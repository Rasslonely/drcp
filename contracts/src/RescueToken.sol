// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RescueToken
 * @author DRCP Team
 * @notice Governance token for the Disaster Response Coordination Protocol
 * @dev ERC20 with voting capabilities for DAO governance
 * 
 * Features:
 * - ERC20Votes: Enables on-chain voting delegation
 * - ERC20Permit: Gasless approvals via EIP-2612
 * - Capped supply: 100,000,000 tokens maximum
 * - Owner-controlled minting (transferred to DAO after launch)
 */
contract RescueToken is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, Ownable {
    /// @notice Maximum supply cap (100 million tokens with 18 decimals)
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;

    /// @notice Emitted when tokens are minted
    event TokensMinted(address indexed to, uint256 amount);

    /// @notice Error thrown when minting would exceed max supply
    error ExceedsMaxSupply(uint256 requested, uint256 available);

    /**
     * @notice Initializes the RescueToken
     * @param initialOwner Address that will own the contract and can mint tokens
     */
    constructor(address initialOwner)
        ERC20("Rescue Token", "RESCUE")
        ERC20Permit("Rescue Token")
        Ownable(initialOwner)
    {}

    /**
     * @notice Mints new tokens to an address
     * @dev Only callable by owner, respects max supply cap
     * @param to Recipient address
     * @param amount Amount of tokens to mint (in wei, 18 decimals)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        uint256 available = MAX_SUPPLY - totalSupply();
        if (amount > available) {
            revert ExceedsMaxSupply(amount, available);
        }
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @notice Returns the remaining mintable supply
     * @return The amount of tokens that can still be minted
     */
    function remainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    // ============ Required Overrides ============

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
