"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  disasterAggregator,
  DisasterEvent,
  DisasterFilter,
  AggregatedDisasterData,
  DataSourceType,
  DisasterType,
  AlertLevel,
  IndonesiaRegion,
  filterIndonesiaEvents,
  filterByRegion,
  searchProvinces,
} from "@/lib/disaster-sources";
import { useDisasterFilters, SEARCH_ALIASES } from "./useDisasterFilters";

// =============================================================================
// TYPES
// =============================================================================

export interface DisasterDataState {
  events: DisasterEvent[];
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  stats: AggregatedDisasterData["stats"] | null;
  sources: DataSourceType[];
  sourceErrors: { source: DataSourceType; error: string }[];
  isStale?: boolean;
}

export interface DisasterDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in ms, default 2 minutes
  initialFilter?: DisasterFilter;
}

// Helper to convert JSON strings back to Dates
function reviveDates(data: any): AggregatedDisasterData {
  return {
    ...data,
    fetchedAt: new Date(data.fetchedAt),
    events: data.events.map((e: any) => ({
      ...e,
      timestamp: new Date(e.timestamp),
    })),
  };
}

// M-06 Audit Fix: Versioned cache key prevents stale data on schema changes
const CACHE_VERSION = "v1";
const CACHE_KEY = `drcp_disaster_cache_${CACHE_VERSION}`;

// =============================================================================
// HOOK
// =============================================================================

