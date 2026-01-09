"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Target, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  Lock,
  ShieldAlert
} from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { keccak256, toBytes } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { VAULT_ADDRESS } from "@/lib/contracts/deployments";
import { ABIS } from "@/lib/contracts/abis";
import { useCreateCampaign, useCloseCampaign } from "@/hooks/useCampaigns";
import { useCampaignsGraph, type FormattedCampaign } from "@/hooks/useGraph";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks";
import { useVaultStats } from "@/hooks/useVaultStats";

// =============================================================================
// ADMIN GUARD (H-02 Audit Fix: On-Chain Role Verification)
// =============================================================================

// Pre-compute DAO_ROLE hash (keccak256("DAO_ROLE"))
const DAO_ROLE_HASH = keccak256(toBytes("DAO_ROLE"));

/**
 * Hook to check if connected wallet has DAO_ROLE on-chain
 * This replaces the hardcoded ADMIN_ADDRESSES list
 */
function useHasDAORole(address: `0x${string}` | undefined) {
  const { data: hasRole, isLoading, error } = useReadContract({
    address: VAULT_ADDRESS,
    abi: ABIS.ParametricVault,
    functionName: "hasRole",
    args: address ? [DAO_ROLE_HASH, address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    hasDAORole: hasRole === true,
    isLoading,
    error,
  };
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const { address, isConnected, isConnecting } = useAccount();
  
  // H-02 Fix: Check on-chain DAO_ROLE instead of hardcoded list
  const { hasDAORole, isLoading: isCheckingRole } = useHasDAORole(address);

  // Wait for client mount to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading on server, during hydration, or while checking role
  if (!mounted || isConnecting || (isConnected && isCheckingRole)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-400 mx-auto mb-4" />
          <p className="text-gray-400">
            {!mounted || isConnecting 
              ? "Connecting wallet..." 
              : "Verifying on-chain permissions..."}
          </p>
        </div>
      </div>
    );
  }

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
            Please connect your wallet to access the campaign management console.
          </p>
          <p className="text-sm text-gray-500">
            Only wallets with DAO_ROLE can access this page.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!hasDAORole) {
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
            Your wallet does not have DAO_ROLE permissions on-chain.
          </p>
          <div className="p-3 rounded-lg bg-white/5 text-sm font-mono text-gray-500 break-all">
            {address}
          </div>
          <p className="text-xs text-gray-600 mt-4">
            Contact the DAO to request access via governance proposal.
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}

// =============================================================================
// CREATE CAMPAIGN FORM
// =============================================================================

// L-03 Audit Fix: Input sanitization helper
function sanitizeInput(input: string, maxLength: number = 200): string {
  return input
    .trim()
    .slice(0, maxLength) // Limit length
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F]/g, ''); // Remove control characters
}

function CreateCampaignForm({ onSuccess }: { onSuccess?: () => void }) {
  const searchParams = useSearchParams();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("5000");
  const [deadline, setDeadline] = useState("");
  const [geoHash, setGeoHash] = useState("");

  // Handle URL Pre-population
  useEffect(() => {
    const pName = searchParams.get("name");
    const pDesc = searchParams.get("desc");
    const pLoc = searchParams.get("loc");
    const pTarget = searchParams.get("target");

    if (pName) setName(pName);
    if (pDesc) setDescription(pDesc);
    if (pLoc) setGeoHash(pLoc);
    if (pTarget) setTargetAmount(pTarget);
  }, [searchParams]);

  const { createCampaign, isPending, isConfirming, isSuccess, error, receiptError } = useCreateCampaign();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error("Campaign name is required");
      return;
    }
    if (Number(targetAmount) < 1000) {
      toast.error("Minimum target is $1,000 USDC");
      return;
    }

    // Convert deadline to timestamp (0 if not set)
    const deadlineTimestamp = deadline 
      ? Math.floor(new Date(deadline).getTime() / 1000)
      : 0;

    // L-03: Use sanitized inputs
    const safeName = sanitizeInput(name, 100);
    const safeDescription = sanitizeInput(description, 500) || `Relief campaign for ${safeName}`;
    const safeGeoHash = sanitizeInput(geoHash, 50) || "indonesia";

    await createCampaign(
      safeName,
      safeDescription,
      targetAmount,
      deadlineTimestamp,
      safeGeoHash
    );
  };

  // Reset form on success
  React.useEffect(() => {
    if (isSuccess) {
      setName("");
      setDescription("");
      setTargetAmount("5000");
      setDeadline("");
      setGeoHash("");
      toast.success("Campaign created successfully!");
      onSuccess?.();
    }
  }, [isSuccess, onSuccess]);

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-emerald-400" />
          Create New Campaign
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campaign Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Campaign Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Banjir Kalimantan Barat 2026"
              className="bg-white/5 border-white/10"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Relief effort for flood victims..."
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Target Amount (USDC) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                min="1000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="5000"
                className="bg-white/5 border-white/10 pl-8"
                required
              />
            </div>
            <p className="text-xs text-gray-500">Minimum: $1,000 USDC</p>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Deadline (optional)
            </label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="bg-white/5 border-white/10"
            />
            <p className="text-xs text-gray-500">Leave empty for no deadline</p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </label>
            <Input
              value={geoHash}
              onChange={(e) => setGeoHash(e.target.value)}
              placeholder="Kalimantan Barat"
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* Error Display */}
          {(error || receiptError) && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                {receiptError 
                  ? "Campaign creation failed on-chain. Check your balance or try again." 
                  : "Failed to create campaign. Please try again."}
              </span>
            </div>
          )}

          {/* Success Display */}
          {isSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>Campaign created successfully!</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending || (isConfirming && !receiptError)}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            {isPending || (isConfirming && !receiptError) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isPending ? "Confirm in wallet..." : "Creating..."}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// CAMPAIGN ROW (for admin list)
