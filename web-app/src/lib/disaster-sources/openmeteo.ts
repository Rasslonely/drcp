/**
 * Open-Meteo Weather & Flood Risk Data Source
 *
 * Uses Open-Meteo's free APIs to provide weather-based flood predictions.
 * - Weather API: Precipitation data (mm)
 * - Flood API: River discharge data (m³/s)
 *
 * API Documentation:
 * - https://open-meteo.com/en/docs
 * - https://open-meteo.com/en/docs/flood-api
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

const WEATHER_API_BASE = "https://api.open-meteo.com/v1/forecast";
const FLOOD_API_BASE = "https://flood-api.open-meteo.com/v1/flood";

/**
 * Monitoring locations across Indonesia's 7 regions
 * These are major cities and flood-prone areas
 */
const MONITORING_POINTS: Array<{
  name: string;
  lat: number;
  lon: number;
  region: IndonesiaRegion;
  province: string;
}> = [
  // Sumatera
  { name: "Medan", lat: 3.5952, lon: 98.6722, region: IndonesiaRegion.SUMATERA, province: "Sumatera Utara" },
  { name: "Palembang", lat: -2.9761, lon: 104.7754, region: IndonesiaRegion.SUMATERA, province: "Sumatera Selatan" },
  { name: "Padang", lat: -0.9471, lon: 100.4172, region: IndonesiaRegion.SUMATERA, province: "Sumatera Barat" },
  { name: "Pekanbaru", lat: 0.5071, lon: 101.4478, region: IndonesiaRegion.SUMATERA, province: "Riau" },

  // Jawa
  { name: "Jakarta", lat: -6.2088, lon: 106.8456, region: IndonesiaRegion.JAWA, province: "DKI Jakarta" },
  { name: "Bandung", lat: -6.9175, lon: 107.6191, region: IndonesiaRegion.JAWA, province: "Jawa Barat" },
  { name: "Semarang", lat: -6.9666, lon: 110.4196, region: IndonesiaRegion.JAWA, province: "Jawa Tengah" },
  { name: "Surabaya", lat: -7.2575, lon: 112.7521, region: IndonesiaRegion.JAWA, province: "Jawa Timur" },
  { name: "Yogyakarta", lat: -7.7956, lon: 110.3695, region: IndonesiaRegion.JAWA, province: "DI Yogyakarta" },

  // Kalimantan
  { name: "Banjarmasin", lat: -3.3194, lon: 114.5900, region: IndonesiaRegion.KALIMANTAN, province: "Kalimantan Selatan" },
  { name: "Pontianak", lat: -0.0263, lon: 109.3425, region: IndonesiaRegion.KALIMANTAN, province: "Kalimantan Barat" },
  { name: "Samarinda", lat: -0.4948, lon: 117.1436, region: IndonesiaRegion.KALIMANTAN, province: "Kalimantan Timur" },

  // Sulawesi
  { name: "Makassar", lat: -5.1477, lon: 119.4327, region: IndonesiaRegion.SULAWESI, province: "Sulawesi Selatan" },
  { name: "Manado", lat: 1.4748, lon: 124.8421, region: IndonesiaRegion.SULAWESI, province: "Sulawesi Utara" },
  { name: "Palu", lat: -0.9002, lon: 119.8707, region: IndonesiaRegion.SULAWESI, province: "Sulawesi Tengah" },

  // Bali & Nusa Tenggara
  { name: "Denpasar", lat: -8.6705, lon: 115.2126, region: IndonesiaRegion.BALI_NUSATENGGARA, province: "Bali" },
  { name: "Mataram", lat: -8.5833, lon: 116.1167, region: IndonesiaRegion.BALI_NUSATENGGARA, province: "NTB" },

  // Maluku
  { name: "Ambon", lat: -3.6954, lon: 128.1814, region: IndonesiaRegion.MALUKU, province: "Maluku" },

  // Papua
  { name: "Jayapura", lat: -2.5338, lon: 140.7187, region: IndonesiaRegion.PAPUA, province: "Papua" },
];

// Flood risk severity thresholds
const FLOOD_RISK_THRESHOLD = 40; // Minimum risk score to generate an event

// =============================================================================
// API TYPES
// =============================================================================

interface WeatherApiResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    precipitation: number[];
    rain: number[];
  };
  daily: {
    time: string[];
    precipitation_sum: number[];
  };
}

interface FloodApiResponse {
  latitude: number;
  longitude: number;
  daily: {
    time: string[];
    river_discharge: number[];
    river_discharge_max: number[];
  };
}

interface FloodRiskData {
  location: typeof MONITORING_POINTS[number];
  precipitation24h: number;
  precipitation7d: number;
  riverDischarge: number;
  riverDischargeMax: number;
  riskScore: number;
  timestamp: Date;
}

// =============================================================================
// FLOOD RISK SCORING MODEL
// =============================================================================

