"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { DollarSign, HandCoins, Receipt, Award, Loader2, AlertCircle } from "lucide-react";
import { useVaultStats } from "@/hooks/useVaultStats";
import { getExplorerUrl, getChainName } from "@/lib/chain-utils";

// =============================================================================
// STAT CARD COMPONENT
// =============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel?: string;
  color: string;
  isLoading?: boolean;
  index: number;
}

function StatCard({ icon, value, label, sublabel, color, isLoading, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 text-center hover:border-white/20 transition-colors">
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${color} mb-4`}>
          {icon}
        </div>
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto mb-2" />
        ) : (
          <div className="text-3xl md:text-4xl font-bold text-white mb-2">
            {value}
          </div>
        )}
        <div className="text-sm text-gray-400">{label}</div>
        {sublabel && (
          <div className="text-xs text-gray-500 mt-1">{sublabel}</div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// GLOBAL STATS SECTION
// =============================================================================

export function GlobalStats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  // Fetch stats using HYBRID approach (RPC primary, GraphQL secondary)
  const { 
    totalDepositsFormatted: totalDonated,
    releasedFundsFormatted: totalPayouts,
    depositCount,
    completedTaskCount,
    isLoading: isLoadingStats,
    isError
  } = useVaultStats();

  const statsData = [
    {
      icon: <DollarSign className="h-7 w-7 text-emerald-400" />,
      value: totalDonated,
      label: "Total Donated",
      sublabel: "On-chain USDC",
      color: "bg-emerald-500/20",
      isLoading: isLoadingStats,
    },
    {
      icon: <HandCoins className="h-7 w-7 text-purple-400" />,
      value: totalPayouts,
      label: "Volunteer Payouts",
      sublabel: "Tasks completed",
      color: "bg-purple-500/20",
      isLoading: isLoadingStats,
    },
    {
      icon: <Receipt className="h-7 w-7 text-blue-400" />,
      value: depositCount.toLocaleString(),
      label: "Donations",
      sublabel: `${completedTaskCount} tasks done`,
      color: "bg-blue-500/20",
      isLoading: isLoadingStats,
    },
    {
      icon: <Award className="h-7 w-7 text-orange-400" />,
      value: "100%",
      label: "Transparency",
      sublabel: "Verified on-chain",
      color: "bg-orange-500/20",
      isLoading: false,
    },
  ];

  return (
    <section
      ref={ref}
      className="py-24 px-4"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Global Impact
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Real metrics from the blockchain. Zero guesswork.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          {statsData.map((stat, index) => (
            <StatCard
              key={stat.label}
              {...stat}
              index={index}
            />
          ))}
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-500 text-sm">
            All data verified on{" "}
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline"
            >
              {getChainName()}
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
