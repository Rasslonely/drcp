"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Zap, Heart, Coffee, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";
import { DonationModal } from "@/components/donation-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrDonation } from "@/components/wallet/qr-donation";
import { FiatOnramp } from "@/components/wallet/fiat-onramp";
import { LoginOptions } from "@/components/wallet/login-options";
import { QrisDisplay } from "@/components/wallet/qris-display";
import { useCreatorDonate } from "@/hooks";

const PRESET_AMOUNTS = [25, 50, 100, 250];

export function QuickDonate() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const { isConnected } = useAccount();
  const [method, setMethod] = useState<"wallet" | "other">("wallet");
  const [donationType, setDonationType] = useState<"relief" | "creator">("relief");
  
  // Creator wallet donation (direct transfer, no tracking)
  const { donate: donateToCreator, isPending, isSuccess } = useCreatorDonate();

  const displayAmount = customAmount || selectedAmount;

  const handleCreatorDonate = () => {
    if (!displayAmount) return;
    donateToCreator(displayAmount.toString());
  };

  return (
    <Card variant="gradient" className="relative overflow-hidden h-full flex flex-col">
      {/* Animated background gradient */}
      <div className={cn(
        "absolute inset-0 animate-pulse",
        donationType === "relief" 
          ? "bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10"
          : "bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10"
      )} />

      <CardHeader className="relative pb-2">
        {/* Donation Type Toggle */}
        <div className="flex bg-black/30 rounded-xl p-1 mb-4">
          <button
            onClick={() => setDonationType("relief")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all",
              donationType === "relief" 
                ? "bg-indigo-500/30 text-white" 
                : "text-gray-400 hover:text-white"
            )}
          >
            <AlertCircle className="h-4 w-4" />
            Disaster Relief
          </button>
          <button
            onClick={() => setDonationType("creator")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all",
              donationType === "creator" 
                ? "bg-amber-500/30 text-white" 
                : "text-gray-400 hover:text-white"
            )}
          >
            <Coffee className="h-4 w-4" />
            Support Creator
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center space-x-2">
            {donationType === "relief" ? (
              <>
                <Heart className="h-5 w-5 text-indigo-500" />
                <span>Quick Donate</span>
              </>
            ) : (
              <>
                <Coffee className="h-5 w-5 text-amber-500" />
                <span>Buy Me a Coffee</span>
              </>
            )}
          </CardTitle>
          {donationType === "relief" && (
            <div className="flex bg-black/20 rounded-lg p-1">
              <button
                onClick={() => setMethod("wallet")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  method === "wallet" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                )}
              >
                Wallet
              </button>
              <button
                onClick={() => setMethod("other")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  method === "other" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
                )}
              >
                Other
              </button>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-400">
          {donationType === "relief"
            ? (method === "wallet" 
                ? "100% goes to disaster victims instantly" 
                : "Donate via Exchange or Credit Card")
            : "Support the person behind DRCP ☕"
          }
        </p>
      </CardHeader>

      <CardContent className="relative space-y-6 flex-1 overflow-auto custom-scrollbar">
        {/* DISASTER RELIEF FLOW */}
        {donationType === "relief" && method === "wallet" && (
          <>
            {/* Preset amounts */}
            <div className="grid grid-cols-4 gap-3">
              {PRESET_AMOUNTS.map((amount) => (
                <motion.button
                  key={amount}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl py-4 px-2 border transition-all",
                    selectedAmount === amount && !customAmount
                      ? "border-indigo-500 bg-indigo-500/20 text-white"
                      : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                  )}
                >
                  <span className="text-xl font-bold">${amount}</span>
                </motion.button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <DonationModal initialAmount={displayAmount?.toString()}>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!isConnected || (!selectedAmount && !customAmount)}
              >
                {!isConnected ? (
                  "Connect Wallet to Donate"
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Donate {displayAmount ? `$${displayAmount}` : ""} USDC
                  </>
                )}
              </Button>
            </DonationModal>

            <p className="text-center text-xs text-gray-500">
              100% of donations go directly to disaster relief. Tracked on-chain.
            </p>
          </>
        )}

        {/* OTHER METHODS (QR/Fiat) */}
        {donationType === "relief" && method === "other" && (
          <div className="space-y-6">
            <Tabs defaultValue="qr" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/20 mb-4">
                <TabsTrigger value="qr">QR Code</TabsTrigger>
                <TabsTrigger value="fiat">Buy Crypto</TabsTrigger>
              </TabsList>
              <TabsContent value="qr" className="mt-0">
                <QrDonation />
              </TabsContent>
              <TabsContent value="fiat" className="mt-0">
                <FiatOnramp />
              </TabsContent>
            </Tabs>
            
            <div className="pt-4 border-t border-white/5">
              <LoginOptions />
            </div>
          </div>
        )}

        {/* SUPPORT CREATOR FLOW */}
        {donationType === "creator" && (
          <Tabs defaultValue="crypto" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/20 mb-4">
              <TabsTrigger value="crypto">💎 Crypto</TabsTrigger>
              <TabsTrigger value="qris">🏦 QRIS / Bank</TabsTrigger>
            </TabsList>

            {/* Crypto Tab */}
            <TabsContent value="crypto" className="mt-0 space-y-4">
              {/* Info banner */}
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
                <p className="text-xs text-amber-300">
                  ☕ This supports me personally, not disaster relief.
                  Used at my discretion. Thank you! 🙏
                </p>
              </div>

              {/* Preset amounts */}
              <div className="grid grid-cols-4 gap-3">
                {PRESET_AMOUNTS.map((amount) => (
                  <motion.button
                    key={amount}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount("");
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl py-4 px-2 border transition-all",
                      selectedAmount === amount && !customAmount
                        ? "border-amber-500 bg-amber-500/20 text-white"
                        : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                    )}
                  >
                    <span className="text-xl font-bold">${amount}</span>
                  </motion.button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/25"
                disabled={!isConnected || (!selectedAmount && !customAmount) || isPending}
                onClick={handleCreatorDonate}
              >
                {!isConnected ? (
                  "Connect Wallet"
                ) : isPending ? (
                  "Processing..."
                ) : isSuccess ? (
                  "Thank You! ☕💕"
                ) : (
                  <>
                    <Coffee className="mr-2 h-5 w-5" />
                    Send {displayAmount ? `$${displayAmount}` : ""} USDC
                  </>
                )}
              </Button>
            </TabsContent>

            {/* QRIS Tab */}
            <TabsContent value="qris" className="mt-0 space-y-4">
              <QrisDisplay />

              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
                <p className="text-xs text-amber-300 text-center">
                  ☕ This supports me personally. Thank you for your kindness! 🙏
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
