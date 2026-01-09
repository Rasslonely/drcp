import { useReadContract, useReadContracts, useWriteContract, useAccount } from 'wagmi';
import { ABIS } from '../constants/abis';
import { DEPLOYMENTS } from '../constants/deployments';

const CONTRACTS = DEPLOYMENTS.amoy;

export const useReputation = () => {
  const { address } = useAccount();
  return useReadContract({
    abi: ABIS.ImpactNFT,
    address: CONTRACTS.ImpactNFT as `0x${string}`,
    functionName: 'getImpact',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });
};

export const useTasks = () => {
  // 1. Get Count
  const { data: countData } = useReadContract({
    abi: ABIS.ParametricVault,
    address: CONTRACTS.VAULT_ADDRESS as `0x${string}`,
    functionName: 'getTaskCount',
  });

  const count = countData ? Number(countData) : 0;
  
  // 2. Prepare calls for all tasks (or last 20)
  // Create array [1, 2, ..., count]
  const taskIds = Array.from({ length: count }, (_, i) => BigInt(i + 1));

  // 3. Batch Read
  const { data: tasksData, isLoading, refetch } = useReadContracts({
    contracts: taskIds.map(id => ({
        abi: ABIS.ParametricVault,
        address: CONTRACTS.VAULT_ADDRESS as `0x${string}`,
        functionName: 'getTask',
        args: [id]
    })),
    query: {
        enabled: count > 0
    }
  });

  // 4. Transform Data
  const tasks = tasksData?.map((result, index) => {
      if (result.status === 'success') {
          return { ...(result.result as any), id: taskIds[index] }; // Append ID
      }
      return null;
  }).filter(t => t !== null) || [];

  return { tasks, count, isLoading, refetch };
};

export const useClaimTask = () => {
    const { writeContract, isPending, isSuccess } = useWriteContract();
    
    const claim = (taskId: bigint) => {
        writeContract({
            abi: ABIS.ParametricVault,
            address: CONTRACTS.VAULT_ADDRESS as `0x${string}`,
            functionName: 'claimTask',
            args: [taskId]
        });
    };
    
    return { claim, isPending, isSuccess };
};
