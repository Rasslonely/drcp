"use client";

import { useMemo } from "react";
import { useVaultStats, useAllTransactions } from "@/hooks";
// Note: useVaultStats and useAllTransactions now use GraphQL internally
// This makes useFundFlow automatically fast without any changes needed!

// Fund flow node structure
export interface FlowNode {
  id: string;
  label: string;
  value: number;
  valueFormatted: string;
  color: string;
  icon: string;
}

// Fund flow link structure
export interface FlowLink {
  source: string;
  target: string;
  value: number;
  color: string;
}

// Computed fund flow data
export interface FundFlowData {
  nodes: FlowNode[];
  links: FlowLink[];
  isLoading: boolean;
}

/**
 * Hook to compute fund flow data from on-chain events.
 * Aggregates: Donations → Vault → Relief Distribution → Volunteer Payouts
 */
export function useFundFlow(): FundFlowData {
  const {
    totalDeposits,
    releasedFunds,
    totalFeesCollected,
    isLoading: loadingStats,
  } = useVaultStats();

  const { transactions, isLoading: loadingTx } = useAllTransactions();

  const isLoading = loadingStats || loadingTx;

  const data = useMemo(() => {
    // Parse BigInt values to numbers (USDC has 6 decimals)
    const deposits = totalDeposits ? Number(totalDeposits) / 1_000_000 : 0;
    const released = releasedFunds ? Number(releasedFunds) / 1_000_000 : 0;
    const fees = totalFeesCollected ? Number(totalFeesCollected) / 1_000_000 : 0;

    // Calculate volunteer payouts from transactions
    const volunteerPayouts = transactions
      .filter((tx) => tx.type === "volunteer_payout")
      .reduce((sum, tx) => {
        // Parse amount like "$25.00" to number
        const amount = parseFloat(tx.amount.replace(/[^0-9.-]/g, "")) || 0;
        return sum + amount;
      }, 0);

    // Calculate relief distribution (released - volunteer payouts)
    const reliefDistribution = Math.max(0, released - volunteerPayouts);
    
    const grossDonations = deposits + fees;

    // Current vault balance
    const vaultBalance = deposits - released;

    // Format helper
    const formatUSD = (val: number) =>
      val >= 1000
        ? `$${(val / 1000).toFixed(1)}k`
        : `$${val.toFixed(2)}`;

    // Build nodes
    const nodes: FlowNode[] = [
      {
        id: "donors",
        label: "Donors",
        value: grossDonations,
        valueFormatted: formatUSD(grossDonations),
        color: "#10B981", // emerald
        icon: "💰",
      },
      {
        id: "vault",
        label: "Vault",
        value: vaultBalance,
        valueFormatted: formatUSD(vaultBalance),
        color: "#6366F1", // indigo
        icon: "🔐",
      },
      {
        id: "treasury",
        label: "Sustainability",
        value: fees,
        valueFormatted: formatUSD(fees),
        color: "#F472B6", // pink-400
        icon: "🛡️",
      },
      {
        id: "relief",
        label: "Relief",
        value: reliefDistribution,
        valueFormatted: formatUSD(reliefDistribution),
        color: "#F59E0B", // amber
        icon: "🆘",
      },
      {
        id: "volunteers",
        label: "Volunteers",
        value: volunteerPayouts,
        valueFormatted: formatUSD(volunteerPayouts),
        color: "#8B5CF6", // purple
        icon: "🤝",
      },
    ];

    // Build links (flow connections)
    const links: FlowLink[] = [
      {
        source: "donors",
        target: "vault",
        value: deposits,
        color: "url(#gradient-donors-vault)",
      },
      {
        source: "donors",
        target: "treasury",
        value: fees,
        color: "url(#gradient-donors-treasury)",
      },
      {
        source: "vault",
        target: "relief",
        value: reliefDistribution,
        color: "url(#gradient-vault-relief)",
      },
      {
        source: "vault",
        target: "volunteers",
        value: volunteerPayouts,
        color: "url(#gradient-vault-volunteers)",
      },
    ];

    return { nodes, links };
  }, [totalDeposits, releasedFunds, transactions]);

  return {
    nodes: data.nodes,
    links: data.links,
    isLoading,
  };
}
