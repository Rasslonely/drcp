"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useTVLHistory, TimeRange } from "@/hooks/useTVLHistory";

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string; tvlFormatted: string; deposits: number } }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-gray-900/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="text-xs text-gray-400 mb-1">{data.date}</p>
      <p className="text-lg font-bold text-white">{data.tvlFormatted}</p>
      {data.deposits > 0 && (
        <p className="text-xs text-emerald-400 mt-1">+{data.deposits} deposit{data.deposits > 1 ? "s" : ""}</p>
      )}
    </div>
  );
}

export function RealtimeChart() {
  const {
    data,
    stats,
    timeRange,
    setTimeRange,
    timeRanges,
    isLoading,
    refresh,
    lastUpdated,
  } = useTVLHistory("7d");

  // Format relative time for last updated
  const formatLastUpdated = () => {
    const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  // Time range buttons
  const timeRangeButtons: TimeRange[] = ["24h", "7d", "30d", "all"];

  return (
    <Card variant="gradient">
      <CardHeader>
        <CardTitle className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center">
              📈 Total Value Locked
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin text-gray-500" />}
            </span>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-white/5 p-1">
              {timeRangeButtons.map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    timeRange === range
                      ? "bg-indigo-500 text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Row - Flex justify-between on desktop, grid on mobile */}
        <div className="flex flex-wrap justify-between gap-y-4 gap-x-2 sm:gap-x-0">
          {/* Current TVL */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-[48%] sm:w-auto sm:flex-1"
          >
            <p className="text-xs text-gray-400 mb-1">Current TVL</p>
            <p className="text-xl sm:text-2xl font-bold text-white">{stats.currentTVLFormatted}</p>
          </motion.div>

          {/* 24h Change */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="w-[48%] sm:w-auto sm:flex-1 sm:text-center"
          >
            <p className="text-xs text-gray-400 mb-1">24h Change</p>
            <div className="flex items-center gap-1 sm:justify-center">
              {stats.change24h >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <span
                className={`text-lg font-bold ${
                  stats.change24h >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {stats.change24h >= 0 ? "+" : ""}
                {stats.change24hPercent.toFixed(1)}%
              </span>
            </div>
          </motion.div>

          {/* Peak TVL */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-[48%] sm:w-auto sm:flex-1 sm:text-center"
          >
            <p className="text-xs text-gray-400 mb-1">Peak TVL</p>
            <p className="text-lg font-bold text-purple-400">{stats.peakTVLFormatted}</p>
          </motion.div>

          {/* Total Deposits */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="w-[48%] sm:w-auto sm:flex-1 sm:text-right"
          >
            <p className="text-xs text-gray-400 mb-1">Total Deposits</p>
            <p className="text-lg font-bold text-blue-400">{stats.totalDeposits}</p>
          </motion.div>
        </div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="h-[200px] sm:h-[250px] w-full"
        >
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              <div className="text-center">
                <p>No deposit data available</p>
                <p className="text-sm mt-1">Make a donation to see the chart!</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                <XAxis
                  dataKey="dateLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  tickFormatter={(value) =>
                    value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`
                  }
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="tvl"
                  stroke="url(#strokeGradient)"
                  strokeWidth={2}
                  fill="url(#tvlGradient)"
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Footer with refresh */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live data • Updated {formatLastUpdated()}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="h-7 px-2 text-xs text-gray-400 hover:text-white"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
