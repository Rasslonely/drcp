/**
 * Indonesia-Specific Disaster Data Utilities
 * 
 * Provides enhanced Indonesia-focused filtering, region mapping,
 * and disaster risk profiling for Indonesian regions.
 */

import {
  DisasterEvent,
  DisasterFilter,
  DisasterType,
  IndonesiaRegion,
  INDONESIA_REGIONS,
  INDONESIA_BOUNDS,
  isInIndonesia,
  getIndonesiaRegion,
} from "./types";

// =============================================================================
// PROVINCE DATA
// =============================================================================

/**
 * Indonesian province information with coordinates and risk profiles
 */
export interface IndonesiaProvince {
  name: string;
  region: IndonesiaRegion;
  capital: string;
  latitude: number;
  longitude: number;
  riskProfile: DisasterType[];
}

/**
 * Major Indonesian provinces with disaster risk profiles
 */
export const INDONESIA_PROVINCES: Record<string, IndonesiaProvince> = {
  // Sumatera
  ACEH: {
    name: "Aceh",
    region: IndonesiaRegion.SUMATERA,
    capital: "Banda Aceh",
    latitude: 5.5483,
    longitude: 95.3238,
    riskProfile: [DisasterType.EARTHQUAKE, DisasterType.TSUNAMI, DisasterType.FLOOD],
  },
  SUMATERA_UTARA: {
    name: "Sumatera Utara",
    region: IndonesiaRegion.SUMATERA,
    capital: "Medan",
    latitude: 3.5952,
    longitude: 98.6722,
    riskProfile: [DisasterType.FLOOD, DisasterType.EARTHQUAKE, DisasterType.VOLCANO],
  },
  SUMATERA_BARAT: {
    name: "Sumatera Barat",
    region: IndonesiaRegion.SUMATERA,
    capital: "Padang",
    latitude: -0.9471,
    longitude: 100.4172,
    riskProfile: [DisasterType.EARTHQUAKE, DisasterType.TSUNAMI, DisasterType.FLOOD],
  },
  RIAU: {
    name: "Riau",
    region: IndonesiaRegion.SUMATERA,
    capital: "Pekanbaru",
    latitude: 0.5071,
    longitude: 101.4478,
    riskProfile: [DisasterType.FLOOD, DisasterType.WILDFIRE],
  },
  SUMATERA_SELATAN: {
    name: "Sumatera Selatan",
    region: IndonesiaRegion.SUMATERA,
    capital: "Palembang",
    latitude: -2.9761,
    longitude: 104.7754,
    riskProfile: [DisasterType.FLOOD, DisasterType.WILDFIRE],
  },
  LAMPUNG: {
    name: "Lampung",
    region: IndonesiaRegion.SUMATERA,
    capital: "Bandar Lampung",
    latitude: -5.4500,
    longitude: 105.2667,
    riskProfile: [DisasterType.FLOOD, DisasterType.EARTHQUAKE, DisasterType.VOLCANO],
  },

  // Jawa
  DKI_JAKARTA: {
    name: "DKI Jakarta",
    region: IndonesiaRegion.JAWA,
    capital: "Jakarta",
    latitude: -6.2088,
    longitude: 106.8456,
    riskProfile: [DisasterType.FLOOD],
  },
  JAWA_BARAT: {
    name: "Jawa Barat",
    region: IndonesiaRegion.JAWA,
    capital: "Bandung",
    latitude: -6.9175,
    longitude: 107.6191,
    riskProfile: [DisasterType.FLOOD, DisasterType.EARTHQUAKE, DisasterType.VOLCANO],
  },
  JAWA_TENGAH: {
    name: "Jawa Tengah",
    region: IndonesiaRegion.JAWA,
    capital: "Semarang",
    latitude: -6.9666,
    longitude: 110.4196,
    riskProfile: [DisasterType.FLOOD, DisasterType.EARTHQUAKE, DisasterType.VOLCANO],
  },
  DI_YOGYAKARTA: {
    name: "DI Yogyakarta",
    region: IndonesiaRegion.JAWA,
    capital: "Yogyakarta",
    latitude: -7.7956,
    longitude: 110.3695,
    riskProfile: [DisasterType.EARTHQUAKE, DisasterType.VOLCANO],
  },
  JAWA_TIMUR: {
    name: "Jawa Timur",
    region: IndonesiaRegion.JAWA,
    capital: "Surabaya",
    latitude: -7.2575,
    longitude: 112.7521,
    riskProfile: [DisasterType.FLOOD, DisasterType.VOLCANO],
  },
  BANTEN: {
    name: "Banten",
    region: IndonesiaRegion.JAWA,
    capital: "Serang",
    latitude: -6.1149,
    longitude: 106.1544,
    riskProfile: [DisasterType.FLOOD, DisasterType.TSUNAMI, DisasterType.VOLCANO],
  },

  // Kalimantan
  KALIMANTAN_BARAT: {
    name: "Kalimantan Barat",
    region: IndonesiaRegion.KALIMANTAN,
    capital: "Pontianak",
    latitude: -0.0263,
    longitude: 109.3425,
    riskProfile: [DisasterType.FLOOD, DisasterType.WILDFIRE],
  },
  KALIMANTAN_TENGAH: {
    name: "Kalimantan Tengah",
    region: IndonesiaRegion.KALIMANTAN,
    capital: "Palangkaraya",
    latitude: -2.2161,
    longitude: 113.9135,
    riskProfile: [DisasterType.FLOOD, DisasterType.WILDFIRE],
  },
  KALIMANTAN_SELATAN: {
    name: "Kalimantan Selatan",
    region: IndonesiaRegion.KALIMANTAN,
    capital: "Banjarmasin",
    latitude: -3.3167,
    longitude: 114.5833,
    riskProfile: [DisasterType.FLOOD],
  },
  KALIMANTAN_TIMUR: {
    name: "Kalimantan Timur",
    region: IndonesiaRegion.KALIMANTAN,
    capital: "Samarinda",
    latitude: -0.4948,
    longitude: 117.1436,
    riskProfile: [DisasterType.FLOOD, DisasterType.WILDFIRE],
  },
  KALIMANTAN_UTARA: {
    name: "Kalimantan Utara",
    region: IndonesiaRegion.KALIMANTAN,
    capital: "Tanjung Selor",
    latitude: 2.8414,
    longitude: 117.3742,
    riskProfile: [DisasterType.FLOOD, DisasterType.EARTHQUAKE],
  },

  // Sulawesi
  SULAWESI_UTARA: {
    name: "Sulawesi Utara",
    region: IndonesiaRegion.SULAWESI,
    capital: "Manado",
    latitude: 1.4748,
    longitude: 124.8421,
    riskProfile: [DisasterType.EARTHQUAKE, DisasterType.VOLCANO, DisasterType.TSUNAMI],
  },
  SULAWESI_TENGAH: {
    name: "Sulawesi Tengah",
    region: IndonesiaRegion.SULAWESI,
    capital: "Palu",
    latitude: -0.9002,
    longitude: 119.8779,
    riskProfile: [DisasterType.EARTHQUAKE, DisasterType.TSUNAMI], // 2018 disaster
  },
  SULAWESI_SELATAN: {
    name: "Sulawesi Selatan",
    region: IndonesiaRegion.SULAWESI,
    capital: "Makassar",
    latitude: -5.1477,
    longitude: 119.4327,
    riskProfile: [DisasterType.FLOOD, DisasterType.EARTHQUAKE],
  },
  SULAWESI_TENGGARA: {
    name: "Sulawesi Tenggara",
    region: IndonesiaRegion.SULAWESI,
    capital: "Kendari",
    latitude: -3.9985,
    longitude: 122.5129,
    riskProfile: [DisasterType.FLOOD, DisasterType.EARTHQUAKE],
  },
  GORONTALO: {
    name: "Gorontalo",
    region: IndonesiaRegion.SULAWESI,
    capital: "Gorontalo",
    latitude: 0.5435,
    longitude: 123.0568,
    riskProfile: [DisasterType.FLOOD, DisasterType.EARTHQUAKE],
  },

  // Bali & Nusa Tenggara
  BALI: {
    name: "Bali",
    region: IndonesiaRegion.BALI_NUSATENGGARA,
    capital: "Denpasar",
    latitude: -8.6705,
    longitude: 115.2126,
    riskProfile: [DisasterType.EARTHQUAKE, DisasterType.VOLCANO],
  },
  NTB: {
    name: "Nusa Tenggara Barat",
    region: IndonesiaRegion.BALI_NUSATENGGARA,
    capital: "Mataram",
    latitude: -8.5833,
    longitude: 116.1167,
    riskProfile: [DisasterType.EARTHQUAKE, DisasterType.VOLCANO], // 2018 Lombok
  },
  NTT: {
    name: "Nusa Tenggara Timur",
    region: IndonesiaRegion.BALI_NUSATENGGARA,
    capital: "Kupang",
    latitude: -10.1772,
    longitude: 123.6070,
    riskProfile: [DisasterType.FLOOD, DisasterType.CYCLONE, DisasterType.DROUGHT],
  },

  // Maluku
  MALUKU: {
    name: "Maluku",
    region: IndonesiaRegion.MALUKU,
    capital: "Ambon",
    latitude: -3.6954,
    longitude: 128.1814,
    riskProfile: [DisasterType.EARTHQUAKE, DisasterType.TSUNAMI],
  },
  MALUKU_UTARA: {
    name: "Maluku Utara",
    region: IndonesiaRegion.MALUKU,
    capital: "Sofifi",
    latitude: 0.7333,
    longitude: 127.3667,
    riskProfile: [DisasterType.EARTHQUAKE, DisasterType.VOLCANO, DisasterType.TSUNAMI],
  },

  // Papua
  PAPUA: {
    name: "Papua Tengah",
    region: IndonesiaRegion.PAPUA,
    capital: "Jayapura",
    latitude: -2.5337,
    longitude: 140.7181,
    riskProfile: [DisasterType.EARTHQUAKE, DisasterType.FLOOD],
  },
  PAPUA_BARAT: {
    name: "Papua Barat",
    region: IndonesiaRegion.PAPUA,
    capital: "Manokwari",
    latitude: -0.8615,
    longitude: 134.0620,
    riskProfile: [DisasterType.EARTHQUAKE, DisasterType.FLOOD],
  },
  PAPUA_SELATAN: {
    name: "Papua Selatan",
    region: IndonesiaRegion.PAPUA,
    capital: "Merauke",
    latitude: -8.4932,
    longitude: 140.4018,
    riskProfile: [DisasterType.FLOOD],
  },
};

