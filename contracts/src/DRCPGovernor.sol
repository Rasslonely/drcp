// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

/**
 * @title DRCPGovernor
 * @author DRCP Team
 * @notice DAO Governor for the Disaster Response Coordination Protocol
 * @dev OpenZeppelin Governor with custom settings for disaster response
 * 
 * Features:
 * - Standard proposals (3 day voting)
 * - Emergency proposals (1 day voting) - ENFORCED via proposalDeadline override
 * - Upgrade proposals (67% supermajority) - ENFORCED via _voteSucceeded override
 * - 10% quorum requirement
 * - 1000 RESCUE proposal threshold
 * 
 * AUDIT FIX (2026-01-04):
 * - C-01: Emergency voting period now properly enforced
 * - C-02: Upgrade supermajority (67%) now properly enforced
 */
contract DRCPGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    /// @notice Proposal type for categorization
    enum ProposalType {
        STANDARD,
        EMERGENCY,
        UPGRADE
    }

    /// @notice Mapping of proposal ID to type
    mapping(uint256 => ProposalType) public proposalTypes;

    /// @notice Custom deadlines for emergency proposals (overrides standard deadline)
    mapping(uint256 => uint256) private _customDeadlines;

    /// @notice Emergency voting period (1 day in blocks, ~43200 on Polygon at 2s/block)
    uint256 public constant EMERGENCY_VOTING_PERIOD = 43200;

    /// @notice Supermajority threshold for upgrade proposals (67% = 6700 basis points)
    uint256 public constant UPGRADE_SUPERMAJORITY_BPS = 6700;

    /// @notice Emitted when an emergency proposal is created
    event EmergencyProposalCreated(
        uint256 indexed proposalId,
        address proposer,
        string description
    );

    /// @notice Emitted when an upgrade proposal is created
    event UpgradeProposalCreated(
        uint256 indexed proposalId,
        address proposer,
        string description
    );

    /**
     * @notice Initializes the DRCPGovernor
     * @param _token The governance token (RescueToken)
     * @param _timelock The timelock controller
     * @param _votingDelay Delay before voting starts (in blocks)
     * @param _votingPeriod Duration of voting (in blocks)
     * @param _proposalThreshold Minimum tokens to create proposal
     */
    constructor(
        IVotes _token,
        TimelockController _timelock,
        uint48 _votingDelay,
        uint32 _votingPeriod,
        uint256 _proposalThreshold
    )
        Governor("DRCP Governor")
        GovernorSettings(_votingDelay, _votingPeriod, _proposalThreshold)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(10) // 10% quorum
        GovernorTimelockControl(_timelock)
    {}

    // ============ Proposal Functions ============

    /**
     * @notice Creates a standard proposal
     * @param targets Target addresses for calls
     * @param values ETH values for calls
     * @param calldatas Encoded function calls
     * @param description Proposal description
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    )
        public
        override
        returns (uint256)
    {
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        proposalTypes[proposalId] = ProposalType.STANDARD;
        return proposalId;
    }

    /**
     * @notice Creates an emergency proposal with faster voting (1 day instead of 3)
     * @dev AUDIT FIX C-01: Now properly enforces shorter voting period
     * @param targets Target addresses for calls
     * @param values ETH values for calls
     * @param calldatas Encoded function calls
     * @param description Proposal description
     */
    function proposeEmergency(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    )
        public
        returns (uint256)
    {
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        proposalTypes[proposalId] = ProposalType.EMERGENCY;
        
        // AUDIT FIX C-01: Override the deadline to use emergency voting period
        // Deadline = snapshot + votingDelay + emergencyVotingPeriod
        uint256 snapshot = proposalSnapshot(proposalId);
        _customDeadlines[proposalId] = snapshot + EMERGENCY_VOTING_PERIOD;
        
        emit EmergencyProposalCreated(proposalId, msg.sender, description);
        
        return proposalId;
    }

    /**
     * @notice Creates an upgrade proposal requiring 67% supermajority
     * @dev AUDIT FIX C-02: Now properly enforces supermajority threshold
     * @param targets Target addresses for calls
     * @param values ETH values for calls
     * @param calldatas Encoded function calls
     * @param description Proposal description
     */
    function proposeUpgrade(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    )
        public
        returns (uint256)
    {
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        proposalTypes[proposalId] = ProposalType.UPGRADE;
        
        emit UpgradeProposalCreated(proposalId, msg.sender, description);
        
        return proposalId;
    }

    // ============ View Functions ============

    /**
     * @notice Returns the proposal type
     * @param proposalId The proposal ID
     */
    function getProposalType(uint256 proposalId) external view returns (ProposalType) {
        return proposalTypes[proposalId];
    }

    /**
     * @notice Returns the deadline for a proposal
     * @dev AUDIT FIX C-01: Emergency proposals use shorter deadline
     * @param proposalId The proposal ID
     */
    function proposalDeadline(uint256 proposalId)
        public
        view
        override(Governor)
        returns (uint256)
    {
        // If custom deadline is set (emergency proposals), use it
        if (_customDeadlines[proposalId] != 0) {
            return _customDeadlines[proposalId];
        }
        // Otherwise use standard deadline from parent
        return super.proposalDeadline(proposalId);
    }

    // ============ Vote Success Override ============

    /**
     * @notice Determines if a proposal vote has succeeded
     * @dev AUDIT FIX C-02: Upgrade proposals require 67% supermajority
     * @param proposalId The proposal ID
     */
    function _voteSucceeded(uint256 proposalId)
        internal
        view
        override(Governor, GovernorCountingSimple)
        returns (bool)
    {
        // For UPGRADE proposals, require 67% supermajority
        if (proposalTypes[proposalId] == ProposalType.UPGRADE) {
            (uint256 againstVotes, uint256 forVotes, ) = proposalVotes(proposalId);
            uint256 totalVotes = forVotes + againstVotes;
            
            // Avoid division by zero
            if (totalVotes == 0) {
                return false;
            }
            
            // Check if forVotes >= 67% of total votes
            // Using basis points: forVotes * 10000 >= totalVotes * 6700
            return forVotes * 10000 >= totalVotes * UPGRADE_SUPERMAJORITY_BPS;
        }
        
        // Standard and Emergency use simple majority
        return super._voteSucceeded(proposalId);
    }

    // ============ Required Overrides ============

    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint48)
    {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
}
