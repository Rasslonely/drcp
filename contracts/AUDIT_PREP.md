# 🛡️ DRCP Smart Contract Audit Preparation

> **Protocol:** Disaster Response Coordination Protocol (DRCP)
> **Author:** DRCP Team
> **Version:** 1.0.0-beta
> **Network:** Polygon Amoy (Testnet) → Polygon PoS (Mainnet)
> **Last Updated:** 2026-01-06

---

## 📋 Executive Summary

DRCP is a parametric disaster relief protocol that coordinates donations, volunteer tasks, and emergency fund distribution using smart contracts and DAO governance.

### Key Stats

| Metric | Value |
|--------|-------|
| Total Contracts | 8 |
| Total Lines of Code | ~2,500 |
| External Dependencies | OpenZeppelin v5.x |
| TVL Cap (Beta) | $1,000 USDC |

---

## 📁 Contract Overview

```
contracts/src/
├── ParametricVault.sol    # Core vault (713 lines) - deposits, tasks, emergencies
├── RescueToken.sol        # Governance token (83 lines) - ERC20Votes
├── DRCPGovernor.sol       # DAO governance (336 lines) - proposals, voting
├── DRCPTimelock.sol       # Timelock controller (30 lines) - execution delay
├── ImpactNFT.sol          # Volunteer rewards (300 lines) - soulbound NFTs
├── ProjectTreasury.sol    # Protocol revenue (180 lines) - donations
├── YieldController.sol    # Yield routing (250 lines) - future use
└── mocks/
    └── MockUSDC.sol       # Test stablecoin
```

---

## 🏗️ Architecture

### Inheritance Diagram

```
ParametricVault
├── AccessControl (OpenZeppelin)
├── ReentrancyGuard (OpenZeppelin)
└── Pausable (OpenZeppelin)

RescueToken
├── ERC20 (OpenZeppelin)
├── ERC20Votes (OpenZeppelin)
├── ERC20Permit (OpenZeppelin)
├── ERC20Burnable (OpenZeppelin)
└── Ownable (OpenZeppelin)

DRCPGovernor
├── Governor (OpenZeppelin)
├── GovernorSettings
├── GovernorCountingSimple
├── GovernorVotes
├── GovernorVotesQuorumFraction
└── GovernorTimelockControl
```

### State Machine (ParametricVault)

```
IDLE ──(risk >= 50)──> ALERT ──(risk >= 80)──> EMERGENCY
  ^                                               │
  │                                               ▼
  └──────────(settleEmergency)────── RELIEF_ACTIVE ──> SETTLED
```

---

## 🔐 Access Control

### Roles (ParametricVault)

| Role | Permissions | Intended Holder |
|------|-------------|-----------------|
| `DEFAULT_ADMIN_ROLE` | Grant/revoke roles | Gnosis Safe Multisig |
| `ADMIN_ROLE` | Pause, update thresholds | Gnosis Safe Multisig |
| `ORACLE_ROLE` | Update risk scores | Chainlink Functions (or DAO initially) |
| `DAO_ROLE` | Create tasks, settle emergencies, manage campaigns | DRCPGovernor (timelock) |

### Role Assignment Flow

```
Deployer → grants ADMIN_ROLE to multisig
Multisig → grants DAO_ROLE to DRCPTimelock
Multisig → grants ORACLE_ROLE to Chainlink (or multisig initially)
Multisig → renounces DEFAULT_ADMIN_ROLE (after setup)
```

---

## 💰 Value Flow

### Primary Flow: Donations → Vault → Relief

```
1. Donor.deposit(amount)
   └── USDC.transferFrom(donor, vault, amount)
   └── totalDeposits += amount
   └── donorBalances[donor] += amount
   └── emit Deposited(donor, amount)

2. Oracle.updateRiskScore(severity, disasterType, geoHash)
   └── if severity >= 80: declareEmergency()
       └── fundsAllocated = balance * 20%
       └── emit EmergencyDeclared(...)

3. DAO.createTask(description, reward, geoHash)
   └── tasks[taskId] = Task{...}
   └── emit TaskCreated(taskId, description, reward)

4. Volunteer.claimTask(taskId) → submitProof(taskId, proofHash)

5. DAO.verifyAndPay(taskId)
   └── USDC.transfer(volunteer, reward)
   └── totalTaskPayouts += reward
   └── emit TaskVerified(taskId, volunteer, reward)
```

