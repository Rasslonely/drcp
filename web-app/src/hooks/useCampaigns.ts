"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, type Address, stringToHex } from "viem";
import { useEffect } from "react";
import { ABIS } from "@/lib/contracts/abis";
import { VAULT_ADDRESS } from "@/lib/contracts/deployments";
import { apolloClient } from "@/lib/graphql/client";
import { walletErrorToast, txToast } from "@/hooks";

/**
 * Hook to deposit to a specific campaign
 */
export function useDepositToCampaign() {
  const { 
    writeContract, 
    data: hash, 
    isPending, 
    error: writeError 
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });

  // Show hash toast as soon as we have it
  useEffect(() => {
    if (hash) {
      txToast(hash, "Donation submitted");
    }
  }, [hash]);

  async function depositToCampaign(campaignId: number, amount: string) {
    try {
      const amountParsed = parseUnits(amount, 6); // USDC has 6 decimals
      
      writeContract({
        address: VAULT_ADDRESS,
        abi: ABIS.ParametricVault,
        functionName: "depositToCampaign",
        args: [BigInt(campaignId), amountParsed],
      });
    } catch (err) {
      console.error("depositToCampaign error:", err);
      walletErrorToast(err instanceof Error ? err.message : "Campaign action failed");
    }
  }

  // Refetch subgraph on success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        apolloClient.refetchQueries({ include: "active" });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  return {
    depositToCampaign,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
    receiptError,
  };
}

/**
 * Hook for DAO to create a new campaign
 */
export function useCreateCampaign() {
  const { 
    writeContract, 
    data: hash, 
    isPending, 
    error: writeError 
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });

  // Show hash toast
  useEffect(() => {
    if (hash) {
      txToast(hash, "Creating campaign...");
    }
  }, [hash]);

  async function createCampaign(
    name: string,
    description: string,
    targetAmount: string,
    deadlineTimestamp: number,
    geoHash: string
  ) {
    try {
      const targetParsed = parseUnits(targetAmount, 6);
      const geoHashBytes = stringToHex(geoHash, { size: 32 });
      
      writeContract({
        address: VAULT_ADDRESS,
        abi: ABIS.ParametricVault,
        functionName: "createCampaign",
        args: [name, description, targetParsed, BigInt(deadlineTimestamp), geoHashBytes],
        gas: BigInt(500000), // Explicit gas limit for Amoy flakiness
      });
    } catch (err) {
      console.error("createCampaign error:", err);
      walletErrorToast(err instanceof Error ? err.message : "Campaign action failed");
    }
  }

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        apolloClient.refetchQueries({ include: "active" });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  return {
    createCampaign,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
    receiptError,
  };
}

/**
 * Hook for DAO to close a campaign
 */
export function useCloseCampaign() {
  const { 
    writeContract, 
    data: hash, 
    isPending, 
    error: writeError 
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });

  // Show hash toast
  useEffect(() => {
    if (hash) {
      txToast(hash, "Closing campaign...");
    }
  }, [hash]);

  async function closeCampaign(campaignId: number) {
    try {
      writeContract({
        address: VAULT_ADDRESS,
        abi: ABIS.ParametricVault,
        functionName: "closeCampaign",
        args: [BigInt(campaignId)],
        gas: BigInt(300000), // Explicit gas limit
      });
    } catch (err) {
      console.error("closeCampaign error:", err);
      walletErrorToast(err instanceof Error ? err.message : "Campaign action failed");
    }
  }

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        apolloClient.refetchQueries({ include: "active" });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  return {
    closeCampaign,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
    receiptError,
  };
}
