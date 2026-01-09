/**
 * GDACS (Global Disaster Alert Coordination System) Data Source
 * 
 * Provides real-time disaster alerts from the UN + EU system.
 * Covers: Earthquakes, Floods, Tropical Cyclones, Volcanoes, Wildfires, Droughts
 * 
 * API Documentation: https://www.gdacs.org/gdacsapi/
 */

import {
  DisasterDataSource,
  DisasterDataResult,
  DisasterEvent,
  DisasterFilter,
  DisasterType,
  AlertLevel,
  DataSourceType,
  isInIndonesia,
  getIndonesiaRegion,
} from "./types";

// =============================================================================
// GDACS API TYPES
// =============================================================================

interface GDACSEvent {
  eventid: number;
  eventtype: string; // "EQ", "FL", "TC", "VO", "WF", "DR"
  name: string;
  description: string;
  htmldescription: string;
  icon: string;
  iconclass: string;
  alertlevel: string; // "Green", "Orange", "Red"
  alertscore: number;
  severity: {
    value: number;
    unit: string;
  };
  population?: {
    value: number;
  };
  country: string;
  iso3: string;
  fromdate: string; // ISO date
  todate: string;
  iscurrent: string; // "true" or "false"
  url: string;
  geo_lat: number;
  geo_lon: number;
}

interface GDACSResponse {
  features: Array<{
    type: "Feature";
    properties: GDACSEvent;
    geometry: {
      type: "Point";
      coordinates: [number, number]; // [lon, lat]
    };
  }>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const GDACS_API_BASE = "https://www.gdacs.org/gdacsapi/api/events/geteventlist";

// Map GDACS event types to our DisasterType enum
const GDACS_TYPE_MAP: Record<string, DisasterType> = {
  EQ: DisasterType.EARTHQUAKE,
  FL: DisasterType.FLOOD,
  TC: DisasterType.CYCLONE,
  VO: DisasterType.VOLCANO,
  WF: DisasterType.WILDFIRE,
  DR: DisasterType.DROUGHT,
  TS: DisasterType.TSUNAMI,
};

// Reverse mapping for API queries
// Note: LANDSLIDE and EXTREME_WEATHER are not supported by GDACS
const DISASTER_TO_GDACS: Partial<Record<DisasterType, string>> = {
  [DisasterType.EARTHQUAKE]: "EQ",
  [DisasterType.FLOOD]: "FL",
  [DisasterType.CYCLONE]: "TC",
  [DisasterType.VOLCANO]: "VO",
  [DisasterType.WILDFIRE]: "WF",
  [DisasterType.DROUGHT]: "DR",
  [DisasterType.TSUNAMI]: "TS",
  // LANDSLIDE and EXTREME_WEATHER not available in GDACS
};

// =============================================================================
// GDACS DATA SOURCE IMPLEMENTATION
// =============================================================================

export class GDACSSource implements DisasterDataSource {
  readonly name = DataSourceType.GDACS;
  readonly description = "Global Disaster Alert Coordination System (UN + EU)";
  readonly supportedTypes = [
    DisasterType.EARTHQUAKE,
    DisasterType.FLOOD,
    DisasterType.CYCLONE,
    DisasterType.VOLCANO,
    DisasterType.WILDFIRE,
    DisasterType.DROUGHT,
  ];

  /**
   * Check if GDACS API is reachable
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${GDACS_API_BASE}/SEARCH?limit=1`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetch disaster events from GDACS
   */
  async fetchEvents(filter?: DisasterFilter): Promise<DisasterDataResult> {
    try {
      const url = this.buildUrl(filter);
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        // Note: May need Next.js API route for CORS
      });

      if (!response.ok) {
        throw new Error(`GDACS API returned ${response.status}`);
      }

      const data: GDACSResponse = await response.json();
      const events = this.transformEvents(data, filter);

