"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { usePublicClient } from "wagmi";
import { formatUnits, parseAbiItem } from "viem";
import { ABIS } from "@/lib/contracts/abis";
import { RESCUE_TOKEN_ADDRESS, GOVERNOR_ADDRESS } from "@/lib/contracts/deployments";

// ============ Types ============

export interface VoteRecord {
  voter: `0x${string}`;
  voterFormatted: string;
  proposalId: string;
  support: "for" | "against" | "abstain";
  weight: bigint;
  weightFormatted: string;
  reason: string;
  txHash: `0x${string}`;
  blockNumber: bigint;
}

export interface DelegateStats {
  address: `0x${string}`;
  addressFormatted: string;
  displayName: string | null;
  votingPower: bigint;
  votingPowerFormatted: string;
  votingPowerPercent: number;
}

export interface VotingAnalyticsData {
  // Token distribution
  totalSupply: bigint;
  totalDelegated: bigint;
  delegationRate: number;
  
  // Top delegates
  topDelegates: DelegateStats[];
  
  // Participation stats
  totalVotesCast: number;
  uniqueVoters: number;
  avgVotesPerProposal: number;
  
  isLoading: boolean;
}

// ============ Helper Functions ============

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatVotingPower(votes: bigint): string {
  const formatted = parseFloat(formatUnits(votes, 18));
  if (formatted >= 1_000_000) {
    return `${(formatted / 1_000_000).toFixed(2)}M`;
  }
  if (formatted >= 1_000) {
    return `${(formatted / 1_000).toFixed(1)}K`;
  }
  return formatted.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function mapSupport(support: number): "for" | "against" | "abstain" {
  switch (support) {
    case 0: return "against";
    case 1: return "for";
    case 2: return "abstain";
    default: return "abstain";
  }
}

// VoteCast event ABI
const VOTE_CAST_EVENT = parseAbiItem(
  "event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)"
);

// DelegateVotesChanged event ABI
const DELEGATE_VOTES_CHANGED_EVENT = parseAbiItem(
  "event DelegateVotesChanged(address indexed delegate, uint256 previousVotes, uint256 newVotes)"
);

// ============ useVotingAnalytics Hook ============

/**
 * Hook to get voting analytics data
 */
export function useVotingAnalytics() {
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(true);
  const [totalSupply, setTotalSupply] = useState<bigint>(BigInt(0));
  const [topDelegates, setTopDelegates] = useState<DelegateStats[]>([]);
  const [totalDelegated, setTotalDelegated] = useState<bigint>(BigInt(0));
  const [voteRecords, setVoteRecords] = useState<VoteRecord[]>([]);

  const fetchAnalytics = useCallback(async () => {
    if (!publicClient) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get total supply
      const supply = await publicClient.readContract({
        address: RESCUE_TOKEN_ADDRESS,
        abi: ABIS.RescueToken,
        functionName: "totalSupply",
      }) as bigint;
      setTotalSupply(supply);

      // Get current block
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > BigInt(100000) ? currentBlock - BigInt(100000) : BigInt(0);

      // Fetch DelegateVotesChanged events for top delegates
      const delegateLogs = await publicClient.getLogs({
        address: RESCUE_TOKEN_ADDRESS,
        event: DELEGATE_VOTES_CHANGED_EVENT,
        fromBlock,
        toBlock: "latest",
      });

      // Build map of latest voting power per delegate
      const delegateMap = new Map<string, bigint>();
      for (const log of delegateLogs) {
        const delegate = log.args.delegate as `0x${string}`;
        const newVotes = log.args.newVotes as bigint;
        if (delegate) {
          delegateMap.set(delegate.toLowerCase(), newVotes);
        }
      }

      // Convert to array and sort by voting power
      let totalPower = BigInt(0);
      const delegatesArray: DelegateStats[] = [];

      for (const [addr, power] of delegateMap.entries()) {
        if (power > BigInt(0)) {
          totalPower += power;
          delegatesArray.push({
            address: addr as `0x${string}`,
            addressFormatted: formatAddress(addr),
            displayName: null, // Would come from profiles
            votingPower: power,
            votingPowerFormatted: formatVotingPower(power),
            votingPowerPercent: supply > BigInt(0)
              ? Number((power * BigInt(10000)) / supply) / 100
              : 0,
          });
        }
      }

      // Sort by voting power descending and take top 10
      delegatesArray.sort((a, b) => Number(b.votingPower - a.votingPower));
      setTopDelegates(delegatesArray.slice(0, 10));
      setTotalDelegated(totalPower);

      // Fetch VoteCast events
      const voteLogs = await publicClient.getLogs({
        address: GOVERNOR_ADDRESS,
        event: VOTE_CAST_EVENT,
        fromBlock,
        toBlock: "latest",
      });

      // Parse vote records
      const votes: VoteRecord[] = voteLogs.map((log) => ({
        voter: log.args.voter as `0x${string}`,
        voterFormatted: formatAddress(log.args.voter as string),
        proposalId: (log.args.proposalId as bigint).toString(),
        support: mapSupport(log.args.support as number),
        weight: log.args.weight as bigint,
        weightFormatted: formatVotingPower(log.args.weight as bigint),
        reason: log.args.reason as string || "",
        txHash: log.transactionHash as `0x${string}`,
        blockNumber: log.blockNumber,
      }));

      setVoteRecords(votes);
    } catch (error) {
      console.error("Error fetching voting analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Computed stats
  const stats = useMemo(() => {
    const uniqueVoters = new Set(voteRecords.map((v) => v.voter.toLowerCase())).size;
    const proposalIds = new Set(voteRecords.map((v) => v.proposalId));
    const avgVotesPerProposal = proposalIds.size > 0
      ? voteRecords.length / proposalIds.size
      : 0;

    return {
      totalVotesCast: voteRecords.length,
      uniqueVoters,
      avgVotesPerProposal: Math.round(avgVotesPerProposal * 10) / 10,
    };
  }, [voteRecords]);

  const delegationRate = totalSupply > BigInt(0)
    ? Number((totalDelegated * BigInt(10000)) / totalSupply) / 100
    : 0;

  return {
    totalSupply,
    totalDelegated,
    delegationRate,
    topDelegates,
    voteRecords,
    ...stats,
    isLoading,
    refetch: fetchAnalytics,
  };
}

// ============ useProposalVotes Hook ============

/**
 * Hook to get votes for a specific proposal
 */
export function useProposalVotes(proposalId: string | undefined) {
  const publicClient = usePublicClient();
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVotes = useCallback(async () => {
    if (!publicClient || !proposalId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > BigInt(100000) ? currentBlock - BigInt(100000) : BigInt(0);

      // Fetch VoteCast events
      const voteLogs = await publicClient.getLogs({
        address: GOVERNOR_ADDRESS,
        event: VOTE_CAST_EVENT,
        fromBlock,
        toBlock: "latest",
      });

      // Filter and parse votes for this proposal
      const proposalVotes: VoteRecord[] = voteLogs
        .filter((log) => (log.args.proposalId as bigint).toString() === proposalId)
        .map((log) => ({
          voter: log.args.voter as `0x${string}`,
          voterFormatted: formatAddress(log.args.voter as string),
          proposalId: (log.args.proposalId as bigint).toString(),
          support: mapSupport(log.args.support as number),
          weight: log.args.weight as bigint,
          weightFormatted: formatVotingPower(log.args.weight as bigint),
          reason: log.args.reason as string || "",
          txHash: log.transactionHash as `0x${string}`,
          blockNumber: log.blockNumber,
        }))
        .sort((a, b) => Number(b.weight - a.weight)); // Sort by weight desc

      setVotes(proposalVotes);
    } catch (error) {
      console.error("Error fetching proposal votes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, proposalId]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  // Computed counts
  const forVoters = votes.filter((v) => v.support === "for").length;
  const againstVoters = votes.filter((v) => v.support === "against").length;
  const abstainVoters = votes.filter((v) => v.support === "abstain").length;
  const largestVote = votes[0] || null;

  return {
    votes,
    forVoters,
    againstVoters,
    abstainVoters,
    largestVote,
    isLoading,
    refetch: fetchVotes,
  };
}
