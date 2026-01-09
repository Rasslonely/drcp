import { parseAbi } from "viem";

export const ABIS = {
  ParametricVault: parseAbi([
    "struct Task { uint256 id; string description; uint256 reward; address volunteer; bytes32 proofHash; uint8 status; bytes32 geoHash; uint256 createdAt; uint256 claimedAt; uint256 completedAt; }",
    "struct RiskScore { uint8 severity; bytes32 disasterType; bytes32 geoHash; uint256 timestamp; }",
    "struct EmergencyEvent { uint256 id; bytes32 disasterType; bytes32 geoHash; uint256 startTime; uint256 endTime; uint256 fundsAllocated; uint256 fundsDistributed; bool isActive; }",
    "struct Campaign { uint256 id; string name; string description; uint256 targetAmount; uint256 raisedAmount; uint256 deadline; bytes32 geoHash; uint8 status; uint256 createdAt; uint256 closedAt; }",
    // AccessControl functions (for on-chain role verification - H-02 Audit Fix)
    "function hasRole(bytes32 role, address account) external view returns (bool)",
    "function DAO_ROLE() external view returns (bytes32)",
    "function ADMIN_ROLE() external view returns (bytes32)",
    // Deposit functions
    "function deposit(uint256 amount) external",
    "function depositToCampaign(uint256 campaignId, uint256 amount) external",
    // View functions
    "function totalDeposits() external view returns (uint256)",
    "function donorBalances(address donor) external view returns (uint256)",
    "function currentState() external view returns (uint8)",
    "function getVaultBalance() external view returns (uint256)",
    "function getTask(uint256 taskId) external view returns (Task)",
    "function getTaskCount() external view returns (uint256)",
    "function latestRiskScore() external view returns (RiskScore)",
    "function emergencies(uint256 id) external view returns (EmergencyEvent)",
    "function emergencyCount() external view returns (uint256)",
    // Campaign functions
    "function getCampaign(uint256 campaignId) external view returns (Campaign)",
    "function getCampaignCount() external view returns (uint256)",
    "function getCampaignDonorBalance(uint256 campaignId, address donor) external view returns (uint256)",
    "function activeCampaignCount() external view returns (uint256)",
    // Campaign admin functions (DAO_ROLE)
    "function createCampaign(string name, string description, uint256 targetAmount, uint256 deadline, bytes32 geoHash) external returns (uint256)",
    "function closeCampaign(uint256 campaignId) external",
    // Events
    "event Deposited(address indexed donor, uint256 amount)",
    "event TaskCreated(uint256 indexed taskId, string description, uint256 reward)",
    "event TaskVerified(uint256 indexed taskId, address indexed volunteer, uint256 reward)",
    "event EmergencyDeclared(uint256 indexed emergencyId, bytes32 disasterType, uint256 fundsAllocated)",
    // Campaign events
    "event CampaignCreated(uint256 indexed campaignId, string name, uint256 targetAmount, bytes32 geoHash)",
    "event CampaignDeposit(uint256 indexed campaignId, address indexed donor, uint256 amount)",
    "event CampaignClosed(uint256 indexed campaignId, uint256 totalRaised, uint8 reason)",
  ]),
  ImpactNFT: parseAbi([
    "struct ImpactProfile { uint256 reputation; uint8 tier; uint256 tasksCompleted; uint256 totalRewards; uint256 lastActive; }",
    "struct ProofRecord { bytes32 proofHash; uint256 taskId; uint256 timestamp; bool verified; }",
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function getImpact(address volunteer) external view returns (ImpactProfile)",
    "function impacts(address volunteer) external view returns (uint256 reputation, uint8 tier, uint256 tasksCompleted, uint256 totalRewards, uint256 lastActive)",
    "function getTierName(uint8 tier) external pure returns (string)",
    "function volunteerToTokenId(address volunteer) external view returns (uint256)",
    "event ImpactRecorded(address indexed volunteer, uint256 indexed tokenId, uint256 tasksCompleted, uint256 reputation, uint8 tier)",
  ]),
  DRCPGovernor: parseAbi([
    // Read functions
    "function name() external view returns (string)",
    "function votingDelay() external view returns (uint256)",
    "function votingPeriod() external view returns (uint256)",
    "function proposalThreshold() external view returns (uint256)",
    "function quorum(uint256 blockNumber) external view returns (uint256)",
    "function state(uint256 proposalId) external view returns (uint8)",
    "function proposalVotes(uint256 proposalId) external view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
    "function proposalDeadline(uint256 proposalId) external view returns (uint256)",
    "function proposalSnapshot(uint256 proposalId) external view returns (uint256)",
    "function proposalProposer(uint256 proposalId) external view returns (address)",
    "function hasVoted(uint256 proposalId, address account) external view returns (bool)",
    "function getProposalType(uint256 proposalId) external view returns (uint8)",
    "function getVotes(address account, uint256 blockNumber) external view returns (uint256)",
    // Write functions - Voting
    "function castVote(uint256 proposalId, uint8 support) external returns (uint256)",
    "function castVoteWithReason(uint256 proposalId, uint8 support, string reason) external returns (uint256)",
    // Write functions - Proposals
    "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) external returns (uint256)",
    "function proposeEmergency(address[] targets, uint256[] values, bytes[] calldatas, string description) external returns (uint256)",
    "function proposeUpgrade(address[] targets, uint256[] values, bytes[] calldatas, string description) external returns (uint256)",
    // Events
    "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)",
    "event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)",
    "event ProposalExecuted(uint256 proposalId)",
    "event ProposalCanceled(uint256 proposalId)",
  ]),
  RescueToken: parseAbi([
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
    "function totalSupply() external view returns (uint256)",
    "function delegate(address delegatee) external",
    "function delegates(address account) external view returns (address)",
    "function getVotes(address account) external view returns (uint256)",
    "event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)",
    "event DelegateVotesChanged(address indexed delegate, uint256 previousVotes, uint256 newVotes)",
  ]),
  ERC20: parseAbi([
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
    "function mint(address to, uint256 amount) external",
  ]),

  // Phase 11: Sustainable Revenue
  ProjectTreasury: parseAbi([
    "function donate(uint256 amount, string message) external",
    "function getBalance() external view returns (uint256)",
    "function getNativeBalance() external view returns (uint256)",
    "function getDonorContribution(address donor) external view returns (uint256)",
    "function getStats() external view returns (uint256 totalDonations, uint256 totalWithdrawn, uint256 currentBalance, uint256 donorCount)",
    "function totalDonations() external view returns (uint256)",
    "function donorCount() external view returns (uint256)",
    "event ProjectDonation(address indexed donor, uint256 amount, string message, uint256 timestamp)",
  ]),

  YieldController: parseAbi([
    "function getConfig() external view returns (uint256 liquidRatio, uint256 yieldRatio, uint256 treasuryYieldShare, address vault, address treasury)",
    "function getYieldStats() external view returns (uint256 totalInYield, uint256 totalYieldEarned, uint256 totalYieldToTreasury)",
    "function calculateYieldAllocation(uint256 depositAmount) external view returns (uint256 liquidAmount, uint256 yieldAmount)",
    "function liquidRatio() external view returns (uint256)",
    "function yieldRatio() external view returns (uint256)",
  ]),
} as const;

