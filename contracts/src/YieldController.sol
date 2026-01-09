// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title YieldController
 * @notice Manages vault funds between liquid reserve and yield-earning pool
 * @dev Configurable 80/20 split with DAO governance
 * 
 * Features:
 * - Configurable liquid/yield ratio (default 80/20)
 * - Treasury yield share (25% of yield to project)
 * - DAO governance for ratio changes
 * - Ready for Aave V3 integration
 */
contract YieldController is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Roles ============
    bytes32 public constant DAO_ROLE = keccak256("DAO_ROLE");

    // ============ State Variables ============
    IERC20 public immutable stablecoin;
    address public vault;
    address public treasury;
    
    // Ratio configuration (must sum to 100)
    uint256 public liquidRatio = 80;   // 80% stays liquid
    uint256 public yieldRatio = 20;    // 20% to yield pool
    
    // Yield distribution
    uint256 public treasuryYieldShare = 25;  // 25% of yield to treasury
    
    // Tracking
    uint256 public totalInYield;
    uint256 public totalYieldEarned;
    uint256 public totalYieldToTreasury;

    // ============ Events ============
    event RatioUpdated(
        uint256 liquidRatio, 
        uint256 yieldRatio,
        address indexed updatedBy
    );
    
    event TreasuryShareUpdated(
        uint256 oldShare,
        uint256 newShare,
        address indexed updatedBy
    );
    
    event FundsDeployedToYield(
        uint256 amount,
        uint256 timestamp
    );
    
    event FundsWithdrawnFromYield(
        uint256 amount,
        uint256 timestamp
    );
    
    event YieldHarvested(
        uint256 totalYield,
        uint256 toTreasury,
        uint256 toVault,
        uint256 timestamp
    );

    // ============ Errors ============
    error InvalidRatio();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientYieldBalance();
    error NotImplemented();

    // ============ Constructor ============
    constructor(
        address _stablecoin,
        address _vault,
        address _treasury,
        address _admin
    ) {
        if (_stablecoin == address(0)) revert ZeroAddress();
        if (_vault == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();
        if (_admin == address(0)) revert ZeroAddress();
        
        stablecoin = IERC20(_stablecoin);
        vault = _vault;
        treasury = _treasury;
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(DAO_ROLE, _admin);
    }

    // ============ Configuration Functions ============
    
    /**
     * @notice Update liquid/yield ratio (DAO governance)
     * @param _liquidRatio New liquid percentage (50-100)
     * @param _yieldRatio New yield percentage (0-50)
     */
    function setRatios(
        uint256 _liquidRatio, 
        uint256 _yieldRatio
    ) external onlyRole(DAO_ROLE) {
        if (_liquidRatio + _yieldRatio != 100) revert InvalidRatio();
        if (_liquidRatio < 50) revert InvalidRatio(); // Safety: min 50% liquid
        if (_yieldRatio > 50) revert InvalidRatio();  // Safety: max 50% yield
        
        liquidRatio = _liquidRatio;
        yieldRatio = _yieldRatio;
        
        emit RatioUpdated(_liquidRatio, _yieldRatio, msg.sender);
    }
    
    /**
     * @notice Update treasury's share of yield (DAO governance)
     * @param _newShare New treasury share percentage (0-50)
     */
    function setTreasuryYieldShare(uint256 _newShare) external onlyRole(DAO_ROLE) {
        if (_newShare > 50) revert InvalidRatio(); // Max 50% to treasury
        
        uint256 oldShare = treasuryYieldShare;
        treasuryYieldShare = _newShare;
        
        emit TreasuryShareUpdated(oldShare, _newShare, msg.sender);
    }
    
    /**
     * @notice Update vault address (admin only)
     */
    function setVault(address _vault) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_vault == address(0)) revert ZeroAddress();
        vault = _vault;
    }
    
    /**
     * @notice Update treasury address (admin only)
     */
    function setTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
    }

    // ============ Yield Functions (Ready for Aave integration) ============
    
    /**
     * @notice Deploy funds to yield protocol
     * @dev TODO: Integrate with Aave V3 aToken deposit
     */
    function deployToYield(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (amount == 0) revert ZeroAmount();
        
        // Transfer from vault to this contract
        stablecoin.safeTransferFrom(vault, address(this), amount);
        totalInYield += amount;
        
        // TODO: Deposit to Aave
        // aavePool.supply(address(stablecoin), amount, address(this), 0);
        
        emit FundsDeployedToYield(amount, block.timestamp);
    }
    
    /**
     * @notice Withdraw funds from yield protocol
     * @dev TODO: Integrate with Aave V3 aToken withdrawal
     */
    function withdrawFromYield(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (amount > totalInYield) revert InsufficientYieldBalance();
        
        totalInYield -= amount;
        
        // TODO: Withdraw from Aave
        // aavePool.withdraw(address(stablecoin), amount, vault);
        
        // For now, just transfer back to vault
        stablecoin.safeTransfer(vault, amount);
        
        emit FundsWithdrawnFromYield(amount, block.timestamp);
    }
    
    /**
     * @notice Harvest yield and distribute to treasury/vault
     * @dev TODO: Calculate actual yield from Aave
     */
    function harvestYield() external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        // TODO: Get actual yield from Aave (aToken balance - totalInYield)
        // For now, this is a placeholder
        
        uint256 yieldAmount = 0; // Would be: aTokenBalance - totalInYield
        
        if (yieldAmount == 0) revert ZeroAmount();
        
        uint256 toTreasury = (yieldAmount * treasuryYieldShare) / 100;
        uint256 toVault = yieldAmount - toTreasury;
        
        totalYieldEarned += yieldAmount;
        totalYieldToTreasury += toTreasury;
        
        if (toTreasury > 0) {
            stablecoin.safeTransfer(treasury, toTreasury);
        }
        if (toVault > 0) {
            stablecoin.safeTransfer(vault, toVault);
        }
        
        emit YieldHarvested(yieldAmount, toTreasury, toVault, block.timestamp);
    }

    // ============ View Functions ============
    
    /**
     * @notice Calculate how much of a deposit should go to yield
     * @param depositAmount Total deposit amount
     */
    function calculateYieldAllocation(uint256 depositAmount) external view returns (
        uint256 liquidAmount,
        uint256 yieldAmount
    ) {
        yieldAmount = (depositAmount * yieldRatio) / 100;
        liquidAmount = depositAmount - yieldAmount;
    }
    
    /**
     * @notice Get current configuration
     */
    function getConfig() external view returns (
        uint256 _liquidRatio,
        uint256 _yieldRatio,
        uint256 _treasuryYieldShare,
        address _vault,
        address _treasury
    ) {
        return (liquidRatio, yieldRatio, treasuryYieldShare, vault, treasury);
    }
    
    /**
     * @notice Get yield statistics
     */
    function getYieldStats() external view returns (
        uint256 _totalInYield,
        uint256 _totalYieldEarned,
        uint256 _totalYieldToTreasury
    ) {
        return (totalInYield, totalYieldEarned, totalYieldToTreasury);
    }
}
