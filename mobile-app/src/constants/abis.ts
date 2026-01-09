import { parseAbi } from "viem";

export const ABIS = {
  ParametricVault: parseAbi([
    "struct Task { uint256 id; string description; uint256 reward; address volunteer; bytes32 proofHash; uint8 status; bytes32 geoHash; uint256 createdAt; uint256 claimedAt; uint256 completedAt; }",
    "function deposit(uint256 amount) external",
    "function totalDeposits() external view returns (uint256)",
    "function donorBalances(address donor) external view returns (uint256)",
    "function currentState() external view returns (uint8)",
    "function getVaultBalance() external view returns (uint256)",
    "function getTask(uint256 taskId) external view returns (Task)",
    "function getTaskCount() external view returns (uint256)",
    "function createTask(string calldata description, uint256 reward, bytes32 geoHash) external returns (uint256)",
    "function claimTask(uint256 taskId) external",
    "function submitProof(uint256 taskId, bytes32 proofHash) external",
    "event Deposited(address indexed donor, uint256 amount)",
  ]),
  ImpactNFT: parseAbi([
    "struct ImpactProfile { uint256 tasksCompleted; uint256 reputation; uint256 totalRewards; uint256 firstTaskAt; uint256 lastTaskAt; uint8 tier; string metadataCID; }",
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function getImpact(address volunteer) external view returns (ImpactProfile)",
  ]),
  ERC20: parseAbi([
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
    "function mint(address to, uint256 amount) external",
  ]),
} as const;