/**
 * Calculate flood risk score (0-100) based on multiple factors
 */
function calculateFloodRisk(input: {
  precipitation24h: number;
  precipitation7d: number;
  riverDischarge: number;
  riverDischargeMax: number;
}): number {
  let risk = 0;

  // Heavy rain in last 24h (mm)
  if (input.precipitation24h > 100) risk += 40;
  else if (input.precipitation24h > 50) risk += 25;
  else if (input.precipitation24h > 25) risk += 15;
  else if (input.precipitation24h > 10) risk += 5;

  // Accumulated rain over 7 days (mm)
  if (input.precipitation7d > 300) risk += 30;
  else if (input.precipitation7d > 150) risk += 20;
  else if (input.precipitation7d > 75) risk += 10;
  else if (input.precipitation7d > 40) risk += 5;

  // River discharge relative to historical max
  if (input.riverDischargeMax > 0) {
    const dischargeRatio = input.riverDischarge / input.riverDischargeMax;
    if (dischargeRatio > 0.9) risk += 30;
    else if (dischargeRatio > 0.7) risk += 20;
    else if (dischargeRatio > 0.5) risk += 10;
  }

  return Math.min(100, risk);
}

/**
 * Convert risk score to alert level
 */
function riskToAlertLevel(risk: number): AlertLevel {
  if (risk >= 70) return AlertLevel.RED;
  if (risk >= 50) return AlertLevel.ORANGE;
  return AlertLevel.GREEN;
}

/**
 * Generate flood risk description
 */
function generateRiskDescription(data: FloodRiskData): string {
  const parts: string[] = [];

  if (data.precipitation24h > 50) {
    parts.push(`Heavy rainfall: ${data.precipitation24h.toFixed(1)}mm in 24h`);
  } else if (data.precipitation24h > 25) {
    parts.push(`Moderate rainfall: ${data.precipitation24h.toFixed(1)}mm in 24h`);
  }

  if (data.precipitation7d > 150) {
    parts.push(`Accumulated: ${data.precipitation7d.toFixed(1)}mm over 7 days`);
  }

  if (data.riverDischargeMax > 0) {
    const ratio = (data.riverDischarge / data.riverDischargeMax * 100).toFixed(0);
    if (data.riverDischarge / data.riverDischargeMax > 0.7) {
      parts.push(`River discharge at ${ratio}% of max capacity`);
    }
  }

  if (parts.length === 0) {
    return `Low flood risk conditions in ${data.location.name}`;
  }

  return parts.join(". ");
}

// =============================================================================
// OPEN-METEO DATA SOURCE IMPLEMENTATION
// =============================================================================

export class OpenMeteoSource implements DisasterDataSource {
  readonly name = DataSourceType.OPENMETEO;
  readonly description = "Weather-based flood risk predictions using Open-Meteo";
  readonly supportedTypes = [DisasterType.FLOOD, DisasterType.EXTREME_WEATHER];

  /**
   * Check if Open-Meteo API is reachable
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `${WEATHER_API_BASE}?latitude=-6.2&longitude=106.8&hourly=precipitation`,
        { method: "GET" }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetch flood risk predictions for all monitoring locations
   */
  async fetchEvents(filter?: DisasterFilter): Promise<DisasterDataResult> {
    try {
      // Skip if explicitly filtering for types we don't support
      if (filter?.types && filter.types.length > 0) {
        const supported = filter.types.some(
          (t) => t === DisasterType.FLOOD || t === DisasterType.EXTREME_WEATHER
        );
        if (!supported) {
          return {
            events: [],
            source: this.name,
            fetchedAt: new Date(),
          };
        }
      }

      // Filter monitoring points by region if specified
      let locations = MONITORING_POINTS;
      if (filter?.regions && filter.regions.length > 0) {
        locations = MONITORING_POINTS.filter((loc) =>
          filter.regions!.includes(loc.region)
        );
      }

      // Fetch data for all locations in parallel
      const riskDataPromises = locations.map((loc) => this.fetchLocationRisk(loc));
      const results = await Promise.allSettled(riskDataPromises);

      // Collect successful results
      const riskData: FloodRiskData[] = [];
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          riskData.push(result.value);
        }
      }

      // Generate events for locations with significant risk
      const events = riskData
        .filter((data) => data.riskScore >= FLOOD_RISK_THRESHOLD)
        .map((data) => this.riskToEvent(data));

      // Apply additional filters
      const filtered = events.filter((event) => this.matchesFilter(event, filter));

