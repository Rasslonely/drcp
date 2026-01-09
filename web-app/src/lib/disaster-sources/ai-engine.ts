/**
 * AI Engine Data Source (Future Integration)
 * 
 * This is a skeleton/placeholder for future AI Engine integration.
 * When the AI Engine backend is deployed:
 * 1. Set NEXT_PUBLIC_AI_ENGINE_URL in .env.local
 * 2. The aggregator will automatically include AI predictions
 * 
 * The AI Engine provides ML-based disaster predictions that complement
 * real-time data from GDACS/BMKG/USGS.
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
// AI ENGINE CONFIGURATION
// =============================================================================

/**
 * AI Engine URL from environment variable
 * Set this in .env.local to enable AI Engine predictions
 */
const AI_ENGINE_URL = typeof window !== "undefined" 
  ? process.env.NEXT_PUBLIC_AI_ENGINE_URL 
  : process.env.NEXT_PUBLIC_AI_ENGINE_URL;

/**
 * Check if AI Engine is configured
 */
export function isAIEngineConfigured(): boolean {
  return Boolean(AI_ENGINE_URL && AI_ENGINE_URL.length > 0);
}

// =============================================================================
// AI ENGINE API TYPES
// =============================================================================

interface AIEnginePrediction {
  severity: number;        // 0-100
  confidence: number;      // 0-1
  disaster_type: string;   // "flood", "earthquake", "wildfire"
  geohash: string;
  factors: string[];
  timestamp: string;       // ISO date
}

interface AIEngineHealthResponse {
  status: "ok" | "error";
  models_loaded: boolean;
  version: string;
}

interface AIEnginePredictionRequest {
  latitude: number;
  longitude: number;
  disaster_type: string;
}

// =============================================================================
// MONITORED LOCATIONS (for AI predictions)
// =============================================================================

/**
 * Locations to monitor with AI Engine predictions
 * These are high-risk areas in Indonesia
 */
const MONITORED_LOCATIONS: Array<{
  name: string;
  latitude: number;
  longitude: number;
  disasterTypes: DisasterType[];
}> = [
  // Sumatera
  { name: "Aceh", latitude: 5.5483, longitude: 95.3238, disasterTypes: [DisasterType.EARTHQUAKE, DisasterType.TSUNAMI] },
  { name: "Padang", latitude: -0.9471, longitude: 100.4172, disasterTypes: [DisasterType.EARTHQUAKE, DisasterType.FLOOD] },
  { name: "Medan", latitude: 3.5952, longitude: 98.6722, disasterTypes: [DisasterType.FLOOD] },
  
  // Jawa
  { name: "Jakarta", latitude: -6.2088, longitude: 106.8456, disasterTypes: [DisasterType.FLOOD] },
  { name: "Bandung", latitude: -6.9175, longitude: 107.6191, disasterTypes: [DisasterType.FLOOD, DisasterType.EARTHQUAKE] },
  { name: "Yogyakarta", latitude: -7.7956, longitude: 110.3695, disasterTypes: [DisasterType.EARTHQUAKE, DisasterType.VOLCANO] },
  { name: "Surabaya", latitude: -7.2575, longitude: 112.7521, disasterTypes: [DisasterType.FLOOD] },
  
  // Kalimantan
  { name: "Banjarmasin", latitude: -3.3167, longitude: 114.5833, disasterTypes: [DisasterType.FLOOD, DisasterType.WILDFIRE] },
  { name: "Pontianak", latitude: -0.0263, longitude: 109.3425, disasterTypes: [DisasterType.FLOOD] },
  
  // Sulawesi
  { name: "Palu", latitude: -0.9002, longitude: 119.8779, disasterTypes: [DisasterType.EARTHQUAKE, DisasterType.TSUNAMI] },
  { name: "Makassar", latitude: -5.1477, longitude: 119.4327, disasterTypes: [DisasterType.FLOOD, DisasterType.EARTHQUAKE] },
  
  // Bali & Nusa Tenggara
  { name: "Denpasar", latitude: -8.6705, longitude: 115.2126, disasterTypes: [DisasterType.EARTHQUAKE, DisasterType.VOLCANO] },
  { name: "Lombok", latitude: -8.5833, longitude: 116.1167, disasterTypes: [DisasterType.EARTHQUAKE] },
  
  // Papua
  { name: "Jayapura", latitude: -2.5337, longitude: 140.7181, disasterTypes: [DisasterType.EARTHQUAKE, DisasterType.FLOOD] },
];

// =============================================================================
// AI ENGINE DATA SOURCE
// =============================================================================

