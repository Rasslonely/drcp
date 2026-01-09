"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DisasterFilter,
  DisasterType,
  AlertLevel,
  IndonesiaRegion,
} from "@/lib/disaster-sources";

// =============================================================================
// FILTER STATE TYPES
// =============================================================================

export interface DisasterFilterState {
  // Regions
  selectedRegions: IndonesiaRegion[];
  
  // Disaster types
  selectedTypes: DisasterType[];
  
  // Severity
  minSeverity: number;
  showCriticalOnly: boolean;
  
  // Alert levels
  selectedAlertLevels: AlertLevel[];
  
  // Search
  searchQuery: string;
  
  // Indonesia focus
  indonesiaOnly: boolean;
  
  // Time range
  maxAgeDays: number;
}

export interface DisasterFilterActions {
  // Region actions
  toggleRegion: (region: IndonesiaRegion) => void;
  setRegions: (regions: IndonesiaRegion[]) => void;
  clearRegions: () => void;
  selectAllRegions: () => void;
  
  // Type actions
  toggleType: (type: DisasterType) => void;
  setTypes: (types: DisasterType[]) => void;
  clearTypes: () => void;
  
  // Severity actions
  setMinSeverity: (severity: number) => void;
  toggleCriticalOnly: () => void;
  
  // Alert level actions
  toggleAlertLevel: (level: AlertLevel) => void;
  
  // Search actions
  setSearchQuery: (query: string) => void;
  
  // Indonesia toggle
  toggleIndonesiaOnly: () => void;
  
  // Time range
  setMaxAgeDays: (days: number) => void;
  
  // General
  resetFilters: () => void;
  applyPreset: (preset: FilterPreset) => void;
}

export type FilterPreset = 
  | "all"
  | "indonesia_critical"
  | "earthquakes_only"
  | "floods_only"
  | "recent_24h";

// =============================================================================
// DEFAULT STATE
// =============================================================================

const DEFAULT_FILTER_STATE: DisasterFilterState = {
  selectedRegions: [],
  selectedTypes: [],
  minSeverity: 0,
  showCriticalOnly: false,
  selectedAlertLevels: [],
  searchQuery: "",
  indonesiaOnly: true, // Default to Indonesia focus
  maxAgeDays: 3, // Reduced to 3 days for better freshness of active events
};

// All regions for "select all"
const ALL_REGIONS = Object.values(IndonesiaRegion);
const ALL_TYPES = Object.values(DisasterType);

// =============================================================================
// HOOK
// =============================================================================

export function useDisasterFilters(initialState?: Partial<DisasterFilterState>) {
  const [state, setState] = useState<DisasterFilterState>({
    ...DEFAULT_FILTER_STATE,
    ...initialState,
  });

  // Region actions
  const toggleRegion = useCallback((region: IndonesiaRegion) => {
    setState((prev) => ({
      ...prev,
      selectedRegions: prev.selectedRegions.includes(region)
        ? prev.selectedRegions.filter((r) => r !== region)
        : [...prev.selectedRegions, region],
    }));
  }, []);

  const setRegions = useCallback((regions: IndonesiaRegion[]) => {
    setState((prev) => ({ ...prev, selectedRegions: regions }));
  }, []);

  const clearRegions = useCallback(() => {
    setState((prev) => ({ ...prev, selectedRegions: [] }));
  }, []);

  const selectAllRegions = useCallback(() => {
    setState((prev) => ({ ...prev, selectedRegions: [...ALL_REGIONS] }));
  }, []);

  // Type actions
  const toggleType = useCallback((type: DisasterType) => {
    setState((prev) => ({
      ...prev,
      selectedTypes: prev.selectedTypes.includes(type)
        ? prev.selectedTypes.filter((t) => t !== type)
        : [...prev.selectedTypes, type],
    }));
  }, []);

  const setTypes = useCallback((types: DisasterType[]) => {
    setState((prev) => ({ ...prev, selectedTypes: types }));
  }, []);

  const clearTypes = useCallback(() => {
    setState((prev) => ({ ...prev, selectedTypes: [] }));
  }, []);

  // Severity actions
  const setMinSeverity = useCallback((severity: number) => {
    setState((prev) => ({ ...prev, minSeverity: severity }));
  }, []);

  const toggleCriticalOnly = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showCriticalOnly: !prev.showCriticalOnly,
      minSeverity: !prev.showCriticalOnly ? 60 : 0,
    }));
  }, []);

  // Alert level actions
  const toggleAlertLevel = useCallback((level: AlertLevel) => {
    setState((prev) => ({
      ...prev,
      selectedAlertLevels: prev.selectedAlertLevels.includes(level)
        ? prev.selectedAlertLevels.filter((l) => l !== level)
        : [...prev.selectedAlertLevels, level],
    }));
  }, []);

  // Search actions
  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  // Indonesia toggle
  const toggleIndonesiaOnly = useCallback(() => {
    setState((prev) => ({ ...prev, indonesiaOnly: !prev.indonesiaOnly }));
  }, []);

  // Time range
  const setMaxAgeDays = useCallback((days: number) => {
    setState((prev) => ({ ...prev, maxAgeDays: days }));
  }, []);

  // Reset
  const resetFilters = useCallback(() => {
    setState(DEFAULT_FILTER_STATE);
  }, []);

  // Presets
  const applyPreset = useCallback((preset: FilterPreset) => {
    switch (preset) {
      case "all":
        setState({
          ...DEFAULT_FILTER_STATE,
          indonesiaOnly: false,
        });
        break;
      case "indonesia_critical":
        setState({
          ...DEFAULT_FILTER_STATE,
          indonesiaOnly: true,
          showCriticalOnly: true,
          minSeverity: 60,
        });
        break;
      case "earthquakes_only":
        setState({
          ...DEFAULT_FILTER_STATE,
          selectedTypes: [DisasterType.EARTHQUAKE],
        });
        break;
      case "floods_only":
        setState({
          ...DEFAULT_FILTER_STATE,
          selectedTypes: [DisasterType.FLOOD],
        });
        break;
      case "recent_24h":
        setState({
          ...DEFAULT_FILTER_STATE,
          maxAgeDays: 1,
        });
        break;
    }
  }, []);

  // Convert state to DisasterFilter for API calls
  const toApiFilter = useMemo((): DisasterFilter => {
    return {
      regions: state.selectedRegions.length > 0 ? state.selectedRegions : undefined,
      types: state.selectedTypes.length > 0 ? state.selectedTypes : undefined,
      alertLevels: state.selectedAlertLevels.length > 0 ? state.selectedAlertLevels : undefined,
      minSeverity: state.minSeverity > 0 ? state.minSeverity : undefined,
      indonesiaOnly: state.indonesiaOnly,
      maxAgeDays: state.maxAgeDays,
    };
  }, [state]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      state.selectedRegions.length > 0 ||
      state.selectedTypes.length > 0 ||
      state.selectedAlertLevels.length > 0 ||
      state.minSeverity > 0 ||
      state.searchQuery.length > 0
    );
  }, [state]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (state.selectedRegions.length > 0) count++;
    if (state.selectedTypes.length > 0) count++;
    if (state.selectedAlertLevels.length > 0) count++;
    if (state.minSeverity > 0) count++;
    if (state.searchQuery.length > 0) count++;
    return count;
  }, [state]);

  const actions: DisasterFilterActions = {
    toggleRegion,
    setRegions,
    clearRegions,
    selectAllRegions,
    toggleType,
    setTypes,
    clearTypes,
    setMinSeverity,
    toggleCriticalOnly,
    toggleAlertLevel,
    setSearchQuery,
    toggleIndonesiaOnly,
    setMaxAgeDays,
    resetFilters,
    applyPreset,
  };

  return {
    state,
    actions,
    toApiFilter,
    hasActiveFilters,
    activeFilterCount,
  };
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

