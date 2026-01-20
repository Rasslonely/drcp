"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { ABIS } from "@/lib/contracts/abis";
import { MOCK_USDC_ADDRESS, VAULT_ADDRESS, CHAIN_ID } from "@/lib/contracts/deployments";
import { apolloClient } from "@/lib/graphql/client";
import { usePendingDeposits } from "@/contexts/PendingDepositsContext";
import { donationToast, walletErrorToast, toast } from "@/hooks";
import { CampaignSelector } from "@/components/campaigns";
import { getTxExplorerUrl, getExplorerName } from "@/lib/chain-utils";

// Protocol fee configuration (matches smart contract)
const PROTOCOL_FEE_BPS = 50; // 0.5% = 50 basis points

interface DonationModalProps {
  children: React.ReactNode;
  initialAmount?: string;
  /** Controlled open state */
  isOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Pre-select a specific campaign (null = General Fund) */
  initialCampaignId?: number | null;
}

export function DonationModal({ 
  children, 
  initialAmount = "100",
  isOpen: controlledOpen,
  onOpenChange,
  initialCampaignId,
}: DonationModalProps) {
  const [amount, setAmount] = useState(initialAmount);
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(initialCampaignId ?? null);
  const { address, isConnected } = useAccount();
  const { addPendingDeposit } = usePendingDeposits();

  // Support both controlled and uncontrolled mode
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    }
    setInternalOpen(open);
  };

  // Sync campaign selection with prop
  useEffect(() => {
    if (initialCampaignId !== undefined) {
      setSelectedCampaignId(initialCampaignId);
    }
  }, [initialCampaignId]);

  // Sync state with prop if it changes
  useEffect(() => {
    if (initialAmount) {
      setAmount(initialAmount);
    }
  }, [initialAmount]);

  // CONTRACT WRITES - capture errors from all transactions
  const { writeContract: writeMint, data: mintHash, isPending: isMintPending, error: mintError, reset: resetMint } = useWriteContract();
  const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending, error: approveError, reset: resetApprove } = useWriteContract();
  const { writeContract: writeDeposit, data: depositHash, isPending: isDepositPending, error: depositError, reset: resetDeposit } = useWriteContract();

  // TRANSACTION RECEIPTS - also capture errors from receipt polling
  const { isLoading: isMinting, isSuccess: isMintSuccess, error: mintReceiptError } = useWaitForTransactionReceipt({ hash: mintHash });
  const { isLoading: isApproving, isSuccess: isApproveSuccess, error: approveReceiptError } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isDepositing, isSuccess: isDepositSuccess, error: depositReceiptError } = useWaitForTransactionReceipt({ hash: depositHash });

  // OPTIMISTIC UI STATE
  // If we have a hash, the tx was SUBMITTED (even if RPC errors occur later)
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txMessage, setTxMessage] = useState<string | null>(null);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTxStatus("idle");
      setTxMessage(null);
      resetMint();
      resetApprove();
      resetDeposit();
    }
  }, [isOpen, resetMint, resetApprove, resetDeposit]);

  // OPTIMISTIC: If we have a hash, the tx was submitted successfully!
  // Show "pending" instead of "error" even if RPC has issues
  useEffect(() => {
    if (mintHash || approveHash || depositHash) {
      setTxStatus("pending");
      setTxMessage(`Transaction submitted! Check ${getExplorerName()} to verify.`);
    }
  }, [mintHash, approveHash, depositHash]);

  // Success states
  useEffect(() => {
    if (isMintSuccess) {
      setTxStatus("success");
      setTxMessage("Test USDC minted successfully!");
      toast.success("Test USDC minted!", { description: "1,000 USDC added to your wallet" });
    }
    if (isApproveSuccess) {
      setTxStatus("success");
      setTxMessage("Approval confirmed! Now click to deposit.");
      toast.success("Approval confirmed!", { description: "Now click to complete donation" });
    }
    if (isDepositSuccess && depositHash) {
      setTxStatus("success");
      setTxMessage("Donation complete! Thank you for your contribution!");
      donationToast(`$${amount}`, depositHash);
    }
  }, [isMintSuccess, isApproveSuccess, isDepositSuccess, depositHash, amount]);

  // Only show errors if NO hash exists (tx truly failed to submit)
  useEffect(() => {
    // Check if user rejected in MetaMask
    const isUserRejection = (err: Error | null) => 
      err?.message?.includes("User rejected") || 
      err?.message?.includes("user rejected") ||
      err?.message?.includes("denied");

    if (mintError && !mintHash) {
      if (isUserRejection(mintError)) {
        setTxStatus("idle");
        setTxMessage(null);
      } else {
        // Log but don't show scary error - might still have succeeded
        console.warn("Mint error (no hash):", mintError);
        setTxStatus("error");
        setTxMessage("Transaction may have failed. Try again or check your wallet.");
        walletErrorToast("Mint failed");
      }
    }
    if (approveError && !approveHash) {
      if (isUserRejection(approveError)) {
        setTxStatus("idle");
        setTxMessage(null);
      } else {
        console.warn("Approve error (no hash):", approveError);
        setTxStatus("error");
        setTxMessage("Transaction may have failed. Try again or check your wallet.");
      }
    }
    if (depositError && !depositHash) {
      if (isUserRejection(depositError)) {
        setTxStatus("idle");
        setTxMessage(null);
      } else {
        console.warn("Deposit error (no hash):", depositError);
        setTxStatus("error");
        setTxMessage("Transaction may have failed. Try again or check your wallet.");
      }
    }
  }, [mintError, approveError, depositError, mintHash, approveHash, depositHash]);

  // Get the most recent tx hash for explorer link
  const currentTxHash = depositHash || approveHash || mintHash;
  const explorerUrl = currentTxHash 
    ? getTxExplorerUrl(currentTxHash) 
    : null;

  // READ DATA
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: ABIS.ERC20,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: ABIS.ERC20,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
    chainId: CHAIN_ID,
    // CRITICAL: Force fresh read every time (no caching) to fix Step 1->2 transition
    query: {
      staleTime: 0,
      gcTime: 0,
    },
  });

  // Refresh data after transactions
  // CRITICAL FIX: Add delay for blockchain propagation before refetch
  useEffect(() => {
    if (isMintSuccess || isApproveSuccess || isDepositSuccess) {
      // Delay refetch to allow blockchain state to propagate
      const timer = setTimeout(async () => {
        await refetchBalance();
        await refetchAllowance();
      }, 1500); // 1.5 second delay for RPC to reflect new state
      return () => clearTimeout(timer);
    }
  }, [isMintSuccess, isApproveSuccess, isDepositSuccess, refetchBalance, refetchAllowance]);

  // Handle deposit success separately (original logic)
  useEffect(() => {
    if (isDepositSuccess && depositHash && address) {
      // OPTIMISTIC UI: Add pending deposit immediately
      // This shows in Donation History before subgraph confirms
      const depositAmount = parseUnits(amount || "0", 6);
      addPendingDeposit({
        txHash: depositHash,
        amount: `$${Number(amount || 0).toFixed(2)}`,
        amountRaw: depositAmount,
        donor: address,
      });
      
      // CRITICAL: Invalidate Apollo cache for all GraphQL queries
      // This triggers immediate refetch of DonationHistory, GlobalStats, etc.
      apolloClient.refetchQueries({
        include: ['GetDeposits', 'GetAllDeposits', 'GetVaultStats', 'GetDonorStats', 'GetRecentDeposits'],
      });
      
      setTimeout(() => setIsOpen(false), 2000); // Close modal on success
    }
  }, [isDepositSuccess, depositHash, address, amount, addPendingDeposit]);

  const handleMint = () => {
    if (!address) return;
    writeMint({
      address: MOCK_USDC_ADDRESS,
      abi: ABIS.ERC20,
      functionName: "mint",
      args: [address, parseUnits("1000", 6)],
      chainId: CHAIN_ID,
      gas: BigInt(500000),
    });
  };

  const handleApprove = () => {
    writeApprove({
      address: MOCK_USDC_ADDRESS,
      abi: ABIS.ERC20,
      functionName: "approve",
      args: [VAULT_ADDRESS, parseUnits(amount, 6)],
      chainId: CHAIN_ID,
      gas: BigInt(200000),
    });
  };

  const handleDeposit = () => {
    // Use campaign-specific deposit if campaign selected
    if (selectedCampaignId !== null) {
      writeDeposit({
        address: VAULT_ADDRESS,
        abi: ABIS.ParametricVault,
        functionName: "depositToCampaign",
        args: [BigInt(selectedCampaignId), parseUnits(amount, 6)],
        chainId: CHAIN_ID,
        gas: BigInt(500000),
      });
    } else {
      // General fund deposit
      writeDeposit({
        address: VAULT_ADDRESS,
        abi: ABIS.ParametricVault,
        functionName: "deposit",
        args: [parseUnits(amount, 6)],
        chainId: CHAIN_ID,
        gas: BigInt(500000),
      });
    }
  };

  const needsApproval = allowance ? (allowance as bigint) < parseUnits(amount, 6) : true;
  const hasFunds = balance ? (balance as bigint) >= parseUnits(amount, 6) : false;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Make a Difference</DialogTitle>
          <DialogDescription className="text-gray-400">
            Support disaster relief efforts with USDC. 100% of funds are tracked on-chain.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="donate" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="donate">Donate</TabsTrigger>
            <TabsTrigger value="faucet">Get Test Funds</TabsTrigger>
          </TabsList>

          {/* DONATE TAB */}
          <TabsContent value="donate" className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Amount (USDC)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white text-lg h-12"
              />
              <p className="text-xs text-gray-500 text-right">
                Balance: {balance ? Number(formatUnits(balance as bigint, 6)).toFixed(2) : "0.00"} USDC
              </p>
            </div>

            {/* Campaign Selector */}
            <CampaignSelector
              selectedCampaignId={selectedCampaignId}
              onSelect={setSelectedCampaignId}
            />

            {/* Fee Breakdown Display */}
            {parseFloat(amount) > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-3 space-y-1.5 text-sm border border-slate-700">
                <div className="flex justify-between text-gray-400">
                  <span>Donation Amount</span>
                  <span>${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-orange-400/80">
                  <span>Protocol Fee (0.5%)</span>
                  <span>-${(parseFloat(amount) * PROTOCOL_FEE_BPS / 10000).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-400 border-t border-slate-700 pt-1.5 mt-1">
                  <span>To Disaster Relief</span>
                  <span>${(parseFloat(amount) * (1 - PROTOCOL_FEE_BPS / 10000)).toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Protocol fee sustains operations. DAO can adjust via governance.
                </p>
              </div>
            )}

            {!hasFunds && (
              <div className="flex items-center p-3 bg-amber-500/10 text-amber-500 rounded-lg text-sm">
                <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                Insufficient funds. Use the "Get Test Funds" tab!
              </div>
            )}

            {/* Transaction Status Display */}
            {txStatus === "pending" && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm space-y-2">
                <div className="flex items-center text-amber-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
                  <span>{txMessage || "Transaction pending..."}</span>
                </div>
                {explorerUrl && (
                  <a 
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-400 hover:text-blue-300 text-xs"
                  >
                    <span>🔍 View transaction on {getExplorerName()}</span>
                  </a>
                )}
              </div>
            )}

            {txStatus === "error" && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm space-y-2">
                <div className="flex items-start text-red-400">
                  <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{txMessage || "Transaction failed"}</span>
                </div>
                {explorerUrl && (
                  <a 
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-400 hover:text-blue-300 text-xs"
                  >
                    <span>🔍 View transaction on {getExplorerName()}</span>
                  </a>
                )}
              </div>
            )}

            {isDepositSuccess ? (
              <div className="flex flex-col items-center justify-center p-4 bg-emerald-500/20 text-emerald-400 rounded-lg space-y-2">
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-6 w-6" />
                  Donation Complete!
                </div>
                {explorerUrl && (
                  <a 
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    🔍 View on {getExplorerName()}
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {needsApproval ? (
                  <Button
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold"
                    onClick={handleApprove}
                    disabled={isApproving || isApprovePending || !hasFunds}
                  >
                    {(isApproving || isApprovePending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Step 1: Approve Usage
                  </Button>
                ) : (
                  <Button
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-semibold"
                    onClick={handleDeposit}
                    disabled={isDepositing || isDepositPending}
                  >
                    {(isDepositing || isDepositPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Step 2: Confirm Donation
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* FAUCET TAB */}
          <TabsContent value="faucet" className="space-y-4 py-4">
            <div className="p-4 bg-slate-800 rounded-lg text-sm text-gray-300">
              <p>Since this is a Testnet demo, you need "Fake USDC" to test the donation flow.</p>
              <p className="mt-2">Click below to mint <b>1,000 MockUSDC</b> to your wallet.</p>
            </div>
            
            <Button 
              className="w-full h-12 bg-purple-600 hover:bg-purple-700" 
              onClick={handleMint}
              disabled={isMinting || isMintPending}
            >
              {(isMinting || isMintPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isMintSuccess ? "Minted! Check Donate Tab" : "Mint 1,000 Test USDC"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
