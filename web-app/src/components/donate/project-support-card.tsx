"use client";

import { motion } from "framer-motion";
import { Heart, Users, Wallet, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTreasuryBalance } from "@/hooks";

interface ProjectSupportCardProps {
  compact?: boolean;
  onDonate?: () => void;
}

export function ProjectSupportCard({ compact = false, onDonate }: ProjectSupportCardProps) {
  const {
    currentBalanceFormatted,
    totalDonationsFormatted,
    donorCount,
    isLoading,
  } = useTreasuryBalance();

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/20">
              <Heart className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Support DRCP</p>
              <p className="text-xs text-gray-400">Keep the platform running</p>
            </div>
          </div>
          {onDonate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDonate}
              className="text-pink-400 hover:bg-pink-500/20"
            >
              Support
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <Card variant="glass" className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10" />
      
      <CardHeader className="relative pb-2">
        <CardTitle className="flex items-center space-x-2">
          <Heart className="h-5 w-5 text-pink-500" />
          <span>Support the Project</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Description */}
        <p className="text-sm text-gray-400">
          Help keep DRCP running. 100% of project support goes to:
        </p>
        
        <ul className="text-xs text-gray-500 space-y-1">
          <li className="flex items-center space-x-2">
            <span className="text-emerald-400">✓</span>
            <span>Server & infrastructure costs</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="text-emerald-400">✓</span>
            <span>Developer salaries</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="text-emerald-400">✓</span>
            <span>Security audits</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="text-emerald-400">✓</span>
            <span>Marketing & growth</span>
          </li>
        </ul>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-lg bg-black/20 p-3 text-center">
            <Wallet className="h-4 w-4 mx-auto text-pink-400 mb-1" />
            {isLoading ? (
              <Loader2 className="h-4 w-4 mx-auto animate-spin text-gray-400" />
            ) : (
              <>
                <p className="text-lg font-bold text-white">${currentBalanceFormatted}</p>
                <p className="text-xs text-gray-500">Treasury Balance</p>
              </>
            )}
          </div>
          <div className="rounded-lg bg-black/20 p-3 text-center">
            <Users className="h-4 w-4 mx-auto text-purple-400 mb-1" />
            {isLoading ? (
              <Loader2 className="h-4 w-4 mx-auto animate-spin text-gray-400" />
            ) : (
              <>
                <p className="text-lg font-bold text-white">{donorCount}</p>
                <p className="text-xs text-gray-500">Supporters</p>
              </>
            )}
          </div>
        </div>

        {/* CTA */}
        {onDonate && (
          <Button
            variant="primary"
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600"
            onClick={onDonate}
          >
            <Heart className="mr-2 h-4 w-4" />
            Support DRCP
          </Button>
        )}

        {/* Transparency link */}
        <p className="text-center text-xs text-gray-500">
          <a
            href="/transparency"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300"
          >
            View spending reports
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
