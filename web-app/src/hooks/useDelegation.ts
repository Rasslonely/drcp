"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  usePublicClient,
  useReadContract,
  useWriteContract,
  useAccount,
} from "wagmi";
import { formatUnits, parseAbiItem, zeroAddress } from "viem";
import { ABIS } from "@/lib/contracts/abis";
import { RESCUE_TOKEN_ADDRESS } from "@/lib/contracts/deployments";

// ============ Types ============

export interface DelegateProfile {
  displayName: string;
  statement: string;
  avatar?: string;
  registeredAt: number;
}

export interface DelegateInfo {
  address: `0x${string}`;
  addressFormatted: string;
  votingPower: bigint;
  votingPowerFormatted: string;
  votingPowerPercent: number;
  participationRate: number;
  recentVotes: number;
  profile: DelegateProfile | null;
}

// Local storage key for delegate profiles
const DELEGATE_PROFILES_KEY = "drcp_delegate_profiles";

// ============ EIP-712 Constants ============

export const EIP712_DOMAIN = {
  name: "DRCP Delegate Registry",
  version: "1",
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID === "137" ? 137 : 80002, // Polygon or Amoy
} as const;

export const EIP712_TYPES = {
  DelegateProfile: [
    { name: "address", type: "address" },
    { name: "displayName", type: "string" },
    { name: "statement", type: "string" },
    { name: "avatar", type: "string" },
    { name: "timestamp", type: "uint256" },
  ],
} as const;

// ============ Helper Functions ============

function formatAddress(address: string): string {
  if (!address || address === zeroAddress) return "Not delegated";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatVotingPower(votes: bigint): string {
  const formatted = parseFloat(formatUnits(votes, 18));
  if (formatted >= 1_000_000) {
    return `${(formatted / 1_000_000).toFixed(2)}M`;
  }
  if (formatted >= 1_000) {
    return `${(formatted / 1_000).toFixed(1)}K`;
  }
  return formatted.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

// Load profiles from localStorage
function loadProfiles(): Record<string, DelegateProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DELEGATE_PROFILES_KEY);
    if (!raw) return {};
    
    const parsed = JSON.parse(raw);
    const normalized: Record<string, DelegateProfile> = {};
    
    // Normalize keys to lowercase on load for robustness
    Object.keys(parsed).forEach(addr => {
      normalized[addr.toLowerCase()] = parsed[addr];
    });
    
    return normalized;
  } catch {
    return {};
  }
}

// Save profiles to localStorage
function saveProfiles(profiles: Record<string, DelegateProfile>): void {
  if (typeof window === "undefined") return;
  try {
    const normalized: Record<string, DelegateProfile> = {};
    Object.keys(profiles).forEach(addr => {
      normalized[addr.toLowerCase()] = profiles[addr];
    });
    localStorage.setItem(DELEGATE_PROFILES_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore storage errors
  }
}

// ============ useDelegation Hook ============

/**
 * Hook to get current user's delegation status
 */
export function useDelegation() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(true);
  const [currentDelegate, setCurrentDelegate] = useState<`0x${string}` | null>(null);
  const [votingPower, setVotingPower] = useState<bigint>(BigInt(0));
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));

  // Fetch delegation data
  const fetchDelegation = useCallback(async () => {
    if (!address || !publicClient || !isConnected) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get current delegate
      const delegate = await publicClient.readContract({
        address: RESCUE_TOKEN_ADDRESS,
        abi: ABIS.RescueToken,
        functionName: "delegates",
        args: [address],
      }) as `0x${string}`;

      // Get voting power
      const votes = await publicClient.readContract({
        address: RESCUE_TOKEN_ADDRESS,
        abi: ABIS.RescueToken,
        functionName: "getVotes",
        args: [address],
      }) as bigint;

      // Get token balance
      const balance = await publicClient.readContract({
        address: RESCUE_TOKEN_ADDRESS,
        abi: ABIS.RescueToken,
        functionName: "balanceOf",
        args: [address],
      }) as bigint;

      setCurrentDelegate(delegate === zeroAddress ? null : delegate);
      setVotingPower(votes);
      setTokenBalance(balance);
    } catch (error) {
      console.error("Error fetching delegation:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, isConnected]);

  useEffect(() => {
    fetchDelegation();
  }, [fetchDelegation]);

  const isDelegatedToSelf = currentDelegate?.toLowerCase() === address?.toLowerCase();
  const isNotDelegated = !currentDelegate || currentDelegate === zeroAddress;
  const delegateFormatted = currentDelegate ? formatAddress(currentDelegate) : "None";

  return {
    currentDelegate,
    delegateFormatted,
    votingPower,
    votingPowerFormatted: formatVotingPower(votingPower),
    tokenBalance,
    tokenBalanceFormatted: formatVotingPower(tokenBalance),
    isDelegatedToSelf,
    isNotDelegated,
    isLoading,
    refetch: fetchDelegation,
  };
}

// ============ useDelegate Hook ============

/**
 * Hook to delegate voting power
 */
export function useDelegate() {
  const { address } = useAccount();
  const { writeContract, isPending, isSuccess, error, reset } = useWriteContract();
  const { refetch } = useDelegation();

  const delegate = useCallback(
    (to: `0x${string}`) => {
      writeContract({
        address: RESCUE_TOKEN_ADDRESS,
        abi: ABIS.RescueToken,
        functionName: "delegate",
        args: [to],
      });
    },
    [writeContract]
  );

  const delegateToSelf = useCallback(() => {
    if (address) {
      delegate(address);
    }
  }, [address, delegate]);

  // Refetch delegation after successful tx
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        refetch();
      }, 2000); // Wait for chain confirmation
      return () => clearTimeout(timer);
    }
  }, [isSuccess, refetch]);

  return {
    delegate,
    delegateToSelf,
    isPending,
    isSuccess,
    error,
    reset,
  };
}

