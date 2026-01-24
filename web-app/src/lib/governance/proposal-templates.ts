/**
 * Proposal Templates for common governance actions
 * Templates simplify creating proposals by providing pre-built action configurations
 */

import { VAULT_ADDRESS, GOVERNOR_ADDRESS } from "@/lib/contracts/deployments";
import { encodeFunctionData, parseAbiItem } from "viem";

// ============ Types ============

export type ProposalType = "standard" | "emergency" | "upgrade";

export interface TemplateField {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "address" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  validation?: (value: string) => string | null;
}

export interface ProposalTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultType: ProposalType;
  fields: TemplateField[];
  buildAction: (values: Record<string, string>) => {
    targets: `0x${string}`[];
    values: bigint[];
    calldatas: `0x${string}`[];
  };
}

// ============ Helper Functions ============

function encodeVaultFunction(
  functionSignature: string,
  args: unknown[]
): `0x${string}` {
  try {
    const abiItem = parseAbiItem(`function ${functionSignature}`);
    return encodeFunctionData({
      abi: [abiItem],
      functionName: functionSignature.split("(")[0],
      args,
    }) as `0x${string}`;
  } catch {
    return "0x" as `0x${string}`;
  }
}

/**
 * Converts a string to bytes32 format
 * Used for disaster types and locations in declareEmergencyByDAO
 */
