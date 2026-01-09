"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, MapPin, Clock, ArrowRight, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useDisasterData } from "@/hooks/useDisasterData";
import {
  DisasterEvent,
  getDisasterEmoji,
  getSeverityLabel,
  formatTimeAgo,
  AlertLevel,
} from "@/lib/disaster-sources";

// =============================================================================
// COMPACT EMERGENCY CARD (for landing page)
// =============================================================================

interface CompactEmergencyCardProps {
  event: DisasterEvent;
  index: number;
}

function CompactEmergencyCard({ event, index }: CompactEmergencyCardProps) {
  const severityColor =
    event.severity >= 80
      ? "border-red-500/50 bg-red-500/5"
      : event.severity >= 60
      ? "border-orange-500/50 bg-orange-500/5"
      : event.severity >= 40
      ? "border-yellow-500/50 bg-yellow-500/5"
      : "border-green-500/50 bg-green-500/5";

  const alertColor =
    event.alertLevel === AlertLevel.RED
      ? "bg-red-500"
      : event.alertLevel === AlertLevel.ORANGE
      ? "bg-orange-500"
      : "bg-green-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`border ${severityColor} overflow-hidden`}>
        {/* Alert level indicator */}
        <div className={`h-1 ${alertColor}`} />
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            {/* Left: Type and Location */}
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getDisasterEmoji(event.type)}</span>
              <div>
                <h4 className="font-semibold text-white text-sm">
                  {event.type}
                  {event.details.magnitude && (
                    <span className="ml-1 text-gray-400">
                      M{event.details.magnitude.toFixed(1)}
                    </span>
                  )}
                </h4>
                <div className="flex items-center text-xs text-gray-400 mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span className="truncate max-w-[150px]">{event.location}</span>
                </div>
              </div>
            </div>

            {/* Right: Severity */}
            <div className="text-right">
              <div className="text-lg font-bold text-white">
                {event.severity}%
              </div>
              <div className="text-xs text-gray-500">
                {getSeverityLabel(event.severity)}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(event.timestamp)}
              {event.isActive && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-400 animate-pulse">
                  ACTIVE
                </span>
              )}
            </div>
            {event.region && (
              <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                {event.region.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =============================================================================
// EMERGENCY PREVIEW SECTION
// =============================================================================

export function EmergencyPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const { events, isLoading, stats } = useDisasterData({
    initialFilter: {
      indonesiaOnly: true,
      limit: 3,
    },
    autoRefresh: true,
    refreshInterval: 120000, // 2 minutes
  });

  // Take only first 3 events
  const previewEvents = events.slice(0, 3);

  return (
    <section
      ref={ref}
      className="py-24 px-4"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400 font-medium">Live Monitoring</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Active Emergencies
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Real-time disaster data from BMKG, GDACS, and USGS
          </p>
        </motion.div>

        {/* Stats Bar */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-500">Total Events</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="text-2xl font-bold text-red-400">{stats.byAlertLevel.RED || 0}</div>
              <div className="text-xs text-gray-500">Critical</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
              <div className="text-2xl font-bold text-orange-400">{stats.active}</div>
              <div className="text-xs text-gray-500">Active Now</div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && previewEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-4" />
            <p className="text-gray-500">Fetching live disaster data...</p>
          </div>
        )}

        {/* Emergency Cards Grid */}
        {previewEvents.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {previewEvents.map((event, index) => (
              <CompactEmergencyCard
                key={event.id}
                event={event}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && previewEvents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <p>No active emergencies in Indonesia</p>
          </div>
        )}

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Link href="/emergencies">
            <Button
              variant="secondary"
              size="lg"
              className="border-white/20 text-white hover:bg-white/10"
            >
              View All Emergencies
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
