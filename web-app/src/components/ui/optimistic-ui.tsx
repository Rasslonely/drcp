"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw, Check, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============ REFRESHING BADGE ============

interface RefreshingBadgeProps {
  isFetching: boolean;
  isStale?: boolean;
  lastUpdated?: Date;
  onRefresh?: () => void;
  className?: string;
}

/**
 * Shows a subtle badge when data is being refreshed in the background
 */
export function RefreshingBadge({ 
  isFetching, 
  isStale = false, 
  lastUpdated,
  onRefresh,
  className 
}: RefreshingBadgeProps) {
  const [showCheck, setShowCheck] = useState(false);

  // Show checkmark briefly after refresh completes
  useEffect(() => {
    if (!isFetching && lastUpdated) {
      setShowCheck(true);
      const timer = setTimeout(() => setShowCheck(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isFetching, lastUpdated]);

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <AnimatePresence mode="wait">
        {isFetching ? (
          <motion.div
            key="fetching"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 text-blue-400"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Syncing...</span>
          </motion.div>
        ) : showCheck ? (
          <motion.div
            key="check"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 text-green-400"
          >
            <Check className="h-3 w-3" />
            <span>Synced</span>
          </motion.div>
        ) : isStale ? (
          <motion.div
            key="stale"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 text-yellow-400"
          >
            <AlertCircle className="h-3 w-3" />
            <span>Stale data</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
      
      {onRefresh && !isFetching && (
        <button 
          onClick={onRefresh}
          className="ml-1 p-1 hover:bg-white/10 rounded transition-colors"
          title="Refresh now"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ============ LIVE INDICATOR ============

interface LiveIndicatorProps {
  isConnected?: boolean;
  pollInterval?: number;
  className?: string;
}

/**
 * Shows a pulsing dot to indicate live data connection
 */
export function LiveIndicator({ 
  isConnected = true, 
  pollInterval = 30,
  className 
}: LiveIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      {isConnected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-green-400">Live • Updates every {pollInterval}s</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-red-400" />
          <span className="text-red-400">Offline</span>
        </>
      )}
    </div>
  );
}

// ============ SKELETON LOADERS ============

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "animate-pulse bg-white/10 rounded",
        className
      )} 
    />
  );
}

export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-4 w-24", className)} />;
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("p-4 border border-white/10 rounded-lg space-y-3", className)}>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex gap-4 p-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-2 border-t border-white/5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ className }: SkeletonProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 border border-white/10 rounded-lg">
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

// ============ DATA CONTAINER WITH LOADING STATE ============

interface DataContainerProps {
  isLoading: boolean;
  isFetching?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  skeleton?: React.ReactNode;
  emptyMessage?: string;
  children: React.ReactNode;
  onRetry?: () => void;
  showRefreshBadge?: boolean;
}

/**
 * Container component that handles loading, error, and empty states
 * Shows skeleton while loading, cached data + refresh badge while refetching
 */
export function DataContainer({
  isLoading,
  isFetching = false,
  error,
  isEmpty = false,
  skeleton,
  emptyMessage = "No data available",
  children,
  onRetry,
  showRefreshBadge = true,
}: DataContainerProps) {
  // Initial loading - show skeleton
  if (isLoading && !isFetching) {
    return skeleton || <SkeletonCard />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-red-500/20 rounded-lg bg-red-500/5">
        <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
        <p className="text-red-400 mb-4">{error.message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        )}
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-white/10 rounded-lg">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Has data - show children with optional refresh badge
  return (
    <div className="relative">
      {showRefreshBadge && isFetching && (
        <div className="absolute top-2 right-2 z-10">
          <RefreshingBadge isFetching={isFetching} onRefresh={onRetry} />
        </div>
      )}
      {children}
    </div>
  );
}

// ============ OPTIMISTIC LIST ============

interface OptimisticItemProps<T> {
  items: T[];
  pendingItems?: T[];
  renderItem: (item: T, isPending: boolean) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
}

/**
 * List component that shows pending/optimistic items with visual distinction
 */
export function OptimisticList<T>({
  items,
  pendingItems = [],
  renderItem,
  keyExtractor,
  className,
}: OptimisticItemProps<T>) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Pending items at top with distinct styling */}
      {pendingItems.map((item) => (
        <motion.div
          key={`pending-${keyExtractor(item)}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 0.7, y: 0 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-blue-500/10 rounded-lg animate-pulse" />
          {renderItem(item, true)}
        </motion.div>
      ))}
      
      {/* Confirmed items */}
      {items.map((item) => (
        <motion.div
          key={keyExtractor(item)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {renderItem(item, false)}
        </motion.div>
      ))}
    </div>
  );
}
