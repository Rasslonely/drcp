"use client";

import { motion } from "framer-motion";
import { Vote, FileText } from "lucide-react";
import { useAccount } from "wagmi";
import { ProposalWizard } from "@/components/governance/proposal-wizard";
import { useCanPropose } from "@/hooks";
import { PageHeader } from "@/components/ui/page-header";

export default function CreateProposalPage() {
  const { isConnected } = useAccount();
  const { canPropose, thresholdFormatted, isLoading } = useCanPropose();

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb (nested page) */}
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Governance", href: "/governance" },
          { label: "Create Proposal" },
        ]}
        icon={FileText}
        iconColor="text-indigo-400"
        iconBg="bg-indigo-500/20"
        title="Create Proposal"
        subtitle="Submit a governance proposal for the community to vote on"
      />

      {/* Not Connected Warning */}
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-6 text-center"
        >
          <Vote className="h-10 w-10 mx-auto text-yellow-400 mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-yellow-400">
            Please connect your wallet to create proposals.
          </p>
        </motion.div>
      )}

      {/* Requirements Info */}
      {isConnected && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4"
        >
          <div className="flex items-center space-x-3">
            <Vote className="h-5 w-5 text-indigo-400" />
            <p className="text-sm text-indigo-300">
              {canPropose ? (
                <>
                  ✓ You meet the {thresholdFormatted} RESCUE voting power requirement to create proposals.
                </>
              ) : (
                <>
                  Minimum {thresholdFormatted} RESCUE voting power required to create proposals.
                </>
              )}
            </p>
          </div>
        </motion.div>
      )}

      {/* Wizard */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ProposalWizard />
        </motion.div>
      )}
    </div>
  );
}
