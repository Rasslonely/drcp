import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { DRCPGovernor, DRCPTimelock, RescueToken } from "../typechain-types";

describe("DRCPGovernor", function () {
  const VOTING_DELAY = 1; // 1 block
  const VOTING_PERIOD = 50400; // ~1 week on Polygon
  const PROPOSAL_THRESHOLD = ethers.parseEther("1000"); // 1000 RESCUE
  const MIN_DELAY = 3600; // 1 hour

  async function deployGovernorFixture() {
    const [owner, proposer, voter1, voter2] = await ethers.getSigners();

    // Deploy RescueToken
    const RescueTokenFactory = await ethers.getContractFactory("RescueToken");
    const rescueToken = await RescueTokenFactory.deploy(owner.address) as unknown as RescueToken;
    await rescueToken.waitForDeployment();

    // Deploy Timelock
    const TimelockFactory = await ethers.getContractFactory("DRCPTimelock");
    const timelock = await TimelockFactory.deploy(
      MIN_DELAY,
      [], // proposers - will be set after governor deployment
      [], // executors - will be set after governor deployment
      owner.address
    ) as unknown as DRCPTimelock;
    await timelock.waitForDeployment();

    // Deploy Governor
    const GovernorFactory = await ethers.getContractFactory("DRCPGovernor");
    const governor = await GovernorFactory.deploy(
      await rescueToken.getAddress(),
      await timelock.getAddress(),
      VOTING_DELAY,
      VOTING_PERIOD,
      PROPOSAL_THRESHOLD
    ) as unknown as DRCPGovernor;
    await governor.waitForDeployment();

    // Grant timelock roles to governor
    const proposerRole = await timelock.PROPOSER_ROLE();
    const executorRole = await timelock.EXECUTOR_ROLE();
    await timelock.grantRole(proposerRole, await governor.getAddress());
    await timelock.grantRole(executorRole, await governor.getAddress());

    // Mint tokens and delegate
    await rescueToken.mint(proposer.address, ethers.parseEther("10000"));
    await rescueToken.mint(voter1.address, ethers.parseEther("50000"));
    await rescueToken.mint(voter2.address, ethers.parseEther("40000"));

    await rescueToken.connect(proposer).delegate(proposer.address);
    await rescueToken.connect(voter1).delegate(voter1.address);
    await rescueToken.connect(voter2).delegate(voter2.address);

    // Mine a block to register votes
    await ethers.provider.send("evm_mine", []);

    return { governor, timelock, rescueToken, owner, proposer, voter1, voter2 };
  }

  describe("Deployment", function () {
    it("Should set the correct name", async function () {
      const { governor } = await loadFixture(deployGovernorFixture);
      expect(await governor.name()).to.equal("DRCP Governor");
    });

    it("Should set the correct voting delay", async function () {
      const { governor } = await loadFixture(deployGovernorFixture);
      expect(await governor.votingDelay()).to.equal(BigInt(VOTING_DELAY));
    });

    it("Should set the correct voting period", async function () {
      const { governor } = await loadFixture(deployGovernorFixture);
      expect(await governor.votingPeriod()).to.equal(BigInt(VOTING_PERIOD));
    });

    it("Should set the correct proposal threshold", async function () {
      const { governor } = await loadFixture(deployGovernorFixture);
      expect(await governor.proposalThreshold()).to.equal(PROPOSAL_THRESHOLD);
    });

    it("Should set 10% quorum", async function () {
      const { governor, rescueToken } = await loadFixture(deployGovernorFixture);
      const totalSupply = await rescueToken.totalSupply();
      const blockNumber = await ethers.provider.getBlockNumber();
      const quorum = await governor.quorum(blockNumber - 1);
      expect(quorum).to.equal(totalSupply / 10n);
    });
  });

  describe("Proposals", function () {
    it("Should allow creating standard proposals", async function () {
      const { governor, rescueToken, proposer, voter1 } = await loadFixture(deployGovernorFixture);
      const targets = [await rescueToken.getAddress()];
      const values = [0n];
      const calldatas = [rescueToken.interface.encodeFunctionData("mint", [voter1.address, ethers.parseEther("1000")])];
      const description = "Mint 1000 tokens to voter1";

      await governor.connect(proposer).propose(targets, values, calldatas, description);
      
      const proposalId = await governor.hashProposal(targets, values, calldatas, ethers.keccak256(ethers.toUtf8Bytes(description)));
      expect(await governor.getProposalType(proposalId)).to.equal(0n); // STANDARD
    });

    it("Should allow creating emergency proposals", async function () {
      const { governor, rescueToken, proposer, voter1 } = await loadFixture(deployGovernorFixture);
      const targets = [await rescueToken.getAddress()];
      const values = [0n];
      const calldatas = [rescueToken.interface.encodeFunctionData("mint", [voter1.address, ethers.parseEther("1000")])];
      const description = "Emergency: Mint 1000 tokens";

      await governor.connect(proposer).proposeEmergency(targets, values, calldatas, description);
      
      const proposalId = await governor.hashProposal(targets, values, calldatas, ethers.keccak256(ethers.toUtf8Bytes(description)));
      expect(await governor.getProposalType(proposalId)).to.equal(1n); // EMERGENCY
    });

    it("Should reject proposals from accounts below threshold", async function () {
      const { governor, rescueToken, voter1 } = await loadFixture(deployGovernorFixture);
      const targets = [await rescueToken.getAddress()];
      const values = [0n];
      const calldatas = [rescueToken.interface.encodeFunctionData("mint", [voter1.address, ethers.parseEther("1000")])];
      const description = "Should fail";

      // Get a signer with no tokens
      const [, , , , noTokensAccount] = await ethers.getSigners();
      
      await expect(
        governor.connect(noTokensAccount).propose(targets, values, calldatas, description)
      ).to.be.reverted;
    });
  });

  describe("Voting", function () {
    it("Should allow voting", async function () {
      const { governor, rescueToken, proposer, voter1 } = await loadFixture(deployGovernorFixture);
      const targets = [await rescueToken.getAddress()];
      const values = [0n];
      const calldatas = [rescueToken.interface.encodeFunctionData("mint", [voter1.address, ethers.parseEther("1000")])];
      const description = "Test Proposal";

      await governor.connect(proposer).propose(targets, values, calldatas, description);
      const proposalId = await governor.hashProposal(targets, values, calldatas, ethers.keccak256(ethers.toUtf8Bytes(description)));

      // Wait for voting delay
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      await governor.connect(voter1).castVote(proposalId, 1); // Vote For
      
      const hasVoted = await governor.hasVoted(proposalId, voter1.address);
      expect(hasVoted).to.be.true;
    });

    it("Should count votes correctly", async function () {
      const { governor, rescueToken, proposer, voter1, voter2 } = await loadFixture(deployGovernorFixture);
      const targets = [await rescueToken.getAddress()];
      const values = [0n];
      const calldatas = [rescueToken.interface.encodeFunctionData("mint", [voter1.address, ethers.parseEther("1000")])];
      const description = "Test Proposal 2";

      await governor.connect(proposer).propose(targets, values, calldatas, description);
      const proposalId = await governor.hashProposal(targets, values, calldatas, ethers.keccak256(ethers.toUtf8Bytes(description)));

      // Wait for voting delay
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      await governor.connect(voter1).castVote(proposalId, 1); // For
      await governor.connect(voter2).castVote(proposalId, 0); // Against

      const votes = await governor.proposalVotes(proposalId);
      expect(votes.forVotes).to.equal(ethers.parseEther("50000"));
      expect(votes.againstVotes).to.equal(ethers.parseEther("40000"));
    });

    it("Should determine proposal state correctly", async function () {
      const { governor, rescueToken, proposer, voter1 } = await loadFixture(deployGovernorFixture);
      const targets = [await rescueToken.getAddress()];
      const values = [0n];
      const calldatas = [rescueToken.interface.encodeFunctionData("mint", [voter1.address, ethers.parseEther("1000")])];
      const description = "Test Proposal 3";

      await governor.connect(proposer).propose(targets, values, calldatas, description);
      const proposalId = await governor.hashProposal(targets, values, calldatas, ethers.keccak256(ethers.toUtf8Bytes(description)));

      // Wait for voting delay
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      // Active state
      expect(await governor.state(proposalId)).to.equal(1n); // Active

      // Vote to pass
      await governor.connect(voter1).castVote(proposalId, 1);

      // Fast forward past voting period
      for (let i = 0; i < VOTING_PERIOD + 1; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Should be Succeeded
      expect(await governor.state(proposalId)).to.equal(4n); // Succeeded
    });
  });
});
