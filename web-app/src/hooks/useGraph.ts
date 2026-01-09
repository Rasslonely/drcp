"use client";

import { gql, useQuery } from '@apollo/client';
import { formatUnits } from 'viem';

// ============ GraphQL Queries ============

// Get financial activities with flexible filtering
const GET_ACTIVITIES = gql`
  query GetActivities($where: FinancialActivity_filter, $first: Int!, $skip: Int) {
    financialActivities(
      where: $where
      orderBy: blockTimestamp
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      type
      amount
      donor
      volunteer
      campaign {
        id
        name
      }
      taskId
      blockTimestamp
      transactionHash
    }
  }
`;

// Get all activities (no filter)
const GET_ALL_ACTIVITIES = gql`
  query GetAllActivities($first: Int!, $skip: Int) {
    financialActivities(
      orderBy: blockTimestamp
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      type
      amount
      donor
      volunteer
      campaign {
        id
        name
      }
      taskId
      blockTimestamp
      transactionHash
    }
  }
`;

// Get deposits with optional donor filter
const GET_DEPOSITS = gql`
  query GetDeposits($donor: Bytes, $first: Int!, $skip: Int) {
    deposits(
      where: { donor: $donor }
      orderBy: blockTimestamp
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      donor
      amount
      blockTimestamp
      blockNumber
      transactionHash
    }
  }
`;

// Get all deposits (no filter)
const GET_ALL_DEPOSITS = gql`
  query GetAllDeposits($first: Int!, $skip: Int) {
    deposits(
      orderBy: blockTimestamp
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      donor
      amount
      blockTimestamp
      blockNumber
      transactionHash
    }
  }
`;

// Get vault stats (singleton)
const GET_VAULT_STATS = gql`
  query GetVaultStats {
    vaultStats(id: "global") {
      id
      totalDeposits
      totalWithdrawals
      totalTaskPayouts
      depositCount
      withdrawalCount
      taskCount
      completedTaskCount
      emergencyCount
      campaignCount
      activeCampaignCount
      totalCampaignRaised
    }
  }
`;

// Get donor stats
const GET_DONOR_STATS = gql`
  query GetDonorStats($donor: Bytes!) {
    donorStats(id: $donor) {
      id
      totalDonated
      totalWithdrawn
      depositCount
    }
  }
`;

// Get volunteer leaderboard
const GET_VOLUNTEER_LEADERBOARD = gql`
  query GetVolunteerLeaderboard($first: Int!) {
    volunteerStats(
      orderBy: totalEarned
      orderDirection: desc
      first: $first
    ) {
      id
      totalEarned
      tasksCompleted
    }
  }
`;

// Get verified tasks
const GET_VERIFIED_TASKS = gql`
  query GetVerifiedTasks($first: Int!) {
    taskVerifieds(
      orderBy: blockTimestamp
      orderDirection: desc
      first: $first
    ) {
      id
      taskId
      volunteer
      reward
      blockTimestamp
      transactionHash
    }
  }
`;

// ============ Interfaces ============

export interface GraphDeposit {
  id: string;
  donor: string;
  amount: string;
  blockTimestamp: string;
  blockNumber: string;
  transactionHash: string;
}

export interface GraphVaultStats {
  id: string;
  totalDeposits: string;
  totalWithdrawals: string;
  totalTaskPayouts: string;
  depositCount: string;
  withdrawalCount: string;
  taskCount: string;
  completedTaskCount: string;
  emergencyCount: string;
  campaignCount: string;
  activeCampaignCount: string;
  totalCampaignRaised: string;
}

export interface GraphDonorStats {
  id: string;
  totalDonated: string;
  totalWithdrawn: string;
  depositCount: string;
}

export interface GraphVolunteerStats {
  id: string;
  totalEarned: string;
  tasksCompleted: string;
}

