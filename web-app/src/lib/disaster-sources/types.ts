/**
 * DRCP Disaster Data Source Types
 * 
 * Provides unified interfaces for disaster data from multiple sources.
 * Architecture supports seamless switching between:
 * - Direct API calls (GDACS, BMKG, USGS) - Default
 * - AI Engine predictions - When NEXT_PUBLIC_AI_ENGINE_URL is set
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Disaster types supported by DRCP
 * 
 * Extended to support Indonesian-specific disasters:
 * - LANDSLIDE: Common during monsoon season
 * - EXTREME_WEATHER: Covers storms, heavy rain, etc.
 */
export enum DisasterType {
  FLOOD = "FLOOD",
  EARTHQUAKE = "EARTHQUAKE",
  WILDFIRE = "WILDFIRE",
  CYCLONE = "CYCLONE",
  VOLCANO = "VOLCANO",
  TSUNAMI = "TSUNAMI",
  DROUGHT = "DROUGHT",
  LANDSLIDE = "LANDSLIDE",
  EXTREME_WEATHER = "EXTREME_WEATHER",
}

/**
 * Alert levels (matches GDACS color system)
 */
export enum AlertLevel {
  GREEN = "GREEN",   // Low impact
  ORANGE = "ORANGE", // Moderate impact
  RED = "RED",       // High impact
}

/**
 * Data source identifiers
 */
export enum DataSourceType {
  GDACS = "GDACS",       // Global Disaster Alert Coordination System
  BMKG = "BMKG",         // Indonesian Meteorology Agency
  USGS = "USGS",         // US Geological Survey
  AI_ENGINE = "AI_ENGINE", // Custom AI Engine (future)
  PETABENCANA = "PETABENCANA", // PetaBencana.id crowdsourced floods
  OPENMETEO = "OPENMETEO", // Open-Meteo weather-based predictions
}

/**
 * Indonesian regions for filtering
 */
export enum IndonesiaRegion {
  SUMATERA = "SUMATERA",
  JAWA = "JAWA",
  KALIMANTAN = "KALIMANTAN",
  SULAWESI = "SULAWESI",
  BALI_NUSATENGGARA = "BALI_NUSATENGGARA",
  MALUKU = "MALUKU",
  PAPUA = "PAPUA",
}

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Unified disaster event interface
 * All data sources must normalize their data to this format
 */
export interface DisasterEvent {
  // Identification
  id: string;
  source: DataSourceType;
  sourceEventId?: string; // Original ID from source API
  
  // Classification
  type: DisasterType;
  alertLevel: AlertLevel;
  
  // Location
  location: string;       // Human-readable location name
  country: string;        // Country name
  countryCode?: string;   // ISO country code (e.g., "ID" for Indonesia)
  region?: IndonesiaRegion; // Indonesian region (if applicable)
  latitude: number;
  longitude: number;
  
  // Severity (normalized 0-100)
  severity: number;
  
  // Timing
  timestamp: Date;        // Event start time
  lastUpdate?: Date;      // Last data update
  
  // Additional details (varies by disaster type)
  details: DisasterEventDetails;
  
  // Metadata
  sourceUrl?: string;     // Link to official source
  isActive: boolean;      // Is the event ongoing?
  isPredicted?: boolean;  // Is this a predicted/forecast event (vs confirmed)?
}

/**
 * Additional details based on disaster type
 */
export interface DisasterEventDetails {
  // Earthquake specific
  magnitude?: number;
  depth?: number;         // km
  
  // Flood specific
  affectedArea?: number;  // sq km
  waterLevel?: string;    // Description
  
  // Cyclone specific
  windSpeed?: number;     // km/h
  category?: string;      // Cyclone category
  
  // Volcano specific
  alertStatus?: string;   // e.g., "Warning", "Watch", "Advisory"
  
  // General
  affectedPeople?: number;
  casualties?: number;
  displaced?: number;
  description?: string;
  factors?: string[];     // Contributing factors
}

/**
 * Filter options for querying disasters
 */
export interface DisasterFilter {
  types?: DisasterType[];
  alertLevels?: AlertLevel[];
  regions?: IndonesiaRegion[];
  countries?: string[];
  indonesiaOnly?: boolean;
  minSeverity?: number;
  maxAgeDays?: number;
  limit?: number;
}

/**
 * Result of a disaster data fetch
 */
export interface DisasterDataResult {
  events: DisasterEvent[];
  source: DataSourceType;
  fetchedAt: Date;
  error?: string;
}

/**
 * Combined result from multiple sources
 */
export interface AggregatedDisasterData {
  events: DisasterEvent[];
  sources: DataSourceType[];
  fetchedAt: Date;
  errors: { source: DataSourceType; error: string }[];
  stats: {
    total: number;
    byType: Record<DisasterType, number>;
    byAlertLevel: Record<AlertLevel, number>;
    byRegion: Record<IndonesiaRegion, number>;
    active: number;
  };
}

// =============================================================================
// DATA SOURCE INTERFACE
// =============================================================================

/**
 * Interface that all disaster data sources must implement
 * Allows seamless switching between GDACS/BMKG/USGS and AI Engine
 */
