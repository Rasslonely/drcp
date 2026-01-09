"use client";

import { toast as sonnerToast } from "sonner";
import { getTxExplorerUrl } from "@/lib/chain-utils";

/**
 * Toast notification utilities for DRCP
 * 
 * Usage:
 * import { toast } from "@/hooks/useToast";
 * 
 * toast.success("Donation successful!");
 * toast.error("Transaction failed");
 * toast.loading("Processing...");
 * toast.tx("0x...", "Donation submitted");
 */

// Re-export sonner toast for direct access
export { toast } from "sonner";

// Transaction toast with link to explorer
export function txToast(txHash: string, message: string = "Transaction submitted") {
  const explorerUrl = getTxExplorerUrl(txHash);
  
  return sonnerToast.success(message, {
    description: (
      <a 
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-400 hover:text-indigo-300 underline text-xs font-mono"
      >
        {txHash.slice(0, 10)}...{txHash.slice(-6)}
      </a>
    ),
    duration: 8000,
  });
}

// Donation success toast
export function donationToast(amount: string, txHash: string) {
  const explorerUrl = getTxExplorerUrl(txHash);
  
  return sonnerToast.success(`Donated ${amount}! 🎉`, {
    description: (
      <div className="space-y-1">
        <p className="text-gray-400 text-xs">Thank you for supporting disaster relief</p>
        <a 
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline text-xs font-mono block"
        >
          View transaction →
        </a>
      </div>
    ),
    duration: 10000,
  });
}

// Wallet error toast
export function walletErrorToast(message: string = "Wallet action failed") {
  return sonnerToast.error(message, {
    description: "Please check your wallet and try again",
  });
}

// Copy to clipboard toast
export function copyToast(label: string = "Copied!") {
  return sonnerToast.success(label, {
    duration: 2000,
  });
}

// Governance vote toast
export function voteToast(support: "for" | "against", proposalId: string) {
  const action = support === "for" ? "voted FOR" : "voted AGAINST";
  
  return sonnerToast.success(`Successfully ${action}`, {
    description: `Proposal #${proposalId.slice(-8)}`,
  });
}

// Delegation toast
export function delegationToast(delegatee: string) {
  return sonnerToast.success("Delegation successful!", {
    description: `Voting power delegated to ${delegatee.slice(0, 8)}...`,
  });
}

// Loading toast that can be updated
export function loadingToast(message: string) {
  return sonnerToast.loading(message);
}

// Dismiss a specific toast or all
export function dismissToast(toastId?: string | number) {
  if (toastId) {
    sonnerToast.dismiss(toastId);
  } else {
    sonnerToast.dismiss();
  }
}

// Promise toast for async operations
export function promiseToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
) {
  return sonnerToast.promise(promise, messages);
}
