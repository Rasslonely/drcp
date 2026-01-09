"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCampaignsGraph, type FormattedCampaign } from "@/hooks/useGraph";

// =============================================================================
// CAMPAIGN SELECTOR COMPONENT
// =============================================================================

interface CampaignSelectorProps {
  selectedCampaignId: number | null; // null = General Fund
  onSelect: (campaignId: number | null) => void;
  className?: string;
}

export function CampaignSelector({
  selectedCampaignId,
  onSelect,
  className,
}: CampaignSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { campaigns, isLoading, error } = useCampaignsGraph("ACTIVE");
  
  const selectedCampaign = campaigns.find(c => c.campaignId === selectedCampaignId);

  return (
    <div className={cn("relative", className)}>
      <label className="block text-sm font-medium text-gray-400 mb-2">
        Select Campaign
      </label>
      
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-xl",
          "bg-white/5 border border-white/10 hover:border-white/20 transition-colors",
          "text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        )}
      >
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
          ) : (
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              selectedCampaignId === null
                ? "bg-emerald-500/20"
                : "bg-indigo-500/20"
            )}>
              <Target className={cn(
                "h-5 w-5",
                selectedCampaignId === null ? "text-emerald-400" : "text-indigo-400"
              )} />
            </div>
          )}
          <div>
            <div className="font-medium text-white">
              {selectedCampaignId === null
                ? "General Fund"
                : selectedCampaign?.name || "Select a campaign"}
            </div>
            <div className="text-xs text-gray-500">
              {selectedCampaignId === null
                ? "Supports any emergency"
                : selectedCampaign
                ? `${selectedCampaign.progressPercent}% funded`
                : "Loading..."}
            </div>
          </div>
        </div>
        <ChevronDown className={cn(
          "h-5 w-5 text-gray-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 w-full mt-2 rounded-xl overflow-hidden",
              "bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl"
            )}
          >
            {/* General Fund Option */}
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left",
                "hover:bg-white/5 transition-colors",
                selectedCampaignId === null && "bg-white/10"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-white">General Fund</div>
                <div className="text-xs text-gray-500">Supports any emergency</div>
              </div>
              {selectedCampaignId === null && (
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>

            {/* Divider */}
            {campaigns.length > 0 && (
              <div className="border-t border-white/10 mx-4" />
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>Failed to load campaigns</span>
              </div>
            )}

            {/* Campaign Options */}
            {!isLoading && campaigns.length === 0 && !error && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No active campaigns available
              </div>
            )}

            <div className="max-h-60 overflow-y-auto">
              {campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => {
                    onSelect(campaign.campaignId);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left",
                    "hover:bg-white/5 transition-colors",
                    selectedCampaignId === campaign.campaignId && "bg-white/10"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Target className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{campaign.name}</div>
                    <div className="text-xs text-gray-500">
                      {campaign.raisedFormatted} / {campaign.targetFormatted}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-medium text-indigo-400">
                      {campaign.progressPercent}%
                    </span>
                    {/* Mini progress bar */}
                    <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, campaign.progressPercent)}%` }}
                      />
                    </div>
                  </div>
                  {selectedCampaignId === campaign.campaignId && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 ml-2" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// =============================================================================
// CAMPAIGN RADIO GROUP (Alternative simpler version)
// =============================================================================

interface CampaignRadioGroupProps {
  selectedCampaignId: number | null;
  onSelect: (campaignId: number | null) => void;
  className?: string;
}

export function CampaignRadioGroup({
  selectedCampaignId,
  onSelect,
  className,
}: CampaignRadioGroupProps) {
  const { campaigns, isLoading } = useCampaignsGraph("ACTIVE");

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-gray-400">
        Select Campaign
      </label>
      
      <div className="space-y-2">
        {/* General Fund Option */}
        <label className={cn(
          "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
          "border",
          selectedCampaignId === null
            ? "bg-emerald-500/10 border-emerald-500/50"
            : "bg-white/5 border-white/10 hover:border-white/20"
        )}>
          <input
            type="radio"
            name="campaign"
            checked={selectedCampaignId === null}
            onChange={() => onSelect(null)}
            className="sr-only"
          />
          <div className={cn(
            "w-4 h-4 rounded-full border-2 flex items-center justify-center",
            selectedCampaignId === null
              ? "border-emerald-500"
              : "border-gray-600"
          )}>
            {selectedCampaignId === null && (
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-white text-sm">General Fund</div>
            <div className="text-xs text-gray-500">Supports any emergency</div>
          </div>
        </label>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center gap-2 p-3 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading campaigns...</span>
          </div>
        )}

        {/* Campaign Options */}
        {campaigns.map((campaign) => (
          <label
            key={campaign.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
              "border",
              selectedCampaignId === campaign.campaignId
                ? "bg-indigo-500/10 border-indigo-500/50"
                : "bg-white/5 border-white/10 hover:border-white/20"
            )}
          >
            <input
              type="radio"
              name="campaign"
              checked={selectedCampaignId === campaign.campaignId}
              onChange={() => onSelect(campaign.campaignId)}
              className="sr-only"
            />
            <div className={cn(
              "w-4 h-4 rounded-full border-2 flex items-center justify-center",
              selectedCampaignId === campaign.campaignId
                ? "border-indigo-500"
                : "border-gray-600"
            )}>
              {selectedCampaignId === campaign.campaignId && (
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white text-sm truncate">
                {campaign.name}
              </div>
              <div className="text-xs text-gray-500">
                {campaign.raisedFormatted} / {campaign.targetFormatted} ({campaign.progressPercent}%)
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