// =============================================================================
// FILTER UTILITIES
// =============================================================================

/**
 * Filter events to only include those in Indonesia
 */
export function filterIndonesiaEvents(events: DisasterEvent[]): DisasterEvent[] {
  return events.filter(
    (event) =>
      event.countryCode === "ID" ||
      event.country === "Indonesia" ||
      isInIndonesia(event.latitude, event.longitude)
  );
}

/**
 * Filter events by Indonesian region
 */
export function filterByRegion(
  events: DisasterEvent[],
  regions: IndonesiaRegion[]
): DisasterEvent[] {
  if (regions.length === 0) return events;

  return events.filter((event) => {
    // Use pre-assigned region if available
    if (event.region && regions.includes(event.region)) {
      return true;
    }
    // Otherwise calculate from coordinates
    const region = getIndonesiaRegion(event.latitude, event.longitude);
    return region !== null && regions.includes(region);
  });
}

/**
 * Get nearest province for a coordinate
 */
export function getNearestProvince(lat: number, lon: number): IndonesiaProvince | null {
  if (!isInIndonesia(lat, lon)) return null;

  let nearest: IndonesiaProvince | null = null;
  let minDistance = Infinity;

  for (const province of Object.values(INDONESIA_PROVINCES)) {
    const distance = calculateDistance(lat, lon, province.latitude, province.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = province;
    }
  }

  return nearest;
}