// ============ useTopDelegates Hook ============

// Fallback Subgraph URL matching client.ts
const SUBGRAPH_FALLBACK = 'https://api.studio.thegraph.com/query/1721760/drcp-polygon-amoy/v0.0.7';

/**
 * Hook to get top delegates by voting power
 * 
 * OPTIMIZED: Uses subgraph for addresses + API for profiles.
 */
export function useTopDelegates(limit: number = 10, currentUserAddress?: string, currentUserVP?: bigint) {
  const [delegates, setDelegates] = useState<DelegateInfo[]>([]);
  const [totalDelegatedPower, setTotalDelegatedPower] = useState<bigint>(BigInt(0));
  const [totalSupply, setTotalSupply] = useState<bigint>(BigInt(0));
  const [delegationRate, setDelegationRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  const fetchFromSubgraph = useCallback(async (): Promise<boolean> => {
    try {
      const subgraphUrl = process.env.NEXT_PUBLIC_SUBGRAPH_URL || SUBGRAPH_FALLBACK;
      
      // 1. Fetch from subgraph (voting power) - attempt but don't crash if fails
      let subDelegates: any[] = [];
      let subStats: any = null;
      
      try {
        const query = `
          query GetTopDelegates($first: Int!) {
            delegates(
              first: $first
              orderBy: votingPower
              orderDirection: desc
              where: { votingPower_gt: "0" }
            ) {
              id
              address
              votingPower
            }
            delegateStats(id: "global") {
              totalVotingPower
              totalSupply
              delegationRate
            }
          }
        `;

      console.log(`[useTopDelegates] Fetching from Subgraph: ${subgraphUrl}`);
      const subResponse = await fetch(subgraphUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { first: limit * 2 } }),
        cache: 'no-store',
      });

      if (subResponse.ok) {
        const subJson = await subResponse.json();
        if (subJson.data) {
          subDelegates = subJson.data.delegates || [];
          subStats = subJson.data.delegateStats;
          console.log(`[useTopDelegates] Subgraph returned ${subDelegates.length} delegates`);
        }
      } else {
        console.warn(`[useTopDelegates] Subgraph HTTP error: ${subResponse.status}`);
      }
    } catch (err) {
      console.warn("[useTopDelegates] Subgraph fetch failed:", err);
    }

    // 2. Fetch all profiles from Redis API (Source of Truth)
    let apiProfiles: Record<string, DelegateProfile> = {};
    try {
      console.log("[useTopDelegates] Fetching profiles from API...");
      const apiResponse = await fetch("/api/delegates", { cache: 'no-store' });
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        const profilesList = apiData.delegates || [];
        console.log(`[useTopDelegates] API returned ${profilesList.length} profiles`);
        
        profilesList.forEach((p: any) => {
          apiProfiles[p.address.toLowerCase()] = {
            displayName: p.displayName,
            statement: p.statement,
            avatar: p.avatar,
            registeredAt: p.registeredAt,
          };
        });
      } else {
        console.warn(`[useTopDelegates] API profiles fetch error: ${apiResponse.status}`);
      }
    } catch (apiErr) {
      console.warn("[useTopDelegates] API profiles fetch failed:", apiErr);
    }

      // 3. Fallback to LocalStorage
      const localProfiles = loadProfiles();
      const mergedProfiles = { ...apiProfiles, ...localProfiles };

      // 4. Merge data
      const supply = subStats?.totalSupply 
        ? BigInt(subStats.totalSupply) 
        : BigInt(0);
      
      const subgraphDelegateMap = new Map<string, any>();
      subDelegates.forEach((d: any) => {
        subgraphDelegateMap.set(d.address.toLowerCase(), d);
      });

      const allAddresses = new Set([
        ...subgraphDelegateMap.keys(),
        ...Object.keys(mergedProfiles)
      ]);

      // Always include current user if they have VP or Profile
      if (currentUserAddress) {
        allAddresses.add(currentUserAddress.toLowerCase());
      }

      if (allAddresses.size === 0) {
        console.log("[useTopDelegates] No delegates found in Subgraph or Redis");
        return false;
      }

      const uniqueAddressArray = Array.from(allAddresses);
      
      // 5. Enrichment: Fetch real-time VP for all addresses via RPC (Multicall)
      // This solves the Subgraph lag even for guest/incognito users.
      let realTimeVPMap = new Map<string, bigint>();
      if (publicClient && uniqueAddressArray.length > 0) {
        try {
          console.log(`[useTopDelegates] Syncing ${uniqueAddressArray.length} delegates via RPC...`);
          const results = await publicClient.multicall({
            contracts: uniqueAddressArray.map(addr => ({
              address: RESCUE_TOKEN_ADDRESS,
              abi: ABIS.RescueToken,
              functionName: 'getVotes',
              args: [addr as `0x${string}`],
            })),
          });
          
          results.forEach((res, i) => {
            if (res.status === 'success') {
              realTimeVPMap.set(uniqueAddressArray[i].toLowerCase(), res.result as bigint);
            }
          });
          console.log(`[useTopDelegates] RPC sync complete`);
        } catch (rpcErr) {
          console.warn("[useTopDelegates] RPC multicall failed, falling back to Subgraph data", rpcErr);
        }
      }

      const delegatesData: DelegateInfo[] = uniqueAddressArray.map((addr) => {
        const subData = subgraphDelegateMap.get(addr);
        
        // Priority: 
        // 1. Real-time RPC override (from multicall)
        // 2. Specific currentUserVP (if explicitly passed and multicall failed)
        // 3. Subgraph data (laggy backup)
        let votingPower = realTimeVPMap.has(addr.toLowerCase())
          ? realTimeVPMap.get(addr.toLowerCase())!
          : (currentUserAddress?.toLowerCase() === addr.toLowerCase() && currentUserVP !== undefined)
            ? currentUserVP
            : (subData ? BigInt(subData.votingPower) : BigInt(0));
        
        return {
          address: addr as `0x${string}`,
          addressFormatted: formatAddress(addr),
          votingPower,
          votingPowerFormatted: formatVotingPower(votingPower),
          votingPowerPercent: supply > BigInt(0) 
            ? Number((votingPower * BigInt(10000)) / supply) / 100 
            : 0,
          participationRate: 0,
          recentVotes: 0,
          profile: mergedProfiles[addr] || null,
        };
      });

      // Filter and sort: 
      // 1. Must have EITHER voting power > 0 OR a profile
      // 2. Sort by voting power desc
      const filteredDelegates = delegatesData
        .filter(d => d.votingPower > BigInt(0) || d.profile !== null)
        .sort((a, b) => {
          if (b.votingPower !== a.votingPower) {
            return b.votingPower > a.votingPower ? 1 : -1;
          }
          // Tie-break with registration date if available
          return (b.profile?.registeredAt || 0) - (a.profile?.registeredAt || 0);
        });

      setDelegates(filteredDelegates.slice(0, limit));
      
      if (subStats) {
        setTotalDelegatedPower(BigInt(subStats.totalVotingPower || 0));
        setTotalSupply(supply);
        setDelegationRate(parseFloat(subStats.delegationRate || "0"));
      }

      return true;
    } catch (error) {
      console.warn("[useTopDelegates] Fetch failed:", error);
      return false;
    }
  }, [limit, currentUserAddress, currentUserVP]);

  const fetchMinimal = useCallback(async () => {
    if (!publicClient) return;
    try {
      const supply = await publicClient.readContract({
        address: RESCUE_TOKEN_ADDRESS,
        abi: ABIS.RescueToken,
        functionName: "totalSupply",
      }) as bigint;
      setTotalSupply(supply);
    } catch (err) {
      console.warn("[useTopDelegates] Minimal fetch failed:", err);
    }
  }, [publicClient]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const success = await fetchFromSubgraph();
      if (!success) await fetchMinimal();
      setIsLoading(false);
    };
    init();
  }, [fetchFromSubgraph, fetchMinimal]);

  return {
    delegates,
    totalDelegatedPower,
    totalDelegatedPowerFormatted: formatVotingPower(totalDelegatedPower),
    totalSupply,
    delegationRate,
    isLoading,
    refetch: fetchFromSubgraph,
  };
}

