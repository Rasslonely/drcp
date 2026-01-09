import { NextRequest, NextResponse } from "next/server";
import {
  getDelegate,
  listDelegates,
  saveDelegate,
  deleteDelegate,
  verifyProfileSignature,
  isTimestampValid,
  type DelegateProfile,
  type DelegateProfileInput,
} from "@/lib/delegates";

// Force this route to be dynamic to avoid caching empty lists/profiles
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/delegates
 * 
 * List all registered delegates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    
    // If address provided, get single delegate
    if (address) {
      const profile = await getDelegate(address);
      
      if (!profile) {
        return NextResponse.json(
          { error: "Delegate not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ profile });
    }
    
    // Otherwise list all delegates
    const delegates = await listDelegates();
    
    const response = NextResponse.json({
      delegates,
      count: delegates.length,
    });

    // Add diagnostic header for production debugging
    const hasRedisUrl = !!(
      process.env.UPSTASH_REDIS_REST_URL || 
      process.env.KV_REST_API_URL || 
      process.env.UPSTASH_REDIS_REST_KV_URL
    );
    response.headers.set("X-Redis-Status", hasRedisUrl ? "connected" : "standalone");
    
    return response;
  } catch (error) {
    console.error("[API] GET /api/delegates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch delegates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/delegates
 * 
 * Register or update a delegate profile
 * Requires EIP-712 signature for ownership verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      address,
      displayName,
      statement,
      avatar,
      timestamp,
      signature,
    } = body as {
      address: string;
      displayName: string;
      statement: string;
      avatar?: string;
      timestamp: number;
      signature: string;
    };
    
    // Validate required fields
    if (!address || !displayName || !statement || !timestamp || !signature) {
      return NextResponse.json(
        { error: "Missing required fields: address, displayName, statement, timestamp, signature" },
        { status: 400 }
      );
    }
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid address format" },
        { status: 400 }
      );
    }
    
    // Validate displayName length
    if (displayName.length < 2 || displayName.length > 50) {
      return NextResponse.json(
        { error: "Display name must be 2-50 characters" },
        { status: 400 }
      );
    }
    
    // Validate statement length
    if (statement.length < 10 || statement.length > 500) {
      return NextResponse.json(
        { error: "Statement must be 10-500 characters" },
        { status: 400 }
      );
    }
    
    // Validate timestamp is recent (prevent replay attacks)
    if (!isTimestampValid(timestamp)) {
      return NextResponse.json(
        { error: "Timestamp expired. Please sign again." },
        { status: 400 }
      );
    }
    
    // Verify signature
    const input: DelegateProfileInput = { displayName, statement, avatar };
    const isValidSignature = await verifyProfileSignature(
      address,
      input,
      timestamp,
      signature
    );
    
    if (!isValidSignature) {
      console.warn(`[API] Signature verification failed for ${address}`);
      return NextResponse.json(
        { error: "Invalid signature. Please sign with the correct wallet." },
        { status: 401 }
      );
    }
    
    // Check if updating existing profile
    const existingProfile = await getDelegate(address);
    
    const profile: DelegateProfile = {
      address: address.toLowerCase(),
      displayName,
      statement,
      avatar,
      registeredAt: existingProfile?.registeredAt || timestamp,
      updatedAt: timestamp,
      signature,
    };
    
    await saveDelegate(profile);
    
    console.log(`[API] Delegate registered: ${address} as "${displayName}"`);
    
    return NextResponse.json({
      success: true,
      profile,
      isUpdate: !!existingProfile,
    });
  } catch (error) {
    console.error("[API] POST /api/delegates error:", error);
    return NextResponse.json(
      { error: "Failed to register delegate" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/delegates
 * 
 * Remove a delegate profile
 * Requires EIP-712 signature for ownership verification
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { address, timestamp, signature } = body as {
      address: string;
      timestamp: number;
      signature: string;
    };
    
    if (!address || !timestamp || !signature) {
      return NextResponse.json(
        { error: "Missing required fields: address, timestamp, signature" },
        { status: 400 }
      );
    }
    
    // Check if profile exists
    const existingProfile = await getDelegate(address);
    
    if (!existingProfile) {
      return NextResponse.json(
        { error: "Delegate not found" },
        { status: 404 }
      );
    }
    
    // Validate timestamp
    if (!isTimestampValid(timestamp)) {
      return NextResponse.json(
        { error: "Timestamp expired. Please sign again." },
        { status: 400 }
      );
    }
    
    // Verify signature (use empty input for deletion)
    const isValidSignature = await verifyProfileSignature(
      address,
      { displayName: "DELETE", statement: "DELETE" },
      timestamp,
      signature
    );
    
    if (!isValidSignature) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
    
    await deleteDelegate(address);
    
    console.log(`[API] Delegate removed: ${address}`);
    
    return NextResponse.json({
      success: true,
      message: "Delegate profile removed",
    });
  } catch (error) {
    console.error("[API] DELETE /api/delegates error:", error);
    return NextResponse.json(
      { error: "Failed to remove delegate" },
      { status: 500 }
    );
  }
}
