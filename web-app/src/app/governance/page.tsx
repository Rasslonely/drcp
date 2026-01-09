"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Vote,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Loader2,
  Zap,
  Shield,
  Plus,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonValue } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";
import { 
  useProposals, 
  useVotingPower, 
  useCastVote, 
  useHasVoted,
  VoteSupport,
  type ProposalDisplay 
} from "@/hooks";
import { getCurrentDeployment } from "@/lib/contracts/deployments";
import { getAddressExplorerUrl } from "@/lib/chain-utils";

// Dynamically import heavy components (reduces initial bundle by ~300KB)
const DelegationPanel = dynamic(
  () => import("@/components/governance/delegation-panel").then((mod) => mod.DelegationPanel),
  { 
    loading: () => (
      <div className="h-[200px] rounded-xl bg-white/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    ), 
    ssr: false 
  }
);

const VotingDistributionChart = dynamic(
  () => import("@/components/governance/voting-distribution-chart").then((mod) => mod.VotingDistributionChart),
  { 
    loading: () => (
      <div className="h-[400px] rounded-xl bg-white/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    ), 
    ssr: false 
  }
);

function ProposalCard({ proposal }: { proposal: ProposalDisplay }) {
  const { isConnected, address } = useAccount();
  const { hasVoted, isLoading: checkingVote } = useHasVoted(proposal.id);
  const { castVote, isPending: isVoting } = useCastVote();
  const [localVote, setLocalVote] = useState<"for" | "against" | null>(null);

  const handleVote = (support: "for" | "against") => {
    setLocalVote(support);
    castVote(proposal.id, support === "for" ? VoteSupport.For : VoteSupport.Against);
  };

  const statusColors: Record<ProposalDisplay["status"], string> = {
    active: "text-blue-400 bg-blue-500/20 border-blue-500/50",
    passed: "text-emerald-400 bg-emerald-500/20 border-emerald-500/50",
    defeated: "text-red-400 bg-red-500/20 border-red-500/50",
    pending: "text-yellow-400 bg-yellow-500/20 border-yellow-500/50",
    queued: "text-purple-400 bg-purple-500/20 border-purple-500/50",
    executed: "text-emerald-400 bg-emerald-500/20 border-emerald-500/50",
    expired: "text-gray-400 bg-gray-500/20 border-gray-500/50",
    canceled: "text-gray-400 bg-gray-500/20 border-gray-500/50",
  };

  const typeIcons: Record<ProposalDisplay["type"], React.ReactNode> = {
    standard: <Vote className="h-3 w-3" />,
    emergency: <Zap className="h-3 w-3" />,
    upgrade: <Shield className="h-3 w-3" />,
  };

  return (
    <Card variant="glass">
      <CardContent className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white text-lg">{proposal.title}</h3>
              {proposal.type !== "standard" && (
                <span className={cn(
                  "flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full",
                  proposal.type === "emergency" 
                    ? "bg-orange-500/20 text-orange-400" 
                    : "bg-indigo-500/20 text-indigo-400"
                )}>
                  {typeIcons[proposal.type]}
                  <span className="capitalize">{proposal.type}</span>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">{proposal.description}</p>
          </div>
          <div
            className={cn(
              "rounded-lg border px-2 py-1 text-xs font-bold uppercase ml-4",
              statusColors[proposal.status]
            )}
          >
            {proposal.status}
          </div>
        </div>

        {/* Vote Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-emerald-400">For: {proposal.forPercent}%</span>
            <span className="text-red-400">Against: {proposal.againstPercent}%</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${proposal.forPercent}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${proposal.againstPercent}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-red-500 to-rose-500"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{proposal.votesFor.toLocaleString()} RESCUE</span>
            <span>{proposal.votesAgainst.toLocaleString()} RESCUE</span>
          </div>
        </div>

        {/* Quorum & Time */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className={proposal.quorumReached ? "text-emerald-400" : "text-gray-400"}>
              {proposal.quorumReached ? "Quorum reached" : "Quorum pending"}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{proposal.endTime}</span>
          </div>
        </div>

        {/* Vote Buttons */}
        {proposal.status === "active" && (
          <div className="flex space-x-3 pt-2">
            {hasVoted ? (
              <div className="flex-1 text-center py-2 rounded-lg bg-white/5 text-gray-400">
                ✓ You have already voted on this proposal
              </div>
            ) : (
              <>
                <Button
                  variant={localVote === "for" ? "primary" : "secondary"}
                  size="sm"
                  className="flex-1"
                  onClick={() => handleVote("for")}
                  disabled={!isConnected || isVoting || checkingVote}
                >
                  {isVoting && localVote === "for" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="mr-2 h-4 w-4" />
                  )}
                  Vote For
                </Button>
                <Button
                  variant={localVote === "against" ? "danger" : "secondary"}
                  size="sm"
                  className="flex-1"
                  onClick={() => handleVote("against")}
                  disabled={!isConnected || isVoting || checkingVote}
                >
                  {isVoting && localVote === "against" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsDown className="mr-2 h-4 w-4" />
                  )}
                  Vote Against
                </Button>
              </>
            )}
          </div>
        )}

        {/* Proposer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-xs text-gray-500">
            Proposed by{" "}
            <span className="font-mono text-gray-400">{proposal.proposerFormatted}</span>
          </span>
          <a
            href={getAddressExplorerUrl(getCurrentDeployment().DRCPGovernor)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-xs text-indigo-400 hover:text-indigo-300"
          >
            View on-chain
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GovernancePage() {
  const { isConnected } = useAccount();
  const { proposals, stats, isLoading } = useProposals();
  const { votingPowerFormatted, hasVotingPower, isLoading: loadingPower } = useVotingPower();

  const statsDisplay = [
    { label: "Active Proposals", value: stats.active.toString(), icon: Vote, color: "text-blue-400" },
    { label: "Passed", value: stats.passed.toString(), icon: CheckCircle, color: "text-emerald-400" },
    { label: "Defeated", value: stats.defeated.toString(), icon: XCircle, color: "text-red-400" },
    { label: "Total Proposals", value: stats.total.toString(), icon: Users, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Breadcrumb */}
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Governance" },
        ]}
        icon={Vote}
        iconColor="text-purple-400"
        iconBg="bg-purple-500/20"
        title="DAO Governance"
        subtitle="Shape the future of disaster relief. Vote on proposals using your RESCUE tokens and participate in decentralized decision-making."
        actions={
          isConnected && (
            <Link href="/governance/create">
              <Button variant="primary" className="bg-gradient-to-r from-indigo-500 to-purple-600">
                <Plus className="mr-2 h-4 w-4" />
                Create Proposal
              </Button>
            </Link>
          )
        }
      >
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
      </PageHeader>

      {/* Stats */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
      >
        {statsDisplay.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Card variant="glass" hover={false}>
              <CardContent className="flex items-center justify-center space-x-3 py-4">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white h-8">
                    {isLoading ? <SkeletonValue /> : stat.value}
                  </div>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.section>

      {/* Delegation Panel (Phase 10A) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <DelegationPanel />
      </motion.section>

      {/* Voting Analytics (Phase 10C) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <VotingDistributionChart />
      </motion.section>

      {/* Wallet Connection Warning */}
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-4 text-center"
        >
          <p className="text-yellow-400">
            Connect your wallet to vote on proposals. You need RESCUE tokens to
            participate in governance.
          </p>
        </motion.div>
      )}

      {/* Proposals */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Proposals</h2>
          <a
            href={getAddressExplorerUrl(getCurrentDeployment().DRCPGovernor)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-gray-400 hover:text-white"
          >
            View Governor
            <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : proposals.length === 0 ? (
          <Card variant="glass">
            <CardContent className="text-center py-12">
              <Vote className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No proposals found on-chain yet.</p>
              <p className="text-sm text-gray-500 mt-1">
                Proposals will appear here when they are created on the Governor contract.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal, index) => (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <ProposalCard proposal={proposal} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}
