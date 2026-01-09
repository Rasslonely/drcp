"use client";

import { motion } from "framer-motion";
import { 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  ExternalLink,
  Award
} from "lucide-react";
import { VerificationCheck } from "@/components/transparency/verification-badge";
import { getTxExplorerUrl } from "@/lib/chain-utils";

// =============================================================================
// TYPES
// =============================================================================

// Matches TransactionEvent from @/hooks/useEvents
export interface Transaction {
  id: string;
  type: "deposit" | "release" | "volunteer_payout" | "emergency";
  amount: string;
  from?: string;
  to?: string;
  timestamp: number;
  txHash: string;
  blockNumber?: bigint;
  label?: string; // Additional context (e.g., Campaign Name)
}

// =============================================================================
// HELPERS
// =============================================================================

export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function formatTxHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export function getTimeGroup(timestamp: number): string {
  const now = Date.now();
  const txTime = timestamp * 1000;
  const diff = now - txTime;
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < oneDay) return "Today";
  if (diff < 2 * oneDay) return "Yesterday";
  if (diff < 7 * oneDay) return "This Week";
  return "Earlier";
}

// =============================================================================
// ACTIVITY ITEM COMPONENT
// =============================================================================

interface ActivityItemProps {
  transaction: Transaction;
  index?: number;
  animate?: boolean;
}

export function ActivityItem({ 
  transaction: tx, 
  index = 0,
  animate = true 
}: ActivityItemProps) {
  const getIcon = () => {
    switch (tx.type) {
      case "deposit":
        return <ArrowDownRight className="h-5 w-5 text-emerald-400" />;
      case "release":
        return <ArrowUpRight className="h-5 w-5 text-blue-400" />;
      case "volunteer_payout":
        return <Award className="h-5 w-5 text-purple-400" />;
      default:
        return <ArrowDownRight className="h-5 w-5 text-gray-400" />;
    }
  };

  const getBgColor = () => {
    switch (tx.type) {
      case "deposit":
        return "bg-emerald-500/20";
      case "release":
        return "bg-blue-500/20";
      case "volunteer_payout":
        return "bg-purple-500/20";
      default:
        return "bg-gray-500/20";
    }
  };

  const getLabel = () => {
    // Priority: Explicit label (e.g. Campaign name)
    if (tx.label) return tx.label;

    switch (tx.type) {
      case "deposit":
        return `Donation from ${tx.from || "Anonymous"}`;
      case "release":
        return "Released to relief fund";
      case "volunteer_payout":
        return tx.to || "Volunteer payout";
      case "emergency":
        return "Emergency fund";
      default:
        return "Transaction";
    }
  };

  const getAmountColor = () => {
    return tx.type === "deposit" ? "text-emerald-400" : "text-blue-400";
  };

  const getAmountSign = () => {
    return tx.type === "deposit" ? "+" : "-";
  };

  const content = (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex items-center space-x-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getBgColor()}`}>
          {getIcon()}
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            {getLabel()}
          </p>
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="mr-1 h-3 w-3" />
            {formatRelativeTime(tx.timestamp)}
          </div>
        </div>
      </div>
      <div className="text-right flex items-center gap-3">
        <div>
          <p className={`font-bold ${getAmountColor()}`}>
            {getAmountSign()}{tx.amount}
          </p>
          <a
            href={getTxExplorerUrl(tx.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-indigo-400 font-mono flex items-center gap-1"
          >
            {formatTxHash(tx.txHash)}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <VerificationCheck txHash={tx.txHash} />
      </div>
    </div>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {content}
    </motion.div>
  );
}
