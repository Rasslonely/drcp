"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Filter,
  ChevronDown,
  RotateCcw,
  MapPin,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DisasterType,
  AlertLevel,
  IndonesiaRegion,
} from "@/lib/disaster-sources";
import {
  useDisasterFilters,
  REGION_DISPLAY,
  TYPE_DISPLAY,
  ALERT_LEVEL_DISPLAY,
  type DisasterFilterState,
  type DisasterFilterActions,
} from "@/hooks/useDisasterFilters";
import { useState } from "react";

// =============================================================================
// FILTER PILL COMPONENT
// =============================================================================

interface FilterPillProps {
  label: string;
  emoji?: string;
  isSelected: boolean;
  onClick: () => void;
  color?: string;
  size?: "sm" | "md";
}

function FilterPill({
  label,
  emoji,
  isSelected,
  onClick,
  color,
  size = "md",
}: FilterPillProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
        isSelected
          ? "border-primary bg-primary/20 text-primary"
          : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
      )}
    >
      {emoji && <span>{emoji}</span>}
      {color && !emoji && (
        <span className={cn("h-2 w-2 rounded-full", color)} />
      )}
      <span>{label}</span>
      {isSelected && (
        <X className="h-3 w-3 opacity-60 hover:opacity-100" />
      )}
    </motion.button>
  );
}

// =============================================================================
// REGION FILTER
// =============================================================================

interface RegionFilterProps {
  selectedRegions: IndonesiaRegion[];
  onToggle: (region: IndonesiaRegion) => void;
  onClear: () => void;
  onSelectAll: () => void;
}

