"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { Wallet, AlertTriangle, ArrowRight, MapPin, Clock, Briefcase, Hand, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuickDonate } from "@/components/quick-donate";
import {
  PersonalStats,
  DonationHistory,
  MyProposals,
  QuickActions,
  IndonesiaMap,
  AutoCampaignBanner,
} from "@/components/dashboard";
import { useDisasterData, useAllTasks, useMyTasks } from "@/hooks";
import {
  DisasterEvent,
  getDisasterEmoji,
  AlertLevel,
} from "@/lib/disaster-sources";

// =============================================================================
// COMPACT EMERGENCY CARD (memoized for performance)
// =============================================================================

const CompactEmergencyItem = memo(function CompactEmergencyItem({ event }: { event: DisasterEvent }) {
  const alertColor =
    event.alertLevel === AlertLevel.RED
      ? "bg-red-500"
      : event.alertLevel === AlertLevel.ORANGE
      ? "bg-orange-500"
      : "bg-green-500";

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center gap-3">
        <span className="text-xl">{getDisasterEmoji(event.type)}</span>
        <div>
          <div className="font-medium text-white text-sm">
            {event.type}
            {event.details.magnitude && (
              <span className="text-gray-400 ml-1">
                M{event.details.magnitude.toFixed(1)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{event.location}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${alertColor}`} />
        <span className="text-sm font-medium text-white">{event.severity}%</span>
      </div>
    </div>
  );
});

// =============================================================================
// EMERGENCIES WIDGET
// =============================================================================

function EmergenciesWidget() {
  const { events, isLoading } = useDisasterData({
    initialFilter: { indonesiaOnly: true, limit: 4 },
  });

  const previewEvents = events.slice(0, 4);

  return (
    <Card variant="glass">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="font-semibold text-white">Active Emergencies</h3>
          </div>
          <Link href="/emergencies">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              View All
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : previewEvents.length > 0 ? (
          <div className="space-y-2">
            {previewEvents.map((event) => (
              <CompactEmergencyItem key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No active emergencies
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// TASKS WIDGET
// =============================================================================

function TasksWidget({ address }: { address?: string }) {
  const { openTasks, isLoading } = useAllTasks();
  const { myTasks, claimedTasks } = useMyTasks(address as `0x${string}` | undefined);

  const previewTasks = openTasks.slice(0, 3);
  const hasActiveTasks = claimedTasks.length > 0;

  return (
    <Card variant="glass">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-white">Volunteer Tasks</h3>
            {openTasks.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                {openTasks.length} open
              </span>
            )}
          </div>
          <Link href="/tasks">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              View All
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>

        {/* Active Tasks Banner */}
        {hasActiveTasks && (
          <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hand className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-blue-300">
                  You have {claimedTasks.length} active task{claimedTasks.length > 1 ? "s" : ""}
                </span>
              </div>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 text-xs">
                  Continue
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : previewTasks.length > 0 ? (
          <div className="space-y-2">
            {previewTasks.map((task) => (
              <div
                key={Number(task.id)}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">{task.statusIcon}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-white text-sm truncate max-w-[180px]">
                      {task.description}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{task.createdAtDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-green-400">
                    {task.rewardFormatted}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-gray-600" />
            <p className="text-sm">No open tasks available</p>
            <p className="text-xs text-gray-600">Check back later for opportunities</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// CONNECT WALLET SCREEN
// =============================================================================

function ConnectWalletScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 mx-auto border border-white/10">
          <Wallet className="h-12 w-12 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Connect Your Wallet</h1>
          <p className="text-gray-400 max-w-md">
            Connect your wallet to view your personal dashboard, track donations,
            and manage your impact in disaster relief efforts.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-gray-500">
            Click &quot;Connect Wallet&quot; in the header to get started
          </p>
          <Link href="/">
            <Button variant="secondary">
              Explore Landing Page
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// DASHBOARD PAGE
// =============================================================================

export default function DashboardPage() {
  const { isConnected, address } = useAccount();

  if (!isConnected) {
    return <ConnectWalletScreen />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Your Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            Welcome back,{" "}
            <span className="text-indigo-400 font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </p>
        </div>
        <Link href="/transparency" className="w-full sm:w-auto">
          <Button variant="secondary" size="sm" className="w-full sm:w-auto">
            View Transparency Report
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.section>
      
      {/* AI Intelligence Banner (Auto-Campaign Trigger) */}
      <AutoCampaignBanner />

      {/* Personal Stats */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <PersonalStats />
      </motion.section>

      {/* Interactive Map Intelligence */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <IndonesiaMap />
      </motion.section>

      {/* Quick Actions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <QuickActions />
      </motion.section>

      {/* Main Grid: History + Proposals + Donate */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Donation History */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <DonationHistory />
        </motion.div>

        {/* My Proposals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-1"
        >
          <MyProposals />
        </motion.div>

        {/* Quick Donate */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1"
        >
          <QuickDonate />
        </motion.div>
      </div>

      {/* Active Emergencies Widget */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <EmergenciesWidget />
      </motion.section>

      {/* Volunteer Tasks Widget */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <TasksWidget address={address} />
      </motion.section>
    </div>
  );
}
