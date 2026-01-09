"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Vote,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserPlus,
  AlertCircle,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useDelegation,
  useDelegate,
  useTopDelegates,
} from "@/hooks/useDelegation";
import { DelegateCardCompact } from "./delegate-card";
import { DelegateRegisterModal } from "./delegate-register-modal";
import { useAccount } from "wagmi";

interface DelegationPanelProps {
  className?: string;
}

export function DelegationPanel({ className }: DelegationPanelProps) {
  const { isConnected, address } = useAccount();
  const {
    currentDelegate,
    votingPower,
    votingPowerFormatted,
    tokenBalance,
    tokenBalanceFormatted,
    isDelegatedToSelf,
    isNotDelegated,
    isLoading: loadingDelegation,
    refetch: refetchDelegation,
  } = useDelegation();

  const {
    delegate,
    delegateToSelf,
    isPending: isDelegating,
    isSuccess: delegationSuccess,
  } = useDelegate();

  const {
    delegates: topDelegates,
    delegationRate,
    isLoading: loadingDelegates,
    refetch: refetchTopDelegates,
  } = useTopDelegates(10, address, votingPower);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [customAddress, setCustomAddress] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const handleModalClose = () => {
    setShowRegisterModal(false);
    // Force immediate refetch to show newly registered profile
    refetchTopDelegates();
    refetchDelegation();
  };

  // Carousel logic
  // We'll use a refined approach: 
  // On mobile, we show a native-like scroll experience
  // On desktop, we use the controlled carousel
  const scrollLeft = () => {
    if (carouselIndex > 0) setCarouselIndex((i) => i - 1);
  };

  const scrollRight = () => {
    if (carouselIndex < topDelegates.length - 1) setCarouselIndex((i) => i + 1);
  };

  // Handle custom delegation
  const handleCustomDelegate = () => {
    if (customAddress && customAddress.startsWith("0x") && customAddress.length === 42) {
      delegate(customAddress as `0x${string}`);
      setCustomAddress("");
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <Card variant="glass" className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Vote className="h-5 w-5 text-indigo-400" />
            <span>Delegation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-3 py-6 text-gray-400">
            <AlertCircle className="h-5 w-5" />
            <span>Connect wallet to manage delegation</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card variant="glass" className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Vote className="h-5 w-5 text-indigo-400" />
              <span>Delegation</span>
              {(loadingDelegation || loadingDelegates) && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              )}
            </span>
            <span className="text-sm text-gray-400 font-normal">
              {delegationRate.toFixed(1)}% supply delegated
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Status */}
          <div
            className={cn(
              "rounded-xl p-4 border",
              isNotDelegated
                ? "bg-yellow-500/10 border-yellow-500/30"
                : isDelegatedToSelf
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-indigo-500/10 border-indigo-500/30"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <UserPlus className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Your Status</p>
                  <div className="text-base sm:text-lg font-bold text-white">
                    {loadingDelegation ? (
                      <Skeleton className="h-6 w-36" />
                    ) : isNotDelegated ? (
                      <span className="text-yellow-400 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" /> Not Delegated
                      </span>
                    ) : isDelegatedToSelf ? (
                      <span className="text-emerald-400">✓ Self-Delegated</span>
                    ) : (
                      <span className="text-indigo-400 truncate max-w-[150px] inline-block">
                        Delegated to {currentDelegate?.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                <p className="text-sm text-gray-400">Voting Power</p>
                <p className="text-lg font-bold text-white whitespace-nowrap">
                  {votingPowerFormatted} RESCUE
                </p>
                {tokenBalance > votingPower && (
                  <p className="text-xs text-gray-500">
                    ({tokenBalanceFormatted} in wallet)
                  </p>
                )}
              </div>
            </div>

            {/* Self-delegate CTA if not delegated */}
            {isNotDelegated && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 pt-4 border-t border-yellow-500/20"
              >
                <p className="text-sm text-yellow-400 mb-3">
                  💡 Delegate to yourself to activate voting power
                </p>
                <Button
                  variant="primary"
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  onClick={delegateToSelf}
                  disabled={isDelegating}
                >
                  {isDelegating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  {isDelegating ? "Delegating..." : "Delegate to Self"}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Top Delegates Carousel / Grid */}
          {topDelegates.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-400">
                  Or delegate to a trusted community member:
                </p>
                <div className="hidden sm:flex space-x-1">
                  <button
                    onClick={scrollLeft}
                    disabled={carouselIndex === 0}
                    className={cn(
                      "p-1 rounded transition-colors",
                      carouselIndex > 0
                        ? "hover:bg-white/10 text-gray-400"
                        : "text-gray-700 cursor-not-allowed"
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={scrollRight}
                    disabled={carouselIndex >= topDelegates.length - 1}
                    className={cn(
                      "p-1 rounded transition-colors",
                      carouselIndex < topDelegates.length - 1
                        ? "hover:bg-white/10 text-gray-400"
                        : "text-gray-700 cursor-not-allowed"
                    )}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Native scroll on mobile, animated on desktop */}
              <div className="overflow-x-auto sm:overflow-hidden no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                <motion.div
                  className="flex space-x-3 w-max sm:w-auto"
                  animate={{ x: typeof window !== "undefined" && window.innerWidth < 640 ? 0 : -carouselIndex * 148 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {topDelegates.map((del) => (
                    <div key={del.address} className="min-w-[140px] sm:min-w-0">
                      <DelegateCardCompact
                        delegate={del}
                        onDelegate={delegate}
                        isCurrentDelegate={
                          currentDelegate?.toLowerCase() === del.address.toLowerCase()
                        }
                        isPending={isDelegating}
                      />
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          )}

          {/* Empty state for no delegates */}
          {!loadingDelegates && topDelegates.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/20 p-6 text-center">
              <Vote className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <p className="text-gray-400 text-sm">
                No delegates found yet. Be the first to register!
              </p>
            </div>
          )}

          {/* Custom Delegate Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="Enter address (0x...)"
              className="flex-1 rounded-lg bg-black/30 border border-white/10 px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none font-mono"
            />
            <Button
              variant="secondary"
              onClick={handleCustomDelegate}
              disabled={
                !customAddress ||
                customAddress.length !== 42 ||
                isDelegating
              }
            >
              {isDelegating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delegate"
              )}
            </Button>
          </div>

          {/* Register as Delegate */}
          <div className="pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              className="w-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
              onClick={() => setShowRegisterModal(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Register as Delegate
            </Button>
          </div>

          {/* Success feedback */}
          <AnimatePresence>
            {delegationSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 p-3 text-center"
              >
                <p className="text-sm text-emerald-400">
                  ✓ Delegation successful! Your voting power is now active.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Register Modal */}
      <DelegateRegisterModal
        isOpen={showRegisterModal}
        onClose={handleModalClose}
      />
    </>
  );
}