export class AIEngineSource implements DisasterDataSource {
  readonly name = DataSourceType.AI_ENGINE;
  readonly description = "DRCP AI Engine - ML-based disaster predictions";
  readonly supportedTypes = [
    DisasterType.FLOOD,
    DisasterType.EARTHQUAKE,
    DisasterType.WILDFIRE,
  ];

  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || AI_ENGINE_URL || "http://localhost:8000";
  }

  /**
   * Check if AI Engine is available
   */
  async isAvailable(): Promise<boolean> {
    if (!isAIEngineConfigured()) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) return false;

      const data: AIEngineHealthResponse = await response.json();
      return data.status === "ok" && data.models_loaded;
    } catch {
      return false;
    }
  }

  /**
   * Fetch AI-based predictions for monitored locations
   */
  async fetchEvents(filter?: DisasterFilter): Promise<DisasterDataResult> {
    if (!isAIEngineConfigured()) {
      return {
        events: [],
        source: DataSourceType.AI_ENGINE,
        fetchedAt: new Date(),
        error: "AI Engine not configured. Set NEXT_PUBLIC_AI_ENGINE_URL to enable.",
      };
    }

    try {
      // Get locations to predict for
      let locations = MONITORED_LOCATIONS;

      // Filter by disaster types if specified
      if (filter?.types && filter.types.length > 0) {
        locations = locations.filter((loc) =>
          loc.disasterTypes.some((t) => filter.types!.includes(t))
        );
      }

      // Filter by Indonesia regions if specified
      if (filter?.regions && filter.regions.length > 0) {
        locations = locations.filter((loc) => {
          const region = getIndonesiaRegion(loc.latitude, loc.longitude);
          return region && filter.regions!.includes(region);
        });
      }

      // Fetch predictions for each location/type combination
      const predictions: DisasterEvent[] = [];
      const predictionPromises: Promise<DisasterEvent | null>[] = [];

      for (const location of locations) {
        for (const disasterType of location.disasterTypes) {
          // Skip if not in filter
          if (filter?.types && !filter.types.includes(disasterType)) {
            continue;
          }

          predictionPromises.push(
            this.fetchPrediction(location.latitude, location.longitude, disasterType, location.name)
          );
        }
      }

      const results = await Promise.allSettled(predictionPromises);

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          // Only include events above minimum severity threshold
          if (!filter?.minSeverity || result.value.severity >= filter.minSeverity) {
            predictions.push(result.value);
          }
        }
      }

      // Sort by severity descending
      predictions.sort((a, b) => b.severity - a.severity);

      return {
        events: predictions,
        source: DataSourceType.AI_ENGINE,
        fetchedAt: new Date(),
      };
    } catch (error) {
      return {
        events: [],
        source: DataSourceType.AI_ENGINE,
        fetchedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Fetch a single prediction from AI Engine
   */
  private async fetchPrediction(
    latitude: number,
    longitude: number,
    type: DisasterType,
    locationName: string
  ): Promise<DisasterEvent | null> {
    try {
      const response = await fetch(`${this.baseUrl}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          latitude,
          longitude,
          disaster_type: type.toLowerCase(),
        } as AIEnginePredictionRequest),
      });

      if (!response.ok) {
        return null;
      }

      const prediction: AIEnginePrediction = await response.json();

      // Convert to DisasterEvent
      const region = getIndonesiaRegion(latitude, longitude);
      const alertLevel =
        prediction.severity >= 60
          ? AlertLevel.RED
          : prediction.severity >= 30
          ? AlertLevel.ORANGE
          : AlertLevel.GREEN;

      return {
        id: `ai-${prediction.geohash}-${type}-${Date.now()}`,
        source: DataSourceType.AI_ENGINE,
        sourceEventId: prediction.geohash,
        type,
        alertLevel,
        location: locationName,
        country: "Indonesia",
        countryCode: "ID",
        region: region ?? undefined,
        latitude,
        longitude,
        severity: prediction.severity,
        timestamp: new Date(prediction.timestamp),
        details: {
          description: `AI Prediction: ${prediction.severity}% risk of ${type.toLowerCase()}`,
          factors: prediction.factors,
        },
        sourceUrl: `${this.baseUrl}/dashboard`,
        isActive: prediction.severity >= 40, // Consider "active" if moderate+severity
      };
    } catch {
      return null;
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Singleton instance (only created if configured)
export const aiEngineSource = isAIEngineConfigured()
  ? new AIEngineSource()
  : null;

// Factory function for custom URL
export function createAIEngineSource(baseUrl: string): AIEngineSource {
  return new AIEngineSource(baseUrl);
}