// ============ useDelegateProfile Hook ============

/**
 * Hook to manage delegate profile registration
 * 
 * Storage: API-backed (Vercel KV) with localStorage cache
 * Security: EIP-712 signature required for registration/updates
 */
export function useDelegateProfile() {
  const { address } = useAccount();
  const [profile, setProfile] = useState<DelegateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile on mount - check cache first, then API
  useEffect(() => {
    if (!address) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);

      // Quick cache check for immediate display
      const cachedProfiles = loadProfiles();
      const cachedProfile = cachedProfiles[address.toLowerCase()];
      if (cachedProfile) {
        setProfile(cachedProfile);
      }

      // Fetch from API for authoritative data
      try {
        const response = await fetch(`/api/delegates?address=${address.toLowerCase()}`);
        
        if (response.ok) {
          const data = await response.json();
          const apiProfile: DelegateProfile = {
            displayName: data.profile.displayName,
            statement: data.profile.statement,
            avatar: data.profile.avatar,
            registeredAt: data.profile.registeredAt,
          };
          
          // Update state and cache
          setProfile(apiProfile);
          cachedProfiles[address.toLowerCase()] = apiProfile;
          saveProfiles(cachedProfiles);
        } else if (response.status === 404) {
          // No profile on server - clear cache if exists
          if (cachedProfile) {
            delete cachedProfiles[address.toLowerCase()];
            saveProfiles(cachedProfiles);
          }
          setProfile(null);
        }
      } catch (err) {
        console.warn("[useDelegateProfile] API fetch failed, using cache:", err);
        // Keep cached profile if API fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [address]);

  // Register/update profile with REAL EIP-712 signature
  const registerProfile = useCallback(
    async (
      displayName: string,
      statement: string,
      timestamp: number,
      signature: string,
      avatar?: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!address) {
        return { success: false, error: "Wallet not connected" };
      }

      setError(null);

      try {
        const newProfile: DelegateProfile = {
          displayName,
          statement,
          avatar,
          registeredAt: profile?.registeredAt || timestamp * 1000,
        };

        // 1. Try to save to API (Authoritative)
        const response = await fetch("/api/delegates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            displayName,
            statement,
            avatar,
            timestamp,
            signature,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "API rejected the profile");
        }

        // 2. Only if API success, save to localStorage (Cache)
        const profiles = loadProfiles();
        profiles[address.toLowerCase()] = newProfile;
        saveProfiles(profiles);
        setProfile(newProfile);

        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Registration failed";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [address, profile]
  );

  // Remove profile with signature
  const removeProfile = useCallback(async (
    timestamp: number,
    signature: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!address) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      // 1. Try to remove from API
      const response = await fetch("/api/delegates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          timestamp,
          signature,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "API failed to delete profile");
      }

      // 2. Clear from local state/cache
      const profiles = loadProfiles();
      delete profiles[address.toLowerCase()];
      saveProfiles(profiles);
      setProfile(null);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Removal failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [address]);

  // Get profile for any address (from cache)
  const getProfile = useCallback((addr: string): DelegateProfile | null => {
    const profiles = loadProfiles();
    return profiles[addr.toLowerCase()] || null;
  }, []);

  return {
    profile,
    hasProfile: !!profile,
    isLoading,
    error,
    registerProfile,
    removeProfile,
    getProfile,
  };
}

