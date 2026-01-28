"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { ABIS } from "@/lib/contracts/abis";
import { CHAIN_ID, getCurrentDeployment } from "@/lib/contracts/deployments";
import { useVaultStatsGraph } from "@/hooks/useGraph";
import { useState, useEffect } from "react";

/**
 * Hook to fetch ParametricVault statistics
 * 
 * HYBRID APPROACH:
 * - RPC FIRST (instant) - reads directly from blockchain
 * - GraphQL SECOND (for additional context like deposit count)
 * 
 * This ensures instant updates after donations!
 */
export function useVaultStats() {
  const deployment = getCurrentDeployment();
  const vaultAddress = deployment.VAULT_ADDRESS as `0x${string}`;
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // PRIMARY: RPC calls - ALWAYS instant from blockchain!
  const { data: rpcData, isLoading: rpcLoading, isError, refetch } = useReadContracts({
    contracts: [
      {
        address: vaultAddress,
        abi: ABIS.ParametricVault,
        functionName: "totalDeposits",
        chainId: CHAIN_ID,
      },
      {
        address: vaultAddress,
        abi: ABIS.ParametricVault,
        functionName: "getVaultBalance",
        chainId: CHAIN_ID,
      },
      {
        address: vaultAddress,
        abi: ABIS.ParametricVault,
        functionName: "currentState",
        chainId: CHAIN_ID,
      },
      {
        address: vaultAddress,
        abi: ABIS.ParametricVault,
        functionName: "activeCampaignCount",
        chainId: CHAIN_ID,
      },
      {
        address: vaultAddress,
        abi: ABIS.ParametricVault,
        functionName: "totalFeesCollected",
        chainId: CHAIN_ID,
      },
    ],
    query: {
      staleTime: 5000, // Frequent updates but allowed to be slightly stale for UI snappy-ness
    }
  });

  // SECONDARY: GraphQL for additional stats (deposit count, etc.)
  const { stats: graphStats, raw: graphRaw, isLoading: graphLoading } = useVaultStatsGraph();

  // Parse RPC results - this is the PRIMARY source
  const rpcTotalDeposits = rpcData?.[0]?.result as bigint | undefined;
  const rpcVaultBalance = rpcData?.[1]?.result as bigint | undefined;
  const currentState = rpcData?.[2]?.result !== undefined ? Number(rpcData[2].result) : undefined;
  const activeCampaignCount = rpcData?.[3]?.result as bigint | undefined;
  const totalFeesCollected = rpcData?.[4]?.result as bigint | undefined;

  // Use RPC data (instant) - NEVER use GraphQL for totalDeposits as it's delayed
  const totalDeposits = rpcTotalDeposits;
  const vaultBalance = rpcVaultBalance;

  useEffect(() => {
    if (rpcData) {
      console.log(`[useVaultStats] RPC Sync: Deposits=${rpcTotalDeposits}, Balance=${rpcVaultBalance}, Fees=${totalFeesCollected}`);
    }
  }, [rpcData, rpcTotalDeposits, rpcVaultBalance, totalFeesCollected]);

  // Track last updated time
  useEffect(() => {
    if (rpcData && !rpcLoading) {
      setLastUpdated(new Date());
    }
  }, [rpcData, rpcLoading]);

  // State labels
  const stateLabels = ["IDLE", "ALERT", "EMERGENCY", "RELIEF_ACTIVE", "SETTLED"];

  // Format for display (USDC has 6 decimals)
  const formatUSDC = (val: bigint | undefined): string => {
    if (val === undefined) return "$0.00";
    return `$${Number(formatUnits(val, 6)).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Calculate released funds (totalDeposits - vaultBalance)
  const releasedFunds = 
    totalDeposits !== undefined && vaultBalance !== undefined
      ? totalDeposits - vaultBalance
      : undefined;

  // Calculate utilization percentage
  const utilization = 
    totalDeposits !== undefined && totalDeposits > BigInt(0) && releasedFunds !== undefined
      ? Number((releasedFunds * BigInt(100)) / totalDeposits)
      : 0;

  // Loading state: only depends on RPC now (instant path)
  const isLoading = rpcLoading;

  // Sync status: compare RPC vs GraphQL to show if subgraph is behind
  const isSynced = graphRaw?.totalDeposits 
    ? BigInt(graphRaw.totalDeposits) === totalDeposits
    : null; // null = unknown

  return {
    // Raw values (from RPC - instant)
    totalDeposits,
    vaultBalance,
     releasedFunds,
    totalFeesCollected,
    currentState,
    activeCampaignCount: activeCampaignCount !== undefined ? Number(activeCampaignCount) : 0,
    
    // Formatted values (from RPC - instant)
    totalDepositsFormatted: formatUSDC(
      totalDeposits !== undefined && totalFeesCollected !== undefined 
        ? totalDeposits + totalFeesCollected 
        : totalDeposits
    ),
    vaultBalanceFormatted: formatUSDC(vaultBalance),
    releasedFundsFormatted: formatUSDC(releasedFunds),
    totalFeesCollectedFormatted: formatUSDC(totalFeesCollected),
    stateLabel: currentState !== undefined ? stateLabels[currentState] : "Unknown",
    utilization,
    
    // Additional stats from GraphQL (may be delayed)
    depositCount: graphStats?.depositCount ?? 0,
    completedTaskCount: graphStats?.completedTaskCount ?? 0,
    
    // Status
    isLoading,
    isError,
    refetch,
    
    // Sync status for UI indicators
    isSynced,
    isGraphLoading: graphLoading,
    isRefreshing: graphLoading && !graphStats, // True if we are refreshing but already have some data
    lastUpdated,
    dataSource: "rpc", // Always RPC for main stats now
  };
}

/**
 * Hook to fetch task count from ParametricVault
 * Uses RPC first (instant) with GraphQL for additional context
 */
export function useTaskCount() {
  const deployment = getCurrentDeployment();
  // PRIMARY: RPC - instant
  const { data, isLoading: rpcLoading, isError } = useReadContract({
    address: deployment.VAULT_ADDRESS as `0x${string}`,
    abi: ABIS.ParametricVault,
    functionName: "getTaskCount",
    chainId: CHAIN_ID,
    query: {
      staleTime: 30000, // Task count changes less frequently
    }
  });

  // SECONDARY: GraphQL for additional stats
  const { stats: graphStats, isLoading: graphLoading } = useVaultStatsGraph();

  // Use RPC data (instant) as primary
  const taskCount = data as bigint | undefined;

  return {
    taskCount,
    completedTaskCount: graphStats?.completedTaskCount ?? 0,
    isLoading: rpcLoading,
    isError,
    isGraphLoading: graphLoading,
    isRefreshing: graphLoading && !!graphStats,
  };
}
