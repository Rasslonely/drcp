"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  Award,
  Flame,
  Target,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Loader2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useAccount } from "wagmi";
import { useImpact, TIER_CONFIG, Tier, useVolunteerLeaderboard } from "@/hooks";
import { useAllTransactions } from "@/hooks/useEvents";
import { getAddressExplorerUrl, getExplorerName, getNFTExplorerUrl, getTxExplorerUrl } from "@/lib/chain-utils";
import { IMPACT_NFT_ADDRESS } from "@/lib/contracts/deployments";

// Tier name mapping for display
const TIER_NAMES: Record<Tier, string> = {
  [Tier.None]: "None",
  [Tier.Bronze]: "Bronze",
  [Tier.Silver]: "Silver",
  [Tier.Gold]: "Gold",
  [Tier.Platinum]: "Platinum",
};

// TIERS constant for backward compatibility with TierBadge/TierProgress
const TIERS = {
  None: TIER_CONFIG[Tier.None],
  Bronze: TIER_CONFIG[Tier.Bronze],
  Silver: TIER_CONFIG[Tier.Silver],
  Gold: TIER_CONFIG[Tier.Gold],
  Platinum: TIER_CONFIG[Tier.Platinum],
};

// Tier number to name mapping for leaderboard display
const TIER_ICON_MAP: Record<number, string> = {
  0: "⚪", // None
  1: "🥉", // Bronze
  2: "🥈", // Silver
  3: "🥇", // Gold
  4: "💎", // Platinum
};


function TierBadge({ tier }: { tier: string }) {
  const config = TIERS[tier as keyof typeof TIERS] || TIERS.None;
  
  return (
    <div className="flex items-center space-x-2">
      <span className="text-3xl">{config.icon}</span>
      <span
        className={`text-xl font-bold ${
          tier === "Platinum"
            ? "text-purple-400"
            : tier === "Gold"
            ? "text-yellow-400"
            : tier === "Silver"
            ? "text-slate-300"
            : tier === "Bronze"
            ? "text-orange-400"
            : "text-gray-400"
        }`}
      >
        {config.name}
      </span>
    </div>
  );
}

function ReputationProgress({
  current,
  max = 10000,
}: {
  current: number;
  max?: number;
}) {
  const percent = (current / max) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Reputation Score</span>
        <span className="text-white font-mono">
          {(current / 100).toFixed(2)} / 100.00
        </span>
      </div>
      <div className="h-3 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        />
      </div>
    </div>
  );
}

