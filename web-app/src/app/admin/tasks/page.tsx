"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  DollarSign,
  MapPin,
  User,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { useAccount } from "wagmi";
import { ADMIN_ADDRESSES } from "@/lib/contracts/deployments";
import {
  useAllTasks,
  useCreateTask,
  useVerifyAndPay,
  useCancelTask,
  TaskStatus,
  TASK_STATUS_CONFIG,
  TaskDisplay,
} from "@/hooks";
import Link from "next/link";

// Check if wallet address is in admin list (case-insensitive)
function isAdmin(address: string | undefined): boolean {
  if (!address) return false;
  return ADMIN_ADDRESSES.some(
    (admin) => admin.toLowerCase() === address.toLowerCase()
  );
}

// ============================================
// STAT CARD COMPONENT
// ============================================
function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: number; 
  icon: React.ElementType; 
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

// ============================================
// CREATE TASK MODAL
// ============================================
function CreateTaskForm({ onClose }: { onClose: () => void }) {
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [location, setLocation] = useState("");
  
  const { createTask, isPending, isConfirming, isSuccess, error, reset } = useCreateTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !reward) return;
    createTask(description, parseFloat(reward), location || undefined);
  };

  // Close modal on success
  if (isSuccess) {
    setTimeout(() => {
      reset();
      onClose();
    }, 1500);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card variant="glass" className="border border-indigo-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-400" />
              Create New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Task Description *</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Distribute water bottles to Camp A"
                  required
                />
              </div>

              {/* Reward */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Reward (USDC) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="number"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                    placeholder="100"
                    className="pl-9"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Location (optional)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Jakarta, Indonesia"
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                  <AlertTriangle className="inline h-4 w-4 mr-2" />
                  {error.message?.slice(0, 100) || "Transaction failed"}
                </div>
              )}

              {/* Success */}
              {isSuccess && (
                <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm">
                  <CheckCircle2 className="inline h-4 w-4 mr-2" />
                  Task created successfully!
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isPending || isConfirming}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={isPending || isConfirming || !description || !reward}
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isPending ? "Confirming..." : "Creating..."}
                    </>
                  ) : (
                    "Create Task"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// TASK ROW COMPONENT
// ============================================
function TaskRow({ 
  task, 
  onVerify, 
  onCancel,
  isVerifying,
  isCancelling,
}: { 
  task: TaskDisplay;
  onVerify: (id: number) => void;
  onCancel: (id: number) => void;
  isVerifying: boolean;
  isCancelling: boolean;
}) {
  const statusConfig = TASK_STATUS_CONFIG[task.status];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
    >
      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{statusConfig.icon}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full bg-${statusConfig.color}-500/20 text-${statusConfig.color}-400`}>
            {statusConfig.label}
          </span>
          <span className="text-xs text-gray-500">#{Number(task.id)}</span>
        </div>
        <p className="text-white font-medium truncate">{task.description}</p>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {task.rewardFormatted}
          </span>
          {task.volunteer !== "0x0000000000000000000000000000000000000000" && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.volunteerFormatted}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.createdAtDate.toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 shrink-0">
        {task.status === TaskStatus.OPEN && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onCancel(Number(task.id))}
            disabled={isCancelling}
            className="text-red-400 hover:text-red-300"
          >
            {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            <span className="ml-1 hidden sm:inline">Cancel</span>
          </Button>
        )}
        {task.status === TaskStatus.PROOF_SUBMITTED && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onVerify(Number(task.id))}
            disabled={isVerifying}
          >
            {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            <span className="ml-1">Verify & Pay</span>
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function AdminTasksPage() {
  const { isConnected, address, isConnecting } = useAccount();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [verifyingTaskId, setVerifyingTaskId] = useState<number | null>(null);
  const [cancellingTaskId, setCancellingTaskId] = useState<number | null>(null);

  const { 
    tasks, 
    openTasks, 
    claimedTasks, 
    pendingTasks, 
    completedTasks,
    isLoading: isLoadingTasks,
    refetch: refetchTasks,
  } = useAllTasks();

  const { verifyAndPay, isPending: isVerifying, isSuccess: verifySuccess, reset: resetVerify } = useVerifyAndPay();
  const { cancelTask, isPending: isCancelling, isSuccess: cancelSuccess, reset: resetCancel } = useCancelTask();

  // Handle verify
  const handleVerify = (taskId: number) => {
    setVerifyingTaskId(taskId);
    verifyAndPay(taskId);
  };

  // Handle cancel
  const handleCancel = (taskId: number) => {
    setCancellingTaskId(taskId);
    cancelTask(taskId);
  };

  // Refresh on success
  if (verifySuccess) {
    setTimeout(() => {
      resetVerify();
      setVerifyingTaskId(null);
      refetchTasks();
    }, 1500);
  }

  if (cancelSuccess) {
    setTimeout(() => {
      resetCancel();
      setCancellingTaskId(null);
      refetchTasks();
    }, 1500);
  }

  // Loading state
  if (isConnecting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
      </div>
    );
  }

  // Not connected or not admin
  if (!isConnected || !isAdmin(address)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-gray-400">
            {!isConnected 
              ? "Please connect your wallet to access task management."
              : "Your wallet is not authorized for admin access."
            }
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/admin" },
          { label: "Tasks" },
        ]}
        icon={ClipboardList}
        iconColor="text-indigo-400"
        iconBg="bg-indigo-500/20"
        title="Task Management"
        subtitle="Create and manage volunteer tasks for disaster relief"
      >
        <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Create Task
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open Tasks" value={openTasks.length} icon={Clock} color="bg-yellow-500/20 text-yellow-400" />
        <StatCard label="Claimed" value={claimedTasks.length} icon={User} color="bg-blue-500/20 text-blue-400" />
        <StatCard label="Pending Verify" value={pendingTasks.length} icon={AlertTriangle} color="bg-purple-500/20 text-purple-400" />
        <StatCard label="Completed" value={completedTasks.length} icon={CheckCircle2} color="bg-green-500/20 text-green-400" />
      </div>

      {/* Task List */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-indigo-400" />
              All Tasks ({tasks.length})
            </span>
            {isLoadingTasks && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTasks && tasks.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No tasks created yet.</p>
              <p className="text-sm text-gray-500 mt-1">Click "Create Task" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskRow
                  key={Number(task.id)}
                  task={task}
                  onVerify={handleVerify}
                  onCancel={handleCancel}
                  isVerifying={isVerifying && verifyingTaskId === Number(task.id)}
                  isCancelling={isCancelling && cancellingTaskId === Number(task.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back to Admin */}
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Admin Console
      </Link>

      {/* Create Task Modal */}
      {showCreateModal && <CreateTaskForm onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
