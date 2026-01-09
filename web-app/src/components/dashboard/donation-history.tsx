"use client";

import { memo, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, ExternalLink, DollarSign, Loader2, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useActivitiesGraph, FormattedActivity } from "@/hooks/useGraph";
import { usePendingDeposits, PendingDeposit } from "@/contexts/PendingDepositsContext";
import Link from "next/link";
import { getTxExplorerUrl } from "@/lib/chain-utils";

// =============================================================================
// DONATION ITEM (memoized for performance)
// =============================================================================

interface DonationItemProps {
  activity: FormattedActivity;
  index: number;
}

const DonationItem = memo(function DonationItem({ activity, index }: DonationItemProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const explorerUrl = getTxExplorerUrl(activity.txHash);

  // Activity UI configuration
  const config = {
    DEPOSIT: {
      bg: "bg-emerald-500/20",
      text: "text-emerald-400",
      label: "General Fund",
      icon: DollarSign
    },
    CAMPAIGN_DEPOSIT: {
      bg: "bg-purple-500/20",
      text: "text-purple-400",
      label: `Campaign: ${activity.campaignName}`,
      icon: DollarSign
    },
    WITHDRAWAL: {
      bg: "bg-red-500/20",
      text: "text-red-400",
      label: "Emergency Withdrawal",
      icon: ExternalLink
    },
    PAYOUT: {
      bg: "bg-blue-500/20",
      text: "text-blue-400",
      label: `Reward: Task #${activity.taskId}`,
      icon: Receipt
    },
  }[activity.type] || {
    bg: "bg-gray-500/20",
    text: "text-gray-400",
    label: "Unknown Activity",
    icon: Clock
  };

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bg}`}>
          <Icon className={`h-5 w-5 ${config.text}`} />
        </div>
        <div>
          <div className="font-medium text-white">
            {activity.amountFormatted}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className={config.text}>{config.label}</span>
            <span className="text-gray-700">•</span>
            <Clock className="h-3 w-3" />
            {formatDate(activity.timestamp)}
          </div>
        </div>
      </div>

      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </motion.div>
  );
});

// =============================================================================
// PENDING DONATION ITEM (with animated badge)
// =============================================================================

interface PendingDonationItemProps {
  deposit: PendingDeposit;
  index: number;
}

const PendingDonationItem = memo(function PendingDonationItem({ deposit, index }: PendingDonationItemProps) {
  const explorerUrl = getTxExplorerUrl(deposit.txHash);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/15 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
          <DollarSign className="h-5 w-5 text-yellow-400" />
          {/* Pulse animation */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{deposit.amount}</span>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400 animate-pulse">
              Pending
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-yellow-400/70">
            <Loader2 className="h-3 w-3 animate-spin" />
            Waiting for confirmation...
          </div>
        </div>
      </div>

      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg hover:bg-white/10 text-yellow-400 hover:text-white transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </motion.div>
  );
});

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyDonations() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
        <Receipt className="h-8 w-8 text-gray-600" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">No donations yet</h3>
      <p className="text-sm text-gray-500 max-w-xs">
        Make your first donation to start building your impact and reputation.
      </p>
    </div>
  );
}

// =============================================================================
// DONATION HISTORY COMPONENT
// =============================================================================

export function DonationHistory() {
  const { address } = useAccount();
  
  // Fetch user's activities (Unified Ledger)
  const { activities, isLoading } = useActivitiesGraph({ donor: address }, 50);
  
  // Get pending deposits from context
  const { pendingDeposits, removePendingDeposit } = usePendingDeposits();
  
  // Filter pending deposits for current user
  const userPendingDeposits = pendingDeposits.filter(
    (p) => p.donor.toLowerCase() === address?.toLowerCase()
  );

  // Auto-remove pending deposits when they appear in GraphQL data
  useEffect(() => {
    if (!activities || activities.length === 0) return;
    
    userPendingDeposits.forEach((pending) => {
      const isConfirmed = activities.some(
        (a) => a.txHash.toLowerCase() === pending.txHash.toLowerCase()
      );
      if (isConfirmed) {
        removePendingDeposit(pending.txHash);
      }
    });
  }, [activities, userPendingDeposits, removePendingDeposit]);

  // Combine pending + confirmed, show only recent 5
  const confirmedActivities = (activities || []).slice(0, 5 - userPendingDeposits.length);
  const totalCount = (activities?.length || 0) + userPendingDeposits.length;
  const hasAnyData = userPendingDeposits.length > 0 || confirmedActivities.length > 0;

  return (
    <Card variant="glass" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Activity History</h3>
          {isLoading && (
            <div className="flex items-center gap-1 text-xs text-yellow-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Syncing</span>
            </div>
          )}
        </div>
        {totalCount > 5 && (
          <Link href="/transparency">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              View All
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col">
        {isLoading && userPendingDeposits.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : hasAnyData ? (
          <div className="space-y-2">
            {/* Show pending deposits first */}
            {userPendingDeposits.map((deposit, index) => (
              <PendingDonationItem key={deposit.id} deposit={deposit} index={index} />
            ))}
            {/* Then show confirmed activities */}
            {confirmedActivities.map((activity, index) => (
              <DonationItem 
                key={activity.txHash} 
                activity={activity} 
                index={index + userPendingDeposits.length} 
              />
            ))}
          </div>
        ) : (
          <EmptyDonations />
        )}

        {/* Summary */}
        {totalCount > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Total: {totalCount} activit{totalCount !== 1 ? "ies" : "y"}
              {userPendingDeposits.length > 0 && (
                <span className="text-yellow-400 ml-1">
                  ({userPendingDeposits.length} pending)
                </span>
              )}
            </span>
            <Link href="/transparency">
              <Button variant="secondary" size="sm">
                View All Ledger
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