// =============================================================================

interface AdminCampaignRowProps {
  campaign: FormattedCampaign;
  onClose?: () => void;
}

function AdminCampaignRow({ campaign, onClose }: AdminCampaignRowProps) {
  const { closeCampaign, isPending, isConfirming, isSuccess } = useCloseCampaign();

  const handleClose = async () => {
    if (confirm(`Are you sure you want to close "${campaign.name}"?`)) {
      await closeCampaign(campaign.campaignId);
    }
  };

  React.useEffect(() => {
    if (isSuccess) {
      toast.success(`Campaign "${campaign.name}" closed`);
      onClose?.();
    }
  }, [isSuccess, campaign.name, onClose]);

  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-xl",
      "bg-white/5 border border-white/10",
      campaign.status !== "ACTIVE" && "opacity-60"
    )}>
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
          <Target className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h4 className="font-medium text-white">{campaign.name}</h4>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{campaign.raisedFormatted} / {campaign.targetFormatted}</span>
            <span>•</span>
            <span>{campaign.progressPercent}% funded</span>
            <span>•</span>
            <span>{campaign.depositCount} donors</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status Badge */}
        <span className={cn(
          "px-2 py-1 rounded text-xs font-medium",
          campaign.status === "ACTIVE" 
            ? "bg-emerald-500/20 text-emerald-400"
            : campaign.status === "CLOSED"
            ? "bg-blue-500/20 text-blue-400"
            : "bg-gray-500/20 text-gray-400"
        )}>
          {campaign.status}
        </span>

        {/* Close Button (only for ACTIVE) */}
        {campaign.status === "ACTIVE" && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleClose}
            disabled={isPending || isConfirming}
          >
            {isPending || isConfirming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Close"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// CAMPAIGN MANAGEMENT (main component)
// =============================================================================

export function CampaignManagement() {
  const { activeCampaignCount, isLoading: statsLoading } = useVaultStats();
  const { campaigns: activeCampaigns, isLoading: loadingActive, refetch: refetchActive } = useCampaignsGraph("ACTIVE", 10);
  const { campaigns: closedCampaigns, isLoading: loadingClosed, refetch: refetchClosed } = useCampaignsGraph("CLOSED", 10);

  const handleRefresh = () => {
    refetchActive();
    refetchClosed();
  };

  const activeCount = activeCampaigns.length;
  const maxCampaigns = 10;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Campaigns" },
        ]}
        icon={Target}
        iconColor="text-indigo-400"
        iconBg="bg-indigo-500/20"
        title="Campaign Management"
        subtitle="Create and manage disaster relief campaigns"
      />

      {/* Stats Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-2xl font-bold text-white">
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
              ) : (
                activeCampaignCount?.toString() || "0"
              )}
            </div>
            <div className="text-xs text-gray-500">Active Campaigns</div>
          </div>
          <div className="h-8 border-l border-white/10" />
          <div>
            <div className="text-2xl font-bold text-gray-400">
              {statsLoading ? "..." : (maxCampaigns - Number(activeCampaignCount || 0))}
            </div>
            <div className="text-xs text-gray-500">Slots Available</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Form */}
        <CreateCampaignForm onSuccess={handleRefresh} />

        {/* Campaign Lists */}
        <div className="space-y-6">
          {/* Active Campaigns */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Campaigns ({activeCampaignCount}/{maxCampaigns})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingActive ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                </div>
              ) : activeCampaigns.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No active campaigns</p>
                </div>
              ) : (
                activeCampaigns.map((campaign) => (
                  <AdminCampaignRow 
                    key={campaign.id} 
                    campaign={campaign}
                    onClose={handleRefresh}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Closed Campaigns */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-gray-400">
                Closed / Expired Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingClosed ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                </div>
              ) : closedCampaigns.length === 0 ? (
                <p className="text-center py-4 text-gray-600 text-sm">
                  No closed campaigns yet
                </p>
              ) : (
                closedCampaigns.map((campaign) => (
                  <AdminCampaignRow 
                    key={campaign.id} 
                    campaign={campaign}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PAGE EXPORT (with AdminGuard)
// =============================================================================

// L-05 Audit Fix: Error Boundary for graceful error handling
class AdminErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Something Went Wrong</h2>
            <p className="text-gray-400 mb-4">
              An error occurred while loading the campaign management console.
            </p>
            <p className="text-sm text-red-400 font-mono bg-white/5 p-3 rounded-lg break-all">
              {this.state.error?.message || "Unknown error"}
            </p>
            <Button 
              variant="primary" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AdminCampaignsPage() {
  return (
    <AdminGuard>
      <AdminErrorBoundary>
        <React.Suspense fallback={
          <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-400 mb-4" />
            <p className="text-gray-500 font-medium">Loading Intelligence Data...</p>
          </div>
        }>
          <CampaignManagement />
        </React.Suspense>
      </AdminErrorBoundary>
    </AdminGuard>
  );
}

