/**
 * BMKG (Badan Meteorologi, Klimatologi, dan Geofisika) Data Source
 * 
 * Provides real-time earthquake data for Indonesia from the official government agency.
 * 
 * API Documentation: https://data.bmkg.go.id/gempabumi/
 * Rate Limit: 60 requests per minute per IP
 * 
 * Endpoints:
 * - autogempa.json: Latest earthquake
 * - gempaterkini.json: Recent M5.0+ earthquakes
 * - gempadirasakan.json: Felt earthquakes
 */

import {
  DisasterDataSource,
  DisasterDataResult,
  DisasterEvent,
  DisasterFilter,
  DisasterType,
  AlertLevel,
  DataSourceType,
  getIndonesiaRegion,
  IndonesiaRegion,
} from "./types";

// =============================================================================
// BMKG API TYPES
// =============================================================================

interface BMKGGempa {
  Tanggal: string;      // "27 Des 2024"
  Jam: string;          // "09:15:23 WIB"
  DateTime: string;     // ISO format
  Coordinates: string;  // "-6.18,106.84"
  Lintang: string;      // "-6.18 LS"
  Bujur: string;        // "106.84 BT"
  Magnitude: string;    // "5.2"
  Kedalaman: string;    // "10 km"
  Wilayah: string;      // "Pusat gempa berada di laut..."
  Potensi: string;      // "Tidak berpotensi tsunami"
  Dirasakan?: string;   // "II-III MMI"
  Shakemap?: string;    // Image URL
}

interface BMKGAutogempaResponse {
  Infogempa: {
    gempa: BMKGGempa;
  };
}

