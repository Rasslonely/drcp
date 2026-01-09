/**
 * PetaBencana.id Data Source
 *
 * Crowdsourced flood reporting platform for Indonesian cities.
 * API Documentation: https://docs.petabencana.id/
 *
 * Coverage:
 * - Jakarta (ID-JK)
 * - Surabaya (ID-SBY)
 * - Bandung (ID-BDG)
 * - Semarang (ID-SMG)
 *
 * Flood States:
 * - 1: Unknown (flood height unknown - caution needed)
 * - 2: Minor (10-70 cm)
 * - 3: Moderate (71-150 cm)
 * - 4: Severe (>150 cm)
 */

import {
  DisasterDataSource,
  DisasterDataResult,
  DisasterEvent,
  DisasterFilter,
  DisasterType,
  AlertLevel,
  DataSourceType,
  IndonesiaRegion,
} from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

const PETABENCANA_BASE = "https://data.petabencana.id";

/**
 * All supported Indonesian provinces/areas with their admin codes
 * PetaBencana uses ISO 3166-2:ID codes
 * Reference: https://en.wikipedia.org/wiki/ISO_3166-2:ID
 */
const SUPPORTED_AREAS: Record<
  string,
  { name: string; region: IndonesiaRegion; displayName: string }
> = {
  // Jawa
  "ID-JK": { name: "jakarta", region: IndonesiaRegion.JAWA, displayName: "DKI Jakarta" },
  "ID-JB": { name: "jawabarat", region: IndonesiaRegion.JAWA, displayName: "Jawa Barat" },
  "ID-JT": { name: "jawatengah", region: IndonesiaRegion.JAWA, displayName: "Jawa Tengah" },
  "ID-JI": { name: "jawatimur", region: IndonesiaRegion.JAWA, displayName: "Jawa Timur" },
  "ID-YO": { name: "yogyakarta", region: IndonesiaRegion.JAWA, displayName: "DI Yogyakarta" },
  "ID-BT": { name: "banten", region: IndonesiaRegion.JAWA, displayName: "Banten" },
  
  // Sumatera
  "ID-AC": { name: "aceh", region: IndonesiaRegion.SUMATERA, displayName: "Aceh" },
  "ID-SU": { name: "sumaterautara", region: IndonesiaRegion.SUMATERA, displayName: "Sumatera Utara" },
  "ID-SB": { name: "sumaterabarat", region: IndonesiaRegion.SUMATERA, displayName: "Sumatera Barat" },
  "ID-RI": { name: "riau", region: IndonesiaRegion.SUMATERA, displayName: "Riau" },
  "ID-JA": { name: "jambi", region: IndonesiaRegion.SUMATERA, displayName: "Jambi" },
  "ID-SS": { name: "sumateraselatan", region: IndonesiaRegion.SUMATERA, displayName: "Sumatera Selatan" },
  "ID-BB": { name: "bangkabelitung", region: IndonesiaRegion.SUMATERA, displayName: "Bangka Belitung" },
  "ID-BE": { name: "bengkulu", region: IndonesiaRegion.SUMATERA, displayName: "Bengkulu" },
  "ID-LA": { name: "lampung", region: IndonesiaRegion.SUMATERA, displayName: "Lampung" },
  "ID-KR": { name: "kepri", region: IndonesiaRegion.SUMATERA, displayName: "Kepulauan Riau" },
  
  // Kalimantan
  "ID-KB": { name: "kalimantanbarat", region: IndonesiaRegion.KALIMANTAN, displayName: "Kalimantan Barat" },
  "ID-KT": { name: "kalimantantengah", region: IndonesiaRegion.KALIMANTAN, displayName: "Kalimantan Tengah" },
  "ID-KS": { name: "kalimantanselatan", region: IndonesiaRegion.KALIMANTAN, displayName: "Kalimantan Selatan" },
  "ID-KI": { name: "kalimantantimur", region: IndonesiaRegion.KALIMANTAN, displayName: "Kalimantan Timur" },
  "ID-KU": { name: "kalimantanutara", region: IndonesiaRegion.KALIMANTAN, displayName: "Kalimantan Utara" },
  
  // Sulawesi
  "ID-SA": { name: "sulawesiutara", region: IndonesiaRegion.SULAWESI, displayName: "Sulawesi Utara" },
  "ID-ST": { name: "sulawesitengah", region: IndonesiaRegion.SULAWESI, displayName: "Sulawesi Tengah" },
  "ID-SN": { name: "sulawesiselatan", region: IndonesiaRegion.SULAWESI, displayName: "Sulawesi Selatan" },
  "ID-SG": { name: "sulawesitenggara", region: IndonesiaRegion.SULAWESI, displayName: "Sulawesi Tenggara" },
  "ID-GO": { name: "gorontalo", region: IndonesiaRegion.SULAWESI, displayName: "Gorontalo" },
  "ID-SR": { name: "sulawesibarat", region: IndonesiaRegion.SULAWESI, displayName: "Sulawesi Barat" },
  
  // Bali & Nusa Tenggara
  "ID-BA": { name: "bali", region: IndonesiaRegion.BALI_NUSATENGGARA, displayName: "Bali" },
  "ID-NB": { name: "ntb", region: IndonesiaRegion.BALI_NUSATENGGARA, displayName: "Nusa Tenggara Barat" },
  "ID-NT": { name: "ntt", region: IndonesiaRegion.BALI_NUSATENGGARA, displayName: "Nusa Tenggara Timur" },
  
  // Maluku
  "ID-MA": { name: "maluku", region: IndonesiaRegion.MALUKU, displayName: "Maluku" },
  "ID-MU": { name: "malukuutara", region: IndonesiaRegion.MALUKU, displayName: "Maluku Utara" },
  
  // Papua
  "ID-PA": { name: "papua", region: IndonesiaRegion.PAPUA, displayName: "Papua" },
  "ID-PB": { name: "papuabarat", region: IndonesiaRegion.PAPUA, displayName: "Papua Barat" },
  "ID-PS": { name: "papuaselatan", region: IndonesiaRegion.PAPUA, displayName: "Papua Selatan" },
  "ID-PT": { name: "papuatengah", region: IndonesiaRegion.PAPUA, displayName: "Papua Tengah" },
  "ID-PH": { name: "papuapegunungan", region: IndonesiaRegion.PAPUA, displayName: "Papua Pegunungan" },
  "ID-PD": { name: "papuabaratdaya", region: IndonesiaRegion.PAPUA, displayName: "Papua Barat Daya" },
};

