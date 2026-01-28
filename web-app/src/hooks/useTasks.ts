"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { formatUnits, toHex, keccak256 } from "viem";
import { useState, useEffect, useCallback } from "react";
import { ABIS } from "@/lib/contracts/abis";
import { CHAIN_ID, getCurrentDeployment } from "@/lib/contracts/deployments";
import { txToast } from "./useToast";

// ============================================
// TASK STATUS ENUM (matches smart contract)
// ============================================
export enum TaskStatus {
  OPEN = 0,
  CLAIMED = 1,
  PROOF_SUBMITTED = 2,
  VERIFIED = 3,
  PAID = 4,
  CANCELLED = 5,
}

export const TASK_STATUS_CONFIG = {
  [TaskStatus.OPEN]: { label: "Open", color: "yellow", icon: "🟡" },
  [TaskStatus.CLAIMED]: { label: "Claimed", color: "blue", icon: "🔵" },
  [TaskStatus.PROOF_SUBMITTED]: { label: "Proof Submitted", color: "purple", icon: "🟣" },
  [TaskStatus.VERIFIED]: { label: "Verified", color: "green", icon: "🟢" },
  [TaskStatus.PAID]: { label: "Paid", color: "green", icon: "✅" },
  [TaskStatus.CANCELLED]: { label: "Cancelled", color: "gray", icon: "⚫" },
};

// ============================================
// TASK INTERFACE
// ============================================
export interface Task {
  id: bigint;
  description: string;
  reward: bigint;
  volunteer: `0x${string}`;
  proofHash: `0x${string}`;
  status: TaskStatus;
  geoHash: `0x${string}`;
  createdAt: bigint;
  claimedAt: bigint;
  completedAt: bigint;
}

export interface TaskDisplay extends Task {
  rewardFormatted: string;
  statusLabel: string;
  statusColor: string;
  statusIcon: string;
  volunteerFormatted: string;
  createdAtDate: Date;
  isOpen: boolean;
  isClaimed: boolean;
  isPending: boolean;
  isCompleted: boolean;
}

// ============================================
// READ HOOKS
// ============================================

/**
 * Hook to get total task count
 */
export function useTaskCount() {
  const deployment = getCurrentDeployment();
  
  const { data, isLoading, isError, refetch } = useReadContract({
    address: deployment.VAULT_ADDRESS as `0x${string}`,
    abi: ABIS.ParametricVault,
    functionName: "getTaskCount",
    chainId: CHAIN_ID,
    query: {
      staleTime: 30000,
    },
  });

  return {
    taskCount: data ? Number(data) : 0,
    isLoading,
    isError,
    refetch,
  };
}

/**
 * Hook to get a single task by ID
 */