      return {
        events: filtered.slice(0, filter?.limit || 50),
        source: this.name,
        fetchedAt: new Date(),
      };
    } catch (error) {
      console.error("[OpenMeteo] Fetch error:", error);
      return {
        events: [],
        source: this.name,
        fetchedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Fetch weather and flood data for a single location
   */
  private async fetchLocationRisk(
    location: typeof MONITORING_POINTS[number]
  ): Promise<FloodRiskData | null> {
    try {
      // Fetch weather and flood data in parallel
      const [weatherData, floodData] = await Promise.all([
        this.fetchWeatherData(location.lat, location.lon),
        this.fetchFloodData(location.lat, location.lon),
      ]);

      if (!weatherData) {
        return null;
      }

      // Calculate precipitation totals
      const precipitation24h = this.calculatePrecipitation24h(weatherData);
      const precipitation7d = this.calculatePrecipitation7d(weatherData);

      // Get current river discharge
      const riverDischarge = floodData?.daily.river_discharge?.[0] || 0;
      const riverDischargeMax = floodData?.daily.river_discharge_max?.[0] || 0;

      // Calculate risk score
      const riskScore = calculateFloodRisk({
        precipitation24h,
        precipitation7d,
        riverDischarge,
        riverDischargeMax,
      });

      return {
        location,
        precipitation24h,
        precipitation7d,
        riverDischarge,
        riverDischargeMax,
        riskScore,
        timestamp: new Date(),
      };
    } catch (error) {
      console.warn(`[OpenMeteo] Error fetching ${location.name}:`, error);
      return null;
    }
  }

  /**
   * Fetch weather forecast data
   */
  private async fetchWeatherData(lat: number, lon: number): Promise<WeatherApiResponse | null> {
    try {
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        hourly: "precipitation,rain",
        daily: "precipitation_sum",
        timezone: "Asia/Jakarta",
        past_days: "7",
        forecast_days: "1",
      });

      const response = await fetch(`${WEATHER_API_BASE}?${params}`);
      if (!response.ok) return null;

      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetch flood/river discharge data
   */
  private async fetchFloodData(lat: number, lon: number): Promise<FloodApiResponse | null> {
    try {
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        daily: "river_discharge,river_discharge_max",
        forecast_days: "1",
      });

      const response = await fetch(`${FLOOD_API_BASE}?${params}`);
      if (!response.ok) return null;

      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Calculate total precipitation in last 24 hours
   */
  private calculatePrecipitation24h(data: WeatherApiResponse): number {
    const hourly = data.hourly.precipitation || [];
    // Take last 24 hours of data
    const last24h = hourly.slice(-24);
    return last24h.reduce((sum, val) => sum + (val || 0), 0);
  }

  /**
   * Calculate total precipitation over 7 days
   */
  private calculatePrecipitation7d(data: WeatherApiResponse): number {
    const daily = data.daily.precipitation_sum || [];
    return daily.reduce((sum, val) => sum + (val || 0), 0);
  }

  /**
   * Convert FloodRiskData to DisasterEvent
   */
  private riskToEvent(data: FloodRiskData): DisasterEvent {
    return {
      id: `openmeteo-flood-risk-${data.location.name.toLowerCase().replace(/\s+/g, "-")}`,
      source: this.name,
      sourceEventId: `risk-${data.location.name}`,
      type: DisasterType.FLOOD,
      alertLevel: riskToAlertLevel(data.riskScore),
      location: `${data.location.name}, ${data.location.province}`,
      country: "Indonesia",
      countryCode: "ID",
      region: data.location.region,
      latitude: data.location.lat,
      longitude: data.location.lon,
      severity: data.riskScore,
      timestamp: data.timestamp,
      details: {
        description: generateRiskDescription(data),
        factors: this.getRiskFactors(data),
      },
      sourceUrl: `https://open-meteo.com/en/docs/flood-api`,
      isActive: true,
      isPredicted: true, // Flag to indicate this is a prediction, not a confirmed event
    };
  }

  /**
   * Get risk contributing factors
   */
  private getRiskFactors(data: FloodRiskData): string[] {
    const factors: string[] = [];

    if (data.precipitation24h > 50) factors.push("HEAVY_RAINFALL_24H");
    else if (data.precipitation24h > 25) factors.push("MODERATE_RAINFALL_24H");

    if (data.precipitation7d > 150) factors.push("HIGH_ACCUMULATED_RAINFALL");
    else if (data.precipitation7d > 75) factors.push("MODERATE_ACCUMULATED_RAINFALL");

    if (data.riverDischargeMax > 0) {
      const ratio = data.riverDischarge / data.riverDischargeMax;
      if (ratio > 0.8) factors.push("CRITICAL_RIVER_LEVEL");
      else if (ratio > 0.6) factors.push("HIGH_RIVER_LEVEL");
    }

    return factors;
  }

  /**
   * Apply local filters to events
   */
  private matchesFilter(event: DisasterEvent, filter?: DisasterFilter): boolean {
    if (!filter) return true;

    // Minimum severity filter
    if (filter.minSeverity && event.severity < filter.minSeverity) {
      return false;
    }

    // Alert level filter
    if (filter.alertLevels?.length && !filter.alertLevels.includes(event.alertLevel)) {
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const openMeteoSource = new OpenMeteoSource();
