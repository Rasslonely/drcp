"use client";

import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { VAULT_ADDRESS, PROJECT_TREASURY, CHAIN_ID } from "@/lib/contracts/deployments";
import { Wallet, TrendingUp, Percent } from "lucide-react";

// Minimal ABIs for the new functions
const PROTOCOL_FEE_ABI = [
  {
    name: "protocolFeeBps",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "totalFeesCollected",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

const TREASURY_ABI = [
  {
    name: "getStats",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
    ],
  },
] as const;

/**
 * TreasuryStats Component
 * Displays protocol fee statistics on the transparency page
 */
export function TreasuryStats() {
  // Read protocol fee rate
  const { data: feeBps, isLoading: isLoadingFee } = useReadContract({
    address: VAULT_ADDRESS,
    abi: PROTOCOL_FEE_ABI,
    functionName: "protocolFeeBps",
    chainId: CHAIN_ID,
  });

  // Read total fees collected
  const { data: totalFeesCollected, isLoading: isLoadingTotal } = useReadContract({
    address: VAULT_ADDRESS,
    abi: PROTOCOL_FEE_ABI,
    functionName: "totalFeesCollected",
    chainId: CHAIN_ID,
  });

  // Read treasury balance
  const { data: treasuryStats, isLoading: isLoadingTreasury } = useReadContract({
    address: PROJECT_TREASURY,
    abi: TREASURY_ABI,
    functionName: "getStats",
    chainId: CHAIN_ID,
  });

  const isLoading = isLoadingFee || isLoadingTotal || isLoadingTreasury;

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-32 mb-3"></div>
        <div className="h-8 bg-slate-700 rounded w-24"></div>
      </div>
    );
  }

  const feePercentage = Number(feeBps || BigInt(50)) / 100; // 50 -> 0.5%
  const totalCollectedFormatted = Number(formatUnits(totalFeesCollected as bigint || BigInt(0), 6)).toFixed(2);
  
  // Treasury stats: [totalDonations, totalWithdrawn, currentBalance, donorCount]
  const treasuryBalance = treasuryStats ? (treasuryStats as readonly bigint[])[2] : BigInt(0);
  const treasuryBalanceFormatted = Number(formatUnits(treasuryBalance, 6)).toFixed(2);

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-5 border border-slate-700/50">
      <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
        <Wallet className="h-4 w-4 text-emerald-400" />
        Protocol Revenue
      </h3>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Current Fee Rate */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <Percent className="h-3 w-3" />
            Fee Rate
          </div>
          <p className="text-xl font-bold text-emerald-400">{feePercentage}%</p>
          <p className="text-[10px] text-gray-500">DAO adjustable</p>
        </div>
        
        {/* Total Fees Collected */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <TrendingUp className="h-3 w-3" />
            Fees Collected
          </div>
          <p className="text-xl font-bold text-white">${totalCollectedFormatted}</p>
          <p className="text-[10px] text-gray-500">All time</p>
        </div>
        
        {/* Treasury Balance */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <Wallet className="h-3 w-3" />
            Treasury
          </div>
          <p className="text-xl font-bold text-white">${treasuryBalanceFormatted}</p>
          <p className="text-[10px] text-gray-500">Available</p>
        </div>
      </div>
      
      <p className="text-[10px] text-gray-500 mt-4 pt-3 border-t border-slate-700">
        Protocol fees sustain development, audits, and operations. Traditional charities take 15-30%.
      </p>
    </div>
  );
}

export default TreasuryStats;

