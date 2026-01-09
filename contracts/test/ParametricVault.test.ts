import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ParametricVault, MockUSDC } from "../typechain-types";

describe("ParametricVault", function () {
  const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE_ROLE"));
  const DAO_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DAO_ROLE"));
  const DEPOSIT_AMOUNT = ethers.parseUnits("500", 6); // 500 USDC (within 1000 USDC TVL cap)

  async function deployVaultFixture() {
    const [admin, oracle, dao, donor, volunteer] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDCFactory.deploy() as unknown as MockUSDC;
    await usdc.waitForDeployment();

    // Deploy ParametricVault
    const VaultFactory = await ethers.getContractFactory("ParametricVault");
    const vault = await VaultFactory.deploy(await usdc.getAddress(), admin.address) as unknown as ParametricVault;
    await vault.waitForDeployment();

    // Grant roles
    await vault.connect(admin).grantRole(ORACLE_ROLE, oracle.address);
    await vault.connect(admin).grantRole(DAO_ROLE, dao.address);

    // Mint USDC to donor
    await usdc.mint(donor.address, DEPOSIT_AMOUNT * 10n);

    return { vault, usdc, admin, oracle, dao, donor, volunteer };
  }

  describe("Deployment", function () {
    it("Should set the correct stablecoin", async function () {
      const { vault, usdc } = await loadFixture(deployVaultFixture);
      expect(await vault.stablecoin()).to.equal(await usdc.getAddress());
    });

    it("Should start in IDLE state", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      expect(await vault.currentState()).to.equal(0n); // VaultState.IDLE
    });

    it("Should grant admin roles correctly", async function () {
      const { vault, admin } = await loadFixture(deployVaultFixture);
      expect(await vault.hasRole(await vault.ADMIN_ROLE(), admin.address)).to.be.true;
    });
  });

  describe("Deposits", function () {
    it("Should accept deposits", async function () {
      const { vault, usdc, donor } = await loadFixture(deployVaultFixture);
      await usdc.connect(donor).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor).deposit(DEPOSIT_AMOUNT);

      expect(await vault.donorBalances(donor.address)).to.equal(DEPOSIT_AMOUNT);
      expect(await vault.totalDeposits()).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should emit Deposited event", async function () {
      const { vault, usdc, donor } = await loadFixture(deployVaultFixture);
      await usdc.connect(donor).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      
      await expect(vault.connect(donor).deposit(DEPOSIT_AMOUNT))
        .to.emit(vault, "Deposited")
        .withArgs(donor.address, DEPOSIT_AMOUNT);
    });

    it("Should reject zero deposits", async function () {
      const { vault, donor } = await loadFixture(deployVaultFixture);
      await expect(vault.connect(donor).deposit(0n))
        .to.be.revertedWithCustomError(vault, "ZeroAmount");
    });
  });

  describe("Withdrawals", function () {
    it("Should allow withdrawal in IDLE state", async function () {
      const { vault, usdc, donor } = await loadFixture(deployVaultFixture);
      await usdc.connect(donor).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor).deposit(DEPOSIT_AMOUNT);

      await vault.connect(donor).withdraw(DEPOSIT_AMOUNT);
      expect(await usdc.balanceOf(donor.address)).to.equal(DEPOSIT_AMOUNT * 10n);
    });

    it("Should reject withdrawal of more than balance", async function () {
      const { vault, usdc, donor } = await loadFixture(deployVaultFixture);
      await usdc.connect(donor).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor).deposit(DEPOSIT_AMOUNT);

      await expect(vault.connect(donor).withdraw(DEPOSIT_AMOUNT * 2n))
        .to.be.revertedWithCustomError(vault, "InsufficientFunds");
    });
  });

  describe("Risk Score Updates", function () {
    it("Should allow oracle to update risk score", async function () {
      const { vault, usdc, donor, oracle } = await loadFixture(deployVaultFixture);
      await usdc.connect(donor).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor).deposit(DEPOSIT_AMOUNT);

      const disasterType = ethers.encodeBytes32String("FLOOD");
      const geoHash = ethers.encodeBytes32String("Jakarta");

      await vault.connect(oracle).updateRiskScore(45, disasterType, geoHash);
      
      const riskScore = await vault.latestRiskScore();
      expect(riskScore.severity).to.equal(45n);
    });

    it("Should transition to ALERT when severity >= 50", async function () {
      const { vault, usdc, donor, oracle } = await loadFixture(deployVaultFixture);
      await usdc.connect(donor).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor).deposit(DEPOSIT_AMOUNT);

      const disasterType = ethers.encodeBytes32String("FLOOD");
      const geoHash = ethers.encodeBytes32String("Jakarta");

      await vault.connect(oracle).updateRiskScore(55, disasterType, geoHash);
      
      expect(await vault.currentState()).to.equal(1n); // VaultState.ALERT
    });

    it("Should transition to EMERGENCY and RELIEF_ACTIVE when severity >= 80", async function () {
      const { vault, usdc, donor, oracle } = await loadFixture(deployVaultFixture);
      await usdc.connect(donor).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor).deposit(DEPOSIT_AMOUNT);

      const disasterType = ethers.encodeBytes32String("FLOOD");
      const geoHash = ethers.encodeBytes32String("Jakarta");

      await vault.connect(oracle).updateRiskScore(85, disasterType, geoHash);
      
      expect(await vault.currentState()).to.equal(3n); // VaultState.RELIEF_ACTIVE
    });

    it("Should emit EmergencyDeclared event", async function () {
      const { vault, usdc, donor, oracle } = await loadFixture(deployVaultFixture);
      await usdc.connect(donor).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor).deposit(DEPOSIT_AMOUNT);

      const disasterType = ethers.encodeBytes32String("FLOOD");
      const geoHash = ethers.encodeBytes32String("Jakarta");

      await expect(vault.connect(oracle).updateRiskScore(85, disasterType, geoHash))
        .to.emit(vault, "EmergencyDeclared");
    });

    it("Should not allow non-oracle to update risk score", async function () {
      const { vault, donor } = await loadFixture(deployVaultFixture);
      const disasterType = ethers.encodeBytes32String("FLOOD");
      const geoHash = ethers.encodeBytes32String("Jakarta");

      await expect(
        vault.connect(donor).updateRiskScore(85, disasterType, geoHash)
      ).to.be.reverted;
    });
  });

  describe("Task Management", function () {
    async function deployWithEmergency() {
      const fixture = await loadFixture(deployVaultFixture);
      const { vault, usdc, donor, oracle } = fixture;
      
      // Deposit and trigger emergency
      await usdc.connect(donor).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor).deposit(DEPOSIT_AMOUNT);

      const disasterType = ethers.encodeBytes32String("FLOOD");
      const geoHash = ethers.encodeBytes32String("Jakarta");
      await vault.connect(oracle).updateRiskScore(85, disasterType, geoHash);

      return fixture;
    }

    it("Should allow DAO to create tasks", async function () {
      const { vault, dao } = await deployWithEmergency();
      const geoHash = ethers.encodeBytes32String("Jakarta");
      const reward = ethers.parseUnits("100", 6);

      await vault.connect(dao).createTask("Deliver water", reward, geoHash);
      
      const task = await vault.getTask(1n);
      expect(task.description).to.equal("Deliver water");
      expect(task.reward).to.equal(reward);
    });

    it("Should allow volunteers to claim tasks", async function () {
      const { vault, dao, volunteer } = await deployWithEmergency();
      const geoHash = ethers.encodeBytes32String("Jakarta");
      const reward = ethers.parseUnits("100", 6);
      await vault.connect(dao).createTask("Deliver water", reward, geoHash);

      await vault.connect(volunteer).claimTask(1n);
      
      const task = await vault.getTask(1n);
      expect(task.volunteer).to.equal(volunteer.address);
      expect(task.status).to.equal(1n); // TaskStatus.CLAIMED
    });

    it("Should allow volunteers to submit proof", async function () {
      const { vault, dao, volunteer } = await deployWithEmergency();
      const geoHash = ethers.encodeBytes32String("Jakarta");
      const reward = ethers.parseUnits("100", 6);
      await vault.connect(dao).createTask("Deliver water", reward, geoHash);
      await vault.connect(volunteer).claimTask(1n);

      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("photo+gps"));
      await vault.connect(volunteer).submitProof(1n, proofHash);
      
      const task = await vault.getTask(1n);
      expect(task.status).to.equal(2n); // TaskStatus.PROOF_SUBMITTED
    });

    it("Should allow DAO to verify and pay", async function () {
      const { vault, usdc, dao, volunteer } = await deployWithEmergency();
      const geoHash = ethers.encodeBytes32String("Jakarta");
      const reward = ethers.parseUnits("100", 6);
      await vault.connect(dao).createTask("Deliver water", reward, geoHash);
      await vault.connect(volunteer).claimTask(1n);

      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("photo+gps"));
      await vault.connect(volunteer).submitProof(1n, proofHash);

      const balanceBefore = await usdc.balanceOf(volunteer.address);
      await vault.connect(dao).verifyAndPay(1n);
      const balanceAfter = await usdc.balanceOf(volunteer.address);

      expect(balanceAfter - balanceBefore).to.equal(reward);
    });
  });

  describe("Emergency Settlement", function () {
    it("Should allow DAO to settle emergency", async function () {
      const { vault, usdc, donor, oracle, dao } = await loadFixture(deployVaultFixture);
      await usdc.connect(donor).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor).deposit(DEPOSIT_AMOUNT);

      const disasterType = ethers.encodeBytes32String("FLOOD");
      const geoHash = ethers.encodeBytes32String("Jakarta");
      await vault.connect(oracle).updateRiskScore(85, disasterType, geoHash);

      await vault.connect(dao).settleEmergency(1n);
      expect(await vault.currentState()).to.equal(4n); // VaultState.SETTLED
    });

    it("Should allow reset to IDLE after settlement", async function () {
      const { vault, usdc, donor, oracle, dao } = await loadFixture(deployVaultFixture);
      await usdc.connect(donor).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await vault.connect(donor).deposit(DEPOSIT_AMOUNT);

      const disasterType = ethers.encodeBytes32String("FLOOD");
      const geoHash = ethers.encodeBytes32String("Jakarta");
      await vault.connect(oracle).updateRiskScore(85, disasterType, geoHash);

      await vault.connect(dao).settleEmergency(1n);
      await vault.connect(dao).resetToIdle();
      expect(await vault.currentState()).to.equal(0n); // VaultState.IDLE
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update emergency release percentage", async function () {
      const { vault, admin } = await loadFixture(deployVaultFixture);
      await vault.connect(admin).setEmergencyReleasePercentage(30n);
      expect(await vault.emergencyReleasePercentage()).to.equal(30n);
    });

    it("Should allow admin to update thresholds", async function () {
      const { vault, admin } = await loadFixture(deployVaultFixture);
      await vault.connect(admin).setThresholds(40n, 70n);
      expect(await vault.alertThreshold()).to.equal(40n);
      expect(await vault.emergencyThreshold()).to.equal(70n);
    });

    it("Should allow admin to pause/unpause", async function () {
      const { vault, usdc, admin, donor } = await loadFixture(deployVaultFixture);
      await vault.connect(admin).pause();
      
      await usdc.connect(donor).approve(await vault.getAddress(), DEPOSIT_AMOUNT);
      await expect(vault.connect(donor).deposit(DEPOSIT_AMOUNT))
        .to.be.revertedWithCustomError(vault, "EnforcedPause");

      await vault.connect(admin).unpause();
      await vault.connect(donor).deposit(DEPOSIT_AMOUNT);
      expect(await vault.totalDeposits()).to.equal(DEPOSIT_AMOUNT);
    });
  });
});