interface BMKGGempaListResponse {
  Infogempa: {
    gempa: BMKGGempa[];
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BMKG_API_BASE = "https://data.bmkg.go.id/DataMKG/TEWS";

const BMKG_ENDPOINTS = {
  autogempa: `${BMKG_API_BASE}/autogempa.json`,       // Latest single earthquake
  gempaterkini: `${BMKG_API_BASE}/gempaterkini.json`, // Recent M5.0+ (15 events)
  gempadirasakan: `${BMKG_API_BASE}/gempadirasakan.json`, // Felt earthquakes
};

// =============================================================================
// BMKG DATA SOURCE IMPLEMENTATION
// =============================================================================

export class BMKGSource implements DisasterDataSource {
  readonly name = DataSourceType.BMKG;
  readonly description = "Indonesian Meteorology, Climatology, and Geophysics Agency";
  readonly supportedTypes = [DisasterType.EARTHQUAKE];

  /**
   * Check if BMKG API is reachable
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(BMKG_ENDPOINTS.autogempa, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetch earthquake events from BMKG
   */
  async fetchEvents(filter?: DisasterFilter): Promise<DisasterDataResult> {
    try {
      // Skip if filtering for non-earthquake types only
      if (filter?.types && !filter.types.includes(DisasterType.EARTHQUAKE)) {
        return {
          events: [],
          source: DataSourceType.BMKG,
          fetchedAt: new Date(),
        };
      }

      // Fetch from multiple endpoints for comprehensive data
      const [terkiniResult, dirasakanResult] = await Promise.allSettled([
        this.fetchGempaList(BMKG_ENDPOINTS.gempaterkini),
        this.fetchGempaList(BMKG_ENDPOINTS.gempadirasakan),
      ]);

      const events: DisasterEvent[] = [];

      // Process M5.0+ earthquakes
      if (terkiniResult.status === "fulfilled") {
        events.push(...terkiniResult.value);
      }

      // Process felt earthquakes
      if (dirasakanResult.status === "fulfilled") {
        // Add felt earthquakes that aren't already in the list
        for (const event of dirasakanResult.value) {
          const isDuplicate = events.some(
            (e) =>
              e.latitude === event.latitude &&
              e.longitude === event.longitude &&
              Math.abs(e.timestamp.getTime() - event.timestamp.getTime()) < 60000
          );
          if (!isDuplicate) {
            events.push(event);
          }
        }
      }

      // Apply filters
      const filteredEvents = events.filter((event) =>
        this.matchesFilter(event, filter)
      );

      // Sort by timestamp descending (newest first)
      filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return {
        events: filteredEvents.slice(0, filter?.limit || 20),
        source: DataSourceType.BMKG,
        fetchedAt: new Date(),
      };
    } catch (error) {
      return {
        events: [],
        source: DataSourceType.BMKG,
        fetchedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Fetch earthquake list from BMKG endpoint
   */
  private async fetchGempaList(url: string): Promise<DisasterEvent[]> {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`BMKG API returned ${response.status}`);
    }

    const data: BMKGGempaListResponse = await response.json();
    const gempaList = data.Infogempa?.gempa || [];

    return gempaList
      .map((gempa) => this.transformGempa(gempa))
      .filter((e): e is DisasterEvent => e !== null);
  }

  /**
   * Transform BMKG gempa to unified format
   */
  private transformGempa(gempa: BMKGGempa): DisasterEvent | null {
    try {
      // Parse coordinates
      const [latStr, lonStr] = gempa.Coordinates.split(",");
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);

      if (isNaN(lat) || isNaN(lon)) return null;

      // Parse magnitude
      const magnitude = parseFloat(gempa.Magnitude);
      if (isNaN(magnitude)) return null;

      // Parse depth
      const depthMatch = gempa.Kedalaman.match(/(\d+)/);
      const depth = depthMatch ? parseInt(depthMatch[1]) : undefined;

      // Calculate severity based on magnitude
      // M5.0 = 50%, M6.0 = 60%, M7.0 = 80%, M8.0 = 100%
      const severity = Math.min(100, Math.round(magnitude * 10));

      // Determine alert level
      let alertLevel: AlertLevel;
      if (magnitude >= 7.0) {
        alertLevel = AlertLevel.RED;
      } else if (magnitude >= 5.5) {
        alertLevel = AlertLevel.ORANGE;
      } else {
        alertLevel = AlertLevel.GREEN;
      }

      // Parse timestamp
      const timestamp = new Date(gempa.DateTime);
      if (isNaN(timestamp.getTime())) return null;

      // Determine region
      const region = getIndonesiaRegion(lat, lon);

      // Extract location from Wilayah
      const locationMatch = gempa.Wilayah.match(/(?:di|dekat)\s+(.+?)(?:,|$)/i);
      const location = locationMatch
        ? locationMatch[1].trim()
        : this.getRegionName(region) || "Indonesia";

      return {
        id: `bmkg-${timestamp.getTime()}-${lat}-${lon}`,
        source: DataSourceType.BMKG,
        type: DisasterType.EARTHQUAKE,
        alertLevel,
        location,
        country: "Indonesia",
        countryCode: "ID",
        region: region ?? undefined,
        latitude: lat,
        longitude: lon,
        severity,
        timestamp,
        details: {
          magnitude,
          depth,
          description: gempa.Wilayah,
          factors: gempa.Potensi.toLowerCase().includes("tidak") 
            ? ["no_tsunami_risk"] 
            : gempa.Potensi.toLowerCase().includes("tsunami") 
              ? ["tsunami_potential"] 
              : [],
        },
        sourceUrl: "https://www.bmkg.go.id/gempabumi/gempabumi-terkini.bmkg",
        isActive: this.isRecent(timestamp),
      };
    } catch {
      return null;
    }
  }

  /**
   * Get region display name
   */
  private getRegionName(region: IndonesiaRegion | null): string | null {
    if (!region) return null;
    const names: Record<IndonesiaRegion, string> = {
      [IndonesiaRegion.SUMATERA]: "Sumatera",
      [IndonesiaRegion.JAWA]: "Jawa",
      [IndonesiaRegion.KALIMANTAN]: "Kalimantan",
      [IndonesiaRegion.SULAWESI]: "Sulawesi",
      [IndonesiaRegion.BALI_NUSATENGGARA]: "Bali/Nusa Tenggara",
      [IndonesiaRegion.MALUKU]: "Maluku",
      [IndonesiaRegion.PAPUA]: "Papua",
    };
    return names[region];
  }

  /**
   * Check if event is recent (within 24 hours)
   */
  private isRecent(timestamp: Date): boolean {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    return diff < 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Apply local filters
   */
  private matchesFilter(event: DisasterEvent, filter?: DisasterFilter): boolean {
    if (!filter) return true;

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

    // Alert level filter
    if (filter.alertLevels && filter.alertLevels.length > 0) {
      if (!filter.alertLevels.includes(event.alertLevel)) {
        return false;
      }
    }

    return true;
  }
}

// Export singleton instance
export const bmkgSource = new BMKGSource();
