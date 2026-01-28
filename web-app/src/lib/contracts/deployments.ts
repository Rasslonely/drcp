import { activeChain, isLiskSepolia, isAmoy, isPolygonMainnet } from "../wagmi";

// ============================================================================
// MULTI-CHAIN CONTRACT DEPLOYMENTS
// ============================================================================
// Contract addresses for each supported chain:
// - Lisk Sepolia (4202) - for Lisk Builders Challenge hackathon
// - Amoy (80002) - for development/testnet
// - Polygon Mainnet (137) - for production
// ============================================================================

export const DEPLOYMENTS = {
  // Lisk Sepolia Testnet (Chain ID: 4202)
  // Deployed for Lisk Builders Challenge
  "lisk-sepolia": {
    RescueToken: "0x4080ACE95cf319c40F952D2dCCE21b070270f14d" as `0x${string}`,
    DRCPTimelock: "0xb38c87D42AA5fbF778e1093c61D5e4a010996EB0" as `0x${string}`,
    DRCPGovernor: "0x8fA50988f36af835de40153E871689148aE54E49" as `0x${string}`,
    ImpactNFT: "0x7D1E0D4C089c6FC1F4500f6C98365DDA6D316E8B" as `0x${string}`,
    MOCK_USDC_ADDRESS: "0xc8f823d7FbE14d950b188F961aaD53b88E9ddfB8" as `0x${string}`,
    VAULT_ADDRESS: "0x6e1cA331F1f701d7B24f7367f5c8A9D07EeEc518" as `0x${string}`, // v2 with 0.5% protocol fee + NFT Fix
    PROJECT_TREASURY: "0xD9207383699f4f7AeB1C8f8f72318aA67f322649" as `0x${string}`, // Protocol Treasury
    YIELD_CONTROLLER: "0x6e8Ff4Ffe11Cf25bc24c9a42DE64cE7eC0458fdE" as `0x${string}`, // Not deployed (optional)
    CREATOR_WALLET: "0xB8735c09D3D78Bcb4cA54E4cc753A07A40F87d96" as `0x${string}`,
  },

  // Polygon Amoy Testnet (Chain ID: 80002)
  amoy: {
    RescueToken: "0xa5247E2e494186EAe1Df1e2e747C3c920D8AC7a9" as `0x${string}`,
    DRCPTimelock: "0x29Ee8D37C05224485b91349C449620318438352C" as `0x${string}`,
    DRCPGovernor: "0xF3c4a5748cF56A01F2147C2A7e5c5b52e176F13f" as `0x${string}`,
    ImpactNFT: "0x3A34430EFD3F45Fe808f28338652cEFD801a71f6" as `0x${string}`,
    MOCK_USDC_ADDRESS: "0xCAa80AbfeC9871D09911bF488e9Ed230d00093e2" as `0x${string}`,
    VAULT_ADDRESS: "0x5ce8cCF75A8Ff90Ba1e73Ba9cBE81dEab6A5dFfB" as `0x${string}`,
    PROJECT_TREASURY: "0x4603eE7AECB9959335f064d0547001D4b9e0BdE9" as `0x${string}`,
    YIELD_CONTROLLER: "0x013559E849a92F470282e68bF7E5C0d0dCaD8844" as `0x${string}`,
    CREATOR_WALLET: "0x5f80439206742Ac04e031665d1DFEDe11C9730aD" as `0x${string}`,
  },

  // Polygon Mainnet (Chain ID: 137)
  // For production deployment
  polygon: {
    RescueToken: "" as `0x${string}`, // TODO: Deploy to Polygon Mainnet
    DRCPTimelock: "" as `0x${string}`, // TODO: Deploy to Polygon Mainnet
    DRCPGovernor: "" as `0x${string}`, // TODO: Deploy to Polygon Mainnet
    ImpactNFT: "" as `0x${string}`, // TODO: Deploy to Polygon Mainnet
    MOCK_USDC_ADDRESS: "" as `0x${string}`, // Use real USDC on mainnet
    VAULT_ADDRESS: "" as `0x${string}`, // TODO: Deploy to Polygon Mainnet
    PROJECT_TREASURY: "" as `0x${string}`, // TODO: Deploy to Polygon Mainnet
    YIELD_CONTROLLER: "" as `0x${string}`, // TODO: Deploy to Polygon Mainnet
    CREATOR_WALLET: "0x5f80439206742Ac04e031665d1DFEDe11C9730aD" as `0x${string}`,
  },
} as const;

// Get current chain's deployment
export function getCurrentDeployment() {
  if (isLiskSepolia) return DEPLOYMENTS["lisk-sepolia"];
  if (isPolygonMainnet) return DEPLOYMENTS["polygon"];
  return DEPLOYMENTS["amoy"];
}

// Current active deployment
export const CURRENT_DEPLOYMENT = getCurrentDeployment();

// Export active chain ID
export const CHAIN_ID = activeChain.id;

// Admin wallet addresses that can access /admin page
export const ADMIN_ADDRESSES: readonly string[] = [
  "0x5f80439206742Ac04e031665d1DFEDe11C9730aD", // Main admin (CREATOR_WALLET)
  // Add more admin addresses here as needed
] as const;

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================
// Use these throughout the app for the current chain's contracts

export const {
  RescueToken: RESCUE_TOKEN_ADDRESS,
  DRCPGovernor: GOVERNOR_ADDRESS,
  DRCPTimelock: TIMELOCK_ADDRESS,
  ImpactNFT: IMPACT_NFT_ADDRESS,
  MOCK_USDC_ADDRESS,
  VAULT_ADDRESS,
  PROJECT_TREASURY,
  YIELD_CONTROLLER,
  CREATOR_WALLET,
} = CURRENT_DEPLOYMENT;
