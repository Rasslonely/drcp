/**
 * Disaster Data Aggregator
 * 
 * Combines data from multiple sources (GDACS, BMKG, USGS) into a unified feed.
 * Features:
 * - Parallel fetching from all sources
 * - Deduplication of similar events
 * - Normalization of severity scores
 * - Comprehensive statistics
 * - Graceful error handling per source
 */

import {
  DisasterDataSource,
  DisasterEvent,
  DisasterFilter,
  AggregatedDisasterData,
  DataSourceType,
  DisasterType,
  AlertLevel,
  IndonesiaRegion,
} from "./types";
import { gdacsSource } from "./gdacs";
import { bmkgSource } from "./bmkg";
import { usgsSource } from "./usgs";
import { aiEngineSource, isAIEngineConfigured } from "./ai-engine";
import { petaBencanaSource } from "./petabencana";
import { openMeteoSource } from "./openmeteo";

// =============================================================================
// AGGREGATOR CONFIGURATION
// =============================================================================

interface AggregatorConfig {
  /** Sources to use (default: all available) */
  sources?: DataSourceType[];
  /** Enable deduplication (default: true) */
  deduplicate?: boolean;
  /** Distance threshold for deduplication in km (default: 50) */
  dedupeDistanceKm?: number;
  /** Time threshold for deduplication in minutes (default: 60) */
  dedupeTimeMinutes?: number;
  /** Prefer BMKG for Indonesia earthquakes (default: true) */
  preferBmkgForIndonesia?: boolean;
  /** Include AI Engine predictions if configured (default: true) */
  includeAIEngine?: boolean;
}

/**
 * Get default sources, automatically including AI Engine if configured
 */
function getDefaultSources(): DataSourceType[] {
  const sources = [
    DataSourceType.GDACS,
    DataSourceType.BMKG,
    DataSourceType.USGS,
    DataSourceType.PETABENCANA, // Indonesia crowdsourced floods
    DataSourceType.OPENMETEO, // Weather-based flood predictions
  ];
  
  // Auto-switch: Include AI Engine if configured
  if (isAIEngineConfigured()) {
    sources.push(DataSourceType.AI_ENGINE);
  }
  
  return sources;
}

const DEFAULT_CONFIG: AggregatorConfig = {
  sources: getDefaultSources(),
  deduplicate: true,
  dedupeDistanceKm: 50,
  dedupeTimeMinutes: 60,
  preferBmkgForIndonesia: true,
  includeAIEngine: true,
};

// =============================================================================
// SOURCE REGISTRY
// =============================================================================

const SOURCE_REGISTRY: Record<DataSourceType, DisasterDataSource | null> = {
  [DataSourceType.GDACS]: gdacsSource,
  [DataSourceType.BMKG]: bmkgSource,
  [DataSourceType.USGS]: usgsSource,
  [DataSourceType.AI_ENGINE]: aiEngineSource, // Auto-null if not configured
  [DataSourceType.PETABENCANA]: petaBencanaSource, // Indonesia crowdsourced floods
  [DataSourceType.OPENMETEO]: openMeteoSource, // Weather-based flood predictions
};

// =============================================================================
// AGGREGATOR CLASS
// =============================================================================

export class DisasterDataAggregator {
  private config: AggregatorConfig;

