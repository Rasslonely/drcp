// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProjectTreasury
 * @notice Receives project support donations separate from disaster relief funds
 * @dev Simple treasury for platform maintenance costs
 * 
 * Features:
 * - Accept USDC/USDT donations for project support
 * - Track individual donor contributions
 * - Admin-controlled withdrawals with reason logging
 * - Event emissions for transparency
 */
contract ProjectTreasury is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============
    IERC20 public immutable stablecoin;
    
    uint256 public totalDonations;
    uint256 public totalWithdrawn;
    uint256 public donorCount;
    
    mapping(address => uint256) public donorContributions;
    mapping(address => bool) private hasDonated;

    // ============ Events ============
    event ProjectDonation(
        address indexed donor, 
        uint256 amount, 
        string message,
        uint256 timestamp
    );
    
    event FundsWithdrawn(
        address indexed to, 
        uint256 amount, 
        string reason,
        uint256 timestamp
    );
    
    event NativeDonation(
        address indexed donor, 
        uint256 amount,
        uint256 timestamp
    );

    // ============ Errors ============
    error ZeroAmount();
    error ZeroAddress();
    error InsufficientBalance();

    // ============ Constructor ============
    constructor(address _stablecoin, address _admin) {
        if (_stablecoin == address(0) || _admin == address(0)) revert ZeroAddress();
        
        stablecoin = IERC20(_stablecoin);
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    }

    // ============ Donation Functions ============
    
    /**
     * @notice Donate stablecoins to support the project
     * @param amount Amount of stablecoins to donate
     * @param message Optional message from donor
     */
    function donate(uint256 amount, string calldata message) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);
        
        totalDonations += amount;
        donorContributions[msg.sender] += amount;
        
        if (!hasDonated[msg.sender]) {
            hasDonated[msg.sender] = true;
            donorCount++;
        }
        
        emit ProjectDonation(msg.sender, amount, message, block.timestamp);
    }
    
    /**
     * @notice Donate native currency (MATIC/ETH)
     */
    receive() external payable {
        if (msg.value == 0) revert ZeroAmount();
        
        if (!hasDonated[msg.sender]) {
            hasDonated[msg.sender] = true;
            donorCount++;
        }
        
        emit NativeDonation(msg.sender, msg.value, block.timestamp);
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Withdraw funds for project expenses
     * @param to Recipient address
     * @param amount Amount to withdraw
     * @param reason Reason for withdrawal (for transparency)
     */
    function withdraw(
        address to, 
        uint256 amount, 
        string calldata reason
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (stablecoin.balanceOf(address(this)) < amount) revert InsufficientBalance();
        
        totalWithdrawn += amount;
        stablecoin.safeTransfer(to, amount);
        
        emit FundsWithdrawn(to, amount, reason, block.timestamp);
    }
    
    /**
     * @notice Withdraw native currency
     * @param to Recipient address
     * @param amount Amount to withdraw
     * @param reason Reason for withdrawal
     */
    function withdrawNative(
        address payable to,
        uint256 amount,
        string calldata reason
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (address(this).balance < amount) revert InsufficientBalance();
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(to, amount, reason, block.timestamp);
    }

    // ============ View Functions ============
    
    /**
     * @notice Get current stablecoin balance
     */
    function getBalance() external view returns (uint256) {
        return stablecoin.balanceOf(address(this));
    }
    
    /**
     * @notice Get native currency balance
     */
    function getNativeBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Get donor's total contribution
     */
    function getDonorContribution(address donor) external view returns (uint256) {
        return donorContributions[donor];
    }
    
    /**
     * @notice Get treasury stats
     */
    function getStats() external view returns (
        uint256 _totalDonations,
        uint256 _totalWithdrawn,
        uint256 _currentBalance,
        uint256 _donorCount
    ) {
        return (
            totalDonations,
            totalWithdrawn,
            stablecoin.balanceOf(address(this)),
            donorCount
        );
    }
}