/**
 * Get all provinces in a region
 */
export function getProvincesInRegion(region: IndonesiaRegion): IndonesiaProvince[] {
  return Object.values(INDONESIA_PROVINCES).filter((p) => p.region === region);
}

/**
 * Get provinces with specific disaster risk
 */
export function getProvincesAtRisk(type: DisasterType): IndonesiaProvince[] {
  return Object.values(INDONESIA_PROVINCES).filter((p) =>
    p.riskProfile.includes(type)
  );
}

/**
 * Search provinces by name (fuzzy)
 */
export function searchProvinces(query: string): IndonesiaProvince[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  return Object.values(INDONESIA_PROVINCES).filter(
    (p) =>
      p.name.toLowerCase().includes(normalizedQuery) ||
      p.capital.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Group events by Indonesian region
 */
export function groupEventsByRegion(
  events: DisasterEvent[]
): Record<IndonesiaRegion, DisasterEvent[]> {
  const grouped: Record<IndonesiaRegion, DisasterEvent[]> = {
    [IndonesiaRegion.SUMATERA]: [],
    [IndonesiaRegion.JAWA]: [],
    [IndonesiaRegion.KALIMANTAN]: [],
    [IndonesiaRegion.SULAWESI]: [],
    [IndonesiaRegion.BALI_NUSATENGGARA]: [],
    [IndonesiaRegion.MALUKU]: [],
    [IndonesiaRegion.PAPUA]: [],
  };

  for (const event of events) {
    const region = event.region || getIndonesiaRegion(event.latitude, event.longitude);
    if (region) {
      grouped[region].push(event);
    }
  }

  return grouped;
}

/**
 * Get region statistics
 */
export function getRegionStats(events: DisasterEvent[]): {
  region: IndonesiaRegion;
  name: string;
  count: number;
  critical: number;
  types: DisasterType[];
}[] {
  const grouped = groupEventsByRegion(events);

  return Object.entries(INDONESIA_REGIONS).map(([region, info]) => {
    const regionEvents = grouped[region as IndonesiaRegion] || [];
    const types = [...new Set(regionEvents.map((e) => e.type))];
    const critical = regionEvents.filter((e) => e.severity >= 80).length;

    return {
      region: region as IndonesiaRegion,
      name: info.name,
      count: regionEvents.length,
      critical,
      types,
    };
  });
}

// =============================================================================
// INDONESIA-SPECIFIC FILTER BUILDER
// =============================================================================

/**
 * Builder class for constructing Indonesia-specific filters
 */
export class IndonesiaFilterBuilder {
  private filter: DisasterFilter = {
    indonesiaOnly: true,
  };

  /**
   * Filter by specific regions
   */
  regions(...regions: IndonesiaRegion[]): this {
    this.filter.regions = regions;
    return this;
  }

  /**
   * Filter by disaster types
   */
  types(...types: DisasterType[]): this {
    this.filter.types = types;
    return this;
  }

  /**
   * Filter by minimum severity (0-100)
   */
  minSeverity(severity: number): this {
    this.filter.minSeverity = severity;
    return this;
  }

  /**
   * Show only critical/high alerts
   */
  criticalOnly(): this {
    this.filter.minSeverity = 60;
    return this;
  }

  /**
   * Limit recent events (days)
   */
  withinDays(days: number): this {
    this.filter.maxAgeDays = days;
    return this;
  }

  /**
   * Limit number of results
   */
  limit(n: number): this {
    this.filter.limit = n;
    return this;
  }

  /**
   * Build the filter
   */
  build(): DisasterFilter {
    return { ...this.filter };
  }
}

/**
 * Create a new Indonesia filter builder
 */
export function indonesiaFilter(): IndonesiaFilterBuilder {
  return new IndonesiaFilterBuilder();
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate distance between two points in km (Haversine)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Get region display info
 */
export function getRegionDisplayInfo(region: IndonesiaRegion): {
  name: string;
  emoji: string;
  cities: string[];
} {
  const info = INDONESIA_REGIONS[region];
  const emojis: Record<IndonesiaRegion, string> = {
    [IndonesiaRegion.SUMATERA]: "🏝️",
    [IndonesiaRegion.JAWA]: "🌆",
    [IndonesiaRegion.KALIMANTAN]: "🌴",
    [IndonesiaRegion.SULAWESI]: "🏔️",
    [IndonesiaRegion.BALI_NUSATENGGARA]: "🏖️",
    [IndonesiaRegion.MALUKU]: "⛵",
    [IndonesiaRegion.PAPUA]: "🌿",
  };

  return {
    name: info.name,
    emoji: emojis[region],
    cities: info.majorCities,
  };
}
