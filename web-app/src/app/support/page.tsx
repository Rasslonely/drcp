"use client";

import { motion } from "framer-motion";
import {
  Heart,
  Coffee,
  Code,
  Gamepad2,
  TrendingUp,
  Wallet,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonValue } from "@/components/ui/skeleton";
import { QuickDonate } from "@/components/quick-donate";
import { useTreasuryBalance } from "@/hooks";

const HONEST_SPENDING = [
  {
    icon: Code,
    label: "Development",
    description: "Building & maintaining DRCP",
    percentage: 40,
    color: "text-purple-400",
  },
  {
    icon: Coffee,
    label: "Living Expenses",
    description: "Food, bills, daily needs",
    percentage: 30,
    color: "text-amber-400",
  },
  {
    icon: TrendingUp,
    label: "Investments",
    description: "Crypto, learning, growth",
    percentage: 20,
    color: "text-emerald-400",
  },
  {
    icon: Gamepad2,
    label: "Personal",
    description: "At my discretion",
    percentage: 10,
    color: "text-rose-400",
  },
];

export default function SupportPage() {
  const {
    currentBalanceFormatted,
    totalDonationsFormatted,
    donorCount,
    userContributionFormatted,
    isLoading,
  } = useTreasuryBalance();

  return (
    <div className="space-y-8">
      {/* Header with Breadcrumb */}
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Support Creator" },
        ]}
        icon={Coffee}
        iconColor="text-amber-400"
        iconBg="bg-amber-500/20"
        title="Support the Creator"
        subtitle="Buy me a coffee ☕ - Your support keeps me building"
      />

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card variant="glass" className="text-center p-4">
          <Wallet className="h-5 w-5 mx-auto text-amber-400 mb-2" />
          <div className="text-2xl font-bold text-white h-8">
            {isLoading ? <SkeletonValue className="mx-auto" /> : `$${currentBalanceFormatted}`}
          </div>
          <p className="text-xs text-gray-500">Current Balance</p>
        </Card>
        <Card variant="glass" className="text-center p-4">
          <TrendingUp className="h-5 w-5 mx-auto text-emerald-400 mb-2" />
          <div className="text-2xl font-bold text-white h-8">
            {isLoading ? <SkeletonValue className="mx-auto" /> : `$${totalDonationsFormatted}`}
          </div>
          <p className="text-xs text-gray-500">Total Received</p>
        </Card>
        <Card variant="glass" className="text-center p-4">
          <Heart className="h-5 w-5 mx-auto text-rose-400 mb-2" />
          <div className="text-2xl font-bold text-white h-8">
            {isLoading ? <SkeletonValue className="mx-auto" /> : donorCount}
          </div>
          <p className="text-xs text-gray-500">Supporters</p>
        </Card>
        <Card variant="glass" className="text-center p-4">
          <Sparkles className="h-5 w-5 mx-auto text-purple-400 mb-2" />
          <div className="text-2xl font-bold text-white h-8">
            {isLoading ? <SkeletonValue className="mx-auto" /> : `$${userContributionFormatted}`}
          </div>
          <p className="text-xs text-gray-500">Your Support</p>
        </Card>
      </motion.div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Info & Spending */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* About Me */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-amber-400" />
                About This
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-400">
              <p>
                Hi! I&apos;m Ras, the solo developer behind DRCP. I built this platform
                to make disaster relief more transparent using blockchain technology.
              </p>
              <p>
                Unlike disaster relief donations (which go 100% to victims), 
                <strong className="text-amber-400"> support here goes directly to me</strong> - 
                to keep building, pay bills, and fuel my coffee addiction. ☕
              </p>
              <p className="text-xs text-gray-500">
                I believe in being transparent about how your support is used.
                No hidden fees, no corporate overhead - just one developer doing their best.
              </p>
            </CardContent>
          </Card>

          {/* Honest Spending Breakdown */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>How I Use Your Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {HONEST_SPENDING.map((category, i) => (
                <motion.div
                  key={category.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 ${category.color}`}>
                    <category.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{category.label}</span>
                      <span className="text-sm text-gray-400">{category.percentage}%</span>
                    </div>
                    <p className="text-xs text-gray-500">{category.description}</p>
                    <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${category.percentage}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Disaster Relief Link */}
          <Card variant="glass" className="p-4 border-indigo-500/30 bg-indigo-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">🆘 Want 100% to go to victims?</p>
                <p className="text-sm text-gray-400">Donate to Disaster Relief instead</p>
              </div>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-indigo-400">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Donate
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Right: Donation Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <QuickDonate />
        </motion.div>
      </div>
    </div>
  );
}
