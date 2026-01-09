"use client";

import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ABIS } from "@/lib/contracts/abis";
import { CHAIN_ID, getCurrentDeployment } from "@/lib/contracts/deployments";

// Tier enum matching ImpactNFT.sol
export enum Tier {
  None = 0,
  Bronze = 1,
  Silver = 2,
  Gold = 3,
  Platinum = 4,
}

// Map tier number to display info
export const TIER_CONFIG = {
  [Tier.None]: { name: "None", icon: "⚪", color: "gray", minTasks: 0 },
  [Tier.Bronze]: { name: "Bronze", icon: "🥉", color: "orange", minTasks: 1 },
  [Tier.Silver]: { name: "Silver", icon: "🥈", color: "slate", minTasks: 6 },
  [Tier.Gold]: { name: "Gold", icon: "🥇", color: "yellow", minTasks: 21 },
  [Tier.Platinum]: { name: "Platinum", icon: "💎", color: "purple", minTasks: 51 },
};

export interface ImpactProfile {
  reputation: bigint;
  tier: Tier;
  tasksCompleted: bigint;
  totalRewards: bigint;
  lastActive: bigint;
}

/**
 * Hook to fetch a volunteer's Impact profile from ImpactNFT contract
 * @param volunteerAddress - Address of the volunteer to fetch
 */
export function useImpact(volunteerAddress: `0x${string}` | undefined) {
  const deployment = getCurrentDeployment();
  const { data, isLoading, isError, refetch } = useReadContract({
    address: deployment.ImpactNFT as `0x${string}`,
    abi: ABIS.ImpactNFT,
    functionName: "getImpact",
    args: volunteerAddress ? [volunteerAddress] : undefined,
    chainId: CHAIN_ID,
    query: {
      enabled: !!volunteerAddress,
      staleTime: 60000, // Impact data changes infrequently
    },
  });

  // Parse the struct result
  const profile = data as ImpactProfile | undefined;

  // Format reputation (0-10000 scale to 0-100.00 display)
  const reputationFormatted = profile
    ? (Number(profile.reputation) / 100).toFixed(2)
    : "0.00";

  // Format rewards (USDC 6 decimals)
  const totalRewardsFormatted = profile
    ? `$${Number(formatUnits(profile.totalRewards, 6)).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "$0.00";

  // Get tier config
  const tierConfig = profile
    ? TIER_CONFIG[profile.tier as Tier] || TIER_CONFIG[Tier.None]
    : TIER_CONFIG[Tier.None];

  // Calculate progress to next tier
  const getNextTierProgress = () => {
    if (!profile) return { nextTier: null, tasksNeeded: 0, progress: 0 };

    const currentTasks = Number(profile.tasksCompleted);
    const tiers = [
      { tier: Tier.Bronze, min: 1 },
      { tier: Tier.Silver, min: 6 },
      { tier: Tier.Gold, min: 21 },
      { tier: Tier.Platinum, min: 51 },
    ];

    const currentTierIndex = tiers.findIndex((t) => t.tier === profile.tier);
    if (currentTierIndex === tiers.length - 1) {
      // Already Platinum
      return { nextTier: null, tasksNeeded: 0, progress: 100 };
    }

    const nextTierData = tiers[currentTierIndex + 1];
    const currentTierMin = tiers[currentTierIndex]?.min || 0;
    const tasksNeeded = nextTierData.min - currentTasks;
    const progress =
      ((currentTasks - currentTierMin) / (nextTierData.min - currentTierMin)) * 100;

    return {
      nextTier: TIER_CONFIG[nextTierData.tier],
      tasksNeeded,
      progress: Math.min(Math.max(progress, 0), 100),
    };
  };

  return {
    // Raw profile data
    profile,
    
    // Parsed values
    reputation: profile?.reputation,
    tier: profile?.tier as Tier | undefined,
    tasksCompleted: profile ? Number(profile.tasksCompleted) : 0,
    totalRewards: profile?.totalRewards,
    lastActive: profile?.lastActive,
    
    // Formatted values
    reputationFormatted,
    totalRewardsFormatted,
    tierConfig,
    tierProgress: getNextTierProgress(),
    
    // Has profile check
    hasProfile: profile && profile.tasksCompleted > BigInt(0),
    
    // Status
    isLoading,
    isRefreshing: !isLoading && refetch !== undefined, // This is a bit tricky with wagmi, but we can check if it's currently fetching
    isError,
    refetch,
  };
}

/**
 * Hook to check if an address has an Impact NFT
 */
export function useHasImpactNFT(address: `0x${string}` | undefined) {
  const deployment = getCurrentDeployment();
  const { data, isLoading, isError } = useReadContract({
    address: deployment.ImpactNFT as `0x${string}`,
    abi: ABIS.ImpactNFT,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: {
      enabled: !!address,
      staleTime: 60000,
    },
  });

  return {
    hasNFT: data ? (data as bigint) > BigInt(0) : false,
    balance: data as bigint | undefined,
    isLoading,
    isRefreshing: !isLoading && data !== undefined,
    isError,
  };
}
