"use client";

import { useState, useEffect } from "react";
import { useDeployContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useBalance } from "wagmi";
import { parseEther, formatEther } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { ADMIN_ADDRESSES } from "@/lib/contracts/deployments";
import { Settings, ShieldAlert, Loader2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import type { Abi } from "viem";

// Contract artifact interfaces
interface AdminDeployClientProps {
  mockUSDCAbi: Abi;
  mockUSDCBytecode: `0x${string}`;
  vaultAbi: Abi;
  vaultBytecode: `0x${string}`;
}

interface VaultDeployerProps {
  abi: Abi;
  bytecode: `0x${string}`;
  usdcAddress: string;
  onSuccess: (address: string) => void;
}

// Check if wallet address is in admin list (case-insensitive)
function isAdmin(address: string | undefined): boolean {
  if (!address) return false;
  return ADMIN_ADDRESSES.some(
    (admin) => admin.toLowerCase() === address.toLowerCase()
  );
}

// Admin Guard Component
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { address, isConnected, isConnecting } = useAccount();
  const isAuthorized = isAdmin(address);

  // Loading state
  if (isConnecting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-indigo-400 mx-auto mb-4" />
          <p className="text-gray-400">Checking authorization...</p>
        </motion.div>
      </div>
    );
  }

  // Not connected
  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/20 mx-auto mb-6">
            <Lock className="h-10 w-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-gray-400 mb-4">
            Please connect your wallet to access the admin console.
          </p>
          <p className="text-sm text-gray-500">
            Only authorized admin wallets can access this page.
          </p>
        </motion.div>
      </div>
    );
  }

  // Connected but not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 mx-auto mb-6">
            <ShieldAlert className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">
            Your wallet is not authorized to access the admin console.
          </p>
          <div className="p-3 rounded-lg bg-white/5 text-sm font-mono text-gray-500 break-all">
            {address}
          </div>
          <p className="text-xs text-gray-600 mt-4">
            Contact the project owner if you believe this is an error.
          </p>
        </motion.div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}

