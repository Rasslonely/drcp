/**
 * OpenZeppelin Defender Configuration
 * 
 * This file contains the Sentinel configurations for monitoring DRCP contracts.
 * Import into Defender dashboard or use with Defender SDK.
 * 
 * Requires: OpenZeppelin Defender account (https://defender.openzeppelin.com)
 * 
 * @see https://docs.openzeppelin.com/defender/v2/
 */

// Contract addresses - UPDATE THESE FOR MAINNET
const CONTRACTS = {
  // Polygon Amoy Testnet addresses (update to mainnet when deploying)
  ParametricVault: "0x5ce8cCF75A8Ff90Ba1e73Ba9cBE81dEab6A5dFfB",
  RescueToken: "0xa5247E2e494186EAe1Df1e2e747C3c920D8AC7a9",
  DRCPGovernor: "0x0000000000000000000000000000000000000000", // TODO: Add after deployment
} as const;

/**
 * Sentinel Configurations
 * 
 * Sentinels monitor on-chain events and trigger notifications.
 * Each sentinel watches specific events and sends alerts via webhook.
 */
export const SENTINEL_CONFIGS = {
  // ============================================================================
  // CRITICAL ALERTS (Immediate action required)
  // ============================================================================
  
  /**
   * Contract Paused Alert
   * Triggers when any admin pauses the vault - indicates emergency response
   */
  contractPaused: {
    name: "DRCP: Contract Paused",
    network: "polygon",
    address: CONTRACTS.ParametricVault,
    abi: `[{"anonymous":false,"inputs":[{"indexed":false,"name":"account","type":"address"}],"name":"Paused","type":"event"}]`,
    eventCondition: "Paused(address)",
    severity: "HIGH",
    notificationChannels: ["webhook", "email"],
    message: "⚠️ DRCP Vault has been PAUSED by {{account}}. All deposits/withdrawals halted.",
  },

  /**
   * Emergency Declaration Alert
   * Triggers when oracle/DAO declares an emergency - 20% of funds released
   */
  emergencyDeclared: {
    name: "DRCP: Emergency Declared",
    network: "polygon",
    address: CONTRACTS.ParametricVault,
    abi: `[{"anonymous":false,"inputs":[{"indexed":true,"name":"emergencyId","type":"uint256"},{"indexed":false,"name":"disasterType","type":"bytes32"},{"indexed":false,"name":"fundsAllocated","type":"uint256"}],"name":"EmergencyDeclared","type":"event"}]`,
    eventCondition: "EmergencyDeclared(uint256,bytes32,uint256)",
    severity: "CRITICAL",
    notificationChannels: ["webhook", "email", "telegram"],
    message: "🚨 EMERGENCY DECLARED! ID: {{emergencyId}}, Type: {{disasterType}}, Funds Released: ${{fundsAllocated / 1e6}}",
  },

  // ============================================================================
  // HIGH ALERTS (Review within hours)
  // ============================================================================

  /**
   * Large Deposit Alert
   * Triggers when single deposit exceeds $500 - unusual activity monitoring
   */
  largeDeposit: {
    name: "DRCP: Large Deposit",
    network: "polygon",
    address: CONTRACTS.ParametricVault,
    abi: `[{"anonymous":false,"inputs":[{"indexed":true,"name":"donor","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Deposited","type":"event"}]`,
    eventCondition: "Deposited(address,uint256)",
    eventFilter: "amount > 500000000", // 500 USDC (6 decimals)
    severity: "MEDIUM",
    notificationChannels: ["webhook"],
    message: "💰 Large deposit: ${{amount / 1e6}} from {{donor}}",
  },

  /**
   * Large Withdrawal Alert
   * Triggers when single withdrawal exceeds $500
   */
  largeWithdrawal: {
    name: "DRCP: Large Withdrawal",
    network: "polygon",
    address: CONTRACTS.ParametricVault,
    abi: `[{"anonymous":false,"inputs":[{"indexed":true,"name":"donor","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Withdrawn","type":"event"}]`,
    eventCondition: "Withdrawn(address,uint256)",
    eventFilter: "amount > 500000000", // 500 USDC
    severity: "MEDIUM",
    notificationChannels: ["webhook"],
    message: "💸 Large withdrawal: ${{amount / 1e6}} by {{donor}}",
  },

  /**
   * Role Change Alert
   * Triggers when any role is granted/revoked - critical for security
   */
  roleChange: {
    name: "DRCP: Role Changed",
    network: "polygon",
    address: CONTRACTS.ParametricVault,
    abi: `[
      {"anonymous":false,"inputs":[{"indexed":true,"name":"role","type":"bytes32"},{"indexed":true,"name":"account","type":"address"},{"indexed":true,"name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},
      {"anonymous":false,"inputs":[{"indexed":true,"name":"role","type":"bytes32"},{"indexed":true,"name":"account","type":"address"},{"indexed":true,"name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"}
    ]`,
    eventCondition: "RoleGranted(bytes32,address,address) OR RoleRevoked(bytes32,address,address)",
    severity: "HIGH",
    notificationChannels: ["webhook", "email"],
    message: "🔐 Role change: {{role}} for {{account}} by {{sender}}",
  },

  // ============================================================================
  // GOVERNANCE ALERTS
  // ============================================================================

  /**
   * Proposal Created Alert
   * Triggers when a new governance proposal is created
   */
  proposalCreated: {
    name: "DRCP: Proposal Created",
    network: "polygon",
    address: CONTRACTS.DRCPGovernor,
    abi: `[{"anonymous":false,"inputs":[{"indexed":false,"name":"proposalId","type":"uint256"},{"indexed":false,"name":"proposer","type":"address"},{"indexed":false,"name":"targets","type":"address[]"},{"indexed":false,"name":"values","type":"uint256[]"},{"indexed":false,"name":"signatures","type":"string[]"},{"indexed":false,"name":"calldatas","type":"bytes[]"},{"indexed":false,"name":"startBlock","type":"uint256"},{"indexed":false,"name":"endBlock","type":"uint256"},{"indexed":false,"name":"description","type":"string"}],"name":"ProposalCreated","type":"event"}]`,
    eventCondition: "ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)",
    severity: "LOW",
    notificationChannels: ["webhook"],
    message: "📜 New proposal #{{proposalId}} by {{proposer}}",
  },

  /**
   * Proposal Executed Alert
   * Triggers when a proposal passes and is executed
   */
  proposalExecuted: {
    name: "DRCP: Proposal Executed",
    network: "polygon",
    address: CONTRACTS.DRCPGovernor,
    abi: `[{"anonymous":false,"inputs":[{"indexed":false,"name":"proposalId","type":"uint256"}],"name":"ProposalExecuted","type":"event"}]`,
    eventCondition: "ProposalExecuted(uint256)",
    severity: "MEDIUM",
    notificationChannels: ["webhook", "email"],
    message: "✅ Proposal #{{proposalId}} EXECUTED",
  },

  // ============================================================================
  // OPERATIONAL ALERTS
  // ============================================================================

  /**
   * Task Verified Alert
   * Triggers when volunteer task is verified and paid
   */
  taskVerified: {
    name: "DRCP: Task Paid",
    network: "polygon",
    address: CONTRACTS.ParametricVault,
    abi: `[{"anonymous":false,"inputs":[{"indexed":true,"name":"taskId","type":"uint256"},{"indexed":true,"name":"volunteer","type":"address"},{"indexed":false,"name":"reward","type":"uint256"}],"name":"TaskVerified","type":"event"}]`,
    eventCondition: "TaskVerified(uint256,address,uint256)",
    severity: "LOW",
    notificationChannels: ["webhook"],
    message: "🤝 Task #{{taskId}} paid ${{reward / 1e6}} to {{volunteer}}",
  },

  /**
   * Campaign Created Alert
   * Triggers when new relief campaign is created
   */
  campaignCreated: {
    name: "DRCP: Campaign Created",
    network: "polygon",
    address: CONTRACTS.ParametricVault,
    abi: `[{"anonymous":false,"inputs":[{"indexed":true,"name":"campaignId","type":"uint256"},{"indexed":false,"name":"name","type":"string"},{"indexed":false,"name":"targetAmount","type":"uint256"},{"indexed":false,"name":"geoHash","type":"bytes32"}],"name":"CampaignCreated","type":"event"}]`,
    eventCondition: "CampaignCreated(uint256,string,uint256,bytes32)",
    severity: "LOW",
    notificationChannels: ["webhook"],
    message: "📢 New campaign: {{name}} (Target: ${{targetAmount / 1e6}})",
  },
};

/**
 * Webhook Configuration
 * 
 * Set these environment variables to receive alerts:
 * - DEFENDER_WEBHOOK_URL: Your webhook endpoint (e.g., /api/defender/webhook)
 * - DEFENDER_TELEGRAM_BOT_TOKEN: Telegram bot token (optional)
 * - DEFENDER_TELEGRAM_CHAT_ID: Telegram chat ID (optional)
 */
export const WEBHOOK_CONFIG = {
  // Replace with your deployed URL
  webhookUrl: "https://your-domain.com/api/defender/webhook",
  // Configure in Defender dashboard, not here
  telegramBotToken: undefined as string | undefined,
  telegramChatId: undefined as string | undefined,
};

/**
 * Helper: Get all sentinel names for setup
 */
export function getSentinelNames(): string[] {
  return Object.values(SENTINEL_CONFIGS).map(s => s.name);
}

/**
 * Helper: Get sentinels by severity
 */
export function getSentinelsBySeverity(severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW") {
  return Object.values(SENTINEL_CONFIGS).filter(s => s.severity === severity);
}
