"use client";

import { usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { formatUnits, parseAbiItem } from "viem";
import { VAULT_ADDRESS, IMPACT_NFT_ADDRESS, CHAIN_ID } from "@/lib/contracts/deployments";
import { useActivitiesGraph } from "@/hooks/useGraph";

// Event interfaces
export interface DepositEvent {
  donor: string;
  amount: bigint;
  amountFormatted: string;
  timestamp: number;
  txHash: string;
  blockNumber: bigint;
}

export interface TaskVerifiedEvent {
  taskId: bigint;
  volunteer: string;
  reward: bigint;
  rewardFormatted: string;
  timestamp: number;
  txHash: string;
  blockNumber: bigint;
}

export interface EmergencyDeclaredEvent {
  emergencyId: bigint;
  disasterType: string;
  fundsAllocated: bigint;
  fundsAllocatedFormatted: string;
  timestamp: number;
  txHash: string;
  blockNumber: bigint;
}

export interface ImpactRecordedEvent {
  volunteer: string;
  tokenId: bigint;
  tasksCompleted: bigint;
  reputation: bigint;
  tier: number;
  timestamp: number;
  txHash: string;
  blockNumber: bigint;
}

// Combined transaction type for transparency page
export interface TransactionEvent {
  id: string;
  type: "deposit" | "release" | "volunteer_payout" | "emergency";
  amount: string;
  from?: string;
  to?: string;
  timestamp: number;
  txHash: string;
  blockNumber: bigint;
  label?: string;
}

// Event ABIs
const DEPOSITED_EVENT = parseAbiItem("event Deposited(address indexed donor, uint256 amount)");
const TASK_VERIFIED_EVENT = parseAbiItem("event TaskVerified(uint256 indexed taskId, address indexed volunteer, uint256 reward)");
const IMPACT_RECORDED_EVENT = parseAbiItem("event ImpactRecorded(address indexed volunteer, uint256 tokenId, uint256 tasksCompleted, uint256 reputation, uint8 tier)");

// Helper to format address for display
function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Helper to fetch logs in paginated chunks (avoids Alchemy 400 errors)
 * Alchemy free tier limits getLogs to ~2000 blocks per request
 */
const CHUNK_SIZE = BigInt(2000);

type PublicClient = ReturnType<typeof usePublicClient>;

async function fetchLogsInChunks(
  publicClient: PublicClient,
  address: `0x${string}`,
  event: ReturnType<typeof parseAbiItem>,
  fromBlock: bigint,
  toBlock: bigint
): Promise<unknown[]> {
  if (!publicClient) return [];
  
  const allLogs: unknown[] = [];
  let currentFrom = fromBlock;
  
  while (currentFrom < toBlock) {
    const currentTo = currentFrom + CHUNK_SIZE > toBlock 
      ? toBlock 
      : currentFrom + CHUNK_SIZE;
    
    try {
      const logs = await publicClient.getLogs({
        address,
        event: event as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        fromBlock: currentFrom,
        toBlock: currentTo,
      });
      allLogs.push(...logs);
    } catch (err) {
      console.warn(`Failed to fetch logs for blocks ${currentFrom}-${currentTo}:`, err);
    }
    
    currentFrom = currentTo + BigInt(1);
  }
  
  return allLogs;
}

// ============ CACHING CONFIGURATION ============
// staleTime: How long data is considered "fresh" (won't refetch)
// gcTime: How long to keep data in cache after component unmounts (React Query v5)
const CACHE_CONFIG = {
  staleTime: 60_000,      // 1 minute - data is fresh
  gcTime: 300_000,        // 5 minutes - keep in cache
  refetchOnMount: false,  // Use cache if available
  refetchOnWindowFocus: false,
  retry: 2,
};

/**
 * Fetches deposit events from blockchain
 */
async function fetchDepositEvents(
  publicClient: PublicClient,
  blockRange: bigint
): Promise<DepositEvent[]> {
  if (!publicClient) return [];
  
  const currentBlock = await publicClient.getBlockNumber();
  const fromBlock = currentBlock > blockRange ? currentBlock - blockRange : BigInt(0);

  const logs = await fetchLogsInChunks(
    publicClient,
    VAULT_ADDRESS,
    DEPOSITED_EVENT,
    fromBlock,
    currentBlock
  );

  // Cache block timestamps to avoid duplicate fetches
  const blockCache = new Map<bigint, bigint>();
  
  const parsedEvents: DepositEvent[] = await Promise.all(
    (logs as Array<{ args: { donor: string; amount: bigint }; blockNumber: bigint; transactionHash: string }>).map(async (log) => {
      let timestamp = blockCache.get(log.blockNumber);
      if (!timestamp) {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        timestamp = block.timestamp;
        blockCache.set(log.blockNumber, timestamp);
      }
      
      return {
        donor: log.args.donor,
        amount: log.args.amount,
        amountFormatted: `$${Number(formatUnits(log.args.amount, 6)).toFixed(2)}`,
        timestamp: Number(timestamp),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      };
    })
  );

  // Sort by block number descending (newest first)
  parsedEvents.sort((a, b) => Number(b.blockNumber - a.blockNumber));
  return parsedEvents;
}

/**
 * Hook to fetch Deposited events with React Query caching
 */
export function useDepositEvents(blockRange: bigint = BigInt(50000)) {
  const publicClient = usePublicClient({ chainId: CHAIN_ID });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['deposits', blockRange.toString()],
    queryFn: () => fetchDepositEvents(publicClient, blockRange),
    enabled: !!publicClient,
    ...CACHE_CONFIG,
  });

  return { 
    events: data ?? [], 
    isLoading, 
    error: error as Error | null, 
    refetch 
  };
}