/**
 * Get region from coordinates using simple bounding boxes
 */
function getRegionFromCoordinates(lon: number, lat: number): IndonesiaRegion {
  // Approximate bounding boxes for Indonesia regions
  if (lon >= 94 && lon <= 109 && lat >= -6 && lat <= 6) return IndonesiaRegion.SUMATERA;
  if (lon >= 105 && lon <= 115 && lat >= -9 && lat <= -5) return IndonesiaRegion.JAWA;
  if (lon >= 108 && lon <= 119 && lat >= -5 && lat <= 5) return IndonesiaRegion.KALIMANTAN;
  if (lon >= 118 && lon <= 126 && lat >= -7 && lat <= 2) return IndonesiaRegion.SULAWESI;
  if (lon >= 114 && lon <= 125 && lat >= -11 && lat <= -8) return IndonesiaRegion.BALI_NUSATENGGARA;
  if (lon >= 124 && lon <= 135 && lat >= -9 && lat <= 3) return IndonesiaRegion.MALUKU;
  if (lon >= 129 && lon <= 141 && lat >= -10 && lat <= 1) return IndonesiaRegion.PAPUA;
  return IndonesiaRegion.JAWA; // Default fallback
}

// Flood state descriptions
const FLOOD_STATE_DESCRIPTIONS: Record<number, string> = {
  1: "Unknown depth - exercise caution",
  2: "Minor flooding (10-70 cm)",
  3: "Moderate flooding (71-150 cm)",
  4: "Severe flooding (>150 cm)",
};

// =============================================================================
// API TYPES
// =============================================================================

interface PetaBencanaFloodProperties {
  area_id: string;
  geom_id: string;
  area_name: string;
  parent_name: string;
  city_name: string;
  state: number; // 1-4
  last_updated: string;
  attributes?: {
    District?: string;
    Kelurahan?: string;
    Kecamatan?: string;
    RW_admin?: string;
    RT_admin?: string;
  };
}

interface PetaBencanaGeometry {
  type: "Polygon" | "MultiPolygon";
  properties: PetaBencanaFloodProperties;
  arcs: number[][];
}

interface PetaBencanaTopoJSON {
  type: "Topology";
  objects: {
    output: {
      type: "GeometryCollection";
      geometries: PetaBencanaGeometry[];
    };
  };
  arcs: number[][][];
  bbox?: number[];
}

interface PetaBencanaResponse {
  statusCode: number;
  result: PetaBencanaTopoJSON;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert flood state (1-4) to AlertLevel
 */
function stateToAlertLevel(state: number): AlertLevel {
  if (state >= 4) return AlertLevel.RED;
  if (state >= 3) return AlertLevel.ORANGE;
  return AlertLevel.GREEN;
}

/**
 * Convert flood state (1-4) to severity (0-100)
 */
function stateToSeverity(state: number): number {
  const severityMap: Record<number, number> = {
    1: 25, // Unknown
    2: 40, // Minor
    3: 65, // Moderate
    4: 90, // Severe
  };
  return severityMap[state] || 25;
}

/**
 * Calculate centroid from TopoJSON arcs
 * This is a simplified calculation - takes the center of the bounding box
 */
function calculateCentroidFromArcs(
  arcs: number[][][],
  geometryArcs: number[][]
): [number, number] {
  // Flatten all coordinates from the referenced arcs
  const allCoords: [number, number][] = [];

  for (const arcRefs of geometryArcs) {
    for (const arcRef of arcRefs) {
      // Handle negative arc references (reversed arcs)
      const arcIndex = arcRef >= 0 ? arcRef : ~arcRef;
      const arc = arcs[arcIndex];
      if (arc) {
        for (const coord of arc) {
          if (coord.length >= 2) {
            allCoords.push([coord[0], coord[1]]);
          }
        }
      }
    }
  }

  if (allCoords.length === 0) {
    return [0, 0];
  }

  // Calculate centroid as average of all points
  let sumLon = 0;
  let sumLat = 0;

  for (const [lon, lat] of allCoords) {
    sumLon += lon;
    sumLat += lat;
  }

  return [sumLon / allCoords.length, sumLat / allCoords.length];
}

// =============================================================================
// PETABENCANA DATA SOURCE IMPLEMENTATION
// =============================================================================

export class PetaBencanaSource implements DisasterDataSource {
  readonly name = DataSourceType.PETABENCANA;
  readonly description = "Crowdsourced flood data for Indonesian cities";
  readonly supportedTypes = [DisasterType.FLOOD];

