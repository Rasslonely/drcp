"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygonAmoy, polygon, type Chain } from "wagmi/chains";
import { http, fallback, createStorage, cookieStorage } from "wagmi";

// ============================================================================
// MULTI-CHAIN CONFIGURATION
// ============================================================================
// Switch between chains using NEXT_PUBLIC_CHAIN environment variable:
// - "lisk-sepolia" → Lisk Sepolia Testnet (for Lisk Builders Challenge)
// - "amoy"         → Polygon Amoy Testnet (default for development)
// - "polygon"      → Polygon Mainnet (for production)
// ============================================================================

// Custom Lisk Sepolia chain definition (not in wagmi/chains yet)
const liskSepolia: Chain = {
  id: 4202,
  name: "Lisk Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.sepolia-api.lisk.com"],
      webSocket: ["wss://ws.sepolia-api.lisk.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Lisk Sepolia Blockscout",
      url: "https://sepolia-blockscout.lisk.com",
    },
  },
  testnet: true,
};

// Determine which chain to use based on environment
const chainEnv = process.env.NEXT_PUBLIC_CHAIN || "amoy";

// Get the active chain
function getActiveChain(): Chain {
  switch (chainEnv) {
    case "lisk-sepolia":
      return liskSepolia;
    case "polygon":
      return polygon;
    case "amoy":
    default:
      return polygonAmoy;
  }
}

const activeChain = getActiveChain();

// Log active chain in development
if (typeof window !== "undefined") {
  console.log(`🔗 [DRCP] Active chain: ${activeChain.name} (${activeChain.id})`);
}

// ============================================================================
// RPC TRANSPORTS
// ============================================================================

// Lisk Sepolia Transport
const liskSepoliaTransport = fallback([
  http("https://rpc.sepolia-api.lisk.com", {
    batch: { batchSize: 100, wait: 50 },
    timeout: 30000, // 30 second timeout
  }),
  // Fallback: PublicNode
  http("https://lisk-sepolia-rpc.publicnode.com", {
    batch: { batchSize: 50, wait: 50 },
    timeout: 30000,
  }),
], {
  retryCount: 5,
  retryDelay: 2000, // 2 second retry delay
});

// Polygon Amoy Transport
const amoyTransport = fallback([
  // Primary: User-provided RPC (if set in env)
  ...(process.env.NEXT_PUBLIC_RPC_URL 
    ? [http(process.env.NEXT_PUBLIC_RPC_URL, {
        batch: { batchSize: 100, wait: 50 },
      })] 
    : []),
  // Official Polygon Amoy RPC
  http("https://rpc-amoy.polygon.technology", {
    batch: { batchSize: 100, wait: 50 },
    fetchOptions: { mode: "cors" },
  }),
  // Ankr (public, CORS-friendly)
  http("https://rpc.ankr.com/polygon_amoy", {
    batch: { batchSize: 50, wait: 50 },
    fetchOptions: { mode: "cors" },
  }),
  // Alchemy public endpoint
  http("https://polygon-amoy.g.alchemy.com/v2/demo", {
    batch: { batchSize: 50, wait: 50 },
    fetchOptions: { mode: "cors" },
  }),
], {
  retryCount: 3,
  retryDelay: 1000,
});

// Polygon Mainnet Transport (for future production)
const polygonTransport = fallback([
  http("https://polygon-rpc.com", {
    batch: { batchSize: 100, wait: 50 },
  }),
  http("https://rpc.ankr.com/polygon", {
    batch: { batchSize: 50, wait: 50 },
  }),
], {
  retryCount: 3,
  retryDelay: 1000,
});

// Get transport for active chain
function getTransports() {
  return {
    [liskSepolia.id]: liskSepoliaTransport,
    [polygonAmoy.id]: amoyTransport,
    [polygon.id]: polygonTransport,
  };
}

// ============================================================================
// WALLETCONNECT CONFIGURATION
// ============================================================================

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!walletConnectProjectId && typeof window !== "undefined") {
  console.warn(
    "⚠️ [DRCP] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. " +
    "Using 'demo' fallback which may cause wallet connection issues. " +
    "Get your project ID at https://cloud.walletconnect.com"
  );
}

// ============================================================================
// FINAL CONFIG EXPORT
// ============================================================================

export const config = getDefaultConfig({
  appName: "DRCP Dashboard",
  projectId: walletConnectProjectId || "demo",
  chains: [activeChain],
  ssr: true,
  transports: getTransports(),
  // Use cookie storage for proper SSR handling
  // This ensures wallet state is properly synced between server and client
  storage: createStorage({
    storage: cookieStorage,
  }),
});

// Export chain info for use elsewhere
export { activeChain, liskSepolia };
export const isLiskSepolia = chainEnv === "lisk-sepolia";
export const isAmoy = chainEnv === "amoy";
export const isPolygonMainnet = chainEnv === "polygon";
