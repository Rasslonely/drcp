import { NextResponse } from "next/server";
import { disasterAggregator, DisasterFilter } from "@/lib/disaster-sources";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Revalidate every minute

// ============================================================================
// RATE LIMITING (H-04 Audit Fix)
// Simple in-memory rate limiter to protect external API quotas
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on server restart, which is acceptable for this use case)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Config
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP
const API_TIMEOUT_MS = 15000; // 15 second timeout for external APIs (BUG-02 fix)

/**
 * Get client IP from request headers
 */
function getClientIP(request: Request): string {
  // Check common headers for proxied requests
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  
  // Fallback for local development
  return "localhost";
}

/**
 * Check and update rate limit for a client
 * @returns true if request is allowed, false if rate limited
 */
function checkRateLimit(clientIP: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientIP);
  
  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  // New client or window expired
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(clientIP, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { 
      allowed: true, 
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetIn: RATE_LIMIT_WINDOW_MS 
    };
  }
  
  // Within window
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { 
      allowed: false, 
      remaining: 0,
      resetIn: entry.resetAt - now 
    };
  }
  
  // Increment counter
  entry.count++;
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetIn: entry.resetAt - now 
  };
}

/**
 * Wrap a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutError: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(timeoutError)), ms)
    )
  ]);
}

// ============================================================================
// API HANDLER
// ============================================================================

/**
 * GET /api/disasters
 * 
 * Aggregates disaster data from multiple sources server-side.
 * Supports filters via query parameters.
 * 
 * Rate Limited: 30 requests per minute per IP (H-04 Audit Fix)
 * Timeout: 15 seconds (BUG-02 Fix)
 */
export async function GET(request: Request) {
  // Rate limiting check
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        error: "Too many requests", 
        message: "Rate limit exceeded. Please wait before making more requests.",
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      },
      { 
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000)),
        }
      }
    );
  }

  const { searchParams } = new URL(request.url);
  
  // Parse filters from query params
  const filter: DisasterFilter = {
    indonesiaOnly: searchParams.get("indonesiaOnly") !== "false",
    maxAgeDays: searchParams.get("maxAgeDays") ? parseInt(searchParams.get("maxAgeDays")!) : 7,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  };
  
  // Parse regions
  const regions = searchParams.getAll("regions");
  if (regions.length > 0) {
    filter.regions = regions as any;
  }
  
  // Parse types
  const types = searchParams.getAll("types");
  if (types.length > 0) {
    filter.types = types as any;
  }

  try {
    // BUG-02 Fix: Add timeout wrapper to prevent infinite loading
    const data = await withTimeout(
      disasterAggregator.fetchAll(filter),
      API_TIMEOUT_MS,
      "External disaster APIs timed out"
    );
    
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000)),
      },
    });
  } catch (error) {
    console.error("Aggregation Error:", error);
    
    // BUG-02 Fix: Return graceful fallback instead of 500 error
    // This prevents the skeleton from being stuck forever
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = errorMessage.includes("timed out");
    
    return NextResponse.json(
      { 
        events: [],
        sources: [],
        fetchedAt: new Date().toISOString(),
        errors: [{ source: "aggregator", error: errorMessage }],
        stats: {
          total: 0,
          byType: {},
          byAlertLevel: {},
          byRegion: {},
          active: 0,
        },
        // Extra metadata for frontend
        _fallback: true,
        _error: errorMessage,
        _retryable: isTimeout,
      },
      { 
        status: 200, // Return 200 with empty data, not 500
        headers: {
          "Cache-Control": "no-cache", // Don't cache errors
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000)),
        },
      }
    );
  }
}