function stringToBytes32(str: string): `0x${string}` {
  // Encode string to UTF-8 bytes, pad to 32 bytes
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str.slice(0, 31)); // Max 31 chars
  const result = new Uint8Array(32);
  result.set(bytes);
  return `0x${Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
}

// ============ Templates ============

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  // CRITICAL: This template triggers vault state change to enable task creation
  {
    id: "declare-emergency",
    name: "Declare Emergency",
    icon: "🆘",
    description: "Declare disaster emergency to enable volunteer task creation and fund release",
    defaultType: "emergency",
    fields: [
      {
        name: "disasterType",
        label: "Disaster Type",
        type: "select",
        required: true,
        options: [
          { value: "FLOOD", label: "Banjir (Flood)" },
          { value: "EARTHQUAKE", label: "Gempa Bumi (Earthquake)" },
          { value: "TSUNAMI", label: "Tsunami" },
          { value: "VOLCANO", label: "Gunung Berapi (Volcanic Eruption)" },
          { value: "WILDFIRE", label: "Kebakaran Hutan (Wildfire)" },
          { value: "LANDSLIDE", label: "Tanah Longsor (Landslide)" },
          { value: "CYCLONE", label: "Siklon/Badai (Cyclone)" },
        ],
      },
      {
        name: "location",
        label: "Affected Region",
        type: "text",
        placeholder: "e.g., Kalimantan Selatan",
        required: true,
        validation: (v) => {
          if (!v || v.trim().length < 3) return "Location must be at least 3 characters";
          return null;
        },
      },
      {
        name: "evidence",
        label: "Evidence URL/IPFS",
        type: "text",
        placeholder: "IPFS hash or news article URL",
        required: true,
        validation: (v) => {
          if (!v || v.trim().length < 5) return "Please provide evidence link";
          return null;
        },
      },
    ],
    buildAction: (values) => {
      // Encode declareEmergencyByDAO call with proper parameters
      const calldata = encodeVaultFunction(
        "declareEmergencyByDAO(bytes32,bytes32,string)",
        [
          stringToBytes32(values.disasterType || "DISASTER"),
          stringToBytes32(values.location || "Indonesia"),
          values.evidence || "",
        ]
      );
      return {
        targets: [VAULT_ADDRESS],
        values: [BigInt(0)],
        calldatas: [calldata],
      };
    },
  },
  {
    id: "emergency-release",
    name: "Emergency Fund Release",
    icon: "🚨",
    description: "Request emergency fund release from the vault for disaster relief",
    defaultType: "emergency",
    fields: [
      {
        name: "amount",
        label: "Amount (USDC)",
        type: "number",
        placeholder: "10000",
        required: true,
        validation: (v) => {
          const num = parseFloat(v);
          if (isNaN(num) || num <= 0) return "Amount must be greater than 0";
          return null;
        },
      },
      {
        name: "recipient",
        label: "Recipient Address",
        type: "address",
        placeholder: "0x...",
        required: true,
        validation: (v) => {
          if (!v.startsWith("0x") || v.length !== 42) return "Invalid address";
          return null;
        },
      },
      {
        name: "reason",
        label: "Emergency Description",
        type: "textarea",
        placeholder: "Describe the emergency and how funds will be used...",
        required: true,
      },
    ],
    buildAction: (values) => {
      // For now, create a signaling proposal (no on-chain action)
      // In production, this would encode ParametricVault.releaseFunds()
      return {
        targets: [VAULT_ADDRESS],
        values: [BigInt(0)],
        calldatas: ["0x" as `0x${string}`], // Empty calldata for signaling
      };
    },
  },
  {
    id: "update-threshold",
    name: "Update Risk Threshold",
    icon: "⚙️",
    description: "Change the risk score threshold that triggers fund release",
    defaultType: "standard",
    fields: [
      {
        name: "newThreshold",
        label: "New Threshold (0-100)",
        type: "number",
        placeholder: "50",
        required: true,
        validation: (v) => {
          const num = parseInt(v);
          if (isNaN(num) || num < 0 || num > 100) return "Must be 0-100";
          return null;
        },
      },
      {
        name: "rationale",
        label: "Rationale",
        type: "textarea",
        placeholder: "Explain why this threshold change is needed...",
        required: true,
      },
    ],
    buildAction: (values) => {
      return {
        targets: [VAULT_ADDRESS],
        values: [BigInt(0)],
        calldatas: ["0x" as `0x${string}`], // Signaling proposal
      };
    },
  },
  {
    id: "grant-role",
    name: "Grant Role",
    icon: "🔑",
    description: "Grant admin, oracle, or DAO role to an address",
    defaultType: "standard",
    fields: [
      {
        name: "role",
        label: "Role",
        type: "select",
        required: true,
        options: [
          { value: "ADMIN_ROLE", label: "Admin" },
          { value: "ORACLE_ROLE", label: "Oracle" },
          { value: "DAO_ROLE", label: "DAO" },
        ],
      },
      {
        name: "account",
        label: "Account Address",
        type: "address",
        placeholder: "0x...",
        required: true,
        validation: (v) => {
          if (!v.startsWith("0x") || v.length !== 42) return "Invalid address";
          return null;
        },
      },
      {
        name: "reason",
        label: "Reason",
        type: "textarea",
        placeholder: "Why should this address receive this role?",
        required: true,
      },
    ],
    buildAction: (values) => {
      return {
        targets: [VAULT_ADDRESS],
        values: [BigInt(0)],
        calldatas: ["0x" as `0x${string}`], // Signaling proposal
      };
    },
  },
  {
    id: "adjust-protocol-fee",
    name: "Adjust Protocol Fee",
    icon: "💰",
    description: "Change the protocol fee rate (currently 0.5%, max 5%)",
    defaultType: "standard",
    fields: [
      {
        name: "newFeeBps",
        label: "New Fee (basis points)",
        type: "number",
        placeholder: "50 = 0.5%",
        required: true,
        validation: (v) => {
          const num = parseInt(v);
          if (isNaN(num) || num < 0) return "Must be 0 or greater";
          if (num > 500) return "Cannot exceed 5% (500 basis points)";
          return null;
        },
      },
      {
        name: "rationale",
        label: "Rationale",
        type: "textarea",
        placeholder: "Explain why this fee change is needed...",
        required: true,
      },
    ],
    buildAction: (values) => {
      const calldata = encodeVaultFunction(
        "setProtocolFee(uint256)",
        [BigInt(values.newFeeBps || "50")]
      );
      return {
        targets: [VAULT_ADDRESS],
        values: [BigInt(0)],
        calldatas: [calldata],
      };
    },
  },
  {
    id: "custom",
    name: "Custom Proposal",
    icon: "✏️",
    description: "Create a custom governance proposal with any description",
    defaultType: "standard",
    fields: [], // Custom proposals only need title + description (no template fields)
    buildAction: () => {
      // Text-only proposal with no on-chain action
      return {
        targets: [GOVERNOR_ADDRESS],
        values: [BigInt(0)],
        calldatas: ["0x" as `0x${string}`],
      };
    },
  },
];

// ============ Helper to get template by ID ============

export function getTemplate(id: string): ProposalTemplate | undefined {
  return PROPOSAL_TEMPLATES.find((t) => t.id === id);
}

export function getDefaultTemplate(): ProposalTemplate {
  return PROPOSAL_TEMPLATES.find((t) => t.id === "custom")!;
}

// ============ Proposal Type Info ============

export const PROPOSAL_TYPE_INFO: Record<
  ProposalType,
  { label: string; description: string; icon: string; color: string }
> = {
  standard: {
    label: "Standard",
    description: "3-day voting period, simple majority",
    icon: "📋",
    color: "text-blue-400 bg-blue-500/20 border-blue-500/30",
  },
  emergency: {
    label: "Emergency",
    description: "1-day voting period for urgent matters",
    icon: "🚨",
    color: "text-orange-400 bg-orange-500/20 border-orange-500/30",
  },
  upgrade: {
    label: "Upgrade",
    description: "Requires 67% supermajority for contract upgrades",
    icon: "🔧",
    color: "text-purple-400 bg-purple-500/20 border-purple-500/30",
  },
};
