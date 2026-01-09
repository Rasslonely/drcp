"use client";

/**
 * AI Engine Hooks (FUTURE IMPLEMENTATION)
 * 
 * ⚠️ IMPORTANT: The AI Engine is NOT ACTIVE in the current MVP.
 * The protocol operates in DAO-ONLY MODE for fund release decisions.
 * 
 * These hooks are kept for future integration when:
 * 1. AI Engine backend is deployed
 * 2. Chainlink Oracle integration is set up
 * 3. NEXT_PUBLIC_AI_ENGINE_URL is configured
 * 
 * Until then, disaster data comes from public APIs (GDACS, BMKG, USGS)
 * directly via the disaster-sources module.
 */

import { useCallback, useEffect, useState } from "react";

// AI Engine API base URL - configurable via environment
const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL || "http://localhost:8000";

// Types matching AI Engine schemas
export enum DisasterType {
  FLOOD = "FLOOD",
  EARTHQUAKE = "EARTHQUAKE",
  WILDFIRE = "WILDFIRE",
}

export interface PredictionRequest {
  latitude: number;
  longitude: number;
  disaster_type: DisasterType;
}

export interface PredictionResponse {
  severity: number;
  confidence: number;
  disaster_type: DisasterType;
  geohash: string;
  factors: string[];
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  models_loaded: boolean;
  version: string;
}

export interface Emergency {
  id: string;
  type: DisasterType | string;
  location: string;
  latitude: number;
  longitude: number;
  severity: number;
  confidence: number;
  factors: string[];
  status: "ACTIVE" | "MONITORING" | "RESOLVED";
  lastUpdated: Date;
}

// Pre-defined monitoring locations for demo
const MONITORED_LOCATIONS = [
  { name: "Jakarta, Indonesia", lat: -6.2088, lon: 106.8456, type: DisasterType.FLOOD },
  { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503, type: DisasterType.EARTHQUAKE },
  { name: "Los Angeles, USA", lat: 34.0522, lon: -118.2437, type: DisasterType.WILDFIRE },
  { name: "Manila, Philippines", lat: 14.5995, lon: 120.9842, type: DisasterType.FLOOD },
  { name: "San Francisco, USA", lat: 37.7749, lon: -122.4194, type: DisasterType.EARTHQUAKE },
];

/**
 * API Client for AI Engine
 */
export class AIEngineClient {
  private baseUrl: string;

  constructor(baseUrl: string = AI_ENGINE_URL) {
    this.baseUrl = baseUrl;
  }

  async healthCheck(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return response.json();
  }

  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    const response = await fetch(`${this.baseUrl}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Prediction failed: ${response.status}`);
    }
    return response.json();
  }
}

// Singleton client instance
const aiClient = new AIEngineClient();

/**
 * Hook to check AI Engine health status
 */
export function useAIEngineHealth() {
  const [status, setStatus] = useState<"online" | "offline" | "checking">("checking");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const checkHealth = useCallback(async () => {
    setStatus("checking");
    try {
      const result = await aiClient.healthCheck();
      setHealth(result);
      setStatus(result.status === "healthy" ? "online" : "offline");
      setError(null);
    } catch (err) {
      setError(err as Error);
      setStatus("offline");
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return { status, health, error, refetch: checkHealth };
}

/**
 * Hook to fetch a single disaster prediction
 */
export function usePrediction(
  latitude: number | undefined,
  longitude: number | undefined,
  disasterType: DisasterType | undefined
) {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrediction = useCallback(async () => {
    if (latitude === undefined || longitude === undefined || !disasterType) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiClient.predict({
        latitude,
        longitude,
        disaster_type: disasterType,
      });
      setPrediction(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
      setPrediction(null);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, disasterType]);

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  return { prediction, isLoading, error, refetch: fetchPrediction };
}

/**
 * Hook to fetch multiple emergency predictions from monitored locations
 */
export function useEmergencyPredictions(autoRefresh: boolean = true) {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchEmergencies = useCallback(async () => {
    setIsLoading(true);
    try {
      const predictions = await Promise.allSettled(
        MONITORED_LOCATIONS.map(async (loc, index) => {
          const result = await aiClient.predict({
            latitude: loc.lat,
            longitude: loc.lon,
            disaster_type: loc.type,
          });
          
          return {
            id: `emergency-${index}`,
            type: result.disaster_type,
            location: loc.name,
            latitude: loc.lat,
            longitude: loc.lon,
            severity: result.severity,
            confidence: result.confidence,
            factors: result.factors,
            status: result.severity >= 60 ? "ACTIVE" as const : "MONITORING" as const,
            lastUpdated: new Date(result.timestamp),
          };
        })
      );

      const successfulPredictions: Emergency[] = [];
      for (const p of predictions) {
        if (p.status === "fulfilled") {
          successfulPredictions.push(p.value as Emergency);
        }
      }

      // Sort by severity descending
      successfulPredictions.sort((a, b) => b.severity - a.severity);
      
      setEmergencies(successfulPredictions);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencies();
    
    if (autoRefresh) {
      // Refresh every 2 minutes
      const interval = setInterval(fetchEmergencies, 120000);
      return () => clearInterval(interval);
    }
  }, [fetchEmergencies, autoRefresh]);

  // Computed stats
  const stats = {
    active: emergencies.filter((e) => e.status === "ACTIVE").length,
    monitoring: emergencies.filter((e) => e.status === "MONITORING").length,
    critical: emergencies.filter((e) => e.severity >= 80).length,
    total: emergencies.length,
  };

  return { 
    emergencies, 
    stats, 
    isLoading, 
    error, 
    lastUpdated,
    refetch: fetchEmergencies 
  };
}

/**
 * Hook to get severity color and label
 */
export function useSeverityDisplay(severity: number) {
  const getColor = () => {
    if (severity >= 80) return { text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/50" };
    if (severity >= 60) return { text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/50" };
    if (severity >= 40) return { text: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/50" };
    return { text: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/50" };
  };

  const getLabel = () => {
    if (severity >= 80) return "CRITICAL";
    if (severity >= 60) return "HIGH";
    if (severity >= 40) return "MODERATE";
    return "LOW";
  };

  const getAction = () => {
    if (severity >= 80) return "Auto-release 20%";
    if (severity >= 60) return "DAO vote (24hr)";
    if (severity >= 40) return "DAO vote (72hr)";
    return "No action";
  };

  return {
    color: getColor(),
    label: getLabel(),
    action: getAction(),
  };
}
