"use client";

import { activeChain, isLiskSepolia, isAmoy, isPolygonMainnet } from "./wagmi";

// ============================================================================
// CHAIN UTILITIES
// ============================================================================
// Centralized chain information for dynamic UI rendering
// ============================================================================

// Chain-specific configurations
const CHAIN_CONFIG = {
  "lisk-sepolia": {
    name: "Lisk Sepolia",
    shortName: "Lisk",
    explorerUrl: "https://sepolia-blockscout.lisk.com",
    explorerName: "Blockscout",
    nativeCurrency: "ETH",
    isTestnet: true,
  },
  amoy: {
    name: "Polygon Amoy",
    shortName: "Amoy",
    explorerUrl: "https://amoy.polygonscan.com",
    explorerName: "Polygonscan",
    nativeCurrency: "MATIC",
    isTestnet: true,
  },
  polygon: {
    name: "Polygon",
    shortName: "Polygon",
    explorerUrl: "https://polygonscan.com",
    explorerName: "Polygonscan",
    nativeCurrency: "MATIC",
    isTestnet: false,
  },
} as const;

// Get current chain config
function getCurrentChainConfig() {
  if (isLiskSepolia) return CHAIN_CONFIG["lisk-sepolia"];
  if (isPolygonMainnet) return CHAIN_CONFIG["polygon"];
  return CHAIN_CONFIG["amoy"];
}

// Current chain config
export const chainConfig = getCurrentChainConfig();

// ============================================================================
// EXPLORER URL HELPERS
// ============================================================================

/**
 * Get the base explorer URL for current chain
 */
export function getExplorerUrl(): string {
  return chainConfig.explorerUrl;
}

/**
 * Get explorer URL for a transaction
 */
export function getTxExplorerUrl(txHash: string): string {
  return `${chainConfig.explorerUrl}/tx/${txHash}`;
}

/**
 * Get explorer URL for an address
 */
export function getAddressExplorerUrl(address: string): string {
  return `${chainConfig.explorerUrl}/address/${address}`;
}

/**
 * Get explorer URL for a specific NFT instance
 */
export function getNFTExplorerUrl(nftAddress: string, tokenId: number | string | bigint): string {
  // Blockscout format for Lisk Sepolia: /token/{addr}/instance/{id}
  if (isLiskSepolia) {
    return `${chainConfig.explorerUrl}/token/${nftAddress}/instance/${tokenId.toString()}`;
  }
  // Fallback for Polygon/Standard
  return `${chainConfig.explorerUrl}/nft/${nftAddress}/${tokenId.toString()}`;
}

/**
 * Get explorer URL for a block
 */
export function getBlockExplorerUrl(blockNumber: number | string): string {
  return `${chainConfig.explorerUrl}/block/${blockNumber}`;
}

// ============================================================================
// CHAIN INFO
// ============================================================================

/**
 * Get chain name for display
 */
export function getChainName(): string {
  return chainConfig.name;
}

/**
 * Get short chain name for display
 */
export function getShortChainName(): string {
  return chainConfig.shortName;
}

/**
 * Get explorer name for display (e.g., "Polygonscan", "Blockscout")
 */
export function getExplorerName(): string {
  return chainConfig.explorerName;
}

/**
 * Get native currency symbol
 */
export function getNativeCurrency(): string {
  return chainConfig.nativeCurrency;
}

/**
 * Check if current chain is testnet
 */
export function isTestnet(): boolean {
  return chainConfig.isTestnet;
}

/**
 * Get chain ID
 */
export function getChainId(): number {
  return activeChain.id;
}

// ============================================================================
// EXPORTS FOR CONVENIENCE
// ============================================================================

export {
  activeChain,
  isLiskSepolia,
  isAmoy,
  isPolygonMainnet,
};
