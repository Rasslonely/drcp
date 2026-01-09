// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ParametricVault
 * @author DRCP Team
 * @notice Parametric disaster relief vault with automated fund release
 * @dev Implements a state machine for disaster response phases
 * 
 * State Machine:
 * IDLE → ALERT → EMERGENCY → RELIEF_ACTIVE → SETTLED
 * 
 * Features:
 * - Accepts USDC/USDT deposits
 * - Auto-releases 20% of funds when emergency is declared
 * - Task creation and claiming system for volunteers
 * - Role-based access control (Oracle, DAO, Admin)
 */
contract ParametricVault is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Roles ============
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant DAO_ROLE = keccak256("DAO_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ============ Enums ============
    enum VaultState {
        IDLE,           // Normal state, accepting donations
        ALERT,          // Risk detected, monitoring
        EMERGENCY,      // Disaster confirmed, funds released
        RELIEF_ACTIVE,  // Relief operations ongoing
        SETTLED         // Disaster event closed
    }

    enum TaskStatus {
        OPEN,
        CLAIMED,
        PROOF_SUBMITTED,
        VERIFIED,
        PAID,
        CANCELLED
    }

    // ============ Structs ============
    struct Task {
        uint256 id;
        string description;
        uint256 reward;
        address volunteer;
        bytes32 proofHash;
        TaskStatus status;
        bytes32 geoHash;
        uint256 createdAt;
        uint256 claimedAt;
        uint256 completedAt;
    }

    struct RiskScore {
        uint8 severity;       // 0-100
        bytes32 disasterType; // FLOOD, EARTHQUAKE, WILDFIRE
        bytes32 geoHash;      // Affected region
        uint256 timestamp;
    }

    struct EmergencyEvent {
        uint256 id;
        bytes32 disasterType;
        bytes32 geoHash;
        uint256 startTime;
        uint256 endTime;
        uint256 fundsAllocated;
        uint256 fundsDistributed;
        bool isActive;
    }

    enum CampaignStatus {
        ACTIVE,
        CLOSED,
        EXPIRED
    }

    struct Campaign {
        uint256 id;
        string name;
        string description;
        uint256 targetAmount;      // Goal in USDC (6 decimals)
        uint256 raisedAmount;      // Current raised
        uint256 deadline;          // Unix timestamp (0 = no deadline)
        bytes32 geoHash;           // Target region
        CampaignStatus status;
        uint256 createdAt;
        uint256 closedAt;
    }

    // ============ State Variables ============
    IERC20 public immutable stablecoin;
    VaultState public currentState;
    RiskScore public latestRiskScore;
    
    uint256 public totalDeposits;
    uint256 public totalReleased;
    uint256 public totalTaskPayouts;
    
    uint256 public emergencyReleasePercentage = 20; // 20% auto-release
    uint256 public alertThreshold = 50;             // Risk score threshold for ALERT
    uint256 public emergencyThreshold = 80;         // Risk score threshold for EMERGENCY
    
    uint256 private _taskIdCounter;
    uint256 private _emergencyIdCounter;
    uint256 private _campaignIdCounter;
    
    // Campaign constants
    uint256 public constant MAX_ACTIVE_CAMPAIGNS = 10;
    uint256 public constant MIN_CAMPAIGN_TARGET = 1000 * 1e6; // $1,000 USDC
    
    // Security: TVL Hard Cap (Phase 0 - Beta Safety)
    // Limits maximum vault balance to reduce exposure during beta
    uint256 public constant MAX_TVL = 1_000 * 1e6; // $1,000 USDC
    
    mapping(uint256 => Task) public tasks;
    mapping(uint256 => EmergencyEvent) public emergencies;
    mapping(address => uint256) public donorBalances;
    mapping(address => uint256) public volunteerEarnings;
    
    // Campaign mappings
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public campaignDonorBalances;
    uint256 public activeCampaignCount;

    // ============ Events ============
    event Deposited(address indexed donor, uint256 amount);
    event Withdrawn(address indexed donor, uint256 amount);
    event StateChanged(VaultState oldState, VaultState newState);
    event RiskScoreUpdated(uint8 severity, bytes32 disasterType, bytes32 geoHash);
    event EmergencyDeclared(uint256 indexed emergencyId, bytes32 disasterType, uint256 fundsAllocated);
    event EmergencySettled(uint256 indexed emergencyId, uint256 totalDistributed);
    event TaskCreated(uint256 indexed taskId, string description, uint256 reward);
    event TaskClaimed(uint256 indexed taskId, address indexed volunteer);
    event TaskProofSubmitted(uint256 indexed taskId, bytes32 proofHash);
    event TaskVerified(uint256 indexed taskId, address indexed volunteer, uint256 reward);
    event TaskCancelled(uint256 indexed taskId);
    event FundsReleased(uint256 amount, string reason);
    event EmergencyDeclaredByDAO(bytes32 disasterType, bytes32 geoHash, string evidence, address declarer);
    
    // Campaign events
    event CampaignCreated(uint256 indexed campaignId, string name, uint256 targetAmount, bytes32 geoHash);
    event CampaignDeposit(uint256 indexed campaignId, address indexed donor, uint256 amount);
    event CampaignClosed(uint256 indexed campaignId, uint256 totalRaised, CampaignStatus reason);

    // ============ Errors ============
    error InvalidState(VaultState current, VaultState required);
    error InsufficientFunds(uint256 requested, uint256 available);
    error TaskNotFound(uint256 taskId);
    error InvalidTaskStatus(TaskStatus current, TaskStatus required);
    error NotTaskVolunteer(address caller, address volunteer);
    error ZeroAmount();
    error InvalidThreshold();
    
    // Campaign errors
    error CampaignNotFound(uint256 campaignId);
    error CampaignNotActive(uint256 campaignId);
    error CampaignExpired(uint256 campaignId);
    error MaxCampaignsReached();
    error TargetBelowMinimum(uint256 target, uint256 minimum);
    
    // Security errors
    error TVLCapExceeded(uint256 current, uint256 attempted, uint256 max);

    // ============ Constructor ============
    
    /**
     * @notice Initializes the ParametricVault
     * @param _stablecoin Address of the accepted stablecoin (USDC/USDT)
     * @param _admin Initial admin address
     */
    constructor(address _stablecoin, address _admin) {
        stablecoin = IERC20(_stablecoin);
        currentState = VaultState.IDLE;
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(DAO_ROLE, _admin);
    }

    // ============ Donor Functions ============

    /**
     * @notice Deposits stablecoins into the vault
     * @param amount Amount to deposit (in stablecoin decimals)
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        
        // TVL Cap Check (Phase 0 - Beta Safety)
        uint256 currentBalance = stablecoin.balanceOf(address(this));
        if (currentBalance + amount > MAX_TVL) {
            revert TVLCapExceeded(currentBalance, amount, MAX_TVL);
        }
        
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);
        
        donorBalances[msg.sender] += amount;
        totalDeposits += amount;
        
        emit Deposited(msg.sender, amount);
    }

    /**
     * @notice Withdraws unused donations (only in IDLE state)
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        if (currentState != VaultState.IDLE) {
            revert InvalidState(currentState, VaultState.IDLE);
        }
        if (amount == 0) revert ZeroAmount();
        if (donorBalances[msg.sender] < amount) {
            revert InsufficientFunds(amount, donorBalances[msg.sender]);
        }
        
        donorBalances[msg.sender] -= amount;
        totalDeposits -= amount;
        
        stablecoin.safeTransfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }

    // ============ Campaign Functions ============

    /**
     * @notice Creates a new disaster relief campaign
     * @param name Campaign name (e.g., "Banjir Kalimantan Barat")
     * @param description Campaign description
     * @param targetAmount Fundraising goal in USDC (6 decimals)
     * @param deadline Unix timestamp for campaign end (0 = no deadline)
     * @param geoHash Geographic location hash
     */
    function createCampaign(
        string calldata name,
        string calldata description,
        uint256 targetAmount,
        uint256 deadline,
        bytes32 geoHash
    ) external onlyRole(DAO_ROLE) returns (uint256) {
        if (activeCampaignCount >= MAX_ACTIVE_CAMPAIGNS) {
            revert MaxCampaignsReached();
        }
        if (targetAmount < MIN_CAMPAIGN_TARGET) {
            revert TargetBelowMinimum(targetAmount, MIN_CAMPAIGN_TARGET);
        }
        
        uint256 campaignId = ++_campaignIdCounter;
        
        campaigns[campaignId] = Campaign({
            id: campaignId,
            name: name,
            description: description,
            targetAmount: targetAmount,
            raisedAmount: 0,
            deadline: deadline,
            geoHash: geoHash,
            status: CampaignStatus.ACTIVE,
            createdAt: block.timestamp,
            closedAt: 0
        });
        
        activeCampaignCount++;
        
        emit CampaignCreated(campaignId, name, targetAmount, geoHash);
        
        return campaignId;
    }

    /**
     * @notice Deposits stablecoins to a specific campaign
     * @param campaignId ID of the campaign to donate to
     * @param amount Amount to deposit (in stablecoin decimals)
     */
    function depositToCampaign(uint256 campaignId, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        
        Campaign storage campaign = campaigns[campaignId];
        if (campaign.id == 0) revert CampaignNotFound(campaignId);
        
        // Check deadline - auto-close if expired
        if (campaign.deadline > 0 && block.timestamp > campaign.deadline) {
            if (campaign.status == CampaignStatus.ACTIVE) {
                _closeCampaign(campaignId, CampaignStatus.EXPIRED);
            }
            revert CampaignExpired(campaignId);
        }
        
        if (campaign.status != CampaignStatus.ACTIVE) {
            revert CampaignNotActive(campaignId);
        }
        
        // TVL Cap Check (Phase 0 - Beta Safety)
        uint256 currentBalance = stablecoin.balanceOf(address(this));
        if (currentBalance + amount > MAX_TVL) {
            revert TVLCapExceeded(currentBalance, amount, MAX_TVL);
        }
        
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);
        
        campaign.raisedAmount += amount;
        campaignDonorBalances[campaignId][msg.sender] += amount;
        totalDeposits += amount;
        
        emit CampaignDeposit(campaignId, msg.sender, amount);
    }

    /**
     * @notice Closes a campaign (DAO only)
     * @dev Funds remain in vault for DAO to allocate via tasks
     * @param campaignId ID of the campaign to close
     */
    function closeCampaign(uint256 campaignId) external onlyRole(DAO_ROLE) {
        Campaign storage campaign = campaigns[campaignId];
        if (campaign.id == 0) revert CampaignNotFound(campaignId);
        if (campaign.status != CampaignStatus.ACTIVE) {
            revert CampaignNotActive(campaignId);
        }
        
        _closeCampaign(campaignId, CampaignStatus.CLOSED);
    }

    function _closeCampaign(uint256 campaignId, CampaignStatus reason) internal {
        Campaign storage campaign = campaigns[campaignId];
        campaign.status = reason;
        campaign.closedAt = block.timestamp;
        
        // M-01 Audit Fix: Prevent underflow (defensive programming)
        if (activeCampaignCount > 0) {
            activeCampaignCount--;
        }
        
        emit CampaignClosed(campaignId, campaign.raisedAmount, reason);
    }

    // ============ Oracle Functions ============
    // NOTE: These functions are for FUTURE USE when AI Engine + Chainlink Oracle is deployed.
    // Currently, the protocol operates in DAO-ONLY MODE.
    // The Oracle integration is designed but not active to avoid centralization risks.

    /**
     * @notice Updates the risk score (called by Chainlink Oracle)
     * @dev FUTURE IMPLEMENTATION - Currently disabled. Use declareEmergencyByDAO() instead.
     * @param severity Risk severity 0-100
     * @param disasterType Type of disaster (FLOOD, EARTHQUAKE, etc.)
     * @param geoHash Geographic location hash
     */
    function updateRiskScore(
        uint8 severity,
        bytes32 disasterType,
        bytes32 geoHash
    ) external onlyRole(ORACLE_ROLE) {
        latestRiskScore = RiskScore({
            severity: severity,
            disasterType: disasterType,
            geoHash: geoHash,
            timestamp: block.timestamp
        });
        
        emit RiskScoreUpdated(severity, disasterType, geoHash);
        
        // Auto state transitions based on severity
        if (severity >= emergencyThreshold && currentState != VaultState.EMERGENCY && currentState != VaultState.RELIEF_ACTIVE) {
            _declareEmergency(disasterType, geoHash);
        } else if (severity >= alertThreshold && currentState == VaultState.IDLE) {
            _transitionState(VaultState.ALERT);
        }
    }

    // ============ DAO Functions ============

    /**
     * @notice Declares an emergency via DAO governance (CURRENT MODE)
     * @dev This is the primary method for emergency declaration in DAO-only mode.
     *      DAO members submit a proposal with disaster evidence, and upon passing,
     *      this function is called to release funds.
     * @param disasterType Type of disaster (FLOOD, EARTHQUAKE, etc.)
     * @param geoHash Geographic location hash
     * @param evidence IPFS hash or URL to disaster evidence (news, BMKG data, etc.)
     */
    function declareEmergencyByDAO(
        bytes32 disasterType,
        bytes32 geoHash,
        string calldata evidence
    ) external onlyRole(DAO_ROLE) {
        require(
            currentState == VaultState.IDLE || currentState == VaultState.ALERT,
            "Already in emergency state"
        );
        
        // Update risk score to reflect DAO decision
        latestRiskScore = RiskScore({
            severity: 100, // DAO-declared emergencies are treated as CRITICAL
            disasterType: disasterType,
            geoHash: geoHash,
            timestamp: block.timestamp
        });
        
        emit RiskScoreUpdated(100, disasterType, geoHash);
        emit EmergencyDeclaredByDAO(disasterType, geoHash, evidence, msg.sender);
        
        _declareEmergency(disasterType, geoHash);
    }

    /**
     * @notice Creates a new volunteer task
     * @param description Task description
     * @param reward Reward amount in stablecoins
     * @param geoHash Location hash for the task
     */
    function createTask(
        string calldata description,
        uint256 reward,
        bytes32 geoHash
    ) external onlyRole(DAO_ROLE) returns (uint256) {
        if (currentState != VaultState.EMERGENCY && currentState != VaultState.RELIEF_ACTIVE) {
            revert InvalidState(currentState, VaultState.EMERGENCY);
        }
        if (reward == 0) revert ZeroAmount();
        
        uint256 availableFunds = _getAvailableFunds();
        if (reward > availableFunds) {
            revert InsufficientFunds(reward, availableFunds);
        }
        
        uint256 taskId = ++_taskIdCounter;
        
        tasks[taskId] = Task({
            id: taskId,
            description: description,
            reward: reward,
            volunteer: address(0),
            proofHash: bytes32(0),
            status: TaskStatus.OPEN,
            geoHash: geoHash,
            createdAt: block.timestamp,
            claimedAt: 0,
            completedAt: 0
        });
        
        emit TaskCreated(taskId, description, reward);
        
        return taskId;
    }

    /**
     * @notice Verifies task completion and pays volunteer
     * @param taskId ID of the task to verify
     */
    function verifyAndPay(uint256 taskId) external onlyRole(DAO_ROLE) nonReentrant {
        Task storage task = tasks[taskId];
        
        if (task.id == 0) revert TaskNotFound(taskId);
        if (task.status != TaskStatus.PROOF_SUBMITTED) {
            revert InvalidTaskStatus(task.status, TaskStatus.PROOF_SUBMITTED);
        }
        
        task.status = TaskStatus.VERIFIED;
        task.completedAt = block.timestamp;
        
        // Pay the volunteer
        stablecoin.safeTransfer(task.volunteer, task.reward);
        
        volunteerEarnings[task.volunteer] += task.reward;
        totalTaskPayouts += task.reward;
        totalReleased += task.reward;
        
        task.status = TaskStatus.PAID;
        
        emit TaskVerified(taskId, task.volunteer, task.reward);
    }

    /**
     * @notice Cancels an unclaimed task
     * @param taskId ID of the task to cancel
     */
    function cancelTask(uint256 taskId) external onlyRole(DAO_ROLE) {
        Task storage task = tasks[taskId];
        
        if (task.id == 0) revert TaskNotFound(taskId);
        if (task.status != TaskStatus.OPEN) {
            revert InvalidTaskStatus(task.status, TaskStatus.OPEN);
        }
        
        task.status = TaskStatus.CANCELLED;
        
        emit TaskCancelled(taskId);
    }

    /**
     * @notice Settles an emergency event
     * @param emergencyId ID of the emergency to settle
     */
    function settleEmergency(uint256 emergencyId) external onlyRole(DAO_ROLE) {
        EmergencyEvent storage emergency = emergencies[emergencyId];
        require(emergency.isActive, "Emergency not active");
        
        emergency.isActive = false;
        emergency.endTime = block.timestamp;
        emergency.fundsDistributed = totalTaskPayouts;
        
        _transitionState(VaultState.SETTLED);
        
        emit EmergencySettled(emergencyId, emergency.fundsDistributed);
    }

    /**
     * @notice Resets vault to IDLE state after settlement
     */
    function resetToIdle() external onlyRole(DAO_ROLE) {
        if (currentState != VaultState.SETTLED) {
            revert InvalidState(currentState, VaultState.SETTLED);
        }
        
        _transitionState(VaultState.IDLE);
    }

    // ============ Volunteer Functions ============

    /**
     * @notice Claims an open task
     * @param taskId ID of the task to claim
     */
    function claimTask(uint256 taskId) external {
        Task storage task = tasks[taskId];
        
        if (task.id == 0) revert TaskNotFound(taskId);
        if (task.status != TaskStatus.OPEN) {
            revert InvalidTaskStatus(task.status, TaskStatus.OPEN);
        }
        
        task.volunteer = msg.sender;
        task.status = TaskStatus.CLAIMED;
        task.claimedAt = block.timestamp;
        
        emit TaskClaimed(taskId, msg.sender);
    }

    /**
     * @notice Submits proof of task completion
     * @param taskId ID of the task
     * @param proofHash Hash of the proof (photo + GPS data)
     */
    function submitProof(uint256 taskId, bytes32 proofHash) external {
        Task storage task = tasks[taskId];
        
        if (task.id == 0) revert TaskNotFound(taskId);
        if (task.status != TaskStatus.CLAIMED) {
            revert InvalidTaskStatus(task.status, TaskStatus.CLAIMED);
        }
        if (task.volunteer != msg.sender) {
            revert NotTaskVolunteer(msg.sender, task.volunteer);
        }
        
        task.proofHash = proofHash;
        task.status = TaskStatus.PROOF_SUBMITTED;
        
        emit TaskProofSubmitted(taskId, proofHash);
    }

    // ============ Admin Functions ============

    /**
     * @notice Updates emergency release percentage
     * @param newPercentage New percentage (0-100)
     */
    function setEmergencyReleasePercentage(uint256 newPercentage) external onlyRole(ADMIN_ROLE) {
        if (newPercentage > 100) revert InvalidThreshold();
        emergencyReleasePercentage = newPercentage;
    }

    /**
     * @notice Updates risk score thresholds
     * @param _alertThreshold New alert threshold
     * @param _emergencyThreshold New emergency threshold
     */
    function setThresholds(uint256 _alertThreshold, uint256 _emergencyThreshold) external onlyRole(ADMIN_ROLE) {
        if (_alertThreshold >= _emergencyThreshold || _emergencyThreshold > 100) {
            revert InvalidThreshold();
        }
        alertThreshold = _alertThreshold;
        emergencyThreshold = _emergencyThreshold;
    }

    /**
     * @notice Pauses the vault
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the vault
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @notice Returns the current vault balance
     */
    function getVaultBalance() external view returns (uint256) {
        return stablecoin.balanceOf(address(this));
    }

    /**
     * @notice Returns available funds for task creation
     */
    function getAvailableFunds() external view returns (uint256) {
        return _getAvailableFunds();
    }

    /**
     * @notice Returns task details
     * @param taskId ID of the task
     */
    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    /**
     * @notice Returns the total number of tasks created
     */
    function getTaskCount() external view returns (uint256) {
        return _taskIdCounter;
    }

    /**
     * @notice Returns emergency event details
     * @param emergencyId ID of the emergency
     */
    function getEmergency(uint256 emergencyId) external view returns (EmergencyEvent memory) {
        return emergencies[emergencyId];
    }

    /**
     * @notice Returns campaign details
     * @param campaignId ID of the campaign
     */
    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        return campaigns[campaignId];
    }

    /**
     * @notice Returns the total number of campaigns created
     */
    function getCampaignCount() external view returns (uint256) {
        return _campaignIdCounter;
    }

    /**
     * @notice Returns donor's contribution to a specific campaign
     * @param campaignId ID of the campaign
     * @param donor Address of the donor
     */
    function getCampaignDonorBalance(uint256 campaignId, address donor) external view returns (uint256) {
        return campaignDonorBalances[campaignId][donor];
    }

    // ============ Internal Functions ============

    function _transitionState(VaultState newState) internal {
        VaultState oldState = currentState;
        currentState = newState;
        emit StateChanged(oldState, newState);
    }

    function _declareEmergency(bytes32 disasterType, bytes32 geoHash) internal {
        _transitionState(VaultState.EMERGENCY);
        
        uint256 currentBalance = stablecoin.balanceOf(address(this));
        uint256 releaseAmount = (currentBalance * emergencyReleasePercentage) / 100;
        
        uint256 emergencyId = ++_emergencyIdCounter;
        
        emergencies[emergencyId] = EmergencyEvent({
            id: emergencyId,
            disasterType: disasterType,
            geoHash: geoHash,
            startTime: block.timestamp,
            endTime: 0,
            fundsAllocated: releaseAmount,
            fundsDistributed: 0,
            isActive: true
        });
        
        emit EmergencyDeclared(emergencyId, disasterType, releaseAmount);
        emit FundsReleased(releaseAmount, "Emergency auto-release");
        
        _transitionState(VaultState.RELIEF_ACTIVE);
    }

    function _getAvailableFunds() internal view returns (uint256) {
        uint256 balance = stablecoin.balanceOf(address(this));
        // Reserve some funds for pending tasks
        return balance > totalTaskPayouts ? balance - totalTaskPayouts : 0;
    }
}
