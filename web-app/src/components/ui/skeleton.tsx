"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component with pulse animation
 */
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

/**
 * Skeleton for inline text values (e.g., stats, numbers)
 * Matches the typical size of stat values
 */
export function SkeletonValue({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-7 w-16 rounded-md inline-block", className)} />;
}

/**
 * Skeleton for small text (labels, secondary text)
 */
export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-4 w-24", className)} />;
}

/**
 * Skeleton for card content
 */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("p-4 border border-white/10 rounded-lg space-y-3", className)}>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/**
 * Skeleton for table rows
 */
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

/**
 * Skeleton for stats grid (4-column layout)
 */
export function SkeletonStats({ className }: SkeletonProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 border border-white/10 rounded-lg text-center">
          <Skeleton className="h-7 w-16 mx-auto mb-2" />
          <Skeleton className="h-3 w-20 mx-auto" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for a single stat item (centered)
 */
export function SkeletonStatItem({ className }: SkeletonProps) {
  return (
    <div className={cn("text-center", className)}>
      <Skeleton className="h-8 w-20 mx-auto mb-1" />
      <Skeleton className="h-3 w-16 mx-auto" />
    </div>
  );
}
