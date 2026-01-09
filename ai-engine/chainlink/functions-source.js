/**
 * Chainlink Functions Source Script
 * 
 * This script runs on Chainlink's Decentralized Oracle Network (DON).
 * It fetches disaster risk scores from our AI engine and returns
 * them in a format suitable for smart contract consumption.
 * 
 * Execution Context:
 * - Runs in isolated Deno environment
 * - 10 second timeout
 * - No filesystem access
 * - Limited HTTP capabilities
 */

// Arguments passed from smart contract
// args[0] = latitude (string)
// args[1] = longitude (string)  
// args[2] = disaster_type ("FLOOD", "EARTHQUAKE", "WILDFIRE")

// Secrets (encrypted, managed by DON)
// secrets.AI_ENGINE_URL = "https://your-ai-engine.com"

const latitude = args[0];
const longitude = args[1];
const disasterType = args[2];

// Validate inputs
if (!latitude || !longitude || !disasterType) {
  throw Error("Missing required arguments: latitude, longitude, disaster_type");
}

// Validate coordinates
const lat = parseFloat(latitude);
const lon = parseFloat(longitude);

if (isNaN(lat) || isNaN(lon)) {
  throw Error("Invalid coordinates");
}

if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
  throw Error("Coordinates out of range");
}

// Valid disaster types
const validTypes = ["FLOOD", "EARTHQUAKE", "WILDFIRE"];
if (!validTypes.includes(disasterType)) {
  throw Error(`Invalid disaster type. Must be one of: ${validTypes.join(", ")}`);
}

// Get AI Engine URL from secrets
const aiEngineUrl = secrets.AI_ENGINE_URL || "http://localhost:8000";

// Make request to AI Engine
const response = await Functions.makeHttpRequest({
  url: `${aiEngineUrl}/predict/chainlink`,
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  data: {
    latitude: lat,
    longitude: lon,
    disaster_type: disasterType
  },
  timeout: 9000 // 9 seconds (leave buffer for DON processing)
});

// Handle errors
if (response.error) {
  console.error("AI Engine request failed:", response.error);
  throw Error(`AI Engine error: ${response.message || "Unknown error"}`);
}

// Extract severity score
const severity = response.data.severity;
const geohash = response.data.geohash;
const timestamp = response.data.timestamp;

if (typeof severity !== "number" || severity < 0 || severity > 100) {
  throw Error(`Invalid severity score: ${severity}`);
}

console.log(`Risk Score: ${severity} for ${disasterType} at ${geohash}`);

// Encode result for smart contract
// Format: severity (uint8) | timestamp (uint40) | disaster_type_encoded (uint8)
// disaster_type_encoded: FLOOD=0, EARTHQUAKE=1, WILDFIRE=2

const disasterTypeEncoded = validTypes.indexOf(disasterType);

// Pack into bytes: [severity, timestamp (5 bytes), disaster_type]
// For simplicity, just return severity as uint256
// The geohash can be passed separately or encoded

return Functions.encodeUint256(severity);