  /**
   * Check if PetaBencana API is reachable
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `${PETABENCANA_BASE}/floods?admin=ID-JK&minimum_state=1`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetch flood events from PetaBencana.id
   * Uses nationwide endpoint for ALL Indonesia floods
   */
  async fetchEvents(filter?: DisasterFilter): Promise<DisasterDataResult> {
    try {
      // Skip if explicitly filtering for non-flood types
      if (filter?.types && filter.types.length > 0) {
        if (!filter.types.includes(DisasterType.FLOOD)) {
          return {
            events: [],
            source: this.name,
            fetchedAt: new Date(),
          };
        }
      }

      // Fetch ALL floods from Indonesia (nationwide endpoint)
      const url = `${PETABENCANA_BASE}/floods?minimum_state=1`;
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        console.warn(`[PetaBencana] API request failed: ${response.status}`);
        return {
          events: [],
          source: this.name,
          fetchedAt: new Date(),
          error: `API returned ${response.status}`,
        };
      }

      const data: PetaBencanaResponse = await response.json();
      const allEvents = this.parseFloodData(data);

      // Apply filters
      const filtered = allEvents.filter((event) =>
        this.matchesFilter(event, filter)
      );

      return {
        events: filtered.slice(0, filter?.limit || 100),
        source: this.name,
        fetchedAt: new Date(),
      };
    } catch (error) {
      console.error("[PetaBencana] Fetch error:", error);
      return {
        events: [],
        source: this.name,
        fetchedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Parse PetaBencana TopoJSON response into DisasterEvents
   * Uses coordinate-based region detection for nationwide data
   */
  private parseFloodData(data: PetaBencanaResponse): DisasterEvent[] {
    const events: DisasterEvent[] = [];

    // Check if we have valid data
    if (
      !data.result ||
      !data.result.objects?.output?.geometries ||
      data.result.objects.output.geometries.length === 0
    ) {
      return events;
    }

    const { geometries } = data.result.objects.output;
    const { arcs } = data.result;

    for (const geometry of geometries) {
      const props = geometry.properties;

      // Skip if no state (invalid data)
      if (!props.state) continue;

      const alertLevel = stateToAlertLevel(props.state);
      const severity = stateToSeverity(props.state);

      // Calculate centroid from arcs
      const [lon, lat] = calculateCentroidFromArcs(arcs, geometry.arcs);

      // Determine region from coordinates
      const region = getRegionFromCoordinates(lon, lat);

      // Build location string
      const locationParts = [props.area_name];
      if (props.parent_name) locationParts.push(props.parent_name);
      if (props.city_name) locationParts.push(props.city_name);
      const location = locationParts.join(", ");

      // Determine city name from attributes for map link
      const cityName = props.city_name?.toLowerCase().replace(/\s+/g, "") || "indonesia";

      events.push({
        id: `petabencana-${props.area_id}`,
        source: this.name,
        sourceEventId: props.area_id,
        type: DisasterType.FLOOD,
        alertLevel,
        location,
        country: "Indonesia",
        countryCode: "ID",
        region,
        latitude: lat,
        longitude: lon,
        severity,
        timestamp: new Date(props.last_updated),
        details: {
          description: `${FLOOD_STATE_DESCRIPTIONS[props.state] || "Flood reported"} in ${props.area_name}`,
          waterLevel: FLOOD_STATE_DESCRIPTIONS[props.state],
        },
        sourceUrl: `https://petabencana.id/map/${cityName}`,
        isActive: true, // PetaBencana only returns active floods
      });
    }

    return events;
  }

  /**
   * Apply local filters to events
   */
  private matchesFilter(
    event: DisasterEvent,
    filter?: DisasterFilter
  ): boolean {
    if (!filter) return true;

    // Minimum severity filter
    if (filter.minSeverity && event.severity < filter.minSeverity) {
      return false;
    }

    // Alert level filter
    if (
      filter.alertLevels?.length &&
      !filter.alertLevels.includes(event.alertLevel)
    ) {
      return false;
    }

    // Region filter
    if (filter.regions?.length) {
      if (!event.region || !filter.regions.includes(event.region)) {
        return false;
      }
    }

    return true;
  }
}

// Export singleton instance
export const petaBencanaSource = new PetaBencanaSource();
