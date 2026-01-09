"use client";

import { motion } from "framer-motion";
import { DollarSign, Users, CheckCircle, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ABIS } from "@/lib/contracts/abis";
import { VAULT_ADDRESS, CHAIN_ID } from "@/lib/contracts/deployments";

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
  color: string;
  isLoading?: boolean;
}

function StatItem({ icon, label, value, trend, color, isLoading }: StatItemProps) {
  return (
    <Card variant="glass" hover={false}>
      <CardContent className="flex items-center space-x-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            ) : (
              <span className="text-2xl font-bold text-white">{value}</span>
            )}
            {trend && !isLoading && (
              <span className="flex items-center text-xs text-emerald-400">
                <TrendingUp className="mr-0.5 h-3 w-3" />
                {trend}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ImpactStats() {
  const { address, isConnected } = useAccount();

  // 1. Fetch User Donations
  const { data: userBalance, isLoading: isLoadingBalance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: ABIS.ParametricVault,
    functionName: "donorBalances",
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: {
      enabled: !!address,
    },
  });

  // 2. Fetch Global Deposits (as a proxy for activity)
  const { data: totalDeposits, isLoading: isLoadingTotal } = useReadContract({
    address: VAULT_ADDRESS,
    abi: ABIS.ParametricVault,
    functionName: "totalDeposits",
    chainId: CHAIN_ID,
  });

  // Helper to format currency (USDC uses 6 decimals)
  const formatCurrency = (val: bigint | undefined) => {
    if (val === undefined) return "$0.00";
    return `$${Number(formatUnits(val, 6)).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Derived metrics based on real values (USDC 6 decimals)
  const impactCount = userBalance ? Number(formatUnits(userBalance as bigint, 6)) / 50 : 0;
  const tasksFunded = totalDeposits ? Number(formatUnits(totalDeposits as bigint, 6)) / 100 : 0;

  const stats = [
    {
      icon: <DollarSign className="h-6 w-6 text-emerald-400" />,
      label: "Your Total Donations",
      value: isConnected ? formatCurrency(userBalance as bigint | undefined) : "$---",
      trend: isConnected ? "Lifetime" : "Connect Wallet",
      color: "bg-emerald-500/20",
      isLoading: isConnected && isLoadingBalance,
    },
    {
      icon: <Users className="h-6 w-6 text-blue-400" />,
      label: "Est. Lives Impacted",
      value: isConnected ? Math.floor(impactCount).toString() : "-",
      trend: "Based on $50/person",
      color: "bg-blue-500/20",
      isLoading: isConnected && isLoadingBalance,
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-purple-400" />,
      label: "Global Tasks Funded",
      value: Math.floor(tasksFunded).toString(),
      color: "bg-purple-500/20",
      isLoading: isLoadingTotal,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Your Impact</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatItem {...stat} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
