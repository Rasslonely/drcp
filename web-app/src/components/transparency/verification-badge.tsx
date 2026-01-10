"use client";

import { motion } from "framer-motion";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { getTxExplorerUrl, getAddressExplorerUrl } from "@/lib/chain-utils";
import { VAULT_ADDRESS } from "@/lib/contracts/deployments";

interface VerificationBadgeProps {
  /** Transaction hash for linking to explorer */
  txHash?: string;
  /** Display variant */
  variant?: "inline" | "compact" | "full";
  /** Whether to show tooltip on hover */
  showTooltip?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * On-Chain Verification Badge
 * Shows "On-Chain Verified" indicator with link to block explorer
 */
export function VerificationBadge({
  txHash,
  variant = "inline",
  showTooltip = true,
  className = "",
}: VerificationBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Explorer link for the transaction
  const explorerUrl = txHash
    ? getTxExplorerUrl(txHash)
    : getAddressExplorerUrl(VAULT_ADDRESS);

  // Compact variant - just the icon
  if (variant === "compact") {
    return (
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative inline-flex items-center z-[60] ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center rounded-full bg-emerald-500/20 p-1.5"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        </motion.div>

        {/* Tooltip */}
        {showTooltip && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-xl border border-white/10 z-[9999]"
            style={{ pointerEvents: "none" }}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>On-Chain Verified</span>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </a>
    );
  }

  // Inline variant - icon + text
  if (variant === "inline") {
    return (
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors ${className}`}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="font-medium">Verified</span>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </motion.div>
      </a>
    );
  }

  // Full variant - complete badge with background
  return (
    <motion.a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all ${className}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <ShieldCheck className="h-4 w-4" />
      <span>On-Chain Verified</span>
      <ExternalLink className="h-3 w-3 opacity-60" />
    </motion.a>
  );
}

/**
 * Small verification checkmark for transaction rows
 */
export function VerificationCheck({
  txHash,
  className = "",
}: {
  txHash?: string;
  className?: string;
}) {
  return (
    <VerificationBadge
      txHash={txHash}
      variant="compact"
      showTooltip={true}
      className={className}
    />
  );
}
