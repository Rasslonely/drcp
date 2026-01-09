"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Target, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "./campaign-card";
import { useCampaignsGraph } from "@/hooks/useGraph";
import { DonationModal } from "@/components/donation-modal";
import Link from "next/link";

// =============================================================================
// ACTIVE CAMPAIGNS SECTION
// =============================================================================

interface ActiveCampaignsSectionProps {
  maxCampaigns?: number;
}

export function ActiveCampaignsSection({ maxCampaigns = 3 }: ActiveCampaignsSectionProps) {
  const { campaigns, isLoading, error } = useCampaignsGraph("ACTIVE", maxCampaigns);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  const handleDonate = (campaignId: number) => {
    setSelectedCampaignId(campaignId);
    setIsDonateModalOpen(true);
  };

  // Don't render section if no campaigns and not loading
  if (!isLoading && campaigns.length === 0 && !error) {
    return null;
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
              <Target className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Active Relief Campaigns</h2>
              <p className="text-sm text-gray-500">Donate to specific disaster response efforts</p>
            </div>
          </div>
          
          {campaigns.length > 0 && (
            <Link href="/campaigns">
              <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            <span className="ml-2 text-gray-500">Loading campaigns...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
            <p className="text-yellow-400 text-sm">
              Unable to load campaigns. Subgraph may be syncing.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              You can still donate to the General Fund using the Donate button.
            </p>
          </div>
        )}

        {/* Campaign Grid */}
        {!isLoading && !error && campaigns.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CampaignCard
                  campaign={campaign}
                  onDonate={handleDonate}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Donation Modal - Controlled from outside */}
      <DonationModal
        isOpen={isDonateModalOpen}
        onOpenChange={setIsDonateModalOpen}
        initialCampaignId={selectedCampaignId}
      >
        <span className="sr-only">Donate to campaign</span>
      </DonationModal>
    </>
  );
}
