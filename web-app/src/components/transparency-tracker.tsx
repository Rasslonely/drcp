"use client";

import { motion } from "framer-motion";
import { Eye, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonValue } from "@/components/ui/skeleton";
import { useVaultStats, useTaskCount } from "@/hooks";
import { getExplorerUrl } from "@/lib/chain-utils";

export function TransparencyTracker() {
  const { 
    totalDepositsFormatted, 
    releasedFundsFormatted, 
    utilization,
    stateLabel,
    isLoading: isLoadingStats 
  } = useVaultStats();
  
  const { taskCount, isLoading: isLoadingTasks } = useTaskCount();

  const isLoading = isLoadingStats || isLoadingTasks;

  const stats = [
    { 
      label: "Total Donated", 
      value: totalDepositsFormatted, 
      color: "text-emerald-400" 
    },
    { 
      label: "Funds Released", 
      value: releasedFundsFormatted, 
      color: "text-blue-400" 
    },
    { 
      label: "Vault Status", 
      value: stateLabel, 
      color: "text-purple-400" 
    },
    { 
      label: "Tasks Created", 
      value: taskCount?.toString() || "0", 
      color: "text-orange-400" 
    },
  ];

  return (
    <Card variant="gradient">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Eye className="mr-2 h-5 w-5 text-indigo-400" />
            Transparency Tracker
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin text-gray-500" />}
          </span>
          <a
            href={getExplorerUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            View on-chain
            <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className={`text-2xl font-bold ${stat.color}`}>
                {isLoading ? <SkeletonValue className="mx-auto" /> : stat.value}
              </div>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Fund Utilization</span>
            <span className="text-white font-medium">
              {isLoading ? <SkeletonValue className="w-10 h-5" /> : `${utilization}%`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${utilization}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {isLoading 
              ? "Loading on-chain data..." 
              : `${releasedFundsFormatted} of ${totalDepositsFormatted} has been distributed to relief efforts`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