export function AdminDeployClient({ mockUSDCAbi, mockUSDCBytecode, vaultAbi, vaultBytecode }: AdminDeployClientProps) {
  const [usdcAddress, setUsdcAddress] = useState<string>("");
  const [vaultAddress, setVaultAddress] = useState<string>("");
  const [walletLoading, setWalletLoading] = useState(false);

  const { address } = useAccount();
  const { data: balance } = useBalance({ address });

  const { deployContract: deployUSDC, data: usdcHash, isPending: isUSDCPending } = useDeployContract();
  const { deployContract: deployVault, data: vaultHash, isPending: isVaultPending } = useDeployContract();

  // Wait for receipts
  const { data: usdcReceipt } = useWaitForTransactionReceipt({ hash: usdcHash });
  const { data: vaultReceipt } = useWaitForTransactionReceipt({ hash: vaultHash });

    const handleDeployUSDC = () => {
    if (balance?.value === BigInt(0)) {
        alert("Insufficient MATIC balance to deploy contracts.");
        return;
    }
    try {
        deployUSDC({
            abi: mockUSDCAbi,
            bytecode: mockUSDCBytecode,
            args: [],
            // Force explicit fees for Amoy (35 Gwei)
            maxFeePerGas: BigInt(35000000000), 
            maxPriorityFeePerGas: BigInt(35000000000), 
            gas: BigInt(3000000), // Force high gas limit
        });
    } catch (e) {
        alert("Deploy Error: " + e);
    }
  };

  const handleDeployVault = () => {
    if (!usdcAddress) {
        alert("Please enter MockUSDC Address first");
        return;
    }
    alert("Please ensure you are connected. Deploying Vault linked to: " + usdcAddress);
  };

  return (
    <AdminGuard>
      {/* Header with Breadcrumb */}
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
        ]}
        icon={Settings}
        iconColor="text-indigo-400"
        iconBg="bg-indigo-500/20"
        title="Admin Deployment Console"
        subtitle="Deploy and manage smart contracts on Polygon Amoy testnet"
      />
      
      {/* Quick Actions */}
      <div className="flex gap-4 mt-6">
        <a href="/admin/campaigns" className="flex-1">
          <Card className="bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20">
                <Settings className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Campaign Management</h3>
                <p className="text-sm text-gray-400">Create and manage relief campaigns</p>
              </div>
            </CardContent>
          </Card>
        </a>
        <a href="/admin/tasks" className="flex-1">
          <Card className="bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
                <Settings className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Task Management</h3>
                <p className="text-sm text-gray-400">Create and verify volunteer tasks</p>
              </div>
            </CardContent>
          </Card>
        </a>
      </div>

      <div className="grid gap-6 mt-6">
        {/* WALLET STATUS */}
        <Card className={balance?.value === BigInt(0) ? "border-red-500 bg-red-900/10" : "bg-slate-900/50"}>
          <CardHeader>
              <CardTitle className="flex justify-between">
                  <span>Connection Status</span>
                  <span className={balance?.value === BigInt(0) ? "text-red-400" : "text-green-400"}>
                      {balance ? `${parseFloat(formatEther(balance.value)).toFixed(4)} MATIC` : <span className="inline-block w-20 h-5 bg-white/10 animate-pulse rounded" />}
                  </span>
              </CardTitle>
          </CardHeader>
          <CardContent>
              {balance?.value === BigInt(0) && (
                  <div className="p-3 bg-red-900/30 text-red-200 rounded text-sm mb-4">
                      ⚠️ <strong>Insufficient Gas!</strong> You need MATIC to deploy contracts. 
                      <a href="https://faucet.polygon.technology/" target="_blank" className="underline ml-2">Get Free MATIC Faucet</a>
                  </div>
              )}
              <p className="text-sm text-gray-400">Connected: {address || "Not Connected"}</p>
          </CardContent>
      </Card>

      {/* MOCK USDC */}
      <Card>
        <CardHeader><CardTitle>1. Deploy MockUSDC</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <Button onClick={handleDeployUSDC} disabled={isUSDCPending || !!usdcReceipt} className="w-full">
                {isUSDCPending ? "Deploying..." : usdcReceipt ? "Deployed!" : "Deploy MockUSDC"}
            </Button>
            {usdcReceipt && (
                <div className="p-4 bg-green-900 rounded break-all">
                    <p className="font-bold">Contract Address:</p>
                    <code className="text-green-300">{usdcReceipt.contractAddress}</code>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2"
                        onClick={() => setUsdcAddress(usdcReceipt.contractAddress!)}
                    >
                        Use This
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>

      {/* VAULT */}
      <Card>
        <CardHeader><CardTitle>2. Deploy ParametricVault</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <label>MockUSDC Address</label>
                <Input value={usdcAddress} onChange={e => setUsdcAddress(e.target.value)} placeholder="0x..." />
            </div>
            {/* We need useAccount to get admin address accurately, importing it below */}
            <VaultDeployer 
                abi={vaultAbi} 
                bytecode={vaultBytecode} 
                usdcAddress={usdcAddress}
                onSuccess={(addr: string) => setVaultAddress(addr)}
            />
        </CardContent>
      </Card>

      {vaultAddress && (
         <div className="p-4 bg-blue-900 rounded">
            <h3 className="text-xl font-bold">🎉 Deployment Complete</h3>
            <p><strong>MockUSDC:</strong> {usdcAddress}</p>
            <p><strong>ParametricVault:</strong> {vaultAddress}</p>
            <p className="mt-4 text-yellow-300">Please verify these addresses and update deployments.ts.</p>
         </div>
      )}
      </div>
    </AdminGuard>
  );
}

function VaultDeployer({ abi, bytecode, usdcAddress, onSuccess }: VaultDeployerProps) {
    const { address } = useAccount();
    const { deployContract, data: hash, isPending } = useDeployContract();
    const { data: receipt } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (receipt?.contractAddress) {
            onSuccess(receipt.contractAddress);
        }
    }, [receipt, onSuccess]);

    const handleDeploy = () => {
        if (!address || !usdcAddress) return;
        deployContract({
            abi,
            bytecode,
            args: [usdcAddress, address], // _stablecoin, _admin
            maxFeePerGas: BigInt(35000000000), 
            maxPriorityFeePerGas: BigInt(35000000000), 
            gas: BigInt(5000000), 
        });
    };

    return (
        <div className="space-y-4">
             <Button onClick={handleDeploy} disabled={isPending || !usdcAddress || !address} className="w-full" variant="secondary">
                {isPending ? "Deploying Vault..." : receipt ? "Vault Deployed!" : "Deploy ParametricVault"}
            </Button>
            {receipt?.contractAddress && (
                <div className="p-2 bg-green-900/50 rounded break-all">
                     <code className="text-green-300">{receipt.contractAddress}</code>
                </div>
            )}
        </div>
    )
}