  constructor(config: Partial<AggregatorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Fetch and aggregate disaster data from all configured sources
   */
  async fetchAll(filter?: DisasterFilter): Promise<AggregatedDisasterData> {
    const fetchedAt = new Date();
    const results: { source: DataSourceType; events: DisasterEvent[]; error?: string }[] = [];

    // Get active sources
    const activeSources = (this.config.sources || [])
      .map((type) => SOURCE_REGISTRY[type])
      .filter((source): source is DisasterDataSource => source !== null);

    // Fetch from all sources in parallel
    const promises = activeSources.map(async (source) => {
      try {
        const result = await source.fetchEvents(filter);
        return {
          source: source.name,
          events: result.events,
          error: result.error,
        };
      } catch (error) {
        return {
          source: source.name,
          events: [],
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const settledResults = await Promise.allSettled(promises);

    for (const result of settledResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }

    // Collect all events
    let allEvents: DisasterEvent[] = [];
    const errors: { source: DataSourceType; error: string }[] = [];

    for (const result of results) {
      allEvents.push(...result.events);
      if (result.error) {
        errors.push({ source: result.source, error: result.error });
      }
    }

    // Deduplicate if enabled
    if (this.config.deduplicate) {
      allEvents = this.deduplicateEvents(allEvents);
    }

    // Sort by severity (highest first), then by timestamp (newest first)
    allEvents.sort((a, b) => {
      if (b.severity !== a.severity) return b.severity - a.severity;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Apply limit if specified
    if (filter?.limit) {
      allEvents = allEvents.slice(0, filter.limit);
    }

    // Calculate statistics
    const stats = this.calculateStats(allEvents);

    return {
      events: allEvents,
      sources: this.config.sources || [],
      fetchedAt,
      errors,
      stats,
    };
  }

  /**
   * Deduplicate similar events from different sources
   */
  private deduplicateEvents(events: DisasterEvent[]): DisasterEvent[] {
    const unique: DisasterEvent[] = [];

    for (const event of events) {
      const isDuplicate = unique.some((existing) =>
        this.isSameEvent(existing, event)
      );

      if (!isDuplicate) {
        unique.push(event);
      } else if (this.shouldReplace(event, unique)) {
        // Replace if new event is from preferred source
        const existingIndex = unique.findIndex((e) => this.isSameEvent(e, event));
        if (existingIndex >= 0) {
          unique[existingIndex] = event;
        }
      }
    }

    return unique;
  }

  /**
   * Check if two events are likely the same disaster
   */
  private isSameEvent(a: DisasterEvent, b: DisasterEvent): boolean {
    // Must be same type
    if (a.type !== b.type) return false;

    // Check time proximity
    const timeDiff = Math.abs(a.timestamp.getTime() - b.timestamp.getTime());
    const maxTimeDiff = (this.config.dedupeTimeMinutes || 60) * 60 * 1000;
    if (timeDiff > maxTimeDiff) return false;

    // Check distance (Haversine formula simplified)
    const distance = this.calculateDistance(
      a.latitude,
      a.longitude,
      b.latitude,
      b.longitude
    );
    const maxDistance = this.config.dedupeDistanceKm || 50;
    if (distance > maxDistance) return false;

    // For earthquakes, also check magnitude similarity
    if (a.type === DisasterType.EARTHQUAKE && b.type === DisasterType.EARTHQUAKE) {
      const magA = a.details.magnitude || 0;
      const magB = b.details.magnitude || 0;
      if (Math.abs(magA - magB) > 0.5) return false;
    }

    return true;
  }

  /**
   * Determine if we should replace existing event with new one
   */
  private shouldReplace(newEvent: DisasterEvent, existing: DisasterEvent[]): boolean {
    const existingEvent = existing.find((e) => this.isSameEvent(e, newEvent));
    if (!existingEvent) return false;

    // Prefer BMKG for Indonesia earthquakes
    if (
      this.config.preferBmkgForIndonesia &&
      newEvent.type === DisasterType.EARTHQUAKE &&
      newEvent.countryCode === "ID" &&
      newEvent.source === DataSourceType.BMKG &&
      existingEvent.source !== DataSourceType.BMKG
    ) {
      return true;
    }

    // Prefer PetaBencana for Indonesia floods
    if (
      newEvent.type === DisasterType.FLOOD &&
      newEvent.countryCode === "ID" &&
      newEvent.source === DataSourceType.PETABENCANA &&
      existingEvent.source !== DataSourceType.PETABENCANA
    ) {
      return true;
    }

    return false;
  }

  /**
   * Calculate distance between two points in km (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Calculate statistics for the event set
   */
  private calculateStats(events: DisasterEvent[]): AggregatedDisasterData["stats"] {
    const byType: Record<DisasterType, number> = {
      [DisasterType.FLOOD]: 0,
      [DisasterType.EARTHQUAKE]: 0,
      [DisasterType.WILDFIRE]: 0,
      [DisasterType.CYCLONE]: 0,
      [DisasterType.VOLCANO]: 0,
      [DisasterType.TSUNAMI]: 0,
      [DisasterType.DROUGHT]: 0,
      [DisasterType.LANDSLIDE]: 0,
      [DisasterType.EXTREME_WEATHER]: 0,
    };

    const byAlertLevel: Record<AlertLevel, number> = {
      [AlertLevel.GREEN]: 0,
      [AlertLevel.ORANGE]: 0,
      [AlertLevel.RED]: 0,
    };

    const byRegion: Record<IndonesiaRegion, number> = {
      [IndonesiaRegion.SUMATERA]: 0,
      [IndonesiaRegion.JAWA]: 0,
      [IndonesiaRegion.KALIMANTAN]: 0,
      [IndonesiaRegion.SULAWESI]: 0,
      [IndonesiaRegion.BALI_NUSATENGGARA]: 0,
      [IndonesiaRegion.MALUKU]: 0,
      [IndonesiaRegion.PAPUA]: 0,
    };

    let active = 0;

    for (const event of events) {
      byType[event.type]++;
      byAlertLevel[event.alertLevel]++;
      if (event.region) {
        byRegion[event.region]++;
      }
      if (event.isActive) {
        active++;
      }
    }

    return {
      total: events.length,
      byType,
      byAlertLevel,
      byRegion,
      active,
    };
  }

  /**
   * Check availability of all configured sources
   */
  async checkSourcesHealth(): Promise<Record<DataSourceType, boolean>> {
    const health: Record<DataSourceType, boolean> = {
      [DataSourceType.GDACS]: false,
      [DataSourceType.BMKG]: false,
      [DataSourceType.USGS]: false,
      [DataSourceType.AI_ENGINE]: false,
      [DataSourceType.PETABENCANA]: false,
      [DataSourceType.OPENMETEO]: false,
    };

    const checks = (this.config.sources || []).map(async (type) => {
      const source = SOURCE_REGISTRY[type];
      if (source) {
        try {
          health[type] = await source.isAvailable();
        } catch {
          health[type] = false;
        }
      }
    });

    await Promise.allSettled(checks);
    return health;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export singleton aggregator with default config
export const disasterAggregator = new DisasterDataAggregator();

// Re-export individual sources for direct access
export { gdacsSource } from "./gdacs";
export { bmkgSource } from "./bmkg";
export { usgsSource } from "./usgs";

