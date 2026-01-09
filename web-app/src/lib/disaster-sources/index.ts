/**
 * Disaster Sources Module
 * 
 * Provides unified access to real-time disaster data from multiple sources:
 * - GDACS (Global Disaster Alert Coordination System) - UN/EU
 * - BMKG (Indonesian Meteorology Agency) - Indonesia earthquakes
 * - USGS (U.S. Geological Survey) - Global earthquakes
 * 
 * Usage:
 * ```typescript
 * import { disasterAggregator, DisasterFilter } from "@/lib/disaster-sources";
 * 
 * // Fetch all disasters
 * const data = await disasterAggregator.fetchAll();
 * 
 * // Fetch Indonesia only
 * const indonesiaData = await disasterAggregator.fetchAll({
 *   indonesiaOnly: true,
 *   regions: [IndonesiaRegion.KALIMANTAN, IndonesiaRegion.JAWA],
 * });
 * ```
 */

// Types & Interfaces
export {
  // Enums
  DisasterType,
  AlertLevel,
  DataSourceType,
  IndonesiaRegion,
  // Interfaces
  type DisasterEvent,
  type DisasterEventDetails,
  type DisasterFilter,
  type DisasterDataResult,
  type AggregatedDisasterData,
  type DisasterDataSource,
  // Constants
  INDONESIA_BOUNDS,
  INDONESIA_REGIONS,
  // Helper functions
  isInIndonesia,
  getIndonesiaRegion,
  severityToAlertLevel,
  getSeverityLabel,
  getDisasterEmoji,
  formatTimeAgo,
} from "./types";

// Aggregator (main entry point)
export {
  disasterAggregator,
  DisasterDataAggregator,
} from "./aggregator";

// Individual sources (for direct access if needed)
export { gdacsSource, GDACSSource } from "./gdacs";
export { bmkgSource, BMKGSource } from "./bmkg";
export { usgsSource, USGSSource } from "./usgs";
export { petaBencanaSource, PetaBencanaSource } from "./petabencana";
export { openMeteoSource, OpenMeteoSource } from "./openmeteo";

// AI Engine (future-ready)
export {
  aiEngineSource,
  AIEngineSource,
  isAIEngineConfigured,
  createAIEngineSource,
} from "./ai-engine";

// Indonesia-specific utilities
export {
  // Province data
  INDONESIA_PROVINCES,
  type IndonesiaProvince,
  // Filter utilities
  filterIndonesiaEvents,
  filterByRegion,
  getNearestProvince,
  getProvincesInRegion,
  getProvincesAtRisk,
  searchProvinces,
  groupEventsByRegion,
  getRegionStats,
  // Filter builder
  IndonesiaFilterBuilder,
  indonesiaFilter,
  // Display helpers
  getRegionDisplayInfo,
} from "./indonesia";
