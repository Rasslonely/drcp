"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  ExternalLink, 
  RefreshCw,
  Bell,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityItem, type Transaction } from "./activity-item";
import { ActivityGroup, groupTransactionsByTime } from "./activity-group";
import { useAllTransactions } from "@/hooks";
import { cn } from "@/lib/utils";
import { getAddressExplorerUrl, getExplorerName } from "@/lib/chain-utils";
import { VAULT_ADDRESS } from "@/lib/contracts/deployments";

// =============================================================================
// CONSTANTS
// =============================================================================

const INITIAL_LIMIT = 5;
const PAGE_SIZE = 10;
const POLL_INTERVAL = 30000; // 30 seconds

// =============================================================================
// SKELETON LOADER
// =============================================================================

function ActivitySkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div 
          key={i}
          className="flex items-center justify-between p-3 rounded-xl bg-white/5 animate-pulse"
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-white/10" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-white/10" />
              <div className="h-3 w-20 rounded bg-white/10" />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div className="h-4 w-16 rounded bg-white/10 ml-auto" />
            <div className="h-3 w-24 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// NEW ACTIVITY BADGE
// =============================================================================

interface NewActivityBadgeProps {
  count: number;
  onClick: () => void;
}

function NewActivityBadge({ count, onClick }: NewActivityBadgeProps) {
  if (count <= 0) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-sm font-medium hover:bg-indigo-500/30 transition-colors"
    >
      <Bell className="h-3.5 w-3.5" />
      {count} new activit{count === 1 ? "y" : "ies"}
    </motion.button>
  );
}

// =============================================================================
// QUICK STATS BAR
// =============================================================================

interface QuickStatsProps {
  transactions: Transaction[];
}

function QuickStats({ transactions }: QuickStatsProps) {
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(today.getTime() / 1000);

    const todayTx = transactions.filter(tx => tx.timestamp >= todayTimestamp);
    
    return {
      donations: todayTx.filter(tx => tx.type === "deposit").length,
      releases: todayTx.filter(tx => tx.type === "release").length,
      payouts: todayTx.filter(tx => tx.type === "volunteer_payout").length,
    };
  }, [transactions]);

  return (
    <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-xl bg-white/5 mb-4">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-sm text-gray-400">
          <span className="text-white font-medium">{stats.donations}</span> Donations
        </span>
      </div>
      <div className="h-4 border-l border-white/10" />
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-blue-500" />
        <span className="text-sm text-gray-400">
          <span className="text-white font-medium">{stats.releases}</span> Releases
        </span>
      </div>
      <div className="h-4 border-l border-white/10" />
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-purple-500" />
        <span className="text-sm text-gray-400">
          <span className="text-white font-medium">{stats.payouts}</span> Tasks
        </span>
      </div>
      <span className="text-xs text-gray-600">today</span>
    </div>
  );
}

// =============================================================================
// MAIN ACTIVITY FEED COMPONENT
// =============================================================================

interface ActivityFeedProps {
  initialLimit?: number;
  pageSize?: number;
  showQuickStats?: boolean;
  enablePolling?: boolean;
}

export function ActivityFeed({
  initialLimit = INITIAL_LIMIT,
  pageSize = PAGE_SIZE,
  showQuickStats = true,
  enablePolling = true,
}: ActivityFeedProps) {
  const { transactions, isLoading } = useAllTransactions();
  
  // Pagination state
  const [visibleCount, setVisibleCount] = useState(initialLimit);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Real-time tracking
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const [newActivityCount, setNewActivityCount] = useState(0);

  // Visible transactions
  const visibleTransactions = useMemo(() => {
    return transactions.slice(0, visibleCount);
  }, [transactions, visibleCount]);

  // Grouped by time
  const groupedTransactions = useMemo(() => {
    return groupTransactionsByTime(visibleTransactions);
  }, [visibleTransactions]);

  // Remaining count
  const remainingCount = Math.max(0, transactions.length - visibleCount);
  const hasMore = remainingCount > 0;

  // Load more handler
  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    // Simulate network delay for smooth animation
    setTimeout(() => {
      setVisibleCount(prev => prev + pageSize);
      setIsLoadingMore(false);
    }, 300);
  }, [pageSize]);

  // Refresh handler - clears new activity badge and resets to initial view
  const handleRefresh = useCallback(() => {
    setNewActivityCount(0);
    setLastSeenCount(transactions.length);
    // Reset to initial view
    setVisibleCount(initialLimit);
  }, [transactions.length, initialLimit]);

  // Initialize last seen count when data first loads
  useEffect(() => {
    if (lastSeenCount === 0 && transactions.length > 0) {
      setLastSeenCount(transactions.length);
    }
  }, [lastSeenCount, transactions.length]);

  // Update new activity count when transactions change
  useEffect(() => {
    if (lastSeenCount > 0 && transactions.length > lastSeenCount) {
      setNewActivityCount(transactions.length - lastSeenCount);
    }
  }, [transactions.length, lastSeenCount]);

  // Reset visible count when initial data loads
  useEffect(() => {
    if (!isLoading && transactions.length > 0) {
      setVisibleCount(Math.min(initialLimit, transactions.length));
    }
  }, [isLoading, transactions.length, initialLimit]);

  return (
    <Card variant="gradient">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            Recent On-Chain Activity
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            <AnimatePresence>
              {newActivityCount > 0 && (
                <NewActivityBadge 
                  count={newActivityCount} 
                  onClick={handleRefresh} 
                />
              )}
            </AnimatePresence>
          </span>
          <a
            href={getAddressExplorerUrl(VAULT_ADDRESS)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            View all on {getExplorerName()}
            <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Loading State */}
        {isLoading && transactions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          </div>
        ) : transactions.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 text-gray-500">
            <p>No transactions found on-chain yet.</p>
            <p className="text-sm mt-1">Make a donation to see it appear here!</p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            {showQuickStats && <QuickStats transactions={transactions} />}

            {/* Grouped Activity Feed */}
            <div className="space-y-4">
              {Array.from(groupedTransactions.entries()).map(([groupLabel, items]) => (
                <ActivityGroup 
                  key={groupLabel} 
                  label={groupLabel}
                  count={items.length}
                >
                  {items.map((tx, index) => (
                    <ActivityItem 
                      key={tx.id} 
                      transaction={tx}
                      index={index}
                      animate={visibleCount <= initialLimit}
                    />
                  ))}
                </ActivityGroup>
              ))}
            </div>

            {/* Load More Section */}
            {hasMore && (
              <div className="mt-6 pt-4 border-t border-white/10">
                {isLoadingMore ? (
                  <ActivitySkeleton />
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleLoadMore}
                    className="w-full text-gray-400 hover:text-white"
                  >
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Load More ({remainingCount} remaining)
                  </Button>
                )}
              </div>
            )}

            {/* End of List */}
            {!hasMore && visibleCount > initialLimit && (
              <div className="mt-4 text-center text-sm text-gray-500">
                You've reached the end
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
