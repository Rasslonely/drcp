"use client";

import { useCallback, useEffect, useState } from "react";
import {
  usePublicClient,
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits, encodeFunctionData, parseAbiItem } from "viem";
import { ABIS } from "@/lib/contracts/abis";
import { RESCUE_TOKEN_ADDRESS, GOVERNOR_ADDRESS } from "@/lib/contracts/deployments";
import { txToast, walletErrorToast } from "./useToast";
import { apolloClient } from "@/lib/graphql/client";

// ============ Types ============

export type ProposalType = "standard" | "emergency" | "upgrade";

export interface ProposalParams {
  title: string;
  description: string;
  targets: `0x${string}`[];
  values: bigint[];
  calldatas: `0x${string}`[];
}

// ============ useCanPropose Hook ============

/**
 * Hook to check if user can create proposals
 * Requires >= proposalThreshold tokens
 */
export function useCanPropose() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(true);
  const [threshold, setThreshold] = useState<bigint>(BigInt(0));
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [userVotes, setUserVotes] = useState<bigint>(BigInt(0));

  const fetchData = useCallback(async () => {
    if (!publicClient || !address || !isConnected) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get proposal threshold from governor
      const thresholdResult = await publicClient.readContract({
        address: GOVERNOR_ADDRESS,
        abi: ABIS.DRCPGovernor,
        functionName: "proposalThreshold",
      }) as bigint;

      // Get user's token balance
      const balanceResult = await publicClient.readContract({
        address: RESCUE_TOKEN_ADDRESS,
        abi: ABIS.RescueToken,
        functionName: "balanceOf",
        args: [address],
      }) as bigint;

      // Get user's voting power (delegated votes)
      const votesResult = await publicClient.readContract({
        address: RESCUE_TOKEN_ADDRESS,
        abi: ABIS.RescueToken,
        functionName: "getVotes",
        args: [address],
      }) as bigint;

      setThreshold(thresholdResult);
      setUserBalance(balanceResult);
      setUserVotes(votesResult);
    } catch (error) {
      console.error("Error fetching proposal requirements:", error);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address, isConnected]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // User can propose if their voting power >= threshold
  const canPropose = userVotes >= threshold;
  const shortfall = threshold > userVotes ? threshold - userVotes : BigInt(0);

  const formatTokens = (amount: bigint) => {
    const formatted = parseFloat(formatUnits(amount, 18));
    return formatted.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return {
    canPropose,
    threshold,
    thresholdFormatted: formatTokens(threshold),
    userBalance,
    userBalanceFormatted: formatTokens(userBalance),
    userVotes,
    userVotesFormatted: formatTokens(userVotes),
    shortfall,
    shortfallFormatted: formatTokens(shortfall),
    isLoading,
    refetch: fetchData,
  };
}

// ============ usePropose Hook ============

/**
 * Hook to create governance proposals
 */
export function usePropose() {
  const { 
    writeContract, 
    data: hash, 
    isPending, 
    error: writeError, 
    reset 
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess, 
    error: receiptError 
  } = useWaitForTransactionReceipt({ hash });

  const [proposalType, setProposalType] = useState<ProposalType>("standard");

  // Show hash toast
  useEffect(() => {
    if (hash) {
      txToast(hash, "Proposal submitted");
    }
  }, [hash]);

  // Build description with title (Governor parses first line as title)
  const buildDescription = (title: string, description: string): string => {
    return `# ${title}\n\n${description}`;
  };

  // Create standard proposal (3-day voting)
  const proposeStandard = useCallback(
    (params: ProposalParams) => {
      setProposalType("standard");
      const fullDescription = buildDescription(params.title, params.description);
      
      writeContract({
        address: GOVERNOR_ADDRESS,
        abi: ABIS.DRCPGovernor,
        functionName: "propose",
        args: [params.targets, params.values, params.calldatas, fullDescription],
        gas: BigInt(800000), // Higher gas for governance complexity
      });
    },
    [writeContract]
  );

  // Create emergency proposal (1-day voting)
  const proposeEmergency = useCallback(
    (params: ProposalParams) => {
      setProposalType("emergency");
      const fullDescription = buildDescription(params.title, params.description);
      
      writeContract({
        address: GOVERNOR_ADDRESS,
        abi: ABIS.DRCPGovernor,
        functionName: "proposeEmergency",
        args: [params.targets, params.values, params.calldatas, fullDescription],
        gas: BigInt(800000),
      });
    },
    [writeContract]
  );

  // Create upgrade proposal (requires 67% supermajority)
  const proposeUpgrade = useCallback(
    (params: ProposalParams) => {
      setProposalType("upgrade");
      const fullDescription = buildDescription(params.title, params.description);
      
      writeContract({
        address: GOVERNOR_ADDRESS,
        abi: ABIS.DRCPGovernor,
        functionName: "proposeUpgrade",
        args: [params.targets, params.values, params.calldatas, fullDescription],
        gas: BigInt(1000000), // Upgrades are heavy
      });
    },
    [writeContract]
  );

  // Generic propose function that routes to correct type
  const propose = useCallback(
    (type: ProposalType, params: ProposalParams) => {
      switch (type) {
        case "emergency":
          proposeEmergency(params);
          break;
        case "upgrade":
          proposeUpgrade(params);
          break;
        default:
          proposeStandard(params);
      }
    },
    [proposeStandard, proposeEmergency, proposeUpgrade]
  );

  // Refetch on success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        apolloClient.refetchQueries({ include: "active" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  return {
    propose,
    proposeStandard,
    proposeEmergency,
    proposeUpgrade,
    proposalType,
    txHash: hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
    receiptError,
    reset,
  };
}

// ============ Helper: Encode Action Calldata ============

/**
 * Helper to encode function calls for proposals
 */
export function encodeProposalAction(
  functionSignature: string,
  args: unknown[]
): `0x${string}` {
  // Parse the function signature and encode
  const abiItem = parseAbiItem(`function ${functionSignature}`);
  return encodeFunctionData({
    abi: [abiItem],
    functionName: functionSignature.split("(")[0],
    args,
  }) as `0x${string}`;
}

/**
 * Create empty action for text-only proposals
 * L-02 Audit Fix: Use proper no-op calldata that works with all timelocks
 * We target the Governor's own address with empty value - this is a safe no-op
 */
export function createEmptyAction(): {
  targets: `0x${string}`[];
  values: bigint[];
  calldatas: `0x${string}`[];
} {
  // Target the Governor contract with 0 value and empty calldata
  // This creates a valid "do nothing" action that timelocks accept
  return {
    targets: [GOVERNOR_ADDRESS],
    values: [BigInt(0)],
    // Empty calldata (0x) is valid for EOA-style calls to contracts
    // If issues arise, use "0x00000000" (4 zero bytes) as fallback
    calldatas: ["0x" as `0x${string}`],
  };
}

