"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDisasterData } from "@/hooks";
import { useRouter } from "next/navigation";

/**
 * AutoCampaignBanner
 * 
 * An intelligence-driven UI component that monitors disaster telemetry for
 * critical events and proactively suggests campaign creation to administrators.
 */
export function AutoCampaignBanner() {
  const router = useRouter();
  const { events, isLoading } = useDisasterData();
  const [isDismissed, setIsDismissed] = useState(false);

  // Identify the most severe active disaster requiring attention
  // Trigger threshold: Active event with >= 85% severity
  const criticalEvent = useMemo(() => {
    if (isLoading || !events.length) return null;
    
    return events
      .filter(e => e.isActive && e.severity >= 85)
      .sort((a, b) => b.severity - a.severity)[0];
  }, [events, isLoading]);

  if (!criticalEvent || isDismissed) return null;

  const handleLaunch = () => {
    // Generate intelligent defaults for the campaign
    const name = `Tanggap Darurat: ${criticalEvent.type} ${criticalEvent.location}`;
    const desc = `Inisiatif bantuan darurat terverifikasi untuk korban ${criticalEvent.type} di ${criticalEvent.location}. Deteksi sistem menunjukkan tingkat resiko dampak ${criticalEvent.severity}%.`;
    const loc = criticalEvent.location;
    const target = "10000"; // Suggest higher initial target for critical events

    const params = new URLSearchParams({ name, desc, loc, target });
    router.push(`/admin/campaigns?${params.toString()}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
        animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
        className="overflow-hidden"
      >
        <div className="relative">
          {/* Backdrop Glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 animate-pulse blur-2xl opacity-30" />
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-[#0C0C0E]/80 backdrop-blur-3xl border border-red-500/20 shadow-2xl group overflow-hidden">
            
            {/* Decorative Scanning Line Effect */}
            <motion.div 
              className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-20"
              animate={{ translateX: ["-100%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            {/* Intel Content */}
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <BrainCircuit className="h-7 w-7 text-red-500 animate-pulse" />
                </div>
                {/* Status Indicator */}
                <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-[#0C0C0E] shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                   <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                      <div className="h-1 w-1 rounded-full bg-red-500 animate-ping" />
                      <span className="text-[9px] font-black text-red-400 uppercase tracking-[0.1em]">AI Intel Alert</span>
                   </span>
                   <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">Space-Based Monitoring</span>
                </div>
                <p className="text-base font-bold text-white leading-tight">
                  Critical <span className="text-red-400">{criticalEvent.type}</span> detected in <span className="text-white underline decoration-red-500/30 underline-offset-4">{criticalEvent.location}</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed max-w-xl">
                  Satellite analysis confirms <span className="text-white font-mono font-bold">{criticalEvent.severity}%</span> impact risk.
                  Our AI suggests immediate campaign initialization to mitigate resource shortage.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button 
                onClick={handleLaunch}
                className="flex-1 md:flex-none h-11 px-6 bg-gradient-to-r from-red-600 to-orange-700 hover:from-red-500 hover:to-orange-600 text-white font-bold border-none shadow-[0_4px_20px_rgba(239,68,68,0.25)] group/btn transition-all active:scale-[0.98]"
              >
                Initialize Campaign
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
              
              <button 
                onClick={() => setIsDismissed(true)}
                className="p-3 rounded-xl bg-white/5 border border-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                title="Dismiss Alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
