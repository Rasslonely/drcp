import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ProjectTreasury", function () {
  let treasury: any;
  let mockUSDC: any;
  let owner: SignerWithAddress;
  let donor1: SignerWithAddress;
  let donor2: SignerWithAddress;

  const INITIAL_MINT = ethers.parseUnits("10000", 6); // 10,000 USDC

  beforeEach(async function () {
    [owner, donor1, donor2] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy ProjectTreasury
    const ProjectTreasury = await ethers.getContractFactory("ProjectTreasury");
    treasury = await ProjectTreasury.deploy(
      await mockUSDC.getAddress(),
      owner.address
    );
    await treasury.waitForDeployment();

    // Mint USDC to donors
    await mockUSDC.mint(donor1.address, INITIAL_MINT);
    await mockUSDC.mint(donor2.address, INITIAL_MINT);
  });

  describe("Donation", function () {
    it("should accept donations", async function () {
      const amount = ethers.parseUnits("100", 6);
      
      // Approve and donate
      await mockUSDC.connect(donor1).approve(await treasury.getAddress(), amount);
      await treasury.connect(donor1).donate(amount, "Thank you DRCP!");

      // Check stats
      const stats = await treasury.getStats();
      expect(stats[0]).to.equal(amount); // totalDonations
      expect(stats[2]).to.equal(amount); // currentBalance
      expect(stats[3]).to.equal(1n);     // donorCount
    });

    it("should track multiple donors", async function () {
      const amount1 = ethers.parseUnits("50", 6);
      const amount2 = ethers.parseUnits("100", 6);

      await mockUSDC.connect(donor1).approve(await treasury.getAddress(), amount1);
      await treasury.connect(donor1).donate(amount1, "Donor 1");

      await mockUSDC.connect(donor2).approve(await treasury.getAddress(), amount2);
      await treasury.connect(donor2).donate(amount2, "Donor 2");

      const stats = await treasury.getStats();
      expect(stats[0]).to.equal(amount1 + amount2); // totalDonations
      expect(stats[3]).to.equal(2n);                // donorCount
    });

    it("should track donor contributions", async function () {
      const amount = ethers.parseUnits("200", 6);
      
      await mockUSDC.connect(donor1).approve(await treasury.getAddress(), amount);
      await treasury.connect(donor1).donate(amount, "");

      const contribution = await treasury.getDonorContribution(donor1.address);
      expect(contribution).to.equal(amount);
    });

    it("should emit ProjectDonation event", async function () {
      const amount = ethers.parseUnits("100", 6);
      
      await mockUSDC.connect(donor1).approve(await treasury.getAddress(), amount);
      
      // Use anyValue for timestamp to avoid race conditions
      const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
      await expect(treasury.connect(donor1).donate(amount, "Hello!"))
        .to.emit(treasury, "ProjectDonation")
        .withArgs(donor1.address, amount, "Hello!", anyValue);
    });

    it("should reject zero amount", async function () {
      await expect(treasury.connect(donor1).donate(0, ""))
        .to.be.revertedWithCustomError(treasury, "ZeroAmount");
    });
  });

  describe("Withdrawal", function () {
    beforeEach(async function () {
      // Donate some funds first
      const amount = ethers.parseUnits("500", 6);
      await mockUSDC.connect(donor1).approve(await treasury.getAddress(), amount);
      await treasury.connect(donor1).donate(amount, "");
    });

    it("should allow admin to withdraw", async function () {
      const withdrawAmount = ethers.parseUnits("100", 6);
      const balanceBefore = await mockUSDC.balanceOf(owner.address);

      await treasury.connect(owner).withdraw(
        owner.address,
        withdrawAmount,
        "Server costs"
      );

      const balanceAfter = await mockUSDC.balanceOf(owner.address);
      expect(balanceAfter - balanceBefore).to.equal(withdrawAmount);
    });

    it("should emit FundsWithdrawn event", async function () {
      const amount = ethers.parseUnits("50", 6);
      
      await expect(treasury.connect(owner).withdraw(owner.address, amount, "Audit"))
        .to.emit(treasury, "FundsWithdrawn");
    });

    it("should reject non-admin withdrawal", async function () {
      await expect(
        treasury.connect(donor1).withdraw(donor1.address, 100, "Hack")
      ).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("should return correct balance", async function () {
      const amount = ethers.parseUnits("100", 6);
      await mockUSDC.connect(donor1).approve(await treasury.getAddress(), amount);
      await treasury.connect(donor1).donate(amount, "");

      const balance = await treasury.getBalance();
      expect(balance).to.equal(amount);
    });
  });
});

// Helper to get block timestamp (approximate)
async function getBlockTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  return block!.timestamp;
}