export function useTask(taskId: number | undefined) {
  const deployment = getCurrentDeployment();
  
  const { data, isLoading, isError, refetch } = useReadContract({
    address: deployment.VAULT_ADDRESS as `0x${string}`,
    abi: ABIS.ParametricVault,
    functionName: "getTask",
    args: taskId !== undefined ? [BigInt(taskId)] : undefined,
    chainId: CHAIN_ID,
    query: {
      enabled: taskId !== undefined && taskId > 0,
      staleTime: 10000,
    },
  });

  const task = data as Task | undefined;
  
  const taskDisplay: TaskDisplay | undefined = task ? {
    ...task,
    rewardFormatted: `$${Number(formatUnits(task.reward, 6)).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    statusLabel: TASK_STATUS_CONFIG[Number(task.status) as TaskStatus]?.label || "Unknown",
    statusColor: TASK_STATUS_CONFIG[Number(task.status) as TaskStatus]?.color || "gray",
    statusIcon: TASK_STATUS_CONFIG[Number(task.status) as TaskStatus]?.icon || "❓",
    volunteerFormatted: task.volunteer === "0x0000000000000000000000000000000000000000" 
      ? "Unassigned" 
      : `${task.volunteer.slice(0, 6)}...${task.volunteer.slice(-4)}`,
    createdAtDate: new Date(Number(task.createdAt) * 1000),
    isOpen: Number(task.status) === TaskStatus.OPEN,
    isClaimed: Number(task.status) === TaskStatus.CLAIMED,
    isPending: Number(task.status) === TaskStatus.PROOF_SUBMITTED,
    isCompleted: Number(task.status) === TaskStatus.PAID || Number(task.status) === TaskStatus.VERIFIED,
  } : undefined;

  return {
    task: taskDisplay,
    rawTask: task,
    isLoading,
    isError,
    refetch,
  };
}

/**
 * Hook to get all tasks (fetches all by iterating through task count)
 */
export function useAllTasks() {
  const { taskCount, isLoading: isCountLoading } = useTaskCount();
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const deployment = getCurrentDeployment();
  
  const [tasks, setTasks] = useState<TaskDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchAllTasks = useCallback(async () => {
    console.log(`[useAllTasks] Fetching for taskCount: ${taskCount}, address: ${deployment.VAULT_ADDRESS}`);
    if (!publicClient || taskCount === 0) {
      if (taskCount === 0) console.log("[useAllTasks] taskCount is 0, skipping fetch.");
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    try {
      const taskPromises = [];
      for (let i = 1; i <= taskCount; i++) {
        taskPromises.push(
          publicClient.readContract({
            address: deployment.VAULT_ADDRESS as `0x${string}`,
            abi: ABIS.ParametricVault,
            functionName: "getTask",
            args: [BigInt(i)],
          })
        );
      }

      const results = await Promise.all(taskPromises);
      console.log(`[useAllTasks] Raw results for ${results.length} tasks:`, results);
      
      const parsedTasks: TaskDisplay[] = results
        .filter((t): t is Task => {
          const isValid = t !== null && (t as Task).id > BigInt(0);
          if (!isValid) console.warn("[useAllTasks] Invalid task found in results:", t);
          return isValid;
        })
        .map((task) => {
          console.log(`[useAllTasks] Parsing task ${task.id}:`, {
            status: task.status,
            statusNum: Number(task.status),
            isOpen: Number(task.status) === TaskStatus.OPEN
          });
          
          return {
            ...task,
            rewardFormatted: `$${Number(formatUnits(task.reward, 6)).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            statusLabel: TASK_STATUS_CONFIG[Number(task.status) as TaskStatus]?.label || "Unknown",
            statusColor: TASK_STATUS_CONFIG[Number(task.status) as TaskStatus]?.color || "gray",
            statusIcon: TASK_STATUS_CONFIG[Number(task.status) as TaskStatus]?.icon || "❓",
            volunteerFormatted: task.volunteer === "0x0000000000000000000000000000000000000000" 
              ? "Unassigned" 
              : `${task.volunteer.slice(0, 6)}...${task.volunteer.slice(-4)}`,
            createdAtDate: new Date(Number(task.createdAt) * 1000),
            isOpen: Number(task.status) === TaskStatus.OPEN,
            isClaimed: Number(task.status) === TaskStatus.CLAIMED,
            isPending: Number(task.status) === TaskStatus.PROOF_SUBMITTED,
            isCompleted: Number(task.status) === TaskStatus.PAID || Number(task.status) === TaskStatus.VERIFIED,
          };
        });

      setTasks(parsedTasks.sort((a, b) => Number(b.id) - Number(a.id))); // Newest first
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, taskCount, deployment.VAULT_ADDRESS]);

  useEffect(() => {
    if (!isCountLoading) {
      fetchAllTasks();
    }
  }, [isCountLoading, fetchAllTasks]);

  return {
    tasks,
    openTasks: tasks.filter(t => t.isOpen),
    claimedTasks: tasks.filter(t => t.isClaimed),
    pendingTasks: tasks.filter(t => t.isPending),
    completedTasks: tasks.filter(t => t.isCompleted),
    taskCount,
    isLoading: isLoading || isCountLoading,
    isError,
    refetch: fetchAllTasks,
  };
}

/**
 * Hook to get tasks assigned to a specific volunteer
 */
