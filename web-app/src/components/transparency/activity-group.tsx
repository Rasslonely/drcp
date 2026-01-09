"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

// =============================================================================
// ACTIVITY GROUP COMPONENT
// =============================================================================

interface ActivityGroupProps {
  label: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function ActivityGroup({ 
  label, 
  count, 
  children,
  defaultOpen = true 
}: ActivityGroupProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [isAnimating, setIsAnimating] = React.useState(false);

  return (
    <div className="space-y-2">
      {/* Group Header */}
      <button
        onClick={() => {
          setIsAnimating(true);
          setIsOpen(!isOpen);
        }}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent w-8" />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {label}
          </span>
          {count !== undefined && (
            <span className="text-xs text-gray-500">
              ({count})
            </span>
          )}
          <div className="h-px flex-1 bg-gradient-to-l from-white/20 to-transparent w-8" />
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="text-gray-500 group-hover:text-white transition-colors"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      {/* Group Content - overflow-visible when open to allow tooltips */}
      <motion.div
        initial={false}
        animate={{ 
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onAnimationComplete={() => setIsAnimating(false)}
        className={isOpen && !isAnimating ? "overflow-visible" : "overflow-hidden"}
      >
        <div className="space-y-2">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// GROUP HELPER - Groups transactions by time period
// =============================================================================

export function groupTransactionsByTime<T extends { timestamp: number }>(
  transactions: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  for (const tx of transactions) {
    const txTime = tx.timestamp * 1000;
    const diff = now - txTime;

    let groupLabel: string;
    if (diff < oneDay) {
      groupLabel = "Today";
    } else if (diff < 2 * oneDay) {
      groupLabel = "Yesterday";
    } else if (diff < 7 * oneDay) {
      groupLabel = "This Week";
    } else {
      groupLabel = "Earlier";
    }

    if (!groups.has(groupLabel)) {
      groups.set(groupLabel, []);
    }
    groups.get(groupLabel)!.push(tx);
  }

  // Sort groups in chronological order
  const orderedGroups = new Map<string, T[]>();
  const order = ["Today", "Yesterday", "This Week", "Earlier"];
  for (const label of order) {
    if (groups.has(label)) {
      orderedGroups.set(label, groups.get(label)!);
    }
  }

  return orderedGroups;
}
