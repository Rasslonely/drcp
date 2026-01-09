/**
 * Delegate Profile Storage Library
 * 
 * Provides persistent storage for delegate profiles using:
 * - Upstash Redis (production) - auto-configured via Vercel integration
 * - In-memory fallback - for local development without Redis
 * 
 * Includes EIP-712 signature verification for profile ownership.
 */

import { Redis } from "@upstash/redis";
import { verifyTypedData, type Hex } from "viem";

// ============ Types ============

export interface DelegateProfile {
  address: string;
  displayName: string;
  statement: string;
  avatar?: string;
  registeredAt: number;
  updatedAt: number;
  signature: string;
}

export interface DelegateProfileInput {
  displayName: string;
  statement: string;
  avatar?: string;
}

// EIP-712 typed data for signature verification
const EIP712_DOMAIN = {
  name: "DRCP Delegate Registry",
  version: "1",
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID === "137" ? 137 : 80002, // Polygon or Amoy
} as const;

const EIP712_TYPES = {
  DelegateProfile: [
    { name: "address", type: "address" },
    { name: "displayName", type: "string" },
    { name: "statement", type: "string" },
    { name: "avatar", type: "string" },
    { name: "timestamp", type: "uint256" },
  ],
} as const;

// ============ Storage Backend ============

// In-memory storage (fallback for local development)
const memoryStorage = new Map<string, DelegateProfile>();

/**
 * Redis Environment Variable Resolution
 * 
 * Supports multiple naming conventions:
 * 1. Standard Upstash: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 * 2. Vercel KV (auto): KV_REST_API_URL, KV_REST_API_TOKEN
 * 3. Vercel KV (manual): UPSTASH_REDIS_REST_KV_URL, etc.
 */
const REDIS_URL = 
  process.env.UPSTASH_REDIS_REST_URL || 
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_KV_URL;

const REDIS_TOKEN = 
  process.env.UPSTASH_REDIS_REST_TOKEN || 
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;

// Check if Upstash Redis is configured (any naming convention)
const hasRedis = !!(REDIS_URL && REDIS_TOKEN);

// Lazy-initialize Redis client
let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (!hasRedis) return null;
  
  if (!redisClient) {
    redisClient = new Redis({
      url: REDIS_URL!,
      token: REDIS_TOKEN!,
    });
    console.log("[Delegates] Redis client initialized");
  }
  
  return redisClient;
}

/**
 * Get a delegate profile by address
 */
export async function getDelegate(address: string): Promise<DelegateProfile | null> {
  const normalizedAddress = address.toLowerCase();
  const redis = getRedis();
  
  if (redis) {
    try {
      const profile = await redis.get<DelegateProfile>(`delegate:${normalizedAddress}`);
      return profile;
    } catch (error) {
      console.error("[Delegates] Redis read error:", error);
      return memoryStorage.get(normalizedAddress) || null;
    }
  }
  
  return memoryStorage.get(normalizedAddress) || null;
}

/**
 * Get all registered delegates
 */
export async function listDelegates(): Promise<DelegateProfile[]> {
  const redis = getRedis();
  
  if (redis) {
    try {
      // Get all delegate keys
      const keys = await redis.keys("delegate:*");
      
      if (keys.length === 0) return [];
      
      // Fetch all profiles in parallel
      const profiles = await Promise.all(
        keys.map(key => redis.get<DelegateProfile>(key))
      );
      
      return profiles.filter((p): p is DelegateProfile => p !== null);
    } catch (error) {
      console.error("[Delegates] Redis list error:", error);
      return Array.from(memoryStorage.values());
    }
  }
  
  return Array.from(memoryStorage.values());
}

/**
 * Save a delegate profile (requires valid signature)
 */
export async function saveDelegate(profile: DelegateProfile): Promise<boolean> {
  const normalizedAddress = profile.address.toLowerCase();
  const profileWithNormalizedAddress = { ...profile, address: normalizedAddress };
  const redis = getRedis();
  
  if (redis) {
    try {
      await redis.set(`delegate:${normalizedAddress}`, profileWithNormalizedAddress);
      console.log(`[Delegates] Saved profile for ${normalizedAddress} (Redis)`);
      return true;
    } catch (error) {
      console.error("[Delegates] Redis write error:", error);
      // Fallback to memory
      memoryStorage.set(normalizedAddress, profileWithNormalizedAddress);
      return true;
    }
  }
  
  memoryStorage.set(normalizedAddress, profileWithNormalizedAddress);
  console.log(`[Delegates] Saved profile for ${normalizedAddress} (in-memory)`);
  return true;
}

/**
 * Delete a delegate profile (requires valid signature)
 */
export async function deleteDelegate(address: string): Promise<boolean> {
  const normalizedAddress = address.toLowerCase();
  const redis = getRedis();
  
  if (redis) {
    try {
      await redis.del(`delegate:${normalizedAddress}`);
      console.log(`[Delegates] Deleted profile for ${normalizedAddress} (Redis)`);
      return true;
    } catch (error) {
      console.error("[Delegates] Redis delete error:", error);
      memoryStorage.delete(normalizedAddress);
      return true;
    }
  }
  
  memoryStorage.delete(normalizedAddress);
  console.log(`[Delegates] Deleted profile for ${normalizedAddress} (in-memory)`);
  return true;
}

// ============ Signature Verification ============

/**
 * Generate the EIP-712 message for signing
 */
export function getMessageToSign(
  address: string,
  input: DelegateProfileInput,
  timestamp: number
): {
  domain: typeof EIP712_DOMAIN;
  types: typeof EIP712_TYPES;
  primaryType: "DelegateProfile";
  message: {
    address: `0x${string}`;
    displayName: string;
    statement: string;
    avatar: string;
    timestamp: bigint;
  };
} {
  return {
    domain: EIP712_DOMAIN,
    types: EIP712_TYPES,
    primaryType: "DelegateProfile" as const,
    message: {
      address: address as `0x${string}`,
      displayName: input.displayName,
      statement: input.statement,
      avatar: input.avatar || "",
      timestamp: BigInt(timestamp),
    },
  };
}

/**
 * Verify that a signature is valid for the given profile
 */
export async function verifyProfileSignature(
  address: string,
  input: DelegateProfileInput,
  timestamp: number,
  signature: string
): Promise<boolean> {
  try {
    const typedData = getMessageToSign(address, input, timestamp);
    
    const isValid = await verifyTypedData({
      ...typedData,
      address: address as `0x${string}`,
      signature: signature as Hex,
    });
    
    return isValid;
  } catch (error) {
    console.error("[Delegates] Signature verification failed:", error);
    return false;
  }
}

/**
 * Check if timestamp is within acceptable range (5 minutes)
 */
export function isTimestampValid(timestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const fiveMinutes = 5 * 60;
  return Math.abs(now - timestamp) <= fiveMinutes;
}
