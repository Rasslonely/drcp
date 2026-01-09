"use client";

import { useCallback, useEffect, useState } from "react";
import {
  usePublicClient,
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { ABIS } from "@/lib/contracts/abis";
import { PROJECT_TREASURY, MOCK_USDC_ADDRESS, CREATOR_WALLET, CHAIN_ID } from "@/lib/contracts/deployments";

// ============ Types ============

export interface TreasuryStats {
  totalDonations: bigint;
  totalWithdrawn: bigint;
  currentBalance: bigint;
  donorCount: number;
}

// ============ useTreasuryBalance Hook ============

/**
 * Hook to get project treasury balance and stats
 */
export function useTreasuryBalance() {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [userContribution, setUserContribution] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!publicClient) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await publicClient.readContract({
        address: PROJECT_TREASURY,
        abi: ABIS.ProjectTreasury,
        functionName: "getStats",
      }) as [bigint, bigint, bigint, bigint];

      setStats({
        totalDonations: result[0],
        totalWithdrawn: result[1],
        currentBalance: result[2],
        donorCount: Number(result[3]),
      });

      // Get user's contribution if connected
      if (address) {
        const contribution = await publicClient.readContract({
          address: PROJECT_TREASURY,
          abi: ABIS.ProjectTreasury,
          functionName: "getDonorContribution",
          args: [address],
        }) as bigint;
        setUserContribution(contribution);
      }
    } catch (error) {
      console.error("Error fetching treasury stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatUSDC = (amount: bigint) => {
    return parseFloat(formatUnits(amount, 6)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return {
    stats,
    totalDonationsFormatted: stats ? formatUSDC(stats.totalDonations) : "0.00",
    currentBalanceFormatted: stats ? formatUSDC(stats.currentBalance) : "0.00",
    donorCount: stats?.donorCount || 0,
    userContribution,
    userContributionFormatted: formatUSDC(userContribution),
    isLoading,
    refetch: fetchStats,
  };
}

// ============ useTreasuryDonate Hook ============

/**
 * Hook to donate to project treasury (on-chain tracking)
 * @deprecated Use useCreatorDonate for personal donations
 */
export function useTreasuryDonate() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Approve USDC for treasury
  const approve = useCallback(
    (amount: string) => {
      const amountWei = parseUnits(amount, 6);
      writeContract({
        address: MOCK_USDC_ADDRESS,
        abi: ABIS.ERC20,
        functionName: "approve",
        args: [PROJECT_TREASURY, amountWei],
        chainId: CHAIN_ID,
      });
    },
    [writeContract]
  );

  // Donate to treasury
  const donate = useCallback(
    (amount: string, message: string = "") => {
      const amountWei = parseUnits(amount, 6);
      writeContract({
        address: PROJECT_TREASURY,
        abi: ABIS.ProjectTreasury,
        functionName: "donate",
        args: [amountWei, message],
        chainId: CHAIN_ID,
      });
    },
    [writeContract]
  );

  return {
    approve,
    donate,
    txHash: hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

// ============ useCreatorDonate Hook ============

/**
 * Hook to donate directly to creator's personal wallet
 * NO on-chain tracking - simple USDC transfer
 */
export function useCreatorDonate() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Simple USDC transfer to creator wallet
  const donate = useCallback(
    (amount: string) => {
      const amountWei = parseUnits(amount, 6);
      writeContract({
        address: MOCK_USDC_ADDRESS,
        abi: ABIS.ERC20,
        functionName: "transfer",
        args: [CREATOR_WALLET, amountWei],
        chainId: CHAIN_ID,
      });
    },
    [writeContract]
  );

  return {
    donate,
    txHash: hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

