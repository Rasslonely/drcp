"use client";

import { motion } from "framer-motion";
import { FileText, Vote, Clock, CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProposals, ProposalDisplay } from "@/hooks";
import Link from "next/link";
import { cn } from "@/lib/utils";

// =============================================================================
// PROPOSAL STATUS BADGE
// =============================================================================

type ProposalStatus = ProposalDisplay["status"];

function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const statusConfig: Record<ProposalStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: "Pending", color: "bg-gray-500/20 text-gray-400", icon: <Clock className="h-3 w-3" /> },
    active: { label: "Active", color: "bg-blue-500/20 text-blue-400", icon: <Vote className="h-3 w-3" /> },
    canceled: { label: "Canceled", color: "bg-gray-500/20 text-gray-400", icon: <XCircle className="h-3 w-3" /> },
    defeated: { label: "Defeated", color: "bg-red-500/20 text-red-400", icon: <XCircle className="h-3 w-3" /> },
    passed: { label: "Passed", color: "bg-emerald-500/20 text-emerald-400", icon: <CheckCircle className="h-3 w-3" /> },
    queued: { label: "Queued", color: "bg-yellow-500/20 text-yellow-400", icon: <Clock className="h-3 w-3" /> },
    expired: { label: "Expired", color: "bg-gray-500/20 text-gray-400", icon: <Clock className="h-3 w-3" /> },
    executed: { label: "Executed", color: "bg-purple-500/20 text-purple-400", icon: <CheckCircle className="h-3 w-3" /> },
  };

  const config = statusConfig[status];

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", config.color)}>
      {config.icon}
      {config.label}
    </span>
  );
}

// =============================================================================
// PROPOSAL ITEM
// =============================================================================

interface ProposalItemProps {
  proposal: ProposalDisplay;
  index: number;
}

function ProposalItem({ proposal, index }: ProposalItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href="/governance">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors cursor-pointer">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 mr-4">
              <h4 className="font-medium text-white line-clamp-1">
                {proposal.title || `Proposal #${proposal.id.slice(0, 8)}`}
              </h4>
              <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                {proposal.description?.slice(0, 80) || "No description"}
              </p>
            </div>
            <ProposalStatusBadge status={proposal.status} />
          </div>

          {/* Vote Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400">Votes</span>
              <span className="text-white">{proposal.forPercent.toFixed(0)}% For</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                style={{ width: `${proposal.forPercent}%` }}
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyProposals() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
        <FileText className="h-8 w-8 text-gray-600" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">No proposals yet</h3>
      <p className="text-sm text-gray-500 max-w-xs mb-4">
        Create your first governance proposal or participate in voting.
      </p>
      <Link href="/governance">
        <Button variant="secondary" size="sm">
          Go to Governance
        </Button>
      </Link>
    </div>
  );
}

// =============================================================================
// MY PROPOSALS COMPONENT
// =============================================================================

export function MyProposals() {
  const { proposals, isLoading } = useProposals();

  // Filter to active proposals
  const activeProposals = (proposals || []).filter(
    (p: ProposalDisplay) => p.status === "active" || p.status === "pending"
  );

  // Show only first 3
  const recentProposals = activeProposals.slice(0, 3);

  return (
    <Card variant="glass" className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <h3 className="text-lg font-semibold text-white">Active Proposals</h3>
        <Link href="/governance">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            View All
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : recentProposals.length > 0 ? (
          <div className="space-y-3">
            {recentProposals.map((proposal: ProposalDisplay, index: number) => (
              <ProposalItem 
                key={proposal.id} 
                proposal={proposal} 
                index={index} 
              />
            ))}
          </div>
        ) : (
          <EmptyProposals />
        )}
      </CardContent>
    </Card>
  );
}