/**
 * Fetches task verified events from blockchain
 */
async function fetchTaskVerifiedEvents(
  publicClient: PublicClient,
  blockRange: bigint
): Promise<TaskVerifiedEvent[]> {
  if (!publicClient) return [];
  
  const currentBlock = await publicClient.getBlockNumber();
  const fromBlock = currentBlock > blockRange ? currentBlock - blockRange : BigInt(0);

  const logs = await fetchLogsInChunks(
    publicClient,
    VAULT_ADDRESS,
    TASK_VERIFIED_EVENT,
    fromBlock,
    currentBlock
  );

  const blockCache = new Map<bigint, bigint>();
  
  const parsedEvents: TaskVerifiedEvent[] = await Promise.all(
    (logs as Array<{ args: { taskId: bigint; volunteer: string; reward: bigint }; blockNumber: bigint; transactionHash: string }>).map(async (log) => {
      let timestamp = blockCache.get(log.blockNumber);
      if (!timestamp) {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        timestamp = block.timestamp;
        blockCache.set(log.blockNumber, timestamp);
      }
      
      return {
        taskId: log.args.taskId,
        volunteer: log.args.volunteer,
        reward: log.args.reward,
        rewardFormatted: `$${Number(formatUnits(log.args.reward, 6)).toFixed(2)}`,
        timestamp: Number(timestamp),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      };
    })
  );

  parsedEvents.sort((a, b) => Number(b.blockNumber - a.blockNumber));
  return parsedEvents;
}

/**
 * Hook to fetch TaskVerified events with React Query caching
 */
export function useTaskVerifiedEvents(blockRange: bigint = BigInt(50000)) {
  const publicClient = usePublicClient({ chainId: CHAIN_ID });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['taskVerified', blockRange.toString()],
    queryFn: () => fetchTaskVerifiedEvents(publicClient, blockRange),
    enabled: !!publicClient,
    ...CACHE_CONFIG,
  });

  return { 
    events: data ?? [], 
    isLoading, 
    error: error as Error | null, 
    refetch 
  };
}

/**
 * Fetches impact recorded events from blockchain
 */
async function fetchImpactRecordedEvents(
  publicClient: PublicClient,
  blockRange: bigint
): Promise<ImpactRecordedEvent[]> {
  if (!publicClient) return [];
  
  const currentBlock = await publicClient.getBlockNumber();
  const fromBlock = currentBlock > blockRange ? currentBlock - blockRange : BigInt(0);

  const logs = await publicClient.getLogs({
    address: IMPACT_NFT_ADDRESS,
    event: IMPACT_RECORDED_EVENT as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    fromBlock,
    toBlock: currentBlock,
  });

  const parsedEvents: ImpactRecordedEvent[] = await Promise.all(
    (logs as unknown as Array<{ 
      args: { volunteer: string; tokenId: bigint; tasksCompleted: bigint; reputation: bigint; tier: number }; 
      blockNumber: bigint; 
      transactionHash: string 
    }>).map(async (log) => {
      const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
      return {
        volunteer: log.args.volunteer,
        tokenId: log.args.tokenId,
        tasksCompleted: log.args.tasksCompleted,
        reputation: log.args.reputation,
        tier: Number(log.args.tier),
        timestamp: Number(block.timestamp),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      };
    })
  );

  parsedEvents.sort((a, b) => Number(b.blockNumber - a.blockNumber));
  return parsedEvents;
}

