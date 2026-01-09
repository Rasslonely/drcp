"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

// Pending deposit structure
export interface PendingDeposit {
  id: string;
  txHash: string;
  amount: string; // Formatted amount like "$100.00"
  amountRaw: bigint;
  timestamp: number;
  donor: string;
}

interface PendingDepositsContextType {
  pendingDeposits: PendingDeposit[];
  addPendingDeposit: (deposit: Omit<PendingDeposit, "id" | "timestamp">) => void;
  removePendingDeposit: (txHash: string) => void;
  clearExpiredDeposits: () => void;
}

const PendingDepositsContext = createContext<PendingDepositsContextType | null>(null);

// Storage key for persistence
const STORAGE_KEY = "drcp_pending_deposits";

// Timeout for auto-cleanup (5 minutes)
const DEPOSIT_TIMEOUT_MS = 5 * 60 * 1000;

// Interface for localStorage (bigint stored as string)
interface StoredPendingDeposit {
  id: string;
  txHash: string;
  amount: string;
  amountRaw: string; // bigint stored as string in JSON
  timestamp: number;
  donor: string;
}

export function PendingDepositsProvider({ children }: { children: ReactNode }) {
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredPendingDeposit[] = JSON.parse(stored);
        // Convert amountRaw back to bigint and filter expired
        const now = Date.now();
        const valid = parsed
          .map((d: StoredPendingDeposit) => ({
            ...d,
            amountRaw: BigInt(d.amountRaw),
          }))
          .filter((d: PendingDeposit) => now - d.timestamp < DEPOSIT_TIMEOUT_MS);
        setPendingDeposits(valid);
      }
    } catch (e) {
      console.warn("Failed to load pending deposits:", e);
    }
  }, []);

  // Save to localStorage when pendingDeposits changes
  useEffect(() => {
    try {
      // Convert bigint to string for JSON
      const toStore = pendingDeposits.map((d) => ({
        ...d,
        amountRaw: d.amountRaw.toString(),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.warn("Failed to save pending deposits:", e);
    }
  }, [pendingDeposits]);

  // Clean up expired deposits periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPendingDeposits((prev) =>
        prev.filter((d) => now - d.timestamp < DEPOSIT_TIMEOUT_MS)
      );
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const addPendingDeposit = useCallback(
    (deposit: Omit<PendingDeposit, "id" | "timestamp">) => {
      const newDeposit: PendingDeposit = {
        ...deposit,
        id: `pending-${deposit.txHash}`,
        timestamp: Date.now(),
      };
      setPendingDeposits((prev) => [newDeposit, ...prev]);
    },
    []
  );

  const removePendingDeposit = useCallback((txHash: string) => {
    setPendingDeposits((prev) =>
      prev.filter((d) => d.txHash.toLowerCase() !== txHash.toLowerCase())
    );
  }, []);

  const clearExpiredDeposits = useCallback(() => {
    const now = Date.now();
    setPendingDeposits((prev) =>
      prev.filter((d) => now - d.timestamp < DEPOSIT_TIMEOUT_MS)
    );
  }, []);

  return (
    <PendingDepositsContext.Provider
      value={{
        pendingDeposits,
        addPendingDeposit,
        removePendingDeposit,
        clearExpiredDeposits,
      }}
    >
      {children}
    </PendingDepositsContext.Provider>
  );
}

export function usePendingDeposits() {
  const context = useContext(PendingDepositsContext);
  if (!context) {
    throw new Error("usePendingDeposits must be used within PendingDepositsProvider");
  }
  return context;
}
