"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProposalVotes, type VoteRecord } from "@/hooks";
import { getTxExplorerUrl } from "@/lib/chain-utils";

interface ProposalVotesTableProps {
  proposalId: string;
  className?: string;
}

export function ProposalVotesTable({ proposalId, className }: ProposalVotesTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { votes, forVoters, againstVoters, abstainVoters, isLoading } = useProposalVotes(
    isExpanded ? proposalId : undefined
  );

  const supportIcons = {
    for: <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />,
    against: <ThumbsDown className="h-3.5 w-3.5 text-red-400" />,
    abstain: <Minus className="h-3.5 w-3.5 text-gray-400" />,
  };

  const supportColors = {
    for: "text-emerald-400",
    against: "text-red-400",
    abstain: "text-gray-400",
  };

  return (
    <div className={cn("border-t border-white/10 mt-4 pt-4", className)}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm text-gray-400 hover:text-white transition-colors"
      >
        <span>Vote History</span>
        <div className="flex items-center space-x-2">
          {isExpanded && !isLoading && (
            <span className="text-xs">
              {forVoters} for · {againstVoters} against · {abstainVoters} abstain
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                </div>
              ) : votes.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-4">
                  No votes recorded yet
                </p>
              ) : (
                <>
                  {/* Table Header */}
                  <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 pb-2 border-b border-white/10">
                    <span>Voter</span>
                    <span className="text-center">Vote</span>
                    <span className="text-right">Weight</span>
                    <span className="text-right">Tx</span>
                  </div>

                  {/* Vote Rows */}
                  {votes.slice(0, 10).map((vote, i) => (
                    <motion.div
                      key={vote.txHash}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="grid grid-cols-4 gap-2 items-center text-sm py-1"
                    >
                      <span className="font-mono text-gray-400 truncate">
                        {vote.voterFormatted}
                      </span>
                      <span className={cn("flex items-center justify-center space-x-1", supportColors[vote.support])}>
                        {supportIcons[vote.support]}
                        <span className="capitalize text-xs">{vote.support}</span>
                      </span>
                      <span className="text-right text-white font-medium">
                        {vote.weightFormatted}
                      </span>
                      <div className="text-right">
                        <a
                          href={getTxExplorerUrl(vote.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          <ExternalLink className="h-3.5 w-3.5 inline" />
                        </a>
                      </div>
                    </motion.div>
                  ))}

                  {/* Show more indicator */}
                  {votes.length > 10 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      + {votes.length - 10} more votes
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Compact inline vote summary for proposal cards
 */
export function VoteSummaryBadge({
  proposalId,
  className,
}: {
  proposalId: string;
  className?: string;
}) {
  // This is a lightweight component that doesn't fetch data
  // It's meant to show existing vote counts from the proposal data
  return null; // Placeholder - data comes from proposal itself
}