export function RegionFilter({
  selectedRegions,
  onToggle,
  onClear,
  onSelectAll,
}: RegionFilterProps) {
  const regions = Object.values(IndonesiaRegion);
  const allSelected = selectedRegions.length === regions.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Regions
        </span>
        <div className="flex gap-2">
          <button
            onClick={allSelected ? onClear : onSelectAll}
            className="text-xs text-primary hover:underline"
          >
            {allSelected ? "Clear" : "All"}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {regions.map((region) => (
          <FilterPill
            key={region}
            label={REGION_DISPLAY[region].label}
            emoji={REGION_DISPLAY[region].emoji}
            isSelected={selectedRegions.includes(region)}
            onClick={() => onToggle(region)}
            size="sm"
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// DISASTER TYPE FILTER
// =============================================================================

interface TypeFilterProps {
  selectedTypes: DisasterType[];
  onToggle: (type: DisasterType) => void;
  onClear: () => void;
}

export function TypeFilter({
  selectedTypes,
  onToggle,
  onClear,
}: TypeFilterProps) {
  const types = Object.values(DisasterType);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Disaster Type
        </span>
        {selectedTypes.length > 0 && (
          <button onClick={onClear} className="text-xs text-primary hover:underline">
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <FilterPill
            key={type}
            label={TYPE_DISPLAY[type].label}
            emoji={TYPE_DISPLAY[type].emoji}
            isSelected={selectedTypes.includes(type)}
            onClick={() => onToggle(type)}
            size="sm"
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// SEVERITY FILTER
// =============================================================================

interface SeverityFilterProps {
  minSeverity: number;
  showCriticalOnly: boolean;
  onSetMinSeverity: (severity: number) => void;
  onToggleCriticalOnly: () => void;
}

export function SeverityFilter({
  minSeverity,
  showCriticalOnly,
  onSetMinSeverity,
  onToggleCriticalOnly,
}: SeverityFilterProps) {
  const presets = [
    { label: "All", value: 0 },
    { label: "≥40 Moderate", value: 40 },
    { label: "≥60 High", value: 60 },
    { label: "≥80 Critical", value: 80 },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Severity
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <FilterPill
            key={preset.value}
            label={preset.label}
            isSelected={minSeverity === preset.value}
            onClick={() => onSetMinSeverity(preset.value)}
            color={
              preset.value >= 80
                ? "bg-red-500"
                : preset.value >= 60
                ? "bg-orange-500"
                : preset.value >= 40
                ? "bg-yellow-500"
                : "bg-green-500"
            }
            size="sm"
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// ALERT LEVEL FILTER
// =============================================================================

interface AlertLevelFilterProps {
  selectedLevels: AlertLevel[];
  onToggle: (level: AlertLevel) => void;
}

export function AlertLevelFilter({
  selectedLevels,
  onToggle,
}: AlertLevelFilterProps) {
  return (
    <div className="flex items-center gap-2">
      {Object.values(AlertLevel).map((level) => (
        <FilterPill
          key={level}
          label={ALERT_LEVEL_DISPLAY[level].label}
          color={ALERT_LEVEL_DISPLAY[level].color}
          isSelected={selectedLevels.includes(level)}
          onClick={() => onToggle(level)}
          size="sm"
        />
      ))}
    </div>
  );
}

// =============================================================================
// SEARCH INPUT
// =============================================================================

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search location...",
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// =============================================================================
// COMPOSED DISASTER FILTERS COMPONENT
// =============================================================================

interface DisasterFiltersProps {
  state: DisasterFilterState;
  actions: DisasterFilterActions;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  compact?: boolean;
}

export function DisasterFilters({
  state,
  actions,
  hasActiveFilters,
  activeFilterCount,
  compact = false,
}: DisasterFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  return (
    <div className="space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-white"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </button>
        
        <div className="flex items-center gap-2">
          {/* Indonesia toggle */}
          <button
            onClick={actions.toggleIndonesiaOnly}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
              state.indonesiaOnly
                ? "bg-red-500/20 text-red-400"
                : "bg-white/5 text-gray-400"
            )}
          >
            🇮🇩 Indonesia
          </button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={actions.resetFilters}
              className="text-gray-400 hover:text-white text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Expandable filter sections */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-2">
              {/* Search */}
              <SearchInput
                value={state.searchQuery}
                onChange={actions.setSearchQuery}
              />

              {/* Region filter (only show when Indonesia is selected) */}
              {state.indonesiaOnly && (
                <RegionFilter
                  selectedRegions={state.selectedRegions}
                  onToggle={actions.toggleRegion}
                  onClear={actions.clearRegions}
                  onSelectAll={actions.selectAllRegions}
                />
              )}

              {/* Type filter */}
              <TypeFilter
                selectedTypes={state.selectedTypes}
                onToggle={actions.toggleType}
                onClear={actions.clearTypes}
              />

              {/* Severity filter */}
              <SeverityFilter
                minSeverity={state.minSeverity}
                showCriticalOnly={state.showCriticalOnly}
                onSetMinSeverity={actions.setMinSeverity}
                onToggleCriticalOnly={actions.toggleCriticalOnly}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick filter summary when collapsed */}
      {!isExpanded && hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {state.selectedTypes.map((type) => (
            <span
              key={type}
              className="px-2 py-0.5 text-xs bg-white/10 text-gray-300 rounded-full"
            >
              {TYPE_DISPLAY[type].emoji} {TYPE_DISPLAY[type].label}
            </span>
          ))}
          {state.selectedRegions.map((region) => (
            <span
              key={region}
              className="px-2 py-0.5 text-xs bg-white/10 text-gray-300 rounded-full"
            >
              {REGION_DISPLAY[region].emoji} {REGION_DISPLAY[region].label}
            </span>
          ))}
          {state.minSeverity > 0 && (
            <span className="px-2 py-0.5 text-xs bg-white/10 text-gray-300 rounded-full">
              ≥{state.minSeverity}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PRESET BUTTONS
// =============================================================================

interface FilterPresetsProps {
  onApply: (preset: "all" | "indonesia_critical" | "earthquakes_only" | "floods_only" | "recent_24h") => void;
  currentIndonesiaOnly: boolean;
}

export function FilterPresets({ onApply, currentIndonesiaOnly }: FilterPresetsProps) {
  const presets = [
    { id: "all" as const, label: "🌍 Global", active: !currentIndonesiaOnly },
    { id: "indonesia_critical" as const, label: "🇮🇩 Critical ID", active: false },
    { id: "earthquakes_only" as const, label: "🌋 Earthquakes", active: false },
    { id: "floods_only" as const, label: "🌊 Floods", active: false },
    { id: "recent_24h" as const, label: "⏰ 24h", active: false },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onApply(preset.id)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
            preset.active
              ? "bg-primary/20 text-primary"
              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
