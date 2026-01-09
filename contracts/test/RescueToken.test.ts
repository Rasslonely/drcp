import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { RescueToken } from "../typechain-types";

describe("RescueToken", function () {
  async function deployRescueTokenFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const RescueTokenFactory = await ethers.getContractFactory("RescueToken");
    const rescueToken = await RescueTokenFactory.deploy(owner.address) as unknown as RescueToken;
    await rescueToken.waitForDeployment();

    return { rescueToken, owner, user1, user2 };
  }

  const MAX_SUPPLY = ethers.parseEther("100000000"); // 100M tokens

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { rescueToken } = await loadFixture(deployRescueTokenFixture);
      expect(await rescueToken.name()).to.equal("Rescue Token");
      expect(await rescueToken.symbol()).to.equal("RESCUE");
    });

    it("Should set the correct owner", async function () {
      const { rescueToken, owner } = await loadFixture(deployRescueTokenFixture);
      expect(await rescueToken.owner()).to.equal(owner.address);
    });

    it("Should have zero initial supply", async function () {
      const { rescueToken } = await loadFixture(deployRescueTokenFixture);
      expect(await rescueToken.totalSupply()).to.equal(0n);
    });

    it("Should have correct max supply constant", async function () {
      const { rescueToken } = await loadFixture(deployRescueTokenFixture);
      expect(await rescueToken.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const { rescueToken, user1 } = await loadFixture(deployRescueTokenFixture);
      const mintAmount = ethers.parseEther("1000");
      await rescueToken.mint(user1.address, mintAmount);
      expect(await rescueToken.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should emit TokensMinted event", async function () {
      const { rescueToken, user1 } = await loadFixture(deployRescueTokenFixture);
      const mintAmount = ethers.parseEther("1000");
      await expect(rescueToken.mint(user1.address, mintAmount))
        .to.emit(rescueToken, "TokensMinted")
        .withArgs(user1.address, mintAmount);
    });

    it("Should not allow non-owner to mint", async function () {
      const { rescueToken, user1 } = await loadFixture(deployRescueTokenFixture);
      const mintAmount = ethers.parseEther("1000");
      await expect(
        rescueToken.connect(user1).mint(user1.address, mintAmount)
      ).to.be.revertedWithCustomError(rescueToken, "OwnableUnauthorizedAccount");
    });

    it("Should not allow minting beyond max supply", async function () {
      const { rescueToken, user1 } = await loadFixture(deployRescueTokenFixture);
      // Mint max supply
      await rescueToken.mint(user1.address, MAX_SUPPLY);
      
      // Try to mint more
      await expect(
        rescueToken.mint(user1.address, 1n)
      ).to.be.revertedWithCustomError(rescueToken, "ExceedsMaxSupply");
    });

    it("Should track remaining mintable supply", async function () {
      const { rescueToken, user1 } = await loadFixture(deployRescueTokenFixture);
      const mintAmount = ethers.parseEther("1000000");
      await rescueToken.mint(user1.address, mintAmount);
      
      const remaining = await rescueToken.remainingMintableSupply();
      expect(remaining).to.equal(MAX_SUPPLY - mintAmount);
    });
  });

  describe("Voting", function () {
    it("Should allow delegation", async function () {
      const { rescueToken, user1 } = await loadFixture(deployRescueTokenFixture);
      await rescueToken.mint(user1.address, ethers.parseEther("1000"));
      await rescueToken.connect(user1).delegate(user1.address);
      const votes = await rescueToken.getVotes(user1.address);
      expect(votes).to.equal(ethers.parseEther("1000"));
    });

    it("Should allow delegation to another address", async function () {
      const { rescueToken, user1, user2 } = await loadFixture(deployRescueTokenFixture);
      await rescueToken.mint(user1.address, ethers.parseEther("1000"));
      await rescueToken.connect(user1).delegate(user2.address);
      
      const user1Votes = await rescueToken.getVotes(user1.address);
      const user2Votes = await rescueToken.getVotes(user2.address);
      
      expect(user1Votes).to.equal(0n);
      expect(user2Votes).to.equal(ethers.parseEther("1000"));
    });

    it("Should track voting power through transfers", async function () {
      const { rescueToken, user1, user2 } = await loadFixture(deployRescueTokenFixture);
      await rescueToken.mint(user1.address, ethers.parseEther("1000"));
      await rescueToken.connect(user1).delegate(user1.address);
      await rescueToken.connect(user1).transfer(user2.address, ethers.parseEther("500"));
      
      const user1Votes = await rescueToken.getVotes(user1.address);
      expect(user1Votes).to.equal(ethers.parseEther("500"));
    });
  });

  describe("Burning", function () {
    it("Should allow burning own tokens", async function () {
      const { rescueToken, user1 } = await loadFixture(deployRescueTokenFixture);
      await rescueToken.mint(user1.address, ethers.parseEther("1000"));
      await rescueToken.connect(user1).burn(ethers.parseEther("500"));
      expect(await rescueToken.balanceOf(user1.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should update remaining mintable supply after burn", async function () {
      const { rescueToken, user1 } = await loadFixture(deployRescueTokenFixture);
      await rescueToken.mint(user1.address, ethers.parseEther("1000"));
      await rescueToken.connect(user1).burn(ethers.parseEther("500"));
      const remaining = await rescueToken.remainingMintableSupply();
      expect(remaining).to.equal(MAX_SUPPLY - ethers.parseEther("500"));
    });
  });

  describe("Permit", function () {
    it("Should support EIP-2612 permit", async function () {
      const { rescueToken } = await loadFixture(deployRescueTokenFixture);
      expect(await rescueToken.DOMAIN_SEPARATOR()).to.not.equal(ethers.ZeroHash);
    });
  });
});
