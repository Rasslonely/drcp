"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
  DollarSign,
  MapPin,
  User,
  Hand,
  FileCheck,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { useAccount } from "wagmi";
import {
  useAllTasks,
  useMyTasks,
  useClaimTask,
  useSubmitProof,
  TaskStatus,
  TASK_STATUS_CONFIG,
  TaskDisplay,
} from "@/hooks";
import Link from "next/link";

// ============================================
// TASK CARD COMPONENT (for grid view)
// ============================================
function TaskCard({
  task,
  onClaim,
  onSubmitProof,
  isClaiming,
  isSubmitting,
  currentAddress,
}: {
  task: TaskDisplay;
  onClaim: (id: number) => void;
  onSubmitProof: (id: number, proof: string) => void;
  isClaiming: boolean;
  isSubmitting: boolean;
  currentAddress?: string;
}) {
  const [showProofInput, setShowProofInput] = useState(false);
  const [proofData, setProofData] = useState("");
  const statusConfig = TASK_STATUS_CONFIG[task.status];
  const isMyTask = currentAddress && task.volunteer.toLowerCase() === currentAddress.toLowerCase();

  const handleSubmitProof = () => {
    if (proofData.trim()) {
      onSubmitProof(Number(task.id), proofData);
      setShowProofInput(false);
      setProofData("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card variant="glass" className="h-full flex flex-col overflow-hidden group">
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs px-2 py-1 rounded-full bg-${statusConfig.color}-500/20 text-${statusConfig.color}-400 flex items-center gap-1`}>
            <span>{statusConfig.icon}</span>
            {statusConfig.label}
          </span>
        </div>

        <CardContent className="flex-1 flex flex-col pt-6">
          {/* Task ID */}
          <span className="text-xs text-gray-500 mb-2">Task #{Number(task.id)}</span>

          {/* Description */}
          <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-indigo-300 transition-colors">
            {task.description}
          </h3>

          {/* Meta Info */}
          <div className="space-y-2 text-sm text-gray-400 mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-green-400 font-semibold">{task.rewardFormatted}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{task.createdAtDate.toLocaleDateString()}</span>
            </div>
            {task.volunteer !== "0x0000000000000000000000000000000000000000" && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className={isMyTask ? "text-indigo-400" : ""}>
                  {isMyTask ? "You" : task.volunteerFormatted}
                </span>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="space-y-2 mt-auto">
            {/* Open task - can claim */}
            {task.status === TaskStatus.OPEN && (
              <Button
                variant="primary"
                className="w-full"
                onClick={() => onClaim(Number(task.id))}
                disabled={isClaiming || !currentAddress}
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Hand className="h-4 w-4 mr-2" />
                    Claim Task
                  </>
                )}
              </Button>
            )}

            {/* Claimed by me - can submit proof */}
            {task.status === TaskStatus.CLAIMED && isMyTask && (
              <>
                {showProofInput ? (
                  <div className="space-y-2">
                    <Input
                      value={proofData}
                      onChange={(e) => setProofData(e.target.value)}
                      placeholder="Enter proof (IPFS hash, description, etc.)"
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => setShowProofInput(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={handleSubmitProof}
                        disabled={isSubmitting || !proofData.trim()}
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => setShowProofInput(true)}
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Submit Proof
                  </Button>
                )}
              </>
            )}

            {/* Claimed by someone else */}
            {task.status === TaskStatus.CLAIMED && !isMyTask && (
              <div className="text-center text-sm text-gray-500 py-2">
                Claimed by another volunteer
              </div>
            )}

            {/* Proof submitted - waiting for verification */}
            {task.status === TaskStatus.PROOF_SUBMITTED && (
              <div className="text-center text-sm text-purple-400 py-2 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Awaiting Admin Verification
              </div>
            )}

            {/* Completed */}
            {(task.status === TaskStatus.VERIFIED || task.status === TaskStatus.PAID) && (
              <div className="text-center text-sm text-green-400 py-2 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Task Completed
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function TasksPage() {
  const { isConnected, address } = useAccount();
  const [activeTab, setActiveTab] = useState<"available" | "my-tasks">("available");
  const [claimingTaskId, setClaimingTaskId] = useState<number | null>(null);
  const [submittingTaskId, setSubmittingTaskId] = useState<number | null>(null);

  const { openTasks, isLoading: isLoadingTasks, refetch: refetchTasks } = useAllTasks();
  const { myTasks, claimedTasks, pendingTasks, completedTasks } = useMyTasks(address as `0x${string}` | undefined);

  const { claimTask, isPending: isClaiming, isSuccess: claimSuccess, reset: resetClaim } = useClaimTask();
  const { submitProof, isPending: isSubmitting, isSuccess: submitSuccess, reset: resetSubmit } = useSubmitProof();

  // Handle claim
  const handleClaim = (taskId: number) => {
    setClaimingTaskId(taskId);
    claimTask(taskId);
  };

  // Handle submit proof
  const handleSubmitProof = (taskId: number, proof: string) => {
    setSubmittingTaskId(taskId);
    submitProof(taskId, proof);
  };

  // Refresh on success
  if (claimSuccess) {
    setTimeout(() => {
      resetClaim();
      setClaimingTaskId(null);
      refetchTasks();
    }, 1500);
  }

  if (submitSuccess) {
    setTimeout(() => {
      resetSubmit();
      setSubmittingTaskId(null);
      refetchTasks();
    }, 1500);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tasks" },
        ]}
        icon={Briefcase}
        iconColor="text-emerald-400"
        iconBg="bg-emerald-500/20"
        title="Volunteer Tasks"
        subtitle="Complete tasks to earn USDC rewards and build your Impact NFT reputation"
      >
        <Link href="/reputation">
          <Button variant="secondary" size="sm">
            <Trophy className="h-4 w-4 mr-1" />
            My Reputation
          </Button>
        </Link>
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-2 justify-center">
        <Button
          variant={activeTab === "available" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("available")}
        >
          Available Tasks ({openTasks.length})
        </Button>
        <Button
          variant={activeTab === "my-tasks" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("my-tasks")}
          disabled={!isConnected}
        >
          My Tasks ({myTasks.length})
        </Button>
      </div>

      {/* Not Connected Warning */}
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Connect your wallet to claim tasks and earn rewards</span>
        </motion.div>
      )}

      {/* Content */}
      {activeTab === "available" ? (
        <>
          {isLoadingTasks ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
            </div>
          ) : openTasks.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-16 w-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Available Tasks</h3>
              <p className="text-gray-400">Check back later for new volunteer opportunities.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {openTasks.map((task) => (
                <TaskCard
                  key={Number(task.id)}
                  task={task}
                  onClaim={handleClaim}
                  onSubmitProof={handleSubmitProof}
                  isClaiming={isClaiming && claimingTaskId === Number(task.id)}
                  isSubmitting={isSubmitting && submittingTaskId === Number(task.id)}
                  currentAddress={address}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {myTasks.length === 0 ? (
            <div className="text-center py-16">
              <User className="h-16 w-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Tasks Yet</h3>
              <p className="text-gray-400 mb-4">Claim an available task to get started!</p>
              <Button variant="primary" onClick={() => setActiveTab("available")}>
                Browse Available Tasks
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Tasks */}
              {(claimedTasks.length > 0 || pendingTasks.length > 0) && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    Active Tasks ({claimedTasks.length + pendingTasks.length})
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...claimedTasks, ...pendingTasks].map((task) => (
                      <TaskCard
                        key={Number(task.id)}
                        task={task}
                        onClaim={handleClaim}
                        onSubmitProof={handleSubmitProof}
                        isClaiming={isClaiming && claimingTaskId === Number(task.id)}
                        isSubmitting={isSubmitting && submittingTaskId === Number(task.id)}
                        currentAddress={address}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    Completed Tasks ({completedTasks.length})
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {completedTasks.map((task) => (
                      <TaskCard
                        key={Number(task.id)}
                        task={task}
                        onClaim={handleClaim}
                        onSubmitProof={handleSubmitProof}
                        isClaiming={false}
                        isSubmitting={false}
                        currentAddress={address}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
