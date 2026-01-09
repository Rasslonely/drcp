// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title DRCPTimelock
 * @author DRCP Team
 * @notice Timelock controller for DRCP governance
 * @dev Simple wrapper around OpenZeppelin TimelockController
 */
contract DRCPTimelock is TimelockController {
    /**
     * @notice Initializes the timelock
     * @param minDelay Minimum delay for operations
     * @param proposers Addresses that can propose
     * @param executors Addresses that can execute
     * @param admin Optional admin address
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}