---

## ⚠️ Known Issues / Design Tradeoffs

### 1. Centralization During Beta

**Issue:** ORACLE_ROLE can trigger emergency and release 20% of funds.

**Mitigation:**
- TVL cap limits exposure to $1,000
- DAO can override via governance
- Oracle will be replaced by Chainlink Functions

**Status:** Accepted (beta phase)

---

### 2. Withdrawal During Emergency

**Issue:** Users CAN withdraw during EMERGENCY state (by design).

**Rationale:** Donors should always have exit liquidity. This is a feature, not a bug.

**Impact:** Protocol may have less funds than expected for relief.

**Status:** Accepted (donor protection)

---

### 3. No Task Reward Cap

**Issue:** DAO can create tasks with any reward amount.

**Mitigation:**
- DAO governance = community consensus
- Timelock provides reaction time

**Status:** Accepted (governance trust)

---

### 4. Off-Chain Proof Verification

**Issue:** Task proof is only a hash; actual verification is off-chain.

**Rationale:** On-chain image/GPS verification is not practical.

**Mitigation:**
- DAO verifiers review evidence manually
- Malicious verifiers can be slashed via governance

**Status:** Accepted (practical constraint)

---

## 🎯 Attack Surface Analysis

### High Priority Areas

| Area | Risk | Mitigation |
|------|------|------------|
| `deposit()` | Flash loan | `nonReentrant`, no callback |
| `withdraw()` | Reentrancy | `nonReentrant`, CEI pattern |
| `verifyAndPay()` | Reentrancy | `nonReentrant`, SafeERC20 |
| `updateRiskScore()` | Oracle manipulation | Role-gated, auditable |
| Governor proposals | Flash loan voting | Snapshot at proposal creation |

### External Calls

| Function | External Call | Safe? |
|----------|---------------|-------|
| `deposit()` | `USDC.safeTransferFrom()` | ✅ SafeERC20 |
| `withdraw()` | `USDC.safeTransfer()` | ✅ SafeERC20 |
| `verifyAndPay()` | `USDC.safeTransfer()` | ✅ SafeERC20 |
| `claimTask()` | None | ✅ |
| `submitProof()` | None | ✅ |

### Invariants

1. `totalDeposits >= totalReleased + USDC.balanceOf(vault)`
2. `∑donorBalances[*] == totalDeposits - totalReleased`
3. `totalTaskPayouts <= totalReleased`
4. `USDC.balanceOf(vault) <= MAX_TVL`

---

## 📊 Test Coverage

### Existing Tests

| Contract | Tests | Coverage |
|----------|-------|----------|
| ParametricVault | 15 tests | ~85% |
| DRCPGovernor | 12 tests | ~80% |
| ImpactNFT | 10 tests | ~75% |
| RescueToken | 8 tests | ~90% |
| ProjectTreasury | 6 tests | ~70% |

### Run Tests

```bash
cd contracts
npm install
npm test
```

### Run Coverage

```bash
npm run coverage
```

---

## 🔗 Deployed Contracts (Testnet)

| Contract | Address (Polygon Amoy) |
|----------|------------------------|
| ParametricVault | `0x5ce8cCF75A8Ff90Ba1e73Ba9cBE81dEab6A5dFfB` |
| RescueToken | `0xa5247E2e494186EAe1Df1e2e747C3c920D8AC7a9` |
| DRCPGovernor | `0x...` |
| DRCPTimelock | `0x...` |

> **Note:** Addresses need to be verified on PolygonScan

---

## 📝 Audit Scope

### In Scope

- `contracts/src/*.sol` - All source contracts
- State transitions
- Access control
- Fund safety
- Governance attacks

### Out of Scope

- `contracts/src/mocks/*` - Test mocks
- Frontend security
- Off-chain components
- Chainlink Functions integration (not deployed yet)

---

## 🤝 Contact

**Email:** [contact email]
**Discord:** [discord link]
**GitHub:** [repo link]

---

## 📅 Audit Timeline (Recommended)

| Phase | Duration | Notes |
|-------|----------|-------|
| Code Freeze | 1 week | No changes during audit |
| Initial Review | 1-2 weeks | Auditor analysis |
| Finding Discussion | 3-5 days | Clarifications |
| Fixes | 1 week | Implement remediations |
| Re-audit | 1 week | Verify fixes |

---

*Document prepared for third-party security audit.*
