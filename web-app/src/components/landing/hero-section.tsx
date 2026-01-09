"use client";

import { motion } from "framer-motion";
import { ArrowDown, Zap, Shield, Globe, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { getShortChainName } from "@/lib/chain-utils";

export function HeroSection() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const handleDonateClick = () => {
    if (isConnected) {
      window.location.href = "/dashboard";
    } else {
      openConnectModal?.();
    }
  };

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden py-16">
      {/* Animated Background - constrained to prevent overflow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 max-w-[80vw] max-h-[80vw] bg-indigo-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-56 sm:w-72 md:w-80 h-56 sm:h-72 md:h-80 max-w-[70vw] max-h-[70vw] bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 w-48 sm:w-56 md:w-64 h-48 sm:h-56 md:h-64 max-w-[60vw] max-h-[60vw] bg-cyan-500/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex-1 flex flex-col justify-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 mx-auto"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-gray-300">Live on {getShortChainName()} • Real-Time Monitoring</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight"
        >
          <span className="text-white">Disaster Relief</span>
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            on Blockchain
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto"
        >
          100% transparent disaster relief. Every Rupiah tracked on-chain
          and distributed directly to verified relief efforts.
        </motion.p>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-10"
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>Smart Contract Secured</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span>AI-Powered Detection</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
            <Globe className="h-4 w-4 text-blue-400" />
            <span>Indonesia Focus</span>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Button
            size="lg"
            onClick={handleDonateClick}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-xl shadow-lg shadow-indigo-500/25"
          >
            {isConnected ? "Go to Dashboard" : "Connect Wallet to Donate"}
          </Button>
          <Link href="#how-it-works" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full border-white/20 text-white hover:bg-white/10 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-xl"
            >
              See How It Works
              <ArrowDown className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>

        {/* Support Creator Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8"
        >
          <Link
            href="/support"
            className="inline-flex items-center gap-2 text-sm text-amber-400/70 hover:text-amber-400 transition-colors"
          >
            <Coffee className="h-4 w-4" />
            <span>Support the Creator ☕</span>
          </Link>
        </motion.div>
      </div>

      {/* Scroll Indicator - Now part of content flow, not absolute */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-auto pt-8 pb-4"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-gray-500"
        >
          <span className="text-xs">Scroll to explore</span>
          <ArrowDown className="h-4 w-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