export interface DisasterDataSource {
  /** Unique identifier for this source */
  readonly name: DataSourceType;
  
  /** Human-readable description */
  readonly description: string;
  
  /** Disaster types this source provides */
  readonly supportedTypes: DisasterType[];
  
  /** Check if the source is available/reachable */
  isAvailable(): Promise<boolean>;
  
  /** Fetch disaster events with optional filters */
  fetchEvents(filter?: DisasterFilter): Promise<DisasterDataResult>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Indonesia geographic bounds for filtering
 */
export const INDONESIA_BOUNDS = {
  latMin: -11,
  latMax: 6,
  lonMin: 95,
  lonMax: 141,
};

/**
 * Indonesia region bounding boxes
 */
export const INDONESIA_REGIONS: Record<IndonesiaRegion, { 
  name: string; 
  latMin: number; 
  latMax: number; 
  lonMin: number; 
  lonMax: number;
  majorCities: string[];
}> = {
  [IndonesiaRegion.SUMATERA]: {
    name: "Sumatera",
    latMin: -6, latMax: 6, lonMin: 95, lonMax: 106,
    majorCities: ["Medan", "Palembang", "Padang", "Pekanbaru", "Banda Aceh"],
  },
  [IndonesiaRegion.JAWA]: {
    name: "Jawa",
    latMin: -9, latMax: -5, lonMin: 105, lonMax: 115,
    majorCities: ["Jakarta", "Surabaya", "Bandung", "Semarang", "Yogyakarta"],
  },
  [IndonesiaRegion.KALIMANTAN]: {
    name: "Kalimantan",
    latMin: -5, latMax: 4, lonMin: 108, lonMax: 120,
    majorCities: ["Banjarmasin", "Samarinda", "Pontianak", "Balikpapan", "Palangkaraya"],
  },
  [IndonesiaRegion.SULAWESI]: {
    name: "Sulawesi",
    latMin: -6, latMax: 2, lonMin: 118, lonMax: 126,
    majorCities: ["Makassar", "Manado", "Palu", "Kendari", "Gorontalo"],
  },
  [IndonesiaRegion.BALI_NUSATENGGARA]: {
    name: "Bali & Nusa Tenggara",
    latMin: -11, latMax: -8, lonMin: 114, lonMax: 125,
    majorCities: ["Denpasar", "Mataram", "Kupang", "Ende", "Labuan Bajo"],
  },
  [IndonesiaRegion.MALUKU]: {
    name: "Maluku",
    latMin: -9, latMax: 3, lonMin: 124, lonMax: 136,
    majorCities: ["Ambon", "Ternate", "Tual", "Sofifi"],
  },
  [IndonesiaRegion.PAPUA]: {
    name: "Papua",
    latMin: -9, latMax: 0, lonMin: 130, lonMax: 141,
    majorCities: ["Jayapura", "Sorong", "Merauke", "Manokwari", "Timika"],
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if coordinates are within Indonesia
 */
export function isInIndonesia(lat: number, lon: number): boolean {
  return (
    lat >= INDONESIA_BOUNDS.latMin &&
    lat <= INDONESIA_BOUNDS.latMax &&
    lon >= INDONESIA_BOUNDS.lonMin &&
    lon <= INDONESIA_BOUNDS.lonMax
  );
}

/**
 * Determine which Indonesian region a coordinate belongs to
 */
export function getIndonesiaRegion(lat: number, lon: number): IndonesiaRegion | null {
  for (const [region, bounds] of Object.entries(INDONESIA_REGIONS)) {
    if (
      lat >= bounds.latMin &&
      lat <= bounds.latMax &&
      lon >= bounds.lonMin &&
      lon <= bounds.lonMax
    ) {
      return region as IndonesiaRegion;
    }
  }
  return null;
}

/**
 * Convert severity score (0-100) to alert level
 */
export function severityToAlertLevel(severity: number): AlertLevel {
  if (severity >= 60) return AlertLevel.RED;
  if (severity >= 30) return AlertLevel.ORANGE;
  return AlertLevel.GREEN;
}

/**
 * Get severity label for display
 */
export function getSeverityLabel(severity: number): string {
  if (severity >= 80) return "CRITICAL";
  if (severity >= 60) return "HIGH";
  if (severity >= 40) return "MODERATE";
  return "LOW";
}

/**
 * Get disaster type emoji
 */
export function getDisasterEmoji(type: DisasterType): string {
  const emojis: Record<DisasterType, string> = {
    [DisasterType.FLOOD]: "🌊",
    [DisasterType.EARTHQUAKE]: "🌋",
    [DisasterType.WILDFIRE]: "🔥",
    [DisasterType.CYCLONE]: "🌀",
    [DisasterType.VOLCANO]: "🗻",
    [DisasterType.TSUNAMI]: "🌊",
    [DisasterType.DROUGHT]: "☀️",
    [DisasterType.LANDSLIDE]: "⛰️",
    [DisasterType.EXTREME_WEATHER]: "⛈️",
  };
  return emojis[type] || "⚠️";
}

/**
 * Format time ago string
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