export function useDisasterData(options: DisasterDataOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds (optimized for real-time monitor)
    initialFilter,
  } = options;

  // Filter state
  const filters = useDisasterFilters(initialFilter ? {
    indonesiaOnly: initialFilter.indonesiaOnly ?? true,
    selectedRegions: initialFilter.regions ?? [],
    selectedTypes: initialFilter.types ?? [],
    minSeverity: initialFilter.minSeverity ?? 0,
    maxAgeDays: initialFilter.maxAgeDays ?? 7,
  } : undefined);

  // Data state
  const [state, setState] = useState<DisasterDataState>({
    events: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
    stats: null,
    sources: [],
    sourceErrors: [],
  });

  // Load from cache on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = reviveDates(JSON.parse(cached));
        setState((prev) => ({
          ...prev,
          events: parsed.events,
          lastUpdated: parsed.fetchedAt,
          stats: parsed.stats,
          sources: parsed.sources,
          isStale: true,
        }));
      }
    } catch (e) {
      console.error("Cache recovery error:", e);
    }
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Build query string from filters
      const params = new URLSearchParams();
      const apiFilter = filters.toApiFilter;
      
      if (apiFilter.indonesiaOnly !== undefined) params.set("indonesiaOnly", String(apiFilter.indonesiaOnly));
      if (apiFilter.maxAgeDays !== undefined) params.set("maxAgeDays", String(apiFilter.maxAgeDays));
      if (apiFilter.limit !== undefined) params.set("limit", String(apiFilter.limit));
      
      apiFilter.regions?.forEach(r => params.append("regions", r));
      apiFilter.types?.forEach(t => params.append("types", t));

      const response = await fetch(`/api/disasters?${params.toString()}`);
      if (!response.ok) throw new Error("API response error");
      
      const rawData = await response.json();
      const result = reviveDates(rawData);

      // Save to cache (only for full Indonesia feed to be useful as general fallback)
      if (!apiFilter.regions && !apiFilter.types && apiFilter.indonesiaOnly) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(rawData));
      }

      // Apply local search filter with alias support
      let filteredEvents = result.events;
      if (filters.state.searchQuery) {
        const query = filters.state.searchQuery.toLowerCase().trim();
        const keywords = query.split(/\s+/);
        
        // Find all disaster types matching the query via aliases
        const aliasedTypes = Object.entries(SEARCH_ALIASES)
          .filter(([alias]) => query.includes(alias))
          .map(([_, type]) => type);

        filteredEvents = filteredEvents.filter(
          (event) => {
            // 1. Direct match on location/country/description
            const directMatch = 
              event.location.toLowerCase().includes(query) ||
              event.country.toLowerCase().includes(query) ||
              (event.details.description?.toLowerCase().includes(query) ?? false);
            
            // 2. Alias match (e.g. query "banjir jakarta" contains "banjir" which is an alias for FLOOD)
            const aliasMatch = aliasedTypes.includes(event.type);

            // 3. Match on display label (e.g. query "flood" matches DisasterType.FLOOD)
            const typeMatch = event.type.toLowerCase().includes(query);
            
            // 4. Multi-keyword match (all words must match somewhere in location/desc)
            const allKeywordsMatch = keywords.length > 1 && keywords.every(kw => 
              event.location.toLowerCase().includes(kw) || 
              (event.details.description?.toLowerCase().includes(kw) ?? false)
            );

            return directMatch || aliasMatch || typeMatch || allKeywordsMatch;
          }
        );
      }

      setState({
        events: filteredEvents,
        isLoading: false,
        error: null,
        lastUpdated: result.fetchedAt,
        stats: result.stats,
        sources: result.sources,
        sourceErrors: result.errors,
        isStale: false,
      });
    } catch (error) {
      console.error("Fetch Error:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
        // Keep existing events (from cache or previous fetch) but mark as stale
        isStale: true,
      }));
    }
  }, [filters.toApiFilter, filters.state.searchQuery]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  // Computed values
  const activeEvents = useMemo(
    () => state.events.filter((e) => e.isActive),
    [state.events]
  );

  const criticalEvents = useMemo(
    () => state.events.filter((e) => e.severity >= 80),
    [state.events]
  );

  const indonesiaEvents = useMemo(
    () => filterIndonesiaEvents(state.events),
    [state.events]
  );

  const eventsByRegion = useMemo(() => {
    const grouped: Record<IndonesiaRegion, DisasterEvent[]> = {
      [IndonesiaRegion.SUMATERA]: [],
      [IndonesiaRegion.JAWA]: [],
      [IndonesiaRegion.KALIMANTAN]: [],
      [IndonesiaRegion.SULAWESI]: [],
      [IndonesiaRegion.BALI_NUSATENGGARA]: [],
      [IndonesiaRegion.MALUKU]: [],
      [IndonesiaRegion.PAPUA]: [],
    };

    for (const event of indonesiaEvents) {
      if (event.region) {
        grouped[event.region].push(event);
      }
    }

    return grouped;
  }, [indonesiaEvents]);

  const eventsByType = useMemo(() => {
    const grouped: Record<DisasterType, DisasterEvent[]> = {
      [DisasterType.FLOOD]: [],
      [DisasterType.EARTHQUAKE]: [],
      [DisasterType.WILDFIRE]: [],
      [DisasterType.CYCLONE]: [],
      [DisasterType.VOLCANO]: [],
      [DisasterType.TSUNAMI]: [],
      [DisasterType.DROUGHT]: [],
      [DisasterType.LANDSLIDE]: [],
      [DisasterType.EXTREME_WEATHER]: [],
    };

    for (const event of state.events) {
      grouped[event.type].push(event);
    }

    return grouped;
  }, [state.events]);

  // Check source health
  const checkSourceHealth = useCallback(async () => {
    return disasterAggregator.checkSourcesHealth();
  }, []);

  return {
    // State
    ...state,
    
    // Computed
    activeEvents,
    criticalEvents,
    indonesiaEvents,
    eventsByRegion,
    eventsByType,
    
    // Actions
    refetch: fetchData,
    checkSourceHealth,
    
    // Filters (expose for UI)
    filters,
  };
}

// =============================================================================
// SIMPLIFIED HOOK FOR QUICK ACCESS
// =============================================================================

/**
 * Quick hook for fetching Indonesia-only disasters
 */
export function useIndonesiaDisasters(options?: {
  regions?: IndonesiaRegion[];
  types?: DisasterType[];
  criticalOnly?: boolean;
}) {
  return useDisasterData({
    initialFilter: {
      indonesiaOnly: true,
      regions: options?.regions,
      types: options?.types,
      minSeverity: options?.criticalOnly ? 60 : undefined,
    },
  });
}

/**
 * Quick hook for fetching earthquakes only
 */
export function useEarthquakes(indonesiaOnly = true) {
  return useDisasterData({
    initialFilter: {
      indonesiaOnly,
      types: [DisasterType.EARTHQUAKE],
    },
  });
}

/**
 * Quick hook for fetching critical events only
 */
export function useCriticalDisasters(indonesiaOnly = true) {
  return useDisasterData({
    initialFilter: {
      indonesiaOnly,
      minSeverity: 80,
    },
  });
}