/**
 * Hook to fetch ImpactRecorded events with React Query caching
 */
export function useImpactRecordedEvents(blockRange: bigint = BigInt(50000)) {
  const publicClient = usePublicClient({ chainId: CHAIN_ID });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['impactRecorded', blockRange.toString()],
    queryFn: () => fetchImpactRecordedEvents(publicClient, blockRange),
    enabled: !!publicClient,
    ...CACHE_CONFIG,
  });

  return { 
    events: data ?? [], 
    isLoading, 
    error: error as Error | null, 
    refetch 
  };
}

/**
 * Combined hook for all transaction types (for transparency page)
 * Uses the Unified Ledger from Subgraph for maximum efficiency!
 * 
 * PERFORMANCE FIX: Removed RPC fallback that was running in parallel
 * causing 2+ minute loading times. Subgraph is the single source of truth.
 */
export function useAllTransactions(address?: string, limit = 50, type?: string) {
  // SUBGRAPH ONLY - No more RPC fallback!
  // If we have a specific type, we can be more specific with the address filter
  // logic to avoid complex OR queries that might not be supported on all nodes
  const { activities, isLoading } = useActivitiesGraph({ 
    volunteer: type === 'PAYOUT' ? address : undefined,
    donor: (type === 'DEPOSIT' || type === 'CAMPAIGN_DEPOSIT') ? address : undefined,
    account: !type ? address : undefined, // Only use general account filter if type is not specified
    type: type
  }, limit);
  
  // Map activities to UI events
  const transactions: TransactionEvent[] = (activities || []).map(a => {
    let type: TransactionEvent['type'] = 'deposit';
    if (a.type === 'WITHDRAWAL') type = 'release';
    if (a.type === 'PAYOUT') type = 'volunteer_payout';
    if (a.type === 'CAMPAIGN_DEPOSIT') type = 'deposit';

    return {
      id: a.id,
      type,
      amount: a.amountFormatted,
      from: a.donorFormatted,
      to: a.volunteerFormatted ? `Volunteer ${a.volunteerFormatted}` : undefined,
      timestamp: a.timestamp,
      txHash: a.txHash,
      blockNumber: BigInt(0),
      label: a.type === 'CAMPAIGN_DEPOSIT' ? `Campaign: ${a.campaignName}` : undefined
    };
  });

  // Sort by timestamp descending
  transactions.sort((a, b) => b.timestamp - a.timestamp);

  return { 
    transactions, 
    isLoading,
    dataSource: "graphql" as const
  };
}

/**
 * Hook to build leaderboard from ImpactRecorded events
 * Uses the cached useImpactRecordedEvents hook
 */
export function useVolunteerLeaderboard(blockRange: bigint = BigInt(100000)) {
  const { events, isLoading, error, refetch } = useImpactRecordedEvents(blockRange);

  // Build leaderboard by getting the latest state for each volunteer
  const leaderboard = events.reduce((acc, event) => {
    const existing = acc.find((v) => v.address === event.volunteer);
    if (!existing) {
      acc.push({
        address: event.volunteer,
        addressFormatted: formatAddress(event.volunteer),
        tasksCompleted: Number(event.tasksCompleted),
        reputation: Number(event.reputation),
        tier: event.tier,
      });
    } else if (event.tasksCompleted > BigInt(existing.tasksCompleted)) {
      existing.tasksCompleted = Number(event.tasksCompleted);
      existing.reputation = Number(event.reputation);
      existing.tier = event.tier;
    }
    return acc;
  }, [] as Array<{
    address: string;
    addressFormatted: string;
    tasksCompleted: number;
    reputation: number;
    tier: number;
  }>);

  // Sort by reputation descending
  leaderboard.sort((a, b) => b.reputation - a.reputation);

  // Add ranks
  const rankedLeaderboard = leaderboard.map((v, i) => ({
    ...v,
    rank: i + 1,
  }));

  return { leaderboard: rankedLeaderboard, isLoading, error, refetch };
}
