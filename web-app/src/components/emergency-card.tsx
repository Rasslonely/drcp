"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  MapPin,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  ExternalLink,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DisasterEvent,
  DisasterType,
  AlertLevel,
  getDisasterEmoji,
  getSeverityLabel,
  formatTimeAgo,
  DataSourceType,
} from "@/lib/disaster-sources";
import { useDisasterData } from "@/hooks/useDisasterData";
import {
  DisasterFilters,
  FilterPresets,
} from "@/components/disaster-filters";

// =============================================================================
// SEVERITY HELPERS
// =============================================================================

function getSeverityColor(severity: number) {
  if (severity >= 80) return "text-red-500 bg-red-500/10 border-red-500/50";
  if (severity >= 60) return "text-orange-500 bg-orange-500/10 border-orange-500/50";
  if (severity >= 40) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/50";
  return "text-green-500 bg-green-500/10 border-green-500/50";
}

function getAlertLevelColor(level: AlertLevel) {
  switch (level) {
    case AlertLevel.RED:
      return "bg-red-500";
    case AlertLevel.ORANGE:
      return "bg-orange-500";
    case AlertLevel.GREEN:
      return "bg-green-500";
  }
}

function getSourceBadge(source: DataSourceType) {
  const badges: Record<DataSourceType, { label: string; color: string }> = {
    [DataSourceType.GDACS]: { label: "GDACS", color: "bg-blue-500/20 text-blue-400" },
    [DataSourceType.BMKG]: { label: "BMKG", color: "bg-red-500/20 text-red-400" },
    [DataSourceType.USGS]: { label: "USGS", color: "bg-purple-500/20 text-purple-400" },
    [DataSourceType.AI_ENGINE]: { label: "AI", color: "bg-emerald-500/20 text-emerald-400" },
    [DataSourceType.PETABENCANA]: { label: "PetaBencana", color: "bg-cyan-500/20 text-cyan-400" },
    [DataSourceType.OPENMETEO]: { label: "Weather", color: "bg-amber-500/20 text-amber-400" },
  };
  return badges[source] || { label: source, color: "bg-gray-500/20 text-gray-400" };
}

// =============================================================================
// EMERGENCY CARD COMPONENT
// =============================================================================

interface EmergencyCardProps {
  event: DisasterEvent;
  compact?: boolean;
}

