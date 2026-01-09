"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Users, Vote, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVotingAnalytics, type DelegateStats } from "@/hooks";

// Chart colors
const COLORS = [
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#A855F7", // Violet
];

// Recharts tooltip interfaces
interface PieChartDataItem {
  name: string;
  value: number;
  votingPowerFormatted: string;
  percent: number;
  fill: string;
}

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: PieChartDataItem }>;
}

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

// Custom tooltip for pie chart
function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg bg-gray-900 border border-white/10 px-3 py-2 shadow-xl">
      <p className="text-sm font-medium text-white">{data.name}</p>
      <p className="text-xs text-gray-400">
        {data.votingPowerFormatted} RESCUE ({data.percent.toFixed(1)}%)
      </p>
    </div>
  );
}

// Custom tooltip for bar chart
function BarTooltip({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-gray-900 border border-white/10 px-3 py-2 shadow-xl">
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="text-xs text-emerald-400">For: {payload[0]?.value || 0}</p>
      <p className="text-xs text-red-400">Against: {payload[1]?.value || 0}</p>
    </div>
  );
}

export function VotingDistributionChart() {
  const {
    totalSupply,
    totalDelegated,
    delegationRate,
    topDelegates,
    totalVotesCast,
    uniqueVoters,
    avgVotesPerProposal,
    voteRecords,
    isLoading,
  } = useVotingAnalytics();

  // Prepare pie chart data
  const pieData = useMemo(() => {
    if (topDelegates.length === 0) return [];

    // Take top 5 and group rest as "Others"
    const top5 = topDelegates.slice(0, 5);
    const othersTotal = topDelegates.slice(5).reduce(
      (sum, d) => sum + d.votingPower,
      BigInt(0)
    );

    const data = top5.map((d, i) => ({
      name: d.displayName || d.addressFormatted,
      value: Number(d.votingPower / BigInt(10 ** 14)) / 10000, // Convert to number
      votingPowerFormatted: d.votingPowerFormatted,
      percent: d.votingPowerPercent,
      fill: COLORS[i],
    }));

    if (othersTotal > BigInt(0) && totalSupply > BigInt(0)) {
      data.push({
        name: "Others",
        value: Number(othersTotal / BigInt(10 ** 14)) / 10000,
        votingPowerFormatted: `${(Number(othersTotal) / 10 ** 18).toLocaleString()} RESCUE`,
        percent: Number((othersTotal * BigInt(10000)) / totalSupply) / 100,
        fill: "#4B5563", // Gray
      });
    }

    return data;
  }, [topDelegates, totalSupply]);

  // Prepare bar chart data (votes by proposal)
  const barData = useMemo(() => {
    if (voteRecords.length === 0) return [];

    // Group votes by proposal
    const proposalVotes = new Map<string, { for: number; against: number; abstain: number }>();
    
    for (const vote of voteRecords) {
      const existing = proposalVotes.get(vote.proposalId) || { for: 0, against: 0, abstain: 0 };
      existing[vote.support]++;
      proposalVotes.set(vote.proposalId, existing);
    }

    // Convert to array
    return Array.from(proposalVotes.entries())
      .slice(0, 5) // Last 5 proposals
      .map(([id, votes]) => ({
        name: `#${id.slice(-4)}`,
        for: votes.for,
        against: votes.against,
      }));
  }, [voteRecords]);

  const stats = [
    {
      label: "Delegation Rate",
      value: `${delegationRate.toFixed(1)}%`,
      icon: Users,
      color: "text-indigo-400",
    },
    {
      label: "Total Votes Cast",
      value: totalVotesCast.toString(),
      icon: Vote,
      color: "text-emerald-400",
    },
    {
      label: "Unique Voters",
      value: uniqueVoters.toString(),
      icon: Users,
      color: "text-purple-400",
    },
    {
      label: "Avg. Votes/Proposal",
      value: avgVotesPerProposal.toFixed(1),
      icon: TrendingUp,
      color: "text-amber-400",
    },
  ];

  if (isLoading) {
    return (
      <Card variant="glass">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-indigo-400" />
          <span>Voting Analytics</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl bg-black/20 p-3 text-center"
            >
              <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Voting Power Distribution - Pie Chart */}
          <div>
            <p className="text-sm font-medium text-gray-400 mb-3">
              Voting Power Distribution
            </p>
            {pieData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      formatter={(value) => (
                        <span className="text-xs text-gray-400">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center bg-white/5 rounded-xl">
                <p className="text-sm text-gray-500">No delegation data yet</p>
              </div>
            )}
          </div>

          {/* Votes by Proposal - Bar Chart */}
          <div>
            <p className="text-sm font-medium text-gray-400 mb-3">
              Votes by Proposal
            </p>
            {barData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                      axisLine={{ stroke: "#374151" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                      axisLine={{ stroke: "#374151" }}
                      tickLine={false}
                    />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="for" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="against" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center bg-white/5 rounded-xl">
                <p className="text-sm text-gray-500">No voting data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Delegates List */}
        {topDelegates.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-400 mb-3">
              Top Delegates
            </p>
            <div className="space-y-2">
              {topDelegates.slice(0, 5).map((delegate, i) => (
                <motion.div
                  key={delegate.address}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i] }}
                    />
                    <span className="text-sm text-white font-mono">
                      {delegate.displayName || delegate.addressFormatted}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-white font-medium">
                      {delegate.votingPowerFormatted}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({delegate.votingPowerPercent.toFixed(1)}%)
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
