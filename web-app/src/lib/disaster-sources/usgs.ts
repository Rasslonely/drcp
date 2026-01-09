/**
 * USGS (U.S. Geological Survey) Data Source
 * 
 * Provides real-time global earthquake data.
 * 
 * API Documentation: https://earthquake.usgs.gov/earthquakes/feed/v1.0/
 * Rate Limit: No strict limit (public, free API)
 * 
 * Feed Options:
 * - significant_week.geojson: Significant earthquakes (M4.5+ or notable)
 * - 4.5_week.geojson: All M4.5+ earthquakes in past week
 * - 2.5_week.geojson: All M2.5+ earthquakes in past week
 * - all_week.geojson: All earthquakes in past week
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
// USGS API TYPES (GeoJSON format)
// =============================================================================

interface USGSFeature {
  type: "Feature";
  properties: {
    mag: number;          // Magnitude
    place: string;        // Location description
    time: number;         // Unix timestamp (ms)
    updated: number;      // Last update timestamp (ms)
    tz: number | null;    // Timezone offset
    url: string;          // Event page URL
    detail: string;       // Detail API URL
    felt: number | null;  // Number of felt reports
    cdi: number | null;   // Community Decimal Intensity
    mmi: number | null;   // Modified Mercalli Intensity
    alert: string | null; // "green", "yellow", "orange", "red"
    status: string;       // "automatic", "reviewed"
    tsunami: number;      // Tsunami flag (0 or 1)
    sig: number;          // Significance (0-1000)
    net: string;          // Network code
    code: string;         // Event code
    ids: string;          // Associated IDs
    sources: string;      // Data sources
    types: string;        // Available data types
    nst: number | null;   // Number of stations
    dmin: number | null;  // Min distance to station
    rms: number;          // Root mean square
    gap: number | null;   // Azimuthal gap
    magType: string;      // Magnitude type (ml, mb, mw, etc.)
    type: string;         // Event type (earthquake, quarry blast, etc.)
    title: string;        // Full title
  };
  geometry: {
    type: "Point";
    coordinates: [number, number, number]; // [lon, lat, depth]
  };
  id: string;
}

interface USGSResponse {
  type: "FeatureCollection";
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: USGSFeature[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const USGS_API_BASE = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary";

const USGS_FEEDS = {
  significant: `${USGS_API_BASE}/significant_week.geojson`,
  m4_5: `${USGS_API_BASE}/4.5_week.geojson`,
  m2_5: `${USGS_API_BASE}/2.5_week.geojson`,
  all: `${USGS_API_BASE}/all_week.geojson`,
};

// =============================================================================
// USGS DATA SOURCE IMPLEMENTATION
// =============================================================================

export class USGSSource implements DisasterDataSource {
  readonly name = DataSourceType.USGS;
  readonly description = "U.S. Geological Survey Earthquake Hazards Program";
  readonly supportedTypes = [DisasterType.EARTHQUAKE];

  /**
   * Check if USGS API is reachable
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(USGS_FEEDS.significant, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetch earthquake events from USGS
   */
  async fetchEvents(filter?: DisasterFilter): Promise<DisasterDataResult> {
    try {
      // Skip if filtering for non-earthquake types only
      if (filter?.types && !filter.types.includes(DisasterType.EARTHQUAKE)) {
        return {
          events: [],
          source: DataSourceType.USGS,
          fetchedAt: new Date(),
        };
      }

      // Choose feed based on minimum severity
      const minSeverity = filter?.minSeverity || 0;
      let feedUrl: string;

      if (minSeverity >= 60) {
        feedUrl = USGS_FEEDS.significant;
      } else if (minSeverity >= 45) {
        feedUrl = USGS_FEEDS.m4_5;
      } else {
        // Use M4.5+ by default to avoid too many results
        feedUrl = USGS_FEEDS.m4_5;
      }

      const response = await fetch(feedUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`USGS API returned ${response.status}`);
      }

      const data: USGSResponse = await response.json();
      let events = this.transformEvents(data);

      // Apply local filters
      events = events.filter((event) => this.matchesFilter(event, filter));

      // Sort by timestamp descending
      events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return {
        events: events.slice(0, filter?.limit || 50),
        source: DataSourceType.USGS,
        fetchedAt: new Date(),
      };
    } catch (error) {
      return {
        events: [],
        source: DataSourceType.USGS,
        fetchedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Transform USGS features to unified format
   */
  private transformEvents(data: USGSResponse): DisasterEvent[] {
    if (!data.features) return [];

    return data.features
      .filter((f) => f.properties.type === "earthquake")
      .map((feature) => this.transformFeature(feature))
      .filter((e): e is DisasterEvent => e !== null);
  }

  /**
   * Transform single USGS feature to unified format
   */
  private transformFeature(feature: USGSFeature): DisasterEvent | null {
    try {
      const props = feature.properties;
      const [lon, lat, depth] = feature.geometry.coordinates;

      if (isNaN(lat) || isNaN(lon)) return null;

      const magnitude = props.mag;
      if (isNaN(magnitude) || magnitude < 0) return null;

      // Calculate severity based on magnitude
      // M4.5 = 45%, M5.5 = 55%, M6.5 = 70%, M7.5 = 90%
      const severity = Math.min(100, Math.round(magnitude * 10 + (magnitude > 6 ? 10 : 0)));

      // Determine alert level from USGS alert or magnitude
      let alertLevel: AlertLevel;
      if (props.alert === "red" || magnitude >= 7.0) {
        alertLevel = AlertLevel.RED;
      } else if (props.alert === "orange" || magnitude >= 5.5) {
        alertLevel = AlertLevel.ORANGE;
      } else {
        alertLevel = AlertLevel.GREEN;
      }

      // Parse location from place string
      // Format typically: "123 km SSW of City, Country"
      const place = props.place || "Unknown Location";
      const countryMatch = place.match(/,\s*([^,]+)$/);
      const country = countryMatch ? countryMatch[1].trim() : this.guessCountry(lat, lon);

      // Check if in Indonesia
      const inIndonesia = isInIndonesia(lat, lon);
      const region = inIndonesia ? getIndonesiaRegion(lat, lon) : null;

      const timestamp = new Date(props.time);

      // Determine if active (within 24 hours and significant)
      const hoursSinceEvent = (Date.now() - props.time) / (1000 * 60 * 60);
      const isActive = hoursSinceEvent < 24 && magnitude >= 4.5;

      return {
        id: `usgs-${feature.id}`,
        source: DataSourceType.USGS,
        sourceEventId: feature.id,
        type: DisasterType.EARTHQUAKE,
        alertLevel,
        location: place,
        country,
        countryCode: inIndonesia ? "ID" : undefined,
        region: region ?? undefined,
        latitude: lat,
        longitude: lon,
        severity,
        timestamp,
        lastUpdate: new Date(props.updated),
        details: {
          magnitude,
          depth: depth >= 0 ? depth : undefined,
          description: props.title,
          factors: [
            props.tsunami === 1 ? "tsunami_potential" : "no_tsunami_risk",
            props.felt && props.felt > 0 ? `felt_by_${props.felt}` : undefined,
          ].filter(Boolean) as string[],
        },
        sourceUrl: props.url,
        isActive,
      };
    } catch {
      return null;
    }
  }

  /**
   * Guess country from coordinates (basic implementation)
   */
  private guessCountry(lat: number, lon: number): string {
    // Basic bounds check for common earthquake regions
    if (isInIndonesia(lat, lon)) return "Indonesia";
    if (lat >= 24 && lat <= 46 && lon >= 122 && lon <= 154) return "Japan";
    if (lat >= 5 && lat <= 21 && lon >= 116 && lon <= 127) return "Philippines";
    if (lat >= -56 && lat <= -17 && lon >= -76 && lon <= -66) return "Chile";
    if (lat >= 25 && lat <= 42 && lon >= -125 && lon <= -114) return "USA (California)";
    if (lat >= 36 && lat <= 42 && lon >= 26 && lon <= 45) return "Turkey";
    return "Unknown";
  }

  /**
   * Apply local filters
   */
  private matchesFilter(event: DisasterEvent, filter?: DisasterFilter): boolean {
    if (!filter) return true;

    // Indonesia only filter
    if (filter.indonesiaOnly && !isInIndonesia(event.latitude, event.longitude)) {
      return false;
    }

    // Region filter (for Indonesia events)
    if (filter.regions && filter.regions.length > 0) {
      if (!event.region || !filter.regions.includes(event.region)) {
        return false;
      }
    }

    // Minimum severity
    if (filter.minSeverity && event.severity < filter.minSeverity) {
      return false;
    }

    // Alert level filter
    if (filter.alertLevels && filter.alertLevels.length > 0) {
      if (!filter.alertLevels.includes(event.alertLevel)) {
        return false;
      }
    }

    // Country filter
    if (filter.countries && filter.countries.length > 0) {
      const countryMatch = filter.countries.some(
        (c) => event.country.toLowerCase().includes(c.toLowerCase())
      );
      if (!countryMatch) return false;
    }

    return true;
  }
}

// Export singleton instance
export const usgsSource = new USGSSource();
