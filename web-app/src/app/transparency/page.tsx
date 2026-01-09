"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Eye,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonValue } from "@/components/ui/skeleton";
import { useVaultStats, useTaskCount } from "@/hooks";
import { VerificationBadge } from "@/components/transparency/verification-badge";

// Dynamically import heavy chart components (reduces initial bundle by ~400KB)
const FundFlow = dynamic(
  () => import("@/components/transparency/fund-flow").then((mod) => mod.FundFlow),
  { 
    loading: () => (
      <div className="h-[280px] rounded-xl bg-white/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    ), 
    ssr: false 
  }
);

const RealtimeChart = dynamic(
  () => import("@/components/transparency/realtime-chart").then((mod) => mod.RealtimeChart),
  { 
    loading: () => (
      <div className="h-[350px] rounded-xl bg-white/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    ), 
    ssr: false 
  }
);

const ActivityFeed = dynamic(
  () => import("@/components/transparency/activity-feed").then((mod) => mod.ActivityFeed),
  { 
    loading: () => (
      <div className="h-[400px] rounded-xl bg-white/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    ), 
    ssr: false 
  }
);


export default function TransparencyPage() {
  const {
    totalDepositsFormatted,
    releasedFundsFormatted,
    stateLabel,
    isLoading: loadingStats,
    isRefreshing: refreshingStats,
    isSynced,
    lastUpdated,
    dataSource,
  } = useVaultStats();

  const { taskCount, isLoading: loadingTasks } = useTaskCount();

  const isLoading = loadingStats || loadingTasks;

  // Build stats from live data
  const vaultStats = [
    {
      label: "Total Donated",
      value: totalDepositsFormatted,
      isLoading: loadingStats,
      icon: DollarSign,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
    },
    {
      label: "Funds Released",
      value: releasedFundsFormatted,
      isLoading: loadingStats,
      icon: TrendingUp,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      label: "Vault Status",
      value: stateLabel,
      isLoading: loadingStats,
      icon: CheckCircle,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
    },
    {
      label: "Tasks Created",
      value: taskCount?.toString() || "0",
      isLoading: loadingTasks,
      icon: Users,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Breadcrumb */}
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Transparency" },
        ]}
        icon={Eye}
        iconColor="text-indigo-400"
        iconBg="bg-indigo-500/20"
        title="Transparency Report"
        subtitle="Every donation is tracked on-chain. See exactly where your money goes and how it helps disaster victims worldwide."
        centerContent={
          <>
            <VerificationBadge variant="full" />
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400">Live from blockchain</span>
              </div>
              {isSynced === false && (
                <div className="flex items-center gap-2 text-yellow-500">
                  <RefreshCw className={`h-3 w-3 ${refreshingStats ? "animate-spin" : ""}`} />
                  <span>{refreshingStats ? "Refreshing data..." : "History syncing..."}</span>
                </div>
              )}
              {isSynced === true && refreshingStats && (
                <div className="flex items-center gap-2 text-indigo-400">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Updating...</span>
                </div>
              )}
              {lastUpdated && (
                <span className="text-gray-500">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </>
        }
      >
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
      </PageHeader>

      {/* Stats Grid - LIVE DATA */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {vaultStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Card variant="glass" hover={false}>
              <CardContent className="flex items-center space-x-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}
                >
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <div className="text-2xl font-bold text-white h-8">
                    {stat.isLoading ? <SkeletonValue /> : stat.value}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.section>

      {/* Fund Flow Diagram - Phase 9A */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <FundFlow />
      </motion.section>

      {/* TVL Chart - Phase 9B */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <RealtimeChart />
      </motion.section>

      {/* Fund Allocation */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="gradient">
          <CardHeader>
            <CardTitle>Fund Allocation (Target)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Direct Relief", percent: 65, color: "from-emerald-500 to-green-500" },
              { label: "Volunteer Payouts", percent: 20, color: "from-blue-500 to-indigo-500" },
              { label: "Emergency Reserve", percent: 10, color: "from-purple-500 to-pink-500" },
              { label: "Operations", percent: 5, color: "from-orange-500 to-yellow-500" },
            ].map((item, index) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-300">{item.label}</span>
                  <span className="text-white font-medium">{item.percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                    className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.section>

      {/* Recent Transactions - Premium Activity Feed */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ActivityFeed initialLimit={5} pageSize={10} />
      </motion.section>
    </div>
  );
}