export const REGION_DISPLAY: Record<IndonesiaRegion, { label: string; emoji: string }> = {
  [IndonesiaRegion.SUMATERA]: { label: "Sumatera", emoji: "🏝️" },
  [IndonesiaRegion.JAWA]: { label: "Jawa", emoji: "🌆" },
  [IndonesiaRegion.KALIMANTAN]: { label: "Kalimantan", emoji: "🌴" },
  [IndonesiaRegion.SULAWESI]: { label: "Sulawesi", emoji: "🏔️" },
  [IndonesiaRegion.BALI_NUSATENGGARA]: { label: "Bali & NT", emoji: "🏖️" },
  [IndonesiaRegion.MALUKU]: { label: "Maluku", emoji: "⛵" },
  [IndonesiaRegion.PAPUA]: { label: "Papua", emoji: "🌿" },
};

export const TYPE_DISPLAY: Record<DisasterType, { label: string; emoji: string; color: string }> = {
  [DisasterType.FLOOD]: { label: "Flood", emoji: "🌊", color: "bg-blue-500" },
  [DisasterType.EARTHQUAKE]: { label: "Earthquake", emoji: "🌋", color: "bg-orange-500" },
  [DisasterType.WILDFIRE]: { label: "Wildfire", emoji: "🔥", color: "bg-red-500" },
  [DisasterType.CYCLONE]: { label: "Cyclone", emoji: "🌀", color: "bg-purple-500" },
  [DisasterType.VOLCANO]: { label: "Volcano", emoji: "🗻", color: "bg-gray-500" },
  [DisasterType.TSUNAMI]: { label: "Tsunami", emoji: "🌊", color: "bg-cyan-500" },
  [DisasterType.DROUGHT]: { label: "Drought", emoji: "☀️", color: "bg-yellow-500" },
  [DisasterType.LANDSLIDE]: { label: "Landslide", emoji: "⛰️", color: "bg-amber-700" },
  [DisasterType.EXTREME_WEATHER]: { label: "Extreme Weather", emoji: "⛈️", color: "bg-slate-500" },
};

export const ALERT_LEVEL_DISPLAY: Record<AlertLevel, { label: string; color: string }> = {
  [AlertLevel.GREEN]: { label: "Low", color: "bg-green-500" },
  [AlertLevel.ORANGE]: { label: "Moderate", color: "bg-orange-500" },
  [AlertLevel.RED]: { label: "Critical", color: "bg-red-500" },
};

export const SEARCH_ALIASES: Record<string, DisasterType> = {
  // Indonesian Aliases
  "gempa": DisasterType.EARTHQUAKE,
  "tsunami": DisasterType.TSUNAMI,
  "banjir": DisasterType.FLOOD,
  "hujan": DisasterType.EXTREME_WEATHER,
  "cuaca": DisasterType.EXTREME_WEATHER,
  "kebakaran": DisasterType.WILDFIRE,
  "gunung": DisasterType.VOLCANO,
  "api": DisasterType.WILDFIRE,
  "longsor": DisasterType.LANDSLIDE,
  "kekeringan": DisasterType.DROUGHT,
  "topan": DisasterType.CYCLONE,
  "badai": DisasterType.CYCLONE,
  
  // English Aliases
  "quake": DisasterType.EARTHQUAKE,
  "rain": DisasterType.EXTREME_WEATHER,
  "storm": DisasterType.CYCLONE,
  "fire": DisasterType.WILDFIRE,
};

