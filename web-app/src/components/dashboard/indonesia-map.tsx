"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { useDisasterData } from "@/hooks";
import { Activity, ShieldCheck } from "lucide-react";

// Dynamic import for Leaflet because it requires 'window'
const LeafletMapInner = dynamic(() => import("./leaflet-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#030712] flex flex-col items-center justify-center gap-4 border border-white/5">
      <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">
        Calibrating Satellite Mesh
      </span>
    </div>
  ),
});

export function IndonesiaMap() {
  const { events, isLoading } = useDisasterData({
    initialFilter: { limit: 100 }
  });

  return (
    <Card variant="glass" className="overflow-hidden border-white/5 group bg-black/20">
      <CardContent className="p-0 relative h-[450px]">
        
        {/* Modern Command Header Overlay */}
        <div className="absolute top-6 left-6 z-[2000] pointer-events-none">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <Activity className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Intelligence Feed</h3>
              </div>
              <p className="text-sm font-bold text-white tracking-tight">Global DRCP Monitor</p>
            </div>
          </div>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-6 right-6 z-[2000] hidden md:flex items-center gap-6 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/5 rounded-xl pointer-events-none transition-opacity group-hover:opacity-100">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="text-[9px] font-bold text-gray-400 uppercase">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,146,60,0.5)]" />
            <span className="text-[9px] font-bold text-gray-400 uppercase">Warning</span>
          </div>
          <div className="flex items-center gap-2">
             <ShieldCheck className="h-3 w-3 text-emerald-500" />
             <span className="text-[9px] font-bold text-gray-400 uppercase">Safe Zone</span>
          </div>
        </div>

        {/* The Actual Leaflet Map */}
        <div className="h-full w-full">
           <LeafletMapInner events={events} />
        </div>

        {/* Data Sync Status Overlay */}
        <div className="absolute top-6 right-6 z-[2000] pointer-events-none">
           <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              <span className="text-[9px] font-mono text-gray-300 uppercase">Sync: Online</span>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
