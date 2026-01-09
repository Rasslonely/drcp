"use client";

import { useCallback, useMemo } from "react";
import { usePublicClient, useReadContract, useWriteContract, useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { formatUnits, parseAbiItem } from "viem";
import { ABIS } from "@/lib/contracts/abis";
import { CHAIN_ID, getCurrentDeployment } from "@/lib/contracts/deployments";

// Proposal state enum (matches OpenZeppelin Governor)
export enum ProposalState {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

// Proposal type enum (matches DRCPGovernor)
export enum ProposalType {
  Standard = 0,
  Emergency = 1,
  Upgrade = 2,
}

// Vote support values
export enum VoteSupport {
  Against = 0,
  For = 1,
  Abstain = 2,
}

// Proposal interface
export interface Proposal {
  id: bigint;
  proposer: string;
  description: string;
  state: ProposalState;
  type: ProposalType;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  deadline: bigint;
  snapshot: bigint;
}

// UI-friendly proposal
export interface ProposalDisplay {
  id: string;
  title: string;
  description: string;
  status: "active" | "passed" | "defeated" | "pending" | "queued" | "executed" | "expired" | "canceled";
  type: "standard" | "emergency" | "upgrade";
  proposer: string;
  proposerFormatted: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotes: number;
  forPercent: number;
  againstPercent: number;
  quorumReached: boolean;
  endTime: string;
  deadlineBlock: bigint;
}

// Governance settings interface
export interface GovernanceSettings {
  votingDelay: number;
  votingPeriod: number;
  proposalThreshold: string;
}

// Parse description to get title (first line)
function parseTitle(description: string): string {
  const firstLine = description.split("\n")[0];
  return firstLine.replace(/^#+\s*/, "").slice(0, 80);
}

// Format proposal state for display
function formatState(state: ProposalState): ProposalDisplay["status"] {
  switch (state) {
    case ProposalState.Pending: return "pending";
    case ProposalState.Active: return "active";
    case ProposalState.Canceled: return "canceled";
    case ProposalState.Defeated: return "defeated";
    case ProposalState.Succeeded: return "passed";
    case ProposalState.Queued: return "queued";
    case ProposalState.Expired: return "expired";
    case ProposalState.Executed: return "executed";
    default: return "pending";
  }
}

// Format proposal type for display
function formatType(type: ProposalType): ProposalDisplay["type"] {
  switch (type) {
    case ProposalType.Standard: return "standard";
    case ProposalType.Emergency: return "emergency";
    case ProposalType.Upgrade: return "upgrade";
    default: return "standard";
  }
}

// Format address
function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ProposalCreated event ABI
const PROPOSAL_CREATED_EVENT = parseAbiItem(
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)"
);

type PublicClient = ReturnType<typeof usePublicClient>;

// ============ CACHING CONFIGURATION ============
const CACHE_CONFIG = {
  staleTime: 60_000,      // 1 minute - data is fresh
  gcTime: 300_000,        // 5 minutes - keep in cache
  refetchOnMount: false,  // Use cache if available
  refetchOnWindowFocus: false,
  retry: 2,
};

/**
 * Fetch proposals from blockchain
 */
async function fetchProposals(
  publicClient: PublicClient,
  blockRange: bigint
): Promise<ProposalDisplay[]> {
  if (!publicClient) return [];

  const deployment = getCurrentDeployment();
  const governorAddress = deployment.DRCPGovernor as `0x${string}`;
  const currentBlock = await publicClient.getBlockNumber();
  const fromBlock = currentBlock > blockRange ? currentBlock - blockRange : BigInt(0);

  // Fetch ProposalCreated events
  const logs = await publicClient.getLogs({
    address: governorAddress,
    event: PROPOSAL_CREATED_EVENT as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    fromBlock,
    toBlock: currentBlock,
  });

  // For each proposal, fetch current state and votes
  const proposalDisplays: ProposalDisplay[] = await Promise.all(
    (logs as unknown as Array<{
      args: {
        proposalId: bigint;
        proposer: string;
        description: string;
        voteEnd: bigint;
      };
    }>).map(async (log) => {
      const proposalId = log.args.proposalId;
      const proposer = log.args.proposer;
      const description = log.args.description;
      const voteEnd = log.args.voteEnd;

      // Fetch proposal state
      const state = await publicClient.readContract({
        address: governorAddress,
        abi: ABIS.DRCPGovernor,
        functionName: "state",
        args: [proposalId],
      }) as number;

      // Fetch proposal votes
      const votes = await publicClient.readContract({
        address: governorAddress,
        abi: ABIS.DRCPGovernor,
        functionName: "proposalVotes",
        args: [proposalId],
      }) as [bigint, bigint, bigint];

      // Fetch proposal type
      const proposalType = await publicClient.readContract({
        address: governorAddress,
        abi: ABIS.DRCPGovernor,
        functionName: "getProposalType",
        args: [proposalId],
      }) as number;

      const [againstVotes, forVotes, abstainVotes] = votes;
      const totalVotes = Number(formatUnits(forVotes + againstVotes + abstainVotes, 18));
      const forVotesNum = Number(formatUnits(forVotes, 18));
      const againstVotesNum = Number(formatUnits(againstVotes, 18));

      // Calculate remaining time
      const blocksLeft = Number(voteEnd) > Number(currentBlock) 
        ? Number(voteEnd) - Number(currentBlock) 
        : 0;
      const secondsLeft = blocksLeft * 2;
      const hoursLeft = Math.floor(secondsLeft / 3600);
      const daysLeft = Math.floor(hoursLeft / 24);
      
      let endTime = "Ended";
      if (state === ProposalState.Executed) endTime = "Executed";
      else if (state === ProposalState.Canceled) endTime = "Canceled";
      else if (blocksLeft > 0) {
        endTime = daysLeft > 0 ? `${daysLeft} days left` : `${hoursLeft} hours left`;
      }

      return {
        id: proposalId.toString(),
        title: parseTitle(description),
        description: description.slice(0, 200),
        status: formatState(state as ProposalState),
        type: formatType(proposalType as ProposalType),
        proposer,
        proposerFormatted: formatAddress(proposer),
        votesFor: forVotesNum,
        votesAgainst: againstVotesNum,
        votesAbstain: Number(formatUnits(abstainVotes, 18)),
        totalVotes,
        forPercent: totalVotes > 0 ? Math.round((forVotesNum / totalVotes) * 100) : 0,
        againstPercent: totalVotes > 0 ? Math.round((againstVotesNum / totalVotes) * 100) : 0,
        quorumReached: totalVotes > 0,
        endTime,
        deadlineBlock: voteEnd,
      };
    })
  );

  // Sort by proposal ID descending (newest first)
  proposalDisplays.sort((a, b) => Number(BigInt(b.id) - BigInt(a.id)));
  return proposalDisplays;
}

/**
 * Hook to fetch governance proposals with React Query caching
 */
export function useProposals(blockRange: bigint = BigInt(10000)) {
  const publicClient = usePublicClient({ chainId: CHAIN_ID });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['proposals', blockRange.toString()],
    queryFn: () => fetchProposals(publicClient, blockRange),
    enabled: !!publicClient,
    ...CACHE_CONFIG,
  });

  const proposals = data ?? [];

  // Calculate stats using useMemo
  const stats = useMemo(() => ({
    active: proposals.filter(p => p.status === "active").length,
    passed: proposals.filter(p => p.status === "passed" || p.status === "queued" || p.status === "executed").length,
    defeated: proposals.filter(p => p.status === "defeated").length,
    total: proposals.length,
  }), [proposals]);

  return { 
    proposals, 
    stats, 
    isLoading, 
    error: error as Error | null, 
    refetch 
  };
}

