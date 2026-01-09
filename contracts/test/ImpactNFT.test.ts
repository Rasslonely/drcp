import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ImpactNFT } from "../typechain-types";

describe("ImpactNFT", function () {
  async function deployImpactNFTFixture() {
    const [owner, minter, volunteer1, volunteer2, attacker] = await ethers.getSigners();

    const ImpactNFTFactory = await ethers.getContractFactory("ImpactNFT");
    const impactNFT = await ImpactNFTFactory.deploy(owner.address) as unknown as ImpactNFT;
    await impactNFT.waitForDeployment();

    // Set minter
    await impactNFT.setMinter(minter.address, true);

    return { impactNFT, owner, minter, volunteer1, volunteer2, attacker };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { impactNFT } = await loadFixture(deployImpactNFTFixture);
      expect(await impactNFT.name()).to.equal("DRCP Impact");
      expect(await impactNFT.symbol()).to.equal("IMPACT");
    });

    it("Should set the owner correctly", async function () {
      const { impactNFT, owner } = await loadFixture(deployImpactNFTFixture);
      expect(await impactNFT.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should mint NFT on first task completion", async function () {
      const { impactNFT, minter, volunteer1 } = await loadFixture(deployImpactNFTFixture);
      
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof1"));
      await impactNFT.connect(minter).recordImpact(
        volunteer1.address,
        proofHash,
        1, // taskId
        50_000000 // 50 USDC
      );

      expect(await impactNFT.balanceOf(volunteer1.address)).to.equal(1);
      expect(await impactNFT.volunteerToTokenId(volunteer1.address)).to.equal(1);
    });

    it("Should not mint duplicate tokens", async function () {
      const { impactNFT, minter, volunteer1 } = await loadFixture(deployImpactNFTFixture);
      
      const proofHash1 = ethers.keccak256(ethers.toUtf8Bytes("proof1"));
      const proofHash2 = ethers.keccak256(ethers.toUtf8Bytes("proof2"));
      
      await impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash1, 1, 50_000000);
      await impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash2, 2, 50_000000);

      // Should still only have 1 NFT
      expect(await impactNFT.balanceOf(volunteer1.address)).to.equal(1);
    });

    it("Should reject unauthorized minters", async function () {
      const { impactNFT, attacker, volunteer1 } = await loadFixture(deployImpactNFTFixture);
      
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof"));
      await expect(
        impactNFT.connect(attacker).recordImpact(volunteer1.address, proofHash, 1, 50_000000)
      ).to.be.revertedWithCustomError(impactNFT, "NotAuthorizedMinter");
    });
  });

  describe("Soulbound (Non-Transferable)", function () {
    it("Should prevent transfers between addresses", async function () {
      const { impactNFT, minter, volunteer1, volunteer2 } = await loadFixture(deployImpactNFTFixture);
      
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof"));
      await impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash, 1, 50_000000);

      const tokenId = await impactNFT.volunteerToTokenId(volunteer1.address);

      // Try to transfer - should fail
      await expect(
        impactNFT.connect(volunteer1).transferFrom(volunteer1.address, volunteer2.address, tokenId)
      ).to.be.revertedWithCustomError(impactNFT, "SoulboundTransferDisabled");
    });

    it("Should prevent safeTransferFrom", async function () {
      const { impactNFT, minter, volunteer1, volunteer2 } = await loadFixture(deployImpactNFTFixture);
      
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof"));
      await impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash, 1, 50_000000);

      const tokenId = await impactNFT.volunteerToTokenId(volunteer1.address);

      await expect(
        impactNFT.connect(volunteer1)["safeTransferFrom(address,address,uint256)"](
          volunteer1.address, volunteer2.address, tokenId
        )
      ).to.be.revertedWithCustomError(impactNFT, "SoulboundTransferDisabled");
    });
  });

  describe("Reputation & Tiers", function () {
    it("Should start with Bronze tier after first task", async function () {
      const { impactNFT, minter, volunteer1 } = await loadFixture(deployImpactNFTFixture);
      
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof"));
      await impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash, 1, 50_000000);

      const impact = await impactNFT.getImpact(volunteer1.address);
      expect(impact.tier).to.equal(1); // Bronze = 1
      expect(impact.tasksCompleted).to.equal(1);
    });

    it("Should upgrade to Silver tier at 6 tasks", async function () {
      const { impactNFT, minter, volunteer1 } = await loadFixture(deployImpactNFTFixture);
      
      // Complete 6 tasks
      for (let i = 1; i <= 6; i++) {
        const proofHash = ethers.keccak256(ethers.toUtf8Bytes(`proof${i}`));
        await impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash, i, 50_000000);
      }

      const impact = await impactNFT.getImpact(volunteer1.address);
      expect(impact.tier).to.equal(2); // Silver = 2
      expect(impact.tasksCompleted).to.equal(6);
    });

    it("Should calculate tasks to next tier correctly", async function () {
      const { impactNFT, minter, volunteer1 } = await loadFixture(deployImpactNFTFixture);
      
      // 3 tasks = Bronze, needs 3 more for Silver (at 6)
      for (let i = 1; i <= 3; i++) {
        const proofHash = ethers.keccak256(ethers.toUtf8Bytes(`proof${i}`));
        await impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash, i, 50_000000);
      }

      const tasksNeeded = await impactNFT.tasksToNextTier(volunteer1.address);
      expect(tasksNeeded).to.equal(3); // 6 - 3 = 3
    });

    it("Should accumulate reputation correctly", async function () {
      const { impactNFT, minter, volunteer1 } = await loadFixture(deployImpactNFTFixture);
      
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof"));
      await impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash, 1, 50_000000);

      const impact = await impactNFT.getImpact(volunteer1.address);
      expect(impact.reputation).to.be.gt(0);
    });

    it("Should track total rewards", async function () {
      const { impactNFT, minter, volunteer1 } = await loadFixture(deployImpactNFTFixture);
      
      const proofHash1 = ethers.keccak256(ethers.toUtf8Bytes("proof1"));
      const proofHash2 = ethers.keccak256(ethers.toUtf8Bytes("proof2"));
      
      await impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash1, 1, 50_000000);
      await impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash2, 2, 75_000000);

      const impact = await impactNFT.getImpact(volunteer1.address);
      expect(impact.totalRewards).to.equal(125_000000); // 50 + 75 USDC
    });
  });

  describe("Proof Records", function () {
    it("Should store proof records correctly", async function () {
      const { impactNFT, minter, volunteer1 } = await loadFixture(deployImpactNFTFixture);
      
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("photo+gps+timestamp"));
      await impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash, 42, 50_000000);

      const records = await impactNFT.getProofRecords(volunteer1.address);
      expect(records.length).to.equal(1);
      expect(records[0].proofHash).to.equal(proofHash);
      expect(records[0].taskId).to.equal(42);
      expect(records[0].verified).to.equal(true);
    });
  });

  describe("Metadata", function () {
    it("Should update metadata CID", async function () {
      const { impactNFT, minter, volunteer1 } = await loadFixture(deployImpactNFTFixture);
      
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof"));
      await impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash, 1, 50_000000);
      
      await impactNFT.connect(minter).updateMetadataCID(
        volunteer1.address,
        "QmYwAPJzv5CZsnAzt8auVZRn6XaPyaFcB6Cth6YL8HkC9g"
      );

      const impact = await impactNFT.getImpact(volunteer1.address);
      expect(impact.metadataCID).to.equal("QmYwAPJzv5CZsnAzt8auVZRn6XaPyaFcB6Cth6YL8HkC9g");
    });

    it("Should return correct tokenURI with CID", async function () {
      const { impactNFT, minter, volunteer1 } = await loadFixture(deployImpactNFTFixture);
      
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof"));
      await impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash, 1, 50_000000);
      
      const cid = "QmTest123";
      await impactNFT.connect(minter).updateMetadataCID(volunteer1.address, cid);

      const tokenId = await impactNFT.volunteerToTokenId(volunteer1.address);
      const uri = await impactNFT.tokenURI(tokenId);
      expect(uri).to.equal(`ipfs://${cid}`);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set minters", async function () {
      const { impactNFT, owner, volunteer1 } = await loadFixture(deployImpactNFTFixture);
      
      await impactNFT.connect(owner).setMinter(volunteer1.address, true);
      expect(await impactNFT.minters(volunteer1.address)).to.equal(true);
    });

    it("Should allow owner to update base URI", async function () {
      const { impactNFT, owner } = await loadFixture(deployImpactNFTFixture);
      
      await impactNFT.connect(owner).setBaseMetadataURI("https://api.drcp.xyz/metadata/");
      expect(await impactNFT.baseMetadataURI()).to.equal("https://api.drcp.xyz/metadata/");
    });
  });

  describe("Events", function () {
    it("Should emit ImpactRecorded event", async function () {
      const { impactNFT, minter, volunteer1 } = await loadFixture(deployImpactNFTFixture);
      
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof"));
      await expect(
        impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash, 1, 50_000000)
      ).to.emit(impactNFT, "ImpactRecorded");
    });

    it("Should emit TierUpgrade event on tier change", async function () {
      const { impactNFT, minter, volunteer1 } = await loadFixture(deployImpactNFTFixture);
      
      // Complete 5 tasks (Bronze)
      for (let i = 1; i <= 5; i++) {
        const proofHash = ethers.keccak256(ethers.toUtf8Bytes(`proof${i}`));
        await impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash, i, 50_000000);
      }

      // 6th task should trigger upgrade to Silver
      const proofHash6 = ethers.keccak256(ethers.toUtf8Bytes("proof6"));
      await expect(
        impactNFT.connect(minter).recordImpact(volunteer1.address, proofHash6, 6, 50_000000)
      ).to.emit(impactNFT, "TierUpgrade")
        .withArgs(volunteer1.address, 1, 2); // Bronze(1) -> Silver(2)
    });
  });
});