export function useMyTasks(volunteerAddress: `0x${string}` | undefined) {
  const { tasks, isLoading, isError, refetch } = useAllTasks();

  const myTasks = volunteerAddress 
    ? tasks.filter(t => t.volunteer.toLowerCase() === volunteerAddress.toLowerCase())
    : [];

  return {
    myTasks,
    claimedTasks: myTasks.filter(t => t.isClaimed),
    pendingTasks: myTasks.filter(t => t.isPending),
    activeTasks: myTasks.filter(t => t.isClaimed || t.isPending),
    completedTasks: myTasks.filter(t => t.isCompleted),
    isLoading,
    isError,
    refetch,
  };
}

// ============================================
// WRITE HOOKS - ADMIN (DAO_ROLE)
// ============================================

/**
 * Hook to create a new task (Admin only)
 */
export function useCreateTask() {
  const deployment = getCurrentDeployment();
  
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (hash) {
      txToast(hash, "Task creation submitted");
    }
  }, [hash]);

  const createTask = (description: string, rewardUsdc: number, geoHash?: string) => {
    const rewardAmount = BigInt(Math.floor(rewardUsdc * 1e6)); // Convert to 6 decimals
    const geoHashBytes = geoHash 
      ? keccak256(toHex(geoHash)) as `0x${string}`
      : "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

    writeContract({
      address: deployment.VAULT_ADDRESS as `0x${string}`,
      abi: ABIS.ParametricVault,
      functionName: "createTask",
      args: [description, rewardAmount, geoHashBytes],
      gas: BigInt(500000),
    });
  };

  return {
    createTask,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook to verify and pay a completed task (Admin only)
 */
export function useVerifyAndPay() {
  const deployment = getCurrentDeployment();
  
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (hash) {
      txToast(hash, "Task verification submitted");
    }
  }, [hash]);

  const verifyAndPay = (taskId: number) => {
    writeContract({
      address: deployment.VAULT_ADDRESS as `0x${string}`,
      abi: ABIS.ParametricVault,
      functionName: "verifyAndPay",
      args: [BigInt(taskId)],
      gas: BigInt(300000),
    });
  };

  return {
    verifyAndPay,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook to cancel an open task (Admin only)
 */
export function useCancelTask() {
  const deployment = getCurrentDeployment();
  
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (hash) {
      txToast(hash, "Task cancellation submitted");
    }
  }, [hash]);

  const cancelTask = (taskId: number) => {
    writeContract({
      address: deployment.VAULT_ADDRESS as `0x${string}`,
      abi: ABIS.ParametricVault,
      functionName: "cancelTask",
      args: [BigInt(taskId)],
      gas: BigInt(200000),
    });
  };

  return {
    cancelTask,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
    reset,
  };
}

// ============================================
// WRITE HOOKS - VOLUNTEER (Public)
// ============================================

/**
 * Hook to claim an open task
 */
export function useClaimTask() {
  const deployment = getCurrentDeployment();
  
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (hash) {
      txToast(hash, "Task claim submitted");
    }
  }, [hash]);

  const claimTask = (taskId: number) => {
    writeContract({
      address: deployment.VAULT_ADDRESS as `0x${string}`,
      abi: ABIS.ParametricVault,
      functionName: "claimTask",
      args: [BigInt(taskId)],
      gas: BigInt(200000),
    });
  };

  return {
    claimTask,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook to submit proof for a claimed task
 */
export function useSubmitProof() {
  const deployment = getCurrentDeployment();
  
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (hash) {
      txToast(hash, "Proof submission submitted");
    }
  }, [hash]);

  const submitProof = (taskId: number, proofData: string) => {
    // Hash the proof data (could be IPFS hash, photo hash, etc.)
    const proofHash = keccak256(toHex(proofData)) as `0x${string}`;

    writeContract({
      address: deployment.VAULT_ADDRESS as `0x${string}`,
      abi: ABIS.ParametricVault,
      functionName: "submitProof",
      args: [BigInt(taskId), proofHash],
      gas: BigInt(200000),
    });
  };

  return {
    submitProof,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
    reset,
  };
}
