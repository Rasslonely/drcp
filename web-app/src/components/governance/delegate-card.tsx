"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { User, Vote, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DelegateInfo } from "@/hooks/useDelegation";
import { getAddressExplorerUrl } from "@/lib/chain-utils";

interface DelegateCardProps {
  delegate: DelegateInfo;
  onDelegate?: (address: `0x${string}`) => void;
  isCurrentDelegate?: boolean;
  isPending?: boolean;
  className?: string;
}

export const DelegateCard = memo(function DelegateCard({
  delegate,
  onDelegate,
  isCurrentDelegate = false,
  isPending = false,
  className,
}: DelegateCardProps) {
  const hasProfile = !!delegate.profile;
  const displayName = delegate.profile?.displayName || delegate.addressFormatted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-xl border p-4 transition-all",
        isCurrentDelegate
          ? "border-emerald-500/50 bg-emerald-500/10"
          : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20",
        className
      )}
    >
      {/* Current delegate badge */}
      {isCurrentDelegate && (
        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
          <Check className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            hasProfile
              ? "bg-gradient-to-br from-indigo-500 to-purple-600"
              : "bg-gray-700"
          )}
        >
          {delegate.profile?.avatar ? (
            <img
              src={delegate.profile.avatar}
              alt={displayName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <User className="h-5 w-5 text-white" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-white truncate">{displayName}</h4>
            {hasProfile && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                Registered
              </span>
            )}
          </div>
          
          {/* Statement if profile exists */}
          {delegate.profile?.statement && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
              "{delegate.profile.statement}"
            </p>
          )}

          {/* Address if showing profile name */}
          {hasProfile && (
            <a
              href={getAddressExplorerUrl(delegate.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-indigo-400 font-mono flex items-center gap-1 mt-1"
            >
              {delegate.addressFormatted}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-black/20 p-2 text-center">
          <p className="text-xs text-gray-500">Voting Power</p>
          <p className="text-sm font-bold text-white">
            {delegate.votingPowerFormatted}
          </p>
          <p className="text-xs text-gray-500">
            {delegate.votingPowerPercent.toFixed(1)}% of supply
          </p>
        </div>
        <div className="rounded-lg bg-black/20 p-2 text-center">
          <p className="text-xs text-gray-500">Participation</p>
          <p className="text-sm font-bold text-white">
            {delegate.participationRate > 0
              ? `${delegate.participationRate}%`
              : "--"}
          </p>
          <p className="text-xs text-gray-500">
            {delegate.recentVotes > 0 ? `${delegate.recentVotes} votes` : "No data"}
          </p>
        </div>
      </div>

      {/* Delegate button */}
      {onDelegate && !isCurrentDelegate && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full mt-4"
          onClick={() => onDelegate(delegate.address)}
          disabled={isPending}
        >
          <Vote className="mr-2 h-4 w-4" />
          {isPending ? "Delegating..." : "Delegate"}
        </Button>
      )}

      {isCurrentDelegate && (
        <div className="mt-4 text-center text-sm text-emerald-400">
          ✓ Currently delegated
        </div>
      )}
    </motion.div>
  );
});

/**
 * Compact delegate card for carousel/list views
 */
export const DelegateCardCompact = memo(function DelegateCardCompact({
  delegate,
  onDelegate,
  isCurrentDelegate = false,
  isPending = false,
}: DelegateCardProps) {
  const displayName = delegate.profile?.displayName || delegate.addressFormatted;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all min-w-[120px]",
        isCurrentDelegate
          ? "border border-emerald-500/50 bg-emerald-500/10"
          : "border border-white/10 bg-white/5 hover:bg-white/10"
      )}
      onClick={() => onDelegate?.(delegate.address)}
    >
      {/* Current badge */}
      {isCurrentDelegate && (
        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Avatar */}
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full mb-2",
          delegate.profile
            ? "bg-gradient-to-br from-indigo-500 to-purple-600"
            : "bg-gray-700"
        )}
      >
        <User className="h-5 w-5 text-white" />
      </div>

      {/* Name */}
      <p className="text-sm font-medium text-white truncate max-w-full">
        {displayName}
      </p>

      {/* Voting power */}
      <p className="text-xs text-gray-400">
        {delegate.votingPowerFormatted} VP
      </p>

      {/* Pending state */}
      {isPending && (
        <p className="text-xs text-indigo-400 mt-1">Delegating...</p>
      )}
    </motion.div>
  );
});
