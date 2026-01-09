"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Target, Users, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FormattedCampaign } from "@/hooks/useGraph";

// =============================================================================
// PROGRESS BAR COMPONENT
// =============================================================================

interface ProgressBarProps {
  percent: number;
  className?: string;
}

function ProgressBar({ percent, className }: ProgressBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  
  return (
    <div className={cn("h-2 bg-white/10 rounded-full overflow-hidden", className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clampedPercent}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={cn(
          "h-full rounded-full",
          clampedPercent >= 100
            ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
            : clampedPercent >= 75
            ? "bg-gradient-to-r from-blue-500 to-cyan-400"
            : clampedPercent >= 50
            ? "bg-gradient-to-r from-indigo-500 to-purple-400"
            : "bg-gradient-to-r from-orange-500 to-amber-400"
        )}
      />
    </div>
  );
}

// =============================================================================
// STATUS BADGE COMPONENT
// =============================================================================

function StatusBadge({ status, isExpired }: { status: string; isExpired: boolean }) {
  if (isExpired) {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500/20 text-gray-400">
        EXPIRED
      </span>
    );
  }
  
  switch (status) {
    case "ACTIVE":
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 animate-pulse">
          ACTIVE
        </span>
      );
    case "CLOSED":
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
          CLOSED
        </span>
      );
    default:
      return null;
  }
}

// =============================================================================
// CAMPAIGN CARD COMPONENT
// =============================================================================

interface CampaignCardProps {
  campaign: FormattedCampaign;
  compact?: boolean;
  onDonate?: (campaignId: number) => void;
}

export function CampaignCard({ campaign, compact = false, onDonate }: CampaignCardProps) {
  const timeRemaining = campaign.deadline > 0
    ? Math.max(0, campaign.deadline - Date.now() / 1000)
    : null;
  
  const daysRemaining = timeRemaining ? Math.ceil(timeRemaining / 86400) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card variant="glass" className="relative overflow-hidden group">
        {/* Top gradient indicator based on progress */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-1",
            campaign.progressPercent >= 100
              ? "bg-emerald-500"
              : campaign.progressPercent >= 75
              ? "bg-blue-500"
              : campaign.progressPercent >= 50
              ? "bg-indigo-500"
              : "bg-orange-500"
          )}
        />

        <CardContent className={cn("pt-5", compact ? "pb-3" : "pb-4")}>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-lg truncate">
                {campaign.name}
              </h3>
              {campaign.geoHash && (
                <div className="flex items-center text-sm text-gray-400 mt-1">
                  <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{campaign.geoHash}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-1 ml-3">
              <StatusBadge status={campaign.status} isExpired={campaign.isExpired} />
            </div>
          </div>

          {/* Progress Section */}
          <div className="mt-4 space-y-2">
            <ProgressBar percent={campaign.progressPercent} />
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className="font-bold text-white">{campaign.raisedFormatted}</span>
                <span className="text-gray-500">raised</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <Target className="h-3 w-3" />
                <span>{campaign.targetFormatted}</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          {!compact && (
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{campaign.depositCount} donors</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>{campaign.progressPercent}% funded</span>
              </div>
              {daysRemaining !== null && daysRemaining > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{daysRemaining} days left</span>
                </div>
              )}
            </div>
          )}

          {/* Donate Button */}
          {campaign.status === "ACTIVE" && !campaign.isExpired && onDonate && (
            <div className="mt-4">
              <Button
                onClick={() => onDonate(campaign.campaignId)}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                Donate to Campaign
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =============================================================================
// CAMPAIGN GRID COMPONENT
// =============================================================================

interface CampaignGridProps {
  campaigns: FormattedCampaign[];
  onDonate?: (campaignId: number) => void;
  emptyMessage?: string;
}

export function CampaignGrid({ campaigns, onDonate, emptyMessage = "No active campaigns" }: CampaignGridProps) {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Target className="h-12 w-12 mx-auto mb-4 text-gray-600" />
        <p className="text-lg font-medium">{emptyMessage}</p>
        <p className="text-sm mt-1">Check back later for new campaigns</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign, index) => (
        <motion.div
          key={campaign.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <CampaignCard campaign={campaign} onDonate={onDonate} />
        </motion.div>
      ))}
    </div>
  );
}

// =============================================================================
// CAMPAIGN LIST COMPONENT (Compact)
// =============================================================================

interface CampaignListProps {
  campaigns: FormattedCampaign[];
  title?: string;
  maxItems?: number;
  onDonate?: (campaignId: number) => void;
  onViewAll?: () => void;
}

export function CampaignList({
  campaigns,
  title = "Active Campaigns",
  maxItems = 3,
  onDonate,
  onViewAll,
}: CampaignListProps) {
  const displayCampaigns = campaigns.slice(0, maxItems);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <Target className="h-4 w-4" />
          {title}
        </h3>
        {campaigns.length > maxItems && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary hover:underline"
          >
            View all ({campaigns.length})
          </button>
        )}
      </div>
      <div className="space-y-2">
        {displayCampaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} compact onDonate={onDonate} />
        ))}
      </div>
    </div>
  );
}
