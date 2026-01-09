// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ImpactNFT
 * @notice Soulbound (non-transferable) ERC-721 for volunteer reputation
 * @dev Each volunteer gets ONE NFT that tracks their cumulative impact
 * 
 * Features:
 * - Non-transferable (soulbound)
 * - Reputation score (0-10000)
 * - Tier system (Bronze → Silver → Gold → Platinum)
 * - IPFS metadata with on-chain CID
 * - Proof hash storage for verification
 */
contract ImpactNFT is ERC721, Ownable {
    using Strings for uint256;

    // ============ Enums ============
    enum Tier {
        None,      // 0 tasks
        Bronze,    // 1-5 tasks
        Silver,    // 6-20 tasks
        Gold,      // 21-50 tasks
        Platinum   // 51+ tasks
    }

    // ============ Structs ============
    struct Impact {
        uint256 tasksCompleted;
        uint256 reputation;      // 0-10000 (100.00 scale)
        uint256 totalRewards;    // Total USDC earned
        uint256 firstTaskAt;     // Timestamp of first task
        uint256 lastTaskAt;      // Timestamp of last task
        Tier tier;
        string metadataCID;      // IPFS CID for rich metadata
    }

    struct ProofRecord {
        bytes32 proofHash;       // Hash of photo + GPS + timestamp
        uint256 taskId;
        uint256 timestamp;
        bool verified;
    }

    // ============ State Variables ============
    uint256 private _nextTokenId = 1;
    
    /// @notice Mapping from volunteer address to their Impact data
    mapping(address => Impact) public impacts;
    
    /// @notice Mapping from volunteer address to their proof records
    mapping(address => ProofRecord[]) public proofRecords;
    
    /// @notice Mapping from volunteer address to their token ID
    mapping(address => uint256) public volunteerToTokenId;
    
    /// @notice Mapping from token ID to volunteer address
    mapping(uint256 => address) public tokenIdToVolunteer;

    /// @notice Addresses authorized to record impacts (e.g., ParametricVault)
    mapping(address => bool) public minters;

    /// @notice Base URI for token metadata
    string public baseMetadataURI;

    // ============ Events ============
    event ImpactRecorded(
        address indexed volunteer,
        uint256 tokenId,
        uint256 tasksCompleted,
        uint256 reputation,
        Tier tier
    );

    event TierUpgrade(
        address indexed volunteer,
        Tier previousTier,
        Tier newTier
    );

    event ProofSubmitted(
        address indexed volunteer,
        bytes32 proofHash,
        uint256 taskId
    );

    event MinterUpdated(address indexed minter, bool authorized);

    // ============ Errors ============
    error SoulboundTransferDisabled();
    error NotAuthorizedMinter();
    error AlreadyHasToken();
    error NoTokenOwned();

    // ============ Modifiers ============
    modifier onlyMinter() {
        if (!minters[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedMinter();
        }
        _;
    }

    // ============ Constructor ============
    constructor(
        address initialOwner
    ) ERC721("DRCP Impact", "IMPACT") Ownable(initialOwner) {
        baseMetadataURI = "ipfs://";
    }

    // ============ Soulbound Logic ============
    /**
     * @notice Override to prevent transfers (soulbound)
     * @dev Allows minting (from = 0) and burning (to = 0) but not transfers
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting and burning, block transfers
        if (from != address(0) && to != address(0)) {
            revert SoulboundTransferDisabled();
        }
        
        return super._update(to, tokenId, auth);
    }

    // ============ Core Functions ============

    /**
     * @notice Record a completed task for a volunteer
     * @param volunteer Address of the volunteer
     * @param proofHash Hash of the proof (photo + GPS + timestamp)
     * @param taskId ID of the completed task
     * @param rewardAmount Amount rewarded in USDC (6 decimals)
     */
    function recordImpact(
        address volunteer,
        bytes32 proofHash,
        uint256 taskId,
        uint256 rewardAmount
    ) external onlyMinter {
        Impact storage impact = impacts[volunteer];
        
        // Mint token if first task
        if (volunteerToTokenId[volunteer] == 0) {
            _mintImpactNFT(volunteer);
        }

        // Update impact data
        uint256 timestamp = block.timestamp;
        if (impact.firstTaskAt == 0) {
            impact.firstTaskAt = timestamp;
        }
        impact.lastTaskAt = timestamp;
        impact.tasksCompleted += 1;
        impact.totalRewards += rewardAmount;
        
        // Calculate reputation increase (base 100 + bonuses)
        uint256 repIncrease = _calculateReputationIncrease(impact);
        impact.reputation += repIncrease;
        if (impact.reputation > 10000) {
            impact.reputation = 10000; // Cap at 100.00
        }

        // Check for tier upgrade
        Tier newTier = _calculateTier(impact.tasksCompleted);
        if (newTier != impact.tier) {
            Tier previousTier = impact.tier;
            impact.tier = newTier;
            emit TierUpgrade(volunteer, previousTier, newTier);
        }

        // Store proof record
        proofRecords[volunteer].push(ProofRecord({
            proofHash: proofHash,
            taskId: taskId,
            timestamp: timestamp,
            verified: true
        }));

        emit ProofSubmitted(volunteer, proofHash, taskId);
        emit ImpactRecorded(
            volunteer,
            volunteerToTokenId[volunteer],
            impact.tasksCompleted,
            impact.reputation,
            impact.tier
        );
    }

    /**
     * @notice Update metadata CID for a volunteer
     * @param volunteer Address of the volunteer
     * @param cid IPFS CID for the metadata
     */
    function updateMetadataCID(
        address volunteer,
        string calldata cid
    ) external onlyMinter {
        impacts[volunteer].metadataCID = cid;
    }

    // ============ Internal Functions ============

    function _mintImpactNFT(address volunteer) internal {
        if (volunteerToTokenId[volunteer] != 0) {
            revert AlreadyHasToken();
        }

        uint256 tokenId = _nextTokenId++;
        _safeMint(volunteer, tokenId);
        
        volunteerToTokenId[volunteer] = tokenId;
        tokenIdToVolunteer[tokenId] = volunteer;
        impacts[volunteer].tier = Tier.Bronze;
    }

    function _calculateReputationIncrease(
        Impact storage impact
    ) internal view returns (uint256) {
        uint256 base = 100; // 1.00 points per task
        
        // Consistency bonus: +20% if task within 7 days of last
        if (impact.lastTaskAt > 0 && 
            block.timestamp - impact.lastTaskAt < 7 days) {
            base = base * 120 / 100;
        }
        
        // Tier bonus
        if (impact.tier == Tier.Silver) base = base * 110 / 100;
        if (impact.tier == Tier.Gold) base = base * 120 / 100;
        if (impact.tier == Tier.Platinum) base = base * 130 / 100;
        
        return base;
    }

    function _calculateTier(uint256 tasks) internal pure returns (Tier) {
        if (tasks >= 51) return Tier.Platinum;
        if (tasks >= 21) return Tier.Gold;
        if (tasks >= 6) return Tier.Silver;
        if (tasks >= 1) return Tier.Bronze;
        return Tier.None;
    }

    // ============ View Functions ============

    /**
     * @notice Get full impact data for a volunteer
     */
    function getImpact(address volunteer) external view returns (Impact memory) {
        return impacts[volunteer];
    }

    /**
     * @notice Get proof records for a volunteer
     */
    function getProofRecords(
        address volunteer
    ) external view returns (ProofRecord[] memory) {
        return proofRecords[volunteer];
    }

    /**
     * @notice Get token URI (points to IPFS metadata)
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        address volunteer = tokenIdToVolunteer[tokenId];
        string memory cid = impacts[volunteer].metadataCID;
        
        if (bytes(cid).length > 0) {
            return string(abi.encodePacked(baseMetadataURI, cid));
        }
        
        // Default: return on-chain generated URI
        return string(abi.encodePacked(
            baseMetadataURI,
            "QmDefaultMetadata/",
            tokenId.toString()
        ));
    }

    /**
     * @notice Get tier name as string
     */
    function getTierName(Tier tier) public pure returns (string memory) {
        if (tier == Tier.Platinum) return "Platinum";
        if (tier == Tier.Gold) return "Gold";
        if (tier == Tier.Silver) return "Silver";
        if (tier == Tier.Bronze) return "Bronze";
        return "None";
    }

    /**
     * @notice Get the number of tasks required for next tier
     */
    function tasksToNextTier(address volunteer) external view returns (uint256) {
        uint256 tasks = impacts[volunteer].tasksCompleted;
        Tier tier = impacts[volunteer].tier;
        
        if (tier == Tier.Platinum) return 0; // Already max
        if (tier == Tier.Gold) return 51 - tasks;
        if (tier == Tier.Silver) return 21 - tasks;
        if (tier == Tier.Bronze) return 6 - tasks;
        return 1; // Need 1 task to get Bronze
    }

    // ============ Admin Functions ============

    function setMinter(address minter, bool authorized) external onlyOwner {
        minters[minter] = authorized;
        emit MinterUpdated(minter, authorized);
    }

    function setBaseMetadataURI(string calldata uri) external onlyOwner {
        baseMetadataURI = uri;
    }
}
