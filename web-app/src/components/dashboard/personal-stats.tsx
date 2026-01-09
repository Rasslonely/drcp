"use client";

import { motion } from "framer-motion";
import { DollarSign, Trophy, Medal, Star, Loader2, Award, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ABIS } from "@/lib/contracts/abis";
import { CHAIN_ID, getCurrentDeployment } from "@/lib/contracts/deployments";
import { useImpact, Tier, TIER_CONFIG } from "@/hooks";
import { useDonorStatsGraph } from "@/hooks/useGraph";
import { cn } from "@/lib/utils";

// =============================================================================
// TIER BADGE
// =============================================================================

function TierBadge({ tier }: { tier: Tier }) {
  const config = TIER_CONFIG[tier];
  
  const tierColors: Record<Tier, string> = {
    [Tier.None]: "from-gray-600 to-gray-500",
    [Tier.Bronze]: "from-amber-700 to-amber-600",
    [Tier.Silver]: "from-gray-400 to-gray-300",
    [Tier.Gold]: "from-yellow-500 to-yellow-400",
    [Tier.Platinum]: "from-cyan-400 to-blue-500",
  };

  const tierIcons: Record<Tier, React.ReactNode> = {
    [Tier.None]: <Medal className="h-5 w-5" />,
    [Tier.Bronze]: <Medal className="h-5 w-5" />,
    [Tier.Silver]: <Medal className="h-5 w-5" />,
    [Tier.Gold]: <Trophy className="h-5 w-5" />,
    [Tier.Platinum]: <Award className="h-5 w-5" />,
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r text-white font-medium shadow-lg",
        tierColors[tier]
      )}
    >
      {tierIcons[tier]}
      <span>{config.name}</span>
    </div>
  );
}

// =============================================================================
// STAT CARD
// =============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  subLabel?: string;
  color: string;
  isLoading?: boolean;
  isRefreshing?: boolean;
}

function StatCard({ icon, value, label, subLabel, color, isLoading, isRefreshing }: StatCardProps) {
  return (
    <Card variant="glass">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-500 mb-2" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-white">{value}</div>
                {isRefreshing && (
                  <RefreshCw className="h-3 w-3 animate-spin text-gray-400" />
                )}
              </div>
            )}
            <div className="text-sm text-gray-400">{label}</div>
            {subLabel && (
              <div className="text-xs text-gray-500 mt-1">{subLabel}</div>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", color)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// PERSONAL STATS COMPONENT
// =============================================================================

export function PersonalStats() {
  const { address } = useAccount();
  const { 
    tier, 
    tasksCompleted, 
    isLoading: isLoadingImpact,
    isRefreshing: isRefreshingImpact 
  } = useImpact(address);
  const currentTier = tier ?? Tier.None;
  
  // Use Subgraph for unified donor stats (General + Campaigns)
  const { 
    raw: donorStats, 
    isLoading: isLoadingDonorStats,
    isRefreshing: isRefreshingDonorStats 
  } = useDonorStatsGraph(address);

  // Fetch user's voting power (if they have RESCUE tokens)
  const deployment = getCurrentDeployment();
  const { data: votingPower, isLoading: isLoadingVotingPower, isFetching: isRefreshingVotingPower } = useReadContract({
    address: deployment.RescueToken as `0x${string}`,
    abi: ABIS.RescueToken,
    functionName: "getVotes",
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: { 
      enabled: !!address,
      staleTime: 30000 
    },
  });

  // Format values
  const formatUSDC = (val: bigint | undefined): string => {
    if (!val) return "$0";
    const amount = Number(formatUnits(val, 6));
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const formatVotes = (val: bigint | undefined): string => {
    if (!val) return "0";
    const amount = Number(formatUnits(val, 18));
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(0);
  };

  // Calculate estimated impact
  const totalDonatedBigInt = donorStats ? BigInt(donorStats.totalDonated) : BigInt(0);
  const totalDonatedAmount = Number(formatUnits(totalDonatedBigInt, 6));
  const livesImpacted = Math.floor(totalDonatedAmount / 50);

  const formatDonated = (amount: number): string => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Tier Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-xl font-semibold text-white">Your Impact</h2>
        {!isLoadingImpact && <TierBadge tier={currentTier} />}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
            value={formatDonated(totalDonatedAmount)}
            label="Total Donated"
            subLabel="Unified Funds"
            color="bg-emerald-500/20"
            isLoading={isLoadingDonorStats}
            isRefreshing={isRefreshingDonorStats}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <StatCard
            icon={<Star className="h-5 w-5 text-yellow-400" />}
            value={tasksCompleted.toString()}
            label="Tasks Completed"
            subLabel="Points"
            color="bg-yellow-500/20"
            isLoading={isLoadingImpact}
            isRefreshing={isRefreshingImpact}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            icon={<Trophy className="h-5 w-5 text-purple-400" />}
            value={formatVotes(votingPower as bigint | undefined)}
            label="Voting Power"
            subLabel="RESCUE tokens"
            color="bg-purple-500/20"
            isLoading={isLoadingVotingPower}
            isRefreshing={isRefreshingVotingPower}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <StatCard
            icon={<Medal className="h-5 w-5 text-blue-400" />}
            value={livesImpacted.toLocaleString()}
            label="Lives Impacted"
            subLabel="Estimated"
            color="bg-blue-500/20"
            isLoading={isLoadingDonorStats}
            isRefreshing={isRefreshingDonorStats}
          />
        </motion.div>
      </div>
    </div>
  );
}