/**
 * Hook to check if user has voted on a proposal
 */
export function useHasVoted(proposalId: string | undefined) {
  const { address } = useAccount();

  const deployment = getCurrentDeployment();
  const { data, isLoading, refetch } = useReadContract({
    address: deployment.DRCPGovernor as `0x${string}`,
    abi: ABIS.DRCPGovernor,
    functionName: "hasVoted",
    args: proposalId && address ? [BigInt(proposalId), address] : undefined,
    chainId: CHAIN_ID,
    query: {
      enabled: !!proposalId && !!address,
      staleTime: 60000,
    },
  });

  return {
    hasVoted: data as boolean | undefined,
    isLoading,
    refetch,
  };
}

/**
 * Hook to get user's voting power
 */
export function useVotingPower() {
  const { address } = useAccount();

  const deployment = getCurrentDeployment();
  const { data, isLoading } = useReadContract({
    address: deployment.RescueToken as `0x${string}`,
    abi: ABIS.RescueToken,
    functionName: "getVotes",
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: {
      enabled: !!address,
      staleTime: 30000, // Voting power doesn't change every second
    },
  });

  const votingPower = data as bigint | undefined;
  const votingPowerFormatted = votingPower 
    ? Number(formatUnits(votingPower, 18)).toLocaleString("en-US", { maximumFractionDigits: 2 })
    : "0";

  return {
    votingPower,
    votingPowerFormatted,
    hasVotingPower: votingPower ? votingPower > BigInt(0) : false,
    isLoading,
  };
}

/**
 * Hook to cast a vote
 */
export function useCastVote() {
  const { writeContract, isPending, isSuccess, error } = useWriteContract();

  const castVote = useCallback(
    (proposalId: string, support: VoteSupport) => {
      const deployment = getCurrentDeployment();
      writeContract({
        address: deployment.DRCPGovernor as `0x${string}`,
        abi: ABIS.DRCPGovernor,
        functionName: "castVote",
        args: [BigInt(proposalId), support],
        chainId: CHAIN_ID,
      });
    },
    [writeContract]
  );

  return {
    castVote,
    isPending,
    isSuccess,
    error,
  };
}

/**
 * Fetch governance settings from blockchain
 */
async function fetchGovernanceSettings(
  publicClient: PublicClient
): Promise<GovernanceSettings | null> {
  if (!publicClient) return null;

  const deployment = getCurrentDeployment();
  const governorAddress = deployment.DRCPGovernor as `0x${string}`;

  const [votingDelay, votingPeriod, proposalThreshold] = await Promise.all([
    publicClient.readContract({
      address: governorAddress,
      abi: ABIS.DRCPGovernor,
      functionName: "votingDelay",
    }),
    publicClient.readContract({
      address: governorAddress,
      abi: ABIS.DRCPGovernor,
      functionName: "votingPeriod",
    }),
    publicClient.readContract({
      address: governorAddress,
      abi: ABIS.DRCPGovernor,
      functionName: "proposalThreshold",
    }),
  ]);

  return {
    votingDelay: Number(votingDelay),
    votingPeriod: Number(votingPeriod),
    proposalThreshold: formatUnits(proposalThreshold as bigint, 18),
  };
}

/**
 * Hook to get governance settings with React Query caching
 */
export function useGovernanceSettings() {
  const publicClient = usePublicClient({ chainId: CHAIN_ID });

  const { data, isLoading } = useQuery({
    queryKey: ['governanceSettings'],
    queryFn: () => fetchGovernanceSettings(publicClient),
    enabled: !!publicClient,
    ...CACHE_CONFIG,
    staleTime: 300_000, // Settings rarely change, cache for 5 minutes
  });

  return { settings: data ?? null, isLoading };
}
