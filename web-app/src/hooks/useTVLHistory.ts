"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useActivitiesGraph } from "@/hooks/useGraph";

// Time range options
export type TimeRange = "24h" | "7d" | "30d" | "all";

// Data point for chart
export interface TVLDataPoint {
  timestamp: number;
  date: string;
  dateLabel: string;
  tvl: number;
  tvlFormatted: string;
  deposits: number;
}

// Time range configuration
const TIME_RANGES: Record<TimeRange, { label: string; hours: number; interval: number }> = {
  "24h": { label: "24 Hours", hours: 24, interval: 1 }, // 1 hour intervals
  "7d": { label: "7 Days", hours: 168, interval: 6 }, // 6 hour intervals
  "30d": { label: "30 Days", hours: 720, interval: 24 }, // 1 day intervals
  "all": { label: "All Time", hours: 0, interval: 24 }, // 1 day intervals
};

// Format helpers
function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

function formatDateLabel(timestamp: number, range: TimeRange): string {
  const date = new Date(timestamp * 1000);
  switch (range) {
    case "24h":
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    case "7d":
      return date.toLocaleDateString("en-US", { weekday: "short", hour: "2-digit" });
    case "30d":
    case "all":
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    default:
      return date.toLocaleDateString();
  }
}

function formatFullDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Hook to compute TVL (Total Value Locked) history from Unified Ledger.
 * Now captures BOTH general deposits and campaign donations!
 */
export function useTVLHistory(initialRange: TimeRange = "7d") {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialRange);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Fetch ALL financial activities (Unified Ledger)
  const { activities, isLoading, error, refetch } = useActivitiesGraph(undefined, 1000);
  
  // Filter activities that contribute to TVL (DEPOSIT and CAMPAIGN_DEPOSIT)
  // and convert to event format 
  const events = useMemo(() => {
    return (activities || [])
      .filter(a => a.type === 'DEPOSIT' || a.type === 'CAMPAIGN_DEPOSIT')
      .map(a => ({
        donor: a.donor || '0x0000',
        amount: a.amount,
        amountFormatted: a.amountFormatted,
        timestamp: a.timestamp,
        txHash: a.txHash,
        blockNumber: BigInt(0), // Activities use timestamp for sorting
      }));
  }, [activities]);

  // Refresh handler
  const refresh = useCallback(async () => {
    await refetch();
    setLastUpdated(new Date());
  }, [refetch]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Process events into TVL history
  const { data, stats } = useMemo(() => {
    if (!events || events.length === 0) {
      return {
        data: [] as TVLDataPoint[],
        stats: {
          currentTVL: 0,
          currentTVLFormatted: "$0",
          change24h: 0,
          change24hPercent: 0,
          totalDeposits: 0,
          peakTVL: 0,
          peakTVLFormatted: "$0",
        },
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const config = TIME_RANGES[timeRange];
    const cutoffTimestamp = config.hours > 0 ? now - config.hours * 3600 : 0;
    const intervalSeconds = config.interval * 3600;

    // Filter and sort events by timestamp
    const sortedEvents = [...events]
      .filter((e) => e.timestamp >= cutoffTimestamp)
      .sort((a, b) => a.timestamp - b.timestamp);

    // If no events in range, use all events
    const eventsToProcess = sortedEvents.length > 0 ? sortedEvents : [...events].sort((a, b) => a.timestamp - b.timestamp);

    if (eventsToProcess.length === 0) {
      return {
        data: [] as TVLDataPoint[],
        stats: {
          currentTVL: 0,
          currentTVLFormatted: "$0",
          change24h: 0,
          change24hPercent: 0,
          totalDeposits: 0,
          peakTVL: 0,
          peakTVLFormatted: "$0",
        },
      };
    }

    // Determine time bounds
    const minTime = eventsToProcess[0].timestamp;
    const maxTime = now;

    // Create time buckets
    const buckets: Map<number, { tvl: number; deposits: number }> = new Map();
    let runningTVL = 0;

    // Calculate cumulative TVL for events before the chart range
    const priorEvents = events.filter((e) => e.timestamp < minTime);
    for (const event of priorEvents) {
      runningTVL += Number(event.amount) / 1_000_000;
    }

    // Initialize buckets
    const startBucket = Math.floor(minTime / intervalSeconds) * intervalSeconds;
    const endBucket = Math.floor(maxTime / intervalSeconds) * intervalSeconds;

    for (let t = startBucket; t <= endBucket; t += intervalSeconds) {
      buckets.set(t, { tvl: runningTVL, deposits: 0 });
    }

    // Fill buckets with deposit data
    for (const event of eventsToProcess) {
      const bucketTime = Math.floor(event.timestamp / intervalSeconds) * intervalSeconds;
      const amount = Number(event.amount) / 1_000_000;
      runningTVL += amount;

      // Update this bucket and all subsequent ones
      for (const [t] of buckets) {
        if (t >= bucketTime) {
          const bucket = buckets.get(t)!;
          bucket.tvl = runningTVL;
          if (t === bucketTime) {
            bucket.deposits += 1;
          }
        }
      }
    }

    // Convert to array
    const dataPoints: TVLDataPoint[] = Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([timestamp, { tvl, deposits }]) => ({
        timestamp,
        date: formatFullDate(timestamp),
        dateLabel: formatDateLabel(timestamp, timeRange),
        tvl,
        tvlFormatted: formatUSD(tvl),
        deposits,
      }));

    // Calculate stats
    const currentTVL = runningTVL;
    const peakTVL = Math.max(...dataPoints.map((d) => d.tvl));
    
    // 24h change calculation
    const oneDayAgo = now - 86400;
    const tvl24hAgo = dataPoints.find((d) => d.timestamp >= oneDayAgo)?.tvl || dataPoints[0]?.tvl || 0;
    const change24h = currentTVL - tvl24hAgo;
    const change24hPercent = tvl24hAgo > 0 ? (change24h / tvl24hAgo) * 100 : 0;

    return {
      data: dataPoints,
      stats: {
        currentTVL,
        currentTVLFormatted: formatUSD(currentTVL),
        change24h,
        change24hPercent,
        totalDeposits: events.length,
        peakTVL,
        peakTVLFormatted: formatUSD(peakTVL),
      },
    };
  }, [events, timeRange]);

  return {
    data,
    stats,
    timeRange,
    setTimeRange,
    timeRanges: TIME_RANGES,
    isLoading,
    error,
    refresh,
    lastUpdated,
  };
}
