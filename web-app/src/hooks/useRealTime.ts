"use client";

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { formatUnits } from 'viem';

// ============ POLLING CONFIGURATION ============

export const POLLING_INTERVALS = {
  FAST: 10_000,      // 10 seconds - for active transaction monitoring
  NORMAL: 30_000,    // 30 seconds - default for most data
  SLOW: 60_000,      // 60 seconds - for rarely changing data
  OFF: 0,            // Disable polling
};

// ============ QUERIES ============

const GET_RECENT_DEPOSITS = gql`
  query GetRecentDeposits($first: Int!, $since: BigInt) {
    deposits(
      where: { blockTimestamp_gte: $since }
      orderBy: blockTimestamp
      orderDirection: desc
      first: $first
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

const GET_VAULT_STATS = gql`
  query GetVaultStats {
    vaultStats(id: "global") {
      id
      totalDeposits
      totalWithdrawals
      totalTaskPayouts
      depositCount
      completedTaskCount
      emergencyCount
    }
  }
`;

// ============ TYPES ============

interface GraphDeposit {
  id: string;
  donor: string;
  amount: string;
  blockTimestamp: string;
  blockNumber: string;
  transactionHash: string;
}

interface FormattedDeposit {
  id: string;
  donor: string;
  donorFormatted: string;
  amount: bigint;
  amountFormatted: string;
  timestamp: number;
  blockNumber: bigint;
  txHash: string;
  isNew?: boolean;
}

// ============ HELPERS ============

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

// ============ REAL-TIME HOOKS ============

interface RealTimeOptions {
  pollInterval?: number;
  enabled?: boolean;
}

/**
 * Hook for real-time deposit monitoring with configurable polling
 * Shows new deposits with visual highlighting
 */
export function useRealTimeDeposits(options: RealTimeOptions = {}) {
  const { pollInterval = POLLING_INTERVALS.NORMAL, enabled = true } = options;
  
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Get deposits from last 24 hours for initial load
  const since = Math.floor(Date.now() / 1000) - 86400; // 24 hours ago

  const { data, loading, error, refetch, networkStatus } = useQuery<{ deposits: GraphDeposit[] }>(
    GET_RECENT_DEPOSITS,
    {
      variables: { first: 50, since: since.toString() },
      pollInterval: enabled ? pollInterval : 0,
      notifyOnNetworkStatusChange: true,
      skip: !enabled,
    }
  );

  // Track new deposits
  const deposits = (data?.deposits || []).map((d) => {
    const formatted = formatDeposit(d);
    formatted.isNew = !seenIds.has(d.id);
    return formatted;
  });

  // Mark all current deposits as seen after initial load
  useEffect(() => {
    if (data?.deposits && !loading) {
      const newIds = new Set(data.deposits.map(d => d.id));
      setSeenIds(prev => new Set([...prev, ...newIds]));
      setLastUpdated(new Date());
    }
  }, [data?.deposits, loading]);

  // Computed states
  const isFetching = networkStatus === 4; // NetworkStatus.refetch
  const isPolling = networkStatus === 6;  // NetworkStatus.poll
  const newDepositCount = deposits.filter(d => d.isNew).length;

  return {
    deposits,
    isLoading: loading,
    isFetching: isFetching || isPolling,
    error: error || null,
    refetch,
    lastUpdated,
    newDepositCount,
    pollInterval,
  };
}

/**
 * Hook for real-time vault stats with auto-refresh
 */
export function useRealTimeStats(options: RealTimeOptions = {}) {
  const { pollInterval = POLLING_INTERVALS.SLOW, enabled = true } = options;
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { data, loading, error, refetch, networkStatus } = useQuery<{ 
    vaultStats: {
      totalDeposits: string;
      totalWithdrawals: string;
      totalTaskPayouts: string;
      depositCount: string;
      completedTaskCount: string;
      emergencyCount: string;
    } | null 
  }>(GET_VAULT_STATS, {
    pollInterval: enabled ? pollInterval : 0,
    notifyOnNetworkStatusChange: true,
    skip: !enabled,
  });

  useEffect(() => {
    if (data && !loading) {
      setLastUpdated(new Date());
    }
  }, [data, loading]);

  const stats = data?.vaultStats;
  const formatted = stats ? {
    totalDeposits: `$${Number(formatUnits(BigInt(stats.totalDeposits), 6)).toLocaleString()}`,
    totalWithdrawals: `$${Number(formatUnits(BigInt(stats.totalWithdrawals), 6)).toLocaleString()}`,
    totalTaskPayouts: `$${Number(formatUnits(BigInt(stats.totalTaskPayouts), 6)).toLocaleString()}`,
    depositCount: Number(stats.depositCount),
    completedTaskCount: Number(stats.completedTaskCount),
    emergencyCount: Number(stats.emergencyCount),
  } : null;

  const isFetching = networkStatus === 4 || networkStatus === 6;

  return {
    stats: formatted,
    raw: stats,
    isLoading: loading,
    isFetching,
    error: error || null,
    refetch,
    lastUpdated,
  };
}

/**
 * Hook to manage active polling state across components
 * Use to pause polling when tab is not visible
 */
export function usePollingVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}
