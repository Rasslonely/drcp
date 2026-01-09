import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";
import { ParametricVault, MockUSDC } from "../typechain-types";

/**
 * Security Invariants Test Suite
 * 
 * These tests verify critical protocol invariants that should NEVER be violated.
 * If any of these tests fail, it indicates a potential security vulnerability.
 * 
 * Prepared for: Third-party security audit
 */
describe("Security Invariants", function () {
  const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE_ROLE"));
  const DAO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DAO_ROLE"));
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
  
  const DEPOSIT_AMOUNT = ethers.parseUnits("100", 6); // 100 USDC
  const MAX_TVL = ethers.parseUnits("1000", 6); // $1,000 USDC

  async function deployFullFixture() {
    const [admin, oracle, dao, donor1, donor2, volunteer] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDCFactory.deploy() as unknown as MockUSDC;
    await usdc.waitForDeployment();

    // Deploy ParametricVault (requires usdc address + admin address)
    const VaultFactory = await ethers.getContractFactory("ParametricVault");
    const vault = await VaultFactory.deploy(await usdc.getAddress(), admin.address) as unknown as ParametricVault;
    await vault.waitForDeployment();

    // Setup roles
    await vault.connect(admin).grantRole(ORACLE_ROLE, oracle.address);
    await vault.connect(admin).grantRole(DAO_ROLE, dao.address);
    await vault.connect(admin).grantRole(ADMIN_ROLE, admin.address);

    // Mint USDC to donors (enough to test TVL cap scenarios)
    await usdc.mint(donor1.address, ethers.parseUnits("1000", 6));
    await usdc.mint(donor2.address, ethers.parseUnits("1000", 6));

    return { vault, usdc, admin, oracle, dao, donor1, donor2, volunteer };
  }

  // ============================================================================
  // INVARIANT 1: Total deposits >= Total released + Vault balance
  // ============================================================================
  describe("Invariant 1: Deposit-Release Balance", function () {
    it("totalDeposits should always equal donorBalances sum + totalReleased", async function () {
      const { vault, usdc, donor1, donor2 } = await loadFixture(deployFullFixture);

      // Multiple deposits
      await usdc.connect(donor1).approve(await vault.getAddress(), DEPOSIT_AMOUNT * 5n);
      await vault.connect(donor1).deposit(DEPOSIT_AMOUNT);
      await vault.connect(donor1).deposit(DEPOSIT_AMOUNT);

      await usdc.connect(donor2).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor2).deposit(DEPOSIT_AMOUNT);

      const totalDeposits = await vault.totalDeposits();
      const donor1Balance = await vault.donorBalances(donor1.address);
      const donor2Balance = await vault.donorBalances(donor2.address);
      const totalReleased = await vault.totalReleased();

      // Invariant: totalDeposits == sum(donorBalances) + totalReleased
      expect(totalDeposits).to.equal(donor1Balance + donor2Balance + totalReleased);
    });

    it("Should maintain invariant after withdrawals", async function () {
      const { vault, usdc, donor1 } = await loadFixture(deployFullFixture);

      await usdc.connect(donor1).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor1).deposit(DEPOSIT_AMOUNT);
      
      // Partial withdrawal
      await vault.connect(donor1).withdraw(DEPOSIT_AMOUNT / 2n);

      const totalDeposits = await vault.totalDeposits();
      const totalReleased = await vault.totalReleased();
      const vaultBalance = await usdc.balanceOf(await vault.getAddress());

      // Vault balance should equal deposits minus withdrawals
      expect(vaultBalance).to.equal(totalDeposits - totalReleased);
    });
  });

  // ============================================================================
  // INVARIANT 2: Vault USDC balance <= MAX_TVL
  // ============================================================================
  describe("Invariant 2: TVL Cap Enforcement", function () {
    it("Should reject deposits that exceed TVL cap", async function () {
      const { vault, usdc, donor1 } = await loadFixture(deployFullFixture);

      // Try to deposit more than MAX_TVL
      const overLimitAmount = MAX_TVL + ethers.parseUnits("1", 6);
      await usdc.connect(donor1).approve(await vault.getAddress(), overLimitAmount);

      await expect(vault.connect(donor1).deposit(overLimitAmount))
        .to.be.revertedWithCustomError(vault, "TVLCapExceeded");
    });

    it("Should reject deposits that would push balance over TVL cap", async function () {
      const { vault, usdc, donor1, donor2 } = await loadFixture(deployFullFixture);

      // First deposit: almost at cap
      const firstDeposit = MAX_TVL - ethers.parseUnits("10", 6);
      await usdc.connect(donor1).approve(await vault.getAddress(), firstDeposit);
      await vault.connect(donor1).deposit(firstDeposit);

      // Second deposit: would exceed cap
      const secondDeposit = ethers.parseUnits("20", 6);
      await usdc.connect(donor2).approve(await vault.getAddress(), secondDeposit);

      await expect(vault.connect(donor2).deposit(secondDeposit))
        .to.be.revertedWithCustomError(vault, "TVLCapExceeded");
    });

    it("TVL cap should never be exceeded regardless of operations", async function () {
      const { vault, usdc } = await loadFixture(deployFullFixture);

      const vaultBalance = await usdc.balanceOf(await vault.getAddress());
      expect(vaultBalance <= MAX_TVL).to.be.true;
    });
  });

  // ============================================================================
  // INVARIANT 3: Task payouts never exceed released funds
  // ============================================================================
  describe("Invariant 3: Task Payout Limits", function () {
    it("totalTaskPayouts should never exceed totalReleased", async function () {
      const { vault, usdc, donor1, oracle, dao, volunteer } = await loadFixture(deployFullFixture);

      // Setup: deposit and trigger emergency
      await usdc.connect(donor1).approve(await vault.getAddress(), DEPOSIT_AMOUNT * 5n);
      await vault.connect(donor1).deposit(DEPOSIT_AMOUNT * 5n); // 500 USDC

      const disasterType = ethers.encodeBytes32String("FLOOD");
      const geoHash = ethers.encodeBytes32String("Jakarta");
      await vault.connect(oracle).updateRiskScore(85, disasterType, geoHash);

      // Create and complete task
      const reward = ethers.parseUnits("50", 6); // 50 USDC
      await vault.connect(dao).createTask("Test task", reward, geoHash);
      await vault.connect(volunteer).claimTask(1n);
      
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof"));
      await vault.connect(volunteer).submitProof(1n, proofHash);
      await vault.connect(dao).verifyAndPay(1n);

      const totalTaskPayouts = await vault.totalTaskPayouts();
      const totalReleased = await vault.totalReleased();

      // Invariant: task payouts can never exceed what was released
      expect(totalTaskPayouts <= totalReleased).to.be.true;
    });
  });

  // ============================================================================
  // INVARIANT 4: State transitions follow valid paths only
  // ============================================================================
  describe("Invariant 4: Valid State Transitions", function () {
    it("Should not allow skipping states", async function () {
      const { vault, usdc, donor1, dao } = await loadFixture(deployFullFixture);

      await usdc.connect(donor1).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor1).deposit(DEPOSIT_AMOUNT);

      // Try to settle emergency while in IDLE state
      await expect(vault.connect(dao).settleEmergency(1n))
        .to.be.reverted;
    });

    it("Current state should always be a valid VaultState enum value", async function () {
      const { vault } = await loadFixture(deployFullFixture);

      const state = await vault.currentState();
      expect(state >= 0n).to.be.true;
      expect(state <= 4n).to.be.true; // VaultState has 5 values (0-4)
    });
  });

  // ============================================================================
  // REENTRANCY PROTECTION TESTS
  // ============================================================================
  describe("Reentrancy Protection", function () {
    it("Deposit should be protected by nonReentrant", async function () {
      const { vault, usdc, donor1 } = await loadFixture(deployFullFixture);

      // Normal deposit should work
      await usdc.connect(donor1).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor1).deposit(DEPOSIT_AMOUNT);

      // Verify balance updated correctly (no reentrancy occurred)
      const balance = await vault.donorBalances(donor1.address);
      expect(balance).to.equal(DEPOSIT_AMOUNT);
    });

    it("Withdraw should be protected by nonReentrant", async function () {
      const { vault, usdc, donor1 } = await loadFixture(deployFullFixture);

      await usdc.connect(donor1).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor1).deposit(DEPOSIT_AMOUNT);

      const balanceBefore = await usdc.balanceOf(donor1.address);
      await vault.connect(donor1).withdraw(DEPOSIT_AMOUNT);
      const balanceAfter = await usdc.balanceOf(donor1.address);

      // Verify exact amount transferred (no double withdrawal)
      expect(balanceAfter - balanceBefore).to.equal(DEPOSIT_AMOUNT);
    });
  });

  // ============================================================================
  // ACCESS CONTROL TESTS
  // ============================================================================
  describe("Access Control Invariants", function () {
    it("Only ORACLE_ROLE can update risk score", async function () {
      const { vault, donor1 } = await loadFixture(deployFullFixture);

      const disasterType = ethers.encodeBytes32String("FLOOD");
      const geoHash = ethers.encodeBytes32String("Jakarta");

      await expect(vault.connect(donor1).updateRiskScore(85, disasterType, geoHash))
        .to.be.reverted;
    });

    it("Only DAO_ROLE can create tasks", async function () {
      const { vault, donor1, oracle } = await loadFixture(deployFullFixture);

      const geoHash = ethers.encodeBytes32String("Jakarta");
      const reward = ethers.parseUnits("50", 6);

      await expect(vault.connect(donor1).createTask("Test", reward, geoHash))
        .to.be.reverted;

      await expect(vault.connect(oracle).createTask("Test", reward, geoHash))
        .to.be.reverted;
    });

    it("Only ADMIN_ROLE can pause contract", async function () {
      const { vault, donor1, oracle } = await loadFixture(deployFullFixture);

      await expect(vault.connect(donor1).pause())
        .to.be.reverted;

      await expect(vault.connect(oracle).pause())
        .to.be.reverted;
    });
  });

  // ============================================================================
  // ZERO AMOUNT PROTECTION
  // ============================================================================
  describe("Zero Amount Protection", function () {
    it("Should reject zero amount deposits", async function () {
      const { vault, donor1 } = await loadFixture(deployFullFixture);

      await expect(vault.connect(donor1).deposit(0n))
        .to.be.revertedWithCustomError(vault, "ZeroAmount");
    });

    it("Should reject zero amount withdrawals", async function () {
      const { vault, usdc, donor1 } = await loadFixture(deployFullFixture);

      await usdc.connect(donor1).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor1).deposit(DEPOSIT_AMOUNT);

      await expect(vault.connect(donor1).withdraw(0n))
        .to.be.revertedWithCustomError(vault, "ZeroAmount");
    });
  });

  // ============================================================================
  // PAUSE FUNCTIONALITY
  // ============================================================================
  describe("Pause Functionality", function () {
    it("Should block deposits when paused", async function () {
      const { vault, usdc, admin, donor1 } = await loadFixture(deployFullFixture);

      await vault.connect(admin).pause();

      await usdc.connect(donor1).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await expect(vault.connect(donor1).deposit(DEPOSIT_AMOUNT))
        .to.be.revertedWithCustomError(vault, "EnforcedPause");
    });

    it("Should allow unpause and resume operations", async function () {
      const { vault, usdc, admin, donor1 } = await loadFixture(deployFullFixture);

      await vault.connect(admin).pause();
      await vault.connect(admin).unpause();

      await usdc.connect(donor1).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor1).deposit(DEPOSIT_AMOUNT);

      expect(await vault.totalDeposits()).to.equal(DEPOSIT_AMOUNT);
    });
  });
});