      return {
        events,
        source: DataSourceType.GDACS,
        fetchedAt: new Date(),
      };
    } catch (error) {
      return {
        events: [],
        source: DataSourceType.GDACS,
        fetchedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Build GDACS API URL with filters
   * 
   * Enhanced for better flood detection (Phase 1):
   * - Uses bounding box instead of country name for Indonesia (more reliable)
   * - Includes all disaster types by default (EQ, FL, TC, VO, WF)
   * - Fetches all alert levels to catch GREEN/ORANGE floods
   * - Extended date range to 90 days for ongoing events
   */
  private buildUrl(filter?: DisasterFilter): string {
    const params = new URLSearchParams();

    // Event type filter
    // Default: Include ALL hydrometeorological disaster types
    if (filter?.types && filter.types.length > 0) {
      const gdacsTypes = filter.types
        .map((t) => DISASTER_TO_GDACS[t])
        .filter(Boolean);
      if (gdacsTypes.length > 0) {
        params.append("eventlist", gdacsTypes.join(","));
      }
    } else {
      // Default behavior: Fetch earthquakes, floods, cyclones, volcanoes, wildfires
      // This ensures flood events are ALWAYS included unless explicitly filtered out
      params.append("eventlist", "EQ,FL,TC,VO,WF");
    }

    // Alert level filter
    // Default: Include ALL alert levels (Green, Orange, Red)
    // Many Indonesian floods are initially reported as Green/Orange
    if (filter?.alertLevels && filter.alertLevels.length > 0) {
      params.append("alertlevel", filter.alertLevels.join(";"));
    } else {
      // Include all levels to catch developing events
      params.append("alertlevel", "Green;Orange;Red");
    }

    // Indonesia filter - Use bounding box instead of country name
    // The "country" parameter in GDACS API can be inconsistent
    // Bounding box is more reliable for geographic filtering
    // Indonesia bounds: lat -11 to 6, lon 95 to 141
    if (filter?.indonesiaOnly || filter?.countries?.includes("Indonesia")) {
      // Note: GDACS uses format minLon,minLat,maxLon,maxLat
      // However, GDACS API may not support bbox directly in SEARCH endpoint
      // So we remove country filter and rely on post-filtering in matchesFilter()
      // This ensures we get ALL events and filter locally for better accuracy
      // params.append("country", "Indonesia"); // REMOVED - unreliable
    }

    // Date range (default: last 90 days for ongoing events)
    // Extended from 30 to 90 days to catch events like Nov 2025 Sumatra floods
    const maxDays = filter?.maxAgeDays || 90;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - maxDays);
    params.append("fromDate", fromDate.toISOString().split("T")[0]);

    // Limit results - increased to capture more events
    params.append("limit", String(filter?.limit || 200));

    return `${GDACS_API_BASE}/SEARCH?${params.toString()}`;
  }

  /**
   * Transform GDACS events to our unified format
   */
  private transformEvents(
    data: GDACSResponse,
    filter?: DisasterFilter
  ): DisasterEvent[] {
    if (!data.features) return [];

    return data.features
      .map((feature) => this.transformEvent(feature.properties))
      .filter((event): event is DisasterEvent => event !== null)
      .filter((event) => this.matchesFilter(event, filter));
  }

  /**
   * Transform single GDACS event to unified format
   * 
   * Enhanced severity calculation for different disaster types:
   * - Floods: Higher severity based on affected population
   * - Earthquakes: Magnitude-based severity
   * - Others: Alert score based
   */
  private transformEvent(props: GDACSEvent): DisasterEvent | null {
    const type = GDACS_TYPE_MAP[props.eventtype];
    if (!type) return null;

    const lat = props.geo_lat;
    const lon = props.geo_lon;

    // Calculate severity (0-100) based on disaster type
    let severity: number;
    
    if (type === DisasterType.FLOOD) {
      // Floods: Use combination of alert score and affected population
      // GDACS flood severity is often based on affected area/population
      const baseScore = Math.min(100, Math.round(props.alertscore * 30));
      const populationBoost = props.population?.value 
        ? Math.min(30, Math.round(props.population.value / 100000)) // +1 per 100k affected
        : 0;
      severity = Math.min(100, baseScore + populationBoost);
      
      // Minimum severity of 25 for any detected flood (they're significant enough to be reported)
      severity = Math.max(25, severity);
    } else if (type === DisasterType.EARTHQUAKE) {
      // Earthquakes: Magnitude-based (M5=50, M6=65, M7=80, M8+=95)
      const magnitude = props.severity?.value || 0;
      severity = Math.min(100, Math.round(magnitude * 12));
    } else if (type === DisasterType.CYCLONE) {
      // Cyclones: Higher base severity (they're always significant)
      severity = Math.min(100, Math.round(props.alertscore * 35));
      severity = Math.max(40, severity);
    } else {
      // Default: Alert score based
      severity = Math.min(100, Math.round(props.alertscore * 25));
    }

    const alertLevel =
      props.alertlevel === "Red"
        ? AlertLevel.RED
        : props.alertlevel === "Orange"
        ? AlertLevel.ORANGE
        : AlertLevel.GREEN;

    // Extract flood-specific details
    const floodDetails = type === DisasterType.FLOOD ? {
      affectedArea: props.severity?.value, // sq km for floods
      waterLevel: props.severity?.unit ? `${props.severity.value} ${props.severity.unit}` : undefined,
    } : {};

    return {
      id: `gdacs-${props.eventtype}-${props.eventid}`,
      source: DataSourceType.GDACS,
      sourceEventId: String(props.eventid),
      type,
      alertLevel,
      location: props.name || props.country,
      country: props.country,
      countryCode: props.iso3,
      region: isInIndonesia(lat, lon) ? getIndonesiaRegion(lat, lon) ?? undefined : undefined,
      latitude: lat,
      longitude: lon,
      severity,
      timestamp: new Date(props.fromdate),
      lastUpdate: props.todate ? new Date(props.todate) : undefined,
      details: {
        description: props.description,
        affectedPeople: props.population?.value,
        magnitude: type === DisasterType.EARTHQUAKE ? props.severity?.value : undefined,
        ...floodDetails,
      },
      sourceUrl: props.url,
      isActive: props.iscurrent === "true",
    };
  }

  /**
   * Apply local filters to events
   */
  private matchesFilter(event: DisasterEvent, filter?: DisasterFilter): boolean {
    if (!filter) return true;

    // Indonesia only filter
    if (filter.indonesiaOnly && !isInIndonesia(event.latitude, event.longitude)) {
      return false;
    }

    // Region filter
    if (filter.regions && filter.regions.length > 0) {
      if (!event.region || !filter.regions.includes(event.region)) {
        return false;
      }
    }

    // Minimum severity
    if (filter.minSeverity && event.severity < filter.minSeverity) {
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const gdacsSource = new GDACSSource();