export interface GraphTaskVerified {
  id: string;
  taskId: string;
  volunteer: string;
  reward: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface GraphActivity {
  id: string;
  type: 'DEPOSIT' | 'CAMPAIGN_DEPOSIT' | 'WITHDRAWAL' | 'PAYOUT';
  amount: string;
  donor?: string;
  volunteer?: string;
  campaign?: {
    id: string;
    name: string;
  };
  taskId?: string;
  blockTimestamp: string;
  transactionHash: string;
}

// ============ Formatted Types ============

export interface FormattedDeposit {
  id: string;
  donor: string;
  donorFormatted: string;
  amount: bigint;
  amountFormatted: string;
  timestamp: number;
  blockNumber: bigint;
  txHash: string;
}

export interface FormattedActivity {
  id: string;
  type: 'DEPOSIT' | 'CAMPAIGN_DEPOSIT' | 'WITHDRAWAL' | 'PAYOUT';
  amount: bigint;
  amountFormatted: string;
  donor?: string;
  donorFormatted?: string;
  volunteer?: string;
  volunteerFormatted?: string;
  campaignId?: string;
  campaignName?: string;
  taskId?: string;
  timestamp: number;
  txHash: string;
}

// ============ Helper Functions ============

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDeposit(d: GraphDeposit): FormattedDeposit {
  const amount = BigInt(d.amount);
  return {
    id: d.id,
    donor: d.donor,
    donorFormatted: formatAddress(d.donor),
    amount,
    amountFormatted: `$${Number(formatUnits(amount, 6)).toFixed(2)}`,
    timestamp: Number(d.blockTimestamp),
    blockNumber: BigInt(d.blockNumber),
    txHash: d.transactionHash,
  };
}

function formatActivity(a: GraphActivity): FormattedActivity {
  const amount = BigInt(a.amount);
  return {
    id: a.id,
    type: a.type,
    amount,
    amountFormatted: `$${Number(formatUnits(amount, 6)).toFixed(2)}`,
    donor: a.donor,
    donorFormatted: a.donor ? formatAddress(a.donor) : undefined,
    volunteer: a.volunteer,
    volunteerFormatted: a.volunteer ? formatAddress(a.volunteer) : undefined,
    campaignId: a.campaign?.id,
    campaignName: a.campaign?.name,
    taskId: a.taskId,
    timestamp: Number(a.blockTimestamp),
    txHash: a.transactionHash,
  };
}

// ============ Hooks ============

/**
 * Fetch deposits from The Graph (much faster than RPC!)
 */
export function useDepositsGraph(donor?: string, limit = 50) {
  const { data, loading, error, refetch } = useQuery<{ deposits: GraphDeposit[] }>(
    donor ? GET_DEPOSITS : GET_ALL_DEPOSITS,
    {
      variables: donor 
        ? { donor: donor.toLowerCase(), first: limit, skip: 0 }
        : { first: limit, skip: 0 },
      skip: donor === undefined && false, // Always fetch if no donor filter
    }
  );

  const deposits = data?.deposits.map(formatDeposit) || [];

  return {
    deposits,
    isLoading: loading,
    error: error || null,
    refetch,
  };
}

/**
 * Fetch unified financial activities from The Graph
 */
export function useActivitiesGraph(filters?: { donor?: string; campaign?: string; type?: string }, limit = 50) {
  const where: any = {};
  if (filters?.donor) where.donor = filters.donor.toLowerCase();
  if (filters?.campaign) where.campaign = filters.campaign;
  if (filters?.type) where.type = filters.type;

  const { data, loading, error, refetch } = useQuery<{ financialActivities: GraphActivity[] }>(
    GET_ACTIVITIES,
    {
      variables: { 
        where, 
        first: limit, 
        skip: 0 
      },
    }
  );

  const activities = (data?.financialActivities || []).map(formatActivity);

  return {
    activities,
    isLoading: loading,
    error: error || null,
    refetch,
  };
}

/**
 * Fetch vault-wide statistics
 */
export function useVaultStatsGraph() {
  const { data, loading, error, refetch, networkStatus } = useQuery<{ vaultStats: GraphVaultStats | null }>(
    GET_VAULT_STATS,
    {
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'cache-and-network',
    }
  );

  const stats = data?.vaultStats;
  const formatted = stats ? {
    totalDeposits: `$${Number(formatUnits(BigInt(stats.totalDeposits), 6)).toLocaleString()}`,
    totalWithdrawals: `$${Number(formatUnits(BigInt(stats.totalWithdrawals), 6)).toLocaleString()}`,
    totalTaskPayouts: `$${Number(formatUnits(BigInt(stats.totalTaskPayouts), 6)).toLocaleString()}`,
    depositCount: Number(stats.depositCount),
    completedTaskCount: Number(stats.completedTaskCount),
    emergencyCount: Number(stats.emergencyCount),
  } : null;

  // isLoading is true only on first fetch, use isRefreshing for subsequent polls
  const isLoading = loading && networkStatus === 1;
  const isRefreshing = networkStatus === 4 || networkStatus === 6;

  return {
    stats: formatted,
    raw: stats,
    isLoading,
    isRefreshing,
    error: error || null,
    refetch,
  };
}

/**
 * Fetch donor's personal stats
 */
export function useDonorStatsGraph(donor?: string) {
  const { data, loading, error, refetch, networkStatus } = useQuery<{ donorStats: GraphDonorStats | null }>(
    GET_DONOR_STATS,
    {
      variables: { donor: donor?.toLowerCase() },
      skip: !donor,
      notifyOnNetworkStatusChange: true,
    }
  );

  const stats = data?.donorStats;
  const formatted = stats ? {
    totalDonated: `$${Number(formatUnits(BigInt(stats.totalDonated), 6)).toLocaleString()}`,
    depositCount: Number(stats.depositCount),
  } : null;

  const isLoading = loading && networkStatus === 1;
  const isRefreshing = networkStatus === 4 || networkStatus === 6;

  return {
    stats: formatted,
    raw: stats,
    isLoading,
    isRefreshing,
    error: error || null,
    refetch,
  };
}

/**
 * Fetch volunteer leaderboard
 */
export function useVolunteerLeaderboardGraph(limit = 10) {
  const { data, loading, error, refetch } = useQuery<{ volunteerStats: GraphVolunteerStats[] }>(
    GET_VOLUNTEER_LEADERBOARD,
    {
      variables: { first: limit },
    }
  );

  const leaderboard = data?.volunteerStats.map((v, i) => ({
    rank: i + 1,
    address: v.id,
    addressFormatted: formatAddress(v.id),
    totalEarned: `$${Number(formatUnits(BigInt(v.totalEarned), 6)).toLocaleString()}`,
    tasksCompleted: Number(v.tasksCompleted),
  })) || [];

  return {
    leaderboard,
    isLoading: loading,
    error: error || null,
    refetch,
  };
}

/**
 * Fetch verified task payouts
 */
export function useTaskPayoutsGraph(limit = 20) {
  const { data, loading, error, refetch } = useQuery<{ taskVerifieds: GraphTaskVerified[] }>(
    GET_VERIFIED_TASKS,
    {
      variables: { first: limit },
    }
  );

  const payouts = data?.taskVerifieds.map(t => ({
    id: t.id,
    taskId: t.taskId,
    volunteer: t.volunteer,
    volunteerFormatted: formatAddress(t.volunteer),
    reward: `$${Number(formatUnits(BigInt(t.reward), 6)).toFixed(2)}`,
    timestamp: Number(t.blockTimestamp),
    txHash: t.transactionHash,
  })) || [];

  return {
    payouts,
    isLoading: loading,
    error: error || null,
    refetch,
  };
}

// ============ CAMPAIGN QUERIES ============

// Get active campaigns
const GET_CAMPAIGNS = gql`
  query GetCampaigns($first: Int!, $skip: Int, $status: String) {
    campaigns(
      where: { status: $status }
      orderBy: createdAt
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      campaignId
      name
      description
      targetAmount
      raisedAmount
      deadline
      geoHash
      status
      createdAt
      closedAt
      depositCount
      transactionHash
    }
  }
`;

// Get all campaigns (no status filter)
const GET_ALL_CAMPAIGNS = gql`
  query GetAllCampaigns($first: Int!, $skip: Int) {
    campaigns(
      orderBy: createdAt
      orderDirection: desc
      first: $first
      skip: $skip
    ) {
      id
      campaignId
      name
      description
      targetAmount
      raisedAmount
      deadline
      geoHash
      status
      createdAt
      closedAt
      depositCount
      transactionHash
    }
  }
`;

// Get single campaign
const GET_CAMPAIGN = gql`
  query GetCampaign($id: ID!) {
    campaign(id: $id) {
      id
      campaignId
      name
      description
      targetAmount
      raisedAmount
      deadline
      geoHash
      status
      createdAt
      closedAt
      depositCount
      transactionHash
    }
  }
`;

// Get campaign deposits
const GET_CAMPAIGN_DEPOSITS = gql`
  query GetCampaignDeposits($campaignId: String!, $first: Int!) {
    campaignDeposits(
      where: { campaign: $campaignId }
      orderBy: blockTimestamp
      orderDirection: desc
      first: $first
    ) {
      id
      donor
      amount
      blockTimestamp
      transactionHash
    }
  }
`;

// ============ CAMPAIGN INTERFACES ============

export interface GraphCampaign {
  id: string;
  campaignId: string;
  name: string;
  description: string;
  targetAmount: string;
  raisedAmount: string;
  deadline: string;
  geoHash: string | null;
  status: string;
  createdAt: string;
  closedAt: string | null;
  depositCount: string;
  transactionHash: string;
}

export interface GraphCampaignDeposit {
  id: string;
  donor: string;
  amount: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface FormattedCampaign {
  id: string;
  campaignId: number;
  name: string;
  description: string;
  targetAmount: bigint;
  targetFormatted: string;
  raisedAmount: bigint;
  raisedFormatted: string;
  progressPercent: number;
  deadline: number;
  deadlineFormatted: string | null;
  isExpired: boolean;
  geoHash: string | null;
  status: string;
  createdAt: number;
  depositCount: number;
  txHash: string;
}

// ============ CAMPAIGN HOOKS ============

function formatCampaign(c: GraphCampaign): FormattedCampaign {
  const target = BigInt(c.targetAmount);
  const raised = BigInt(c.raisedAmount);
  const deadline = Number(c.deadline);
  const now = Date.now() / 1000;
  
  return {
    id: c.id,
    campaignId: Number(c.campaignId),
    name: c.name,
    description: c.description,
    targetAmount: target,
    targetFormatted: `$${Number(formatUnits(target, 6)).toLocaleString()}`,
    raisedAmount: raised,
    raisedFormatted: `$${Number(formatUnits(raised, 6)).toLocaleString()}`,
    progressPercent: target > BigInt(0) ? Math.min(100, Number((raised * BigInt(100)) / target)) : 0,
    deadline,
    deadlineFormatted: deadline > 0 ? new Date(deadline * 1000).toLocaleDateString() : null,
    isExpired: deadline > 0 && now > deadline,
    geoHash: c.geoHash,
    status: c.status,
    createdAt: Number(c.createdAt),
    depositCount: Number(c.depositCount),
    txHash: c.transactionHash,
  };
}

/**
 * Fetch campaigns from The Graph
 * @param status - Filter by status: 'ACTIVE', 'CLOSED', 'EXPIRED', or undefined for all
 */
export function useCampaignsGraph(status?: string, limit = 20) {
  const { data, loading, error, refetch } = useQuery<{ campaigns: GraphCampaign[] }>(
    status ? GET_CAMPAIGNS : GET_ALL_CAMPAIGNS,
    {
      variables: status 
        ? { status, first: limit, skip: 0 }
        : { first: limit, skip: 0 },
    }
  );

  const campaigns = data?.campaigns.map(formatCampaign) || [];

  return {
    campaigns,
    isLoading: loading,
    error: error || null,
    refetch,
  };
}

/**
 * Fetch single campaign details
 */
export function useCampaignGraph(campaignId: number | undefined) {
  const { data, loading, error, refetch } = useQuery<{ campaign: GraphCampaign | null }>(
    GET_CAMPAIGN,
    {
      variables: { id: campaignId?.toString() },
      skip: campaignId === undefined,
    }
  );

  const campaign = data?.campaign ? formatCampaign(data.campaign) : null;

  return {
    campaign,
    isLoading: loading,
    error: error || null,
    refetch,
  };
}

/**
 * Fetch campaign deposits
 */
export function useCampaignDepositsGraph(campaignId: number | undefined, limit = 20) {
  const { data, loading, error, refetch } = useQuery<{ campaignDeposits: GraphCampaignDeposit[] }>(
    GET_CAMPAIGN_DEPOSITS,
    {
      variables: { campaignId: campaignId?.toString(), first: limit },
      skip: campaignId === undefined,
    }
  );

  const deposits = data?.campaignDeposits.map(d => ({
    id: d.id,
    donor: d.donor,
    donorFormatted: formatAddress(d.donor),
    amount: BigInt(d.amount),
    amountFormatted: `$${Number(formatUnits(BigInt(d.amount), 6)).toFixed(2)}`,
    timestamp: Number(d.blockTimestamp),
    txHash: d.transactionHash,
  })) || [];

  return {
    deposits,
    isLoading: loading,
    error: error || null,
    refetch,
  };
}

// ============================================================================
// GOVERNANCE HOOKS - O(1) Subgraph Queries
// ============================================================================

// GraphQL Queries for Governance
const GET_TOP_DELEGATES = gql`
  query GetTopDelegates($first: Int!, $skip: Int) {
    delegates(
      first: $first
      skip: $skip
      orderBy: votingPower
      orderDirection: desc
      where: { votingPower_gt: "0" }
    ) {
      id
      address
      votingPower
      delegatorsCount
      firstDelegatedAt
      lastUpdatedAt
    }
  }
`;

const GET_DELEGATE_STATS = gql`
  query GetDelegateStats {
    delegateStats(id: "global") {
      totalDelegates
      totalDelegators
      totalVotingPower
      totalSupply
      delegationRate
    }
  }
`;

/**
 * Hook to get top delegates from subgraph (O(1) query - production ready)
 * Falls back gracefully if subgraph doesn't have delegate data yet
 */
export function useTopDelegatesGraph(limit: number = 10) {
  const { data, loading, error, refetch } = useQuery(GET_TOP_DELEGATES, {
    variables: { first: limit, skip: 0 },
  });

  const delegates = data?.delegates?.map((d: any) => ({
    address: d.address as `0x${string}`,
    addressFormatted: formatAddress(d.address),
    votingPower: BigInt(d.votingPower),
    votingPowerFormatted: formatVotingPower(BigInt(d.votingPower)),
    votingPowerPercent: 0, // Will be calculated with total supply
    delegatorsCount: d.delegatorsCount,
    firstDelegatedAt: Number(d.firstDelegatedAt),
    lastUpdatedAt: Number(d.lastUpdatedAt),
  })) || [];

  return {
    delegates,
    isLoading: loading,
    error: error || null,
    refetch,
    // Flag to indicate subgraph is being used
    source: "subgraph" as const,
  };
}

/**
 * Hook to get delegation stats from subgraph
 */
export function useDelegateStatsGraph() {
  const { data, loading, error } = useQuery(GET_DELEGATE_STATS);

  const stats = data?.delegateStats;

  return {
    totalDelegates: stats?.totalDelegates || 0,
    totalDelegators: stats?.totalDelegators || 0,
    totalVotingPower: stats ? BigInt(stats.totalVotingPower) : BigInt(0),
    totalVotingPowerFormatted: stats 
      ? formatVotingPower(BigInt(stats.totalVotingPower)) 
      : "0",
    totalSupply: stats ? BigInt(stats.totalSupply) : BigInt(0),
    delegationRate: stats ? parseFloat(stats.delegationRate) : 0,
    isLoading: loading,
    error: error || null,
  };
}

// Helper to format voting power (also used by RPC hook)
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