export function EmergencyCard({ event, compact = false }: EmergencyCardProps) {
  const severityColor = getSeverityColor(event.severity);
  const sourceBadge = getSourceBadge(event.source);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant="glass" className="relative overflow-hidden">
        {/* Alert level indicator */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-1",
            getAlertLevelColor(event.alertLevel)
          )}
        />

        <CardContent className={cn("pt-5", compact ? "pb-3" : "pb-4")}>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getDisasterEmoji(event.type)}</span>
              <div>
                <h3 className="font-semibold text-white">{event.type}</h3>
                <div className="flex items-center text-sm text-gray-400">
                  <MapPin className="mr-1 h-3 w-3" />
                  {event.location}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div
                className={cn(
                  "rounded-lg border px-2 py-1 text-xs font-bold",
                  severityColor
                )}
              >
                {event.severity}% {getSeverityLabel(event.severity)}
              </div>
              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", sourceBadge.color)}>
                {sourceBadge.label}
              </span>
            </div>
          </div>

          {/* Details */}
          {!compact && (
            <div className="mt-3 space-y-2">
              {/* Earthquake magnitude */}
              {event.type === DisasterType.EARTHQUAKE && event.details.magnitude && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Magnitude</span>
                  <span className="text-white font-medium">
                    M{event.details.magnitude.toFixed(1)}
                    {event.details.depth && ` • ${event.details.depth}km depth`}
                  </span>
                </div>
              )}

              {/* Affected people */}
              {event.details.affectedPeople && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Affected</span>
                  <span className="text-white">
                    {event.details.affectedPeople.toLocaleString()} people
                  </span>
                </div>
              )}

              {/* Factors */}
              {event.details.factors && event.details.factors.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {event.details.factors.slice(0, 3).map((factor) => (
                    <span
                      key={factor}
                      className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-gray-400"
                    >
                      {factor.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {event.isActive && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 animate-pulse">
                  ACTIVE
                </span>
              )}
              {event.region && (
                <span className="px-2 py-0.5 rounded text-xs bg-white/5 text-gray-400">
                  {event.region.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(event.timestamp)}
              {event.sourceUrl && (
                <a
                  href={event.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =============================================================================
// SOURCE STATUS INDICATOR
// =============================================================================

interface SourceStatusProps {
  sources: DataSourceType[];
  errors: { source: DataSourceType; error: string }[];
  isStale?: boolean;
}

function SourceStatus({ sources, errors, isStale }: SourceStatusProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const hasErrors = errors.length > 0;
  const allOnline = errors.length === 0 && sources.length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={cn(
          "flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-medium transition-colors",
          isStale
            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            : allOnline
            ? "bg-emerald-500/20 text-emerald-400"
            : hasErrors
            ? "bg-yellow-500/20 text-yellow-400"
            : "bg-gray-500/20 text-gray-400"
        )}
      >
        {isStale ? (
          <Clock className="h-3 w-3" />
        ) : allOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        <span>
          {isStale ? "STALE DATA" : `${sources.length} SOURCES`}
          {hasErrors && ` (${errors.length} ERR)`}
        </span>
      </button>

      {showDetails && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDetails(false)} 
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 top-full mt-2 w-64 z-50 rounded-xl border border-white/10 bg-[#0A0A0B] p-3 shadow-2xl overflow-hidden"
          >
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Source Health Logs
            </div>
            <div className="space-y-2">
              {sources.map(source => {
                const error = errors.find(e => e.source === source);
                return (
                  <div key={source} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-300 font-medium">{source}</span>
                      {error ? (
                        <span className="text-red-400 flex items-center">
                          <WifiOff className="h-2 w-2 mr-1" /> Offline
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center">
                          <Wifi className="h-2 w-2 mr-1" /> Online
                        </span>
                      )}
                    </div>
                    {error && (
                      <div className="text-[10px] text-gray-500 bg-red-500/5 p-1.5 rounded leading-tight">
                        {error.error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// ACTIVE EMERGENCIES COMPONENT
// =============================================================================

export function ActiveEmergencies() {
  const {
    events,
    isLoading,
    error,
    lastUpdated,
    stats,
    sources,
    sourceErrors,
    activeEvents,
    criticalEvents,
    refetch,
    filters,
    isStale,
  } = useDisasterData();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
          Active Emergencies
          {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin text-gray-400" />}
        </h2>
        <div className="flex items-center space-x-3">
          <SourceStatus sources={sources} errors={sourceErrors} isStale={isStale} />
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="rounded-lg bg-red-500/10 p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.byAlertLevel.RED}</div>
            <div className="text-xs text-gray-500">Critical</div>
          </div>
          <div className="rounded-lg bg-orange-500/10 p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{stats.byAlertLevel.ORANGE}</div>
            <div className="text-xs text-gray-500">High</div>
          </div>
          <div className="rounded-lg bg-green-500/10 p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.active}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <DisasterFilters
        state={filters.state}
        actions={filters.actions}
        hasActiveFilters={filters.hasActiveFilters}
        activeFilterCount={filters.activeFilterCount}
      />

      {/* Quick Presets */}
      <FilterPresets
        onApply={filters.actions.applyPreset}
        currentIndonesiaOnly={filters.state.indonesiaOnly}
      />

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
          <p className="text-red-400 text-sm">
            Failed to fetch disaster data: {error.message}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            className="mt-2 text-red-400"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400 mb-4" />
          <p className="text-gray-500">Fetching disaster data from GDACS, BMKG, USGS...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && events.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-medium">No disasters found</p>
          <p className="text-sm mt-1 mb-4">
            {filters.hasActiveFilters
              ? "Try adjusting your filters"
              : "No active disasters in the selected region"}
          </p>
          {filters.hasActiveFilters && (
            <Button
              variant="secondary"
              size="sm"
              onClick={filters.actions.resetFilters}
            >
              Reset Filters
            </Button>
          )}
        </div>
      )}

      {/* Event List */}
      <div className="space-y-3">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <EmergencyCard event={event} />
          </motion.div>
        ))}
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <p className="text-xs text-gray-500 text-center">
          Last updated: {lastUpdated.toLocaleString()} • Auto-refresh every 2 min
        </p>
      )}
    </div>
  );
}

// =============================================================================
// COMPACT EMERGENCY LIST
// =============================================================================

interface EmergencyListProps {
  events: DisasterEvent[];
  title?: string;
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export function EmergencyList({
  events,
  title = "Recent Emergencies",
  maxItems = 5,
  showViewAll = true,
  onViewAll,
}: EmergencyListProps) {
  const displayEvents = events.slice(0, maxItems);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        {showViewAll && events.length > maxItems && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary hover:underline"
          >
            View all ({events.length})
          </button>
        )}
      </div>
      <div className="space-y-2">
        {displayEvents.map((event) => (
          <EmergencyCard key={event.id} event={event} compact />
        ))}
      </div>
    </div>
  );
}