function TierProgress({ tier, tasks }: { tier: string; tasks: number }) {
  const tiers = ["Bronze", "Silver", "Gold", "Platinum"];
  const thresholds = [1, 6, 21, 51];
  
  const currentIndex = tiers.indexOf(tier);
  const nextTier = currentIndex < 3 ? tiers[currentIndex + 1] : null;
  const nextThreshold = currentIndex < 3 ? thresholds[currentIndex + 1] : null;
  
  const progress = nextThreshold 
    ? ((tasks - thresholds[currentIndex]) / (nextThreshold - thresholds[currentIndex])) * 100
    : 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">Tier Progress</span>
        {nextTier && (
          <span className="text-sm text-gray-400">
            {nextThreshold! - tasks} tasks to{" "}
            {TIERS[nextTier as keyof typeof TIERS].icon} {nextTier}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {tiers.map((t, i) => (
          <div key={t} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                i <= currentIndex
                  ? "bg-gradient-to-br from-indigo-500 to-purple-500"
                  : "bg-white/10"
              }`}
            >
              {TIERS[t as keyof typeof TIERS].icon}
            </div>
            {i < 3 && (
              <div
                className={`w-12 h-1 ${
                  i < currentIndex
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                    : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReputationPage() {
  const { isConnected, address } = useAccount();
  const [activeTab, setActiveTab] = useState<"profile" | "leaderboard">("profile");
  
  // Fetch on-chain impact data
  const { 
    tierConfig, 
    reputationFormatted, 
    tasksCompleted, 
    totalRewardsFormatted,
    tierProgress,
    hasProfile,
    tokenId,
    isLoading,
    isRefreshing,
  } = useImpact(address as `0x${string}` | undefined);
  
  // Fetch real activities for this volunteer from Subgraph (Payouts only for Reputation)
  const { 
    transactions, 
    isLoading: isLoadingActivities 
  } = useAllTransactions(address as string, 10, 'PAYOUT');

  // Fetch leaderboard from indexed events
  const { 
    leaderboard, 
    isLoading: isLoadingLeaderboard 
  } = useVolunteerLeaderboard();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/20 mx-auto">
            <Trophy className="h-10 w-10 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Volunteer Reputation</h1>
          <p className="text-gray-400 max-w-md">
            Connect your wallet to view your Impact NFT, reputation score, and
            position on the leaderboard.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Breadcrumb */}
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Reputation" },
        ]}
        icon={Trophy}
        iconColor="text-purple-400"
        iconBg="bg-purple-500/20"
        title="Volunteer Reputation"
        subtitle="Your Impact NFT tracks all verified contributions to disaster relief"
      >
        {isRefreshing && (
          <div className="flex items-center gap-2 text-xs text-purple-400 animate-pulse">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </PageHeader>

      {/* Tabs */}
      <div className="flex space-x-2 justify-center">
        <Button
          variant={activeTab === "profile" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("profile")}
        >
          My Profile
        </Button>
        <Button
          variant={activeTab === "leaderboard" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("leaderboard")}
        >
          Leaderboard
        </Button>
      </div>

      {activeTab === "profile" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Impact NFT Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card variant="gradient" className="relative overflow-hidden">
              {/* Loading/Sparkle effect */}
              <div className="absolute top-4 right-4">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
                ) : (
                  <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" />
                )}
              </div>

              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-purple-400" />
                  <span>Your Impact NFT</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                  </div>
                ) : !hasProfile ? (
                  <div className="text-center py-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-purple-500/30 mb-4">
                      <TierBadge tier="None" />
                    </div>
                    <p className="text-gray-400 text-sm">
                      Complete volunteer tasks to earn your Impact NFT and build your reputation!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Tier Badge */}
                    <div className="flex justify-center">
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-purple-500/30">
                        <TierBadge tier={tierConfig.name} />
                      </div>
                    </div>

                    {/* Reputation */}
                    <ReputationProgress current={Number(reputationFormatted) * 100} />

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-xl bg-white/5">
                        <Target className="h-6 w-6 mx-auto text-blue-400 mb-2" />
                        <p className="text-2xl font-bold text-white">
                          {tasksCompleted}
                        </p>
                        <p className="text-xs text-gray-400">Tasks Completed</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-white/5">
                        <Star className="h-6 w-6 mx-auto text-yellow-400 mb-2" />
                        <p className="text-2xl font-bold text-white">
                          {totalRewardsFormatted}
                        </p>
                        <p className="text-xs text-gray-400">USDC Earned</p>
                      </div>
                    </div>

                    {/* Tier Progress */}
                    <TierProgress
                      tier={tierConfig.name}
                      tasks={tasksCompleted}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Proofs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Flame className="h-5 w-5 mr-2 text-orange-400" />
                    Recent Activity
                  </span>
                  <a
                    href={tokenId ? getNFTExplorerUrl(IMPACT_NFT_ADDRESS, tokenId) : getAddressExplorerUrl(address!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center"
                  >
                    {tokenId ? "View NFT on-chain" : "View on-chain"}
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || isLoadingActivities ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : !hasProfile || transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No activity yet</p>
                    <p className="text-sm mt-1">Complete tasks to see your history here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            tx.type === 'volunteer_payout' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            <Star className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {tx.type === 'volunteer_payout' ? 'Task Payout Received' : 'Donation Made'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(tx.timestamp * 1000).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center space-x-3">
                          <div>
                            <p className="text-sm font-bold text-white">{tx.amount}</p>
                            <a 
                              href={getTxExplorerUrl(tx.txHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center justify-end"
                            >
                              TX <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-center text-[10px] text-gray-500 pt-2">
                       Full history synchronized from Goldsky Subgraph
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : (
        /* Leaderboard */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
                Top Volunteers
                {isLoadingLeaderboard && <Loader2 className="ml-2 h-4 w-4 animate-spin text-gray-400" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingLeaderboard ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p>No volunteers on the leaderboard yet.</p>
                  <p className="text-sm mt-1">Complete tasks to be featured here!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((volunteer, index) => (
                    <motion.div
                      key={volunteer.address}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            volunteer.rank === 1
                              ? "bg-yellow-500 text-black"
                              : volunteer.rank === 2
                              ? "bg-slate-300 text-black"
                              : volunteer.rank === 3
                              ? "bg-orange-400 text-black"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          {volunteer.rank}
                        </div>
                        <div>
                          <p className="font-mono text-white">{volunteer.addressFormatted}</p>
                          <p className="text-xs text-gray-500">
                            {volunteer.tasksCompleted} tasks
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-lg">
                          {TIER_ICON_MAP[volunteer.tier] || "⚪"}
                        </span>
                        <div className="text-right">
                          <p className="text-white font-bold">
                            {(volunteer.reputation / 100).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">reputation</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
