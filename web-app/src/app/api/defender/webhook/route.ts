import { NextRequest, NextResponse } from "next/server";

/**
 * OpenZeppelin Defender Webhook Handler
 * 
 * Receives alerts from Defender Sentinels and processes them.
 * Supports: Logging, Telegram notifications, custom actions.
 * 
 * @see https://docs.openzeppelin.com/defender/v2/sentinels#webhooks
 */

// Types for Defender webhook payload
interface DefenderAlert {
  id: string;
  hash: string;
  timestamp: string;
  type: string;
  sentinel: {
    id: string;
    name: string;
    network: string;
    address: string;
  };
  transaction?: {
    transactionHash: string;
    blockNumber: number;
    from: string;
    to: string;
    value: string;
  };
  matchReasons: Array<{
    type: string;
    signature: string;
    condition: string;
    args: Record<string, string>;
  }>;
  metadata?: Record<string, unknown>;
}

// Alert severity levels for filtering
type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

// Map sentinel names to severity
const SEVERITY_MAP: Record<string, AlertSeverity> = {
  "DRCP: Contract Paused": "HIGH",
  "DRCP: Emergency Declared": "CRITICAL",
  "DRCP: Large Deposit": "MEDIUM",
  "DRCP: Large Withdrawal": "MEDIUM",
  "DRCP: Role Changed": "HIGH",
  "DRCP: Proposal Created": "LOW",
  "DRCP: Proposal Executed": "MEDIUM",
  "DRCP: Task Paid": "LOW",
  "DRCP: Campaign Created": "LOW",
};

/**
 * POST /api/defender/webhook
 * 
 * Receives alerts from OpenZeppelin Defender
 */
export async function POST(request: NextRequest) {
  try {
    // Verify request is from Defender (optional: add signature verification)
    const authHeader = request.headers.get("x-defender-signature");
    if (process.env.DEFENDER_WEBHOOK_SECRET && !authHeader) {
      console.warn("[Defender Webhook] Missing signature header");
      // Don't reject - Defender may not always send signature
    }

    const alert: DefenderAlert = await request.json();

    // Log the alert
    const severity = SEVERITY_MAP[alert.sentinel.name] || "LOW";
    const logPrefix = getLogPrefix(severity);
    
    console.log(`${logPrefix} [${alert.sentinel.name}]`);
    console.log(`  Network: ${alert.sentinel.network}`);
    console.log(`  Contract: ${alert.sentinel.address}`);
    
    if (alert.transaction) {
      console.log(`  TxHash: ${alert.transaction.transactionHash}`);
      console.log(`  Block: ${alert.transaction.blockNumber}`);
    }
    
    if (alert.matchReasons.length > 0) {
      console.log(`  Event: ${alert.matchReasons[0].signature}`);
      console.log(`  Args:`, JSON.stringify(alert.matchReasons[0].args, null, 2));
    }

    // Send to Telegram if configured (for CRITICAL/HIGH alerts)
    if (
      (severity === "CRITICAL" || severity === "HIGH") &&
      process.env.TELEGRAM_BOT_TOKEN &&
      process.env.TELEGRAM_CHAT_ID
    ) {
      await sendTelegramNotification(alert, severity);
    }

    // Store alert in database (optional - for dashboard)
    // await storeAlert(alert);

    // Custom actions based on alert type
    await handleAlertActions(alert);

    return NextResponse.json({
      success: true,
      alertId: alert.id,
      severity,
      processed: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Defender Webhook] Error processing alert:", error);
    
    return NextResponse.json(
      { success: false, error: "Failed to process alert" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/defender/webhook
 * 
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "DRCP Defender Webhook",
    timestamp: new Date().toISOString(),
    sentinels: Object.keys(SEVERITY_MAP).length,
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getLogPrefix(severity: AlertSeverity): string {
  const prefixes: Record<AlertSeverity, string> = {
    CRITICAL: "🚨 CRITICAL",
    HIGH: "⚠️  HIGH",
    MEDIUM: "📢 MEDIUM",
    LOW: "ℹ️  LOW",
  };
  return prefixes[severity];
}

async function sendTelegramNotification(
  alert: DefenderAlert,
  severity: AlertSeverity
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) return;

  const emoji = severity === "CRITICAL" ? "🚨" : "⚠️";
  
  // Format message
  let message = `${emoji} *DRCP Alert*: ${alert.sentinel.name}\n`;
  message += `Network: ${alert.sentinel.network}\n`;

  if (alert.transaction) {
    message += `TxHash: \`${alert.transaction.transactionHash.slice(0, 10)}...\`\n`;
  }

  if (alert.matchReasons[0]?.args) {
    const args = alert.matchReasons[0].args;
    for (const [key, value] of Object.entries(args)) {
      // Format USDC amounts
      if (key.toLowerCase().includes("amount") || key.toLowerCase().includes("funds")) {
        const usdcAmount = (BigInt(value) / BigInt(1e6)).toString();
        message += `${key}: $${usdcAmount}\n`;
      } else if (value.length === 42 && value.startsWith("0x")) {
        // Format addresses
        message += `${key}: \`${value.slice(0, 6)}...${value.slice(-4)}\`\n`;
      } else {
        message += `${key}: ${value}\n`;
      }
    }
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!response.ok) {
      console.error("[Telegram] Failed to send:", await response.text());
    }
  } catch (error) {
    console.error("[Telegram] Error:", error);
  }
}

async function handleAlertActions(alert: DefenderAlert): Promise<void> {
  const sentinelName = alert.sentinel.name;

  switch (sentinelName) {
    case "DRCP: Contract Paused":
      // Could trigger: Discord announcement, status page update
      console.log("[Action] Vault paused - consider updating status page");
      break;

    case "DRCP: Emergency Declared":
      // Could trigger: Alert all administrators, prepare response team
      console.log("[Action] Emergency declared - sending to all admins");
      break;

    case "DRCP: Role Changed":
      // Could trigger: Security review workflow
      console.log("[Action] Role change detected - log for security audit");
      break;

    case "DRCP: Proposal Executed":
      // Could trigger: Update frontend caches
      console.log("[Action] Proposal executed - may need cache invalidation");
      break;

    default:
      // No special action needed
      break;
  }
}
