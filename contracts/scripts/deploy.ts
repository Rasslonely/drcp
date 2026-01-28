import { ethers, network } from "hardhat";

// Network-specific configurations
const NETWORK_CONFIG: Record<string, { name: string; symbol: string; explorer: string; verifyCmd: string }> = {
  "lisk-sepolia": {
    name: "Lisk Sepolia Testnet",
    symbol: "ETH",
    explorer: "https://sepolia-blockscout.lisk.com",
    verifyCmd: "lisk-sepolia",
  },
  amoy: {
    name: "Polygon Amoy Testnet",
    symbol: "MATIC",
    explorer: "https://amoy.polygonscan.com",
    verifyCmd: "amoy",
  },
  lisk: {
    name: "Lisk Mainnet",
    symbol: "ETH",
    explorer: "https://blockscout.lisk.com",
    verifyCmd: "lisk",
  },
  polygon: {
    name: "Polygon Mainnet",
    symbol: "MATIC",
    explorer: "https://polygonscan.com",
    verifyCmd: "polygon",
  },
  hardhat: {
    name: "Hardhat Local",
    symbol: "ETH",
    explorer: "",
    verifyCmd: "",
  },
};

async function main() {
  const networkName = network.name;
  const config = NETWORK_CONFIG[networkName] || NETWORK_CONFIG.hardhat;
  const chainId = (await ethers.provider.getNetwork()).chainId;

  console.log(`🚀 Deploying DRCP Contracts to ${config.name}...\n`);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), config.symbol + "\n");

  // ============ Deploy RescueToken ============
  console.log("1️⃣ Deploying RescueToken...");
  const RescueTokenFactory = await ethers.getContractFactory("RescueToken");
  const rescueToken = await RescueTokenFactory.deploy(deployer.address);
  await rescueToken.waitForDeployment();
  const rescueTokenAddress = await rescueToken.getAddress();
  console.log("   ✅ RescueToken deployed to:", rescueTokenAddress);

  // ============ Deploy Timelock ============
  console.log("\n2️⃣ Deploying DRCPTimelock...");
  const minDelay = 3600; // 1 hour
  const TimelockFactory = await ethers.getContractFactory("DRCPTimelock");
  const timelock = await TimelockFactory.deploy(
    minDelay,
    [], // proposers - will be set after governor deployment
    [], // executors - will be set after governor deployment
    deployer.address
  );
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("   ✅ DRCPTimelock deployed to:", timelockAddress);

  // ============ Deploy Governor ============
  console.log("\n3️⃣ Deploying DRCPGovernor...");
  const votingDelay = 1; // 1 block
  const votingPeriod = 50400; // ~1 week (assuming 2s blocks)
  const proposalThreshold = ethers.parseEther("1000"); // 1000 RESCUE

  const GovernorFactory = await ethers.getContractFactory("DRCPGovernor");
  const governor = await GovernorFactory.deploy(
    rescueTokenAddress,
    timelockAddress,
    votingDelay,
    votingPeriod,
    proposalThreshold
  );
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("   ✅ DRCPGovernor deployed to:", governorAddress);

  // ============ Configure Timelock Roles ============
  console.log("\n4️⃣ Configuring Timelock roles...");
  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();
  
  await timelock.grantRole(proposerRole, governorAddress);
  await timelock.grantRole(executorRole, governorAddress);
  console.log("   ✅ Governor granted PROPOSER and EXECUTOR roles");

  // ============ Deploy MockUSDC ============
  console.log("\n5️⃣ Deploying MockUSDC (for testnet)...");
  const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDCFactory.deploy();
  await mockUsdc.waitForDeployment();
  const mockUsdcAddress = await mockUsdc.getAddress();
  console.log("   ✅ MockUSDC deployed to:", mockUsdcAddress);

  // ============ Deploy ProjectTreasury ============
  console.log("\n5.5️⃣ Deploying ProjectTreasury...");
  const TreasuryFactory = await ethers.getContractFactory("ProjectTreasury");
  const treasury = await TreasuryFactory.deploy(mockUsdcAddress, deployer.address);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("   ✅ ProjectTreasury deployed to:", treasuryAddress);

  // ============ Deploy ImpactNFT ============
  console.log("\n5.6️⃣ Deploying ImpactNFT...");
  const ImpactNFTFactory = await ethers.getContractFactory("ImpactNFT");
  const impactNFT = await ImpactNFTFactory.deploy(deployer.address); // minter = deployer
  await impactNFT.waitForDeployment();
  const impactNFTAddress = await impactNFT.getAddress();
  console.log("   ✅ ImpactNFT deployed to:", impactNFTAddress);

  // ============ Deploy ParametricVault (with treasury & NFT) ============
  console.log("\n6️⃣ Deploying ParametricVault...");
  const VaultFactory = await ethers.getContractFactory("ParametricVault");
  const vault = await VaultFactory.deploy(
    mockUsdcAddress, 
    impactNFTAddress,
    deployer.address, 
    treasuryAddress
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("   ✅ ParametricVault deployed to:", vaultAddress);
  console.log("   📌 Protocol Fee: 0.5% → Treasury:", treasuryAddress);

  // ============ Configure Vault Roles ============
  console.log("\n7️⃣ Configuring Vault roles...");
  const daoRole = await vault.DAO_ROLE();
  await vault.grantRole(daoRole, governorAddress);
  await vault.grantRole(daoRole, timelockAddress);
  console.log("   ✅ Governor and Timelock granted DAO_ROLE");

  // ============ Initial Token Mint ============
  console.log("\n9️⃣ Minting initial token distribution...");
  const communityAllocation = ethers.parseEther("40000000"); // 40M (40%)
  const treasuryAllocation = ethers.parseEther("25000000"); // 25M (25%)
  
  await rescueToken.mint(deployer.address, communityAllocation);
  await rescueToken.mint(timelockAddress, treasuryAllocation);
  console.log("   ✅ Minted 40M to deployer, 25M to treasury");

  // ============ Summary ============
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`
🪙 RescueToken:     ${rescueTokenAddress}
⏰ DRCPTimelock:    ${timelockAddress}
🏛️ DRCPGovernor:    ${governorAddress}
💰 ParametricVault: ${vaultAddress}
💵 MockUSDC:        ${mockUsdcAddress}
🏆 ImpactNFT:       ${impactNFTAddress}

Network: ${config.name}
ChainId: ${chainId}
Explorer: ${config.explorer}

Next Steps:
1. Verify contracts on ${config.explorer ? "Blockscout/Explorer" : "local network"}
2. Mint test USDC for testing
3. Test deposit/withdraw flow
4. Create a test proposal
  `);

  // ============ Verification Commands ============
  if (config.verifyCmd) {
    console.log("=".repeat(60));
    console.log("📝 VERIFICATION COMMANDS");
    console.log("=".repeat(60));
    console.log(`
npx hardhat verify --network ${config.verifyCmd} ${rescueTokenAddress} ${deployer.address}
npx hardhat verify --network ${config.verifyCmd} ${timelockAddress} ${minDelay} [] [] ${deployer.address}
npx hardhat verify --network ${config.verifyCmd} ${governorAddress} ${rescueTokenAddress} ${timelockAddress} ${votingDelay} ${votingPeriod} ${proposalThreshold}
npx hardhat verify --network ${config.verifyCmd} ${vaultAddress} ${mockUsdcAddress} ${deployer.address}
npx hardhat verify --network ${config.verifyCmd} ${impactNFTAddress} ${deployer.address}
    `);
  }

  // ============ Export for deployments.ts ============
  console.log("=".repeat(60));
  console.log("📦 COPY TO deployments.ts");
  console.log("=".repeat(60));
  console.log(`
"${networkName === "amoy" ? "amoy" : networkName}": {
  RescueToken: "${rescueTokenAddress}" as \`0x\${string}\`,
  DRCPTimelock: "${timelockAddress}" as \`0x\${string}\`,
  DRCPGovernor: "${governorAddress}" as \`0x\${string}\`,
  ImpactNFT: "${impactNFTAddress}" as \`0x\${string}\`,
  MOCK_USDC_ADDRESS: "${mockUsdcAddress}" as \`0x\${string}\`,
  VAULT_ADDRESS: "${vaultAddress}" as \`0x\${string}\`,
  PROJECT_TREASURY: "" as \`0x\${string}\`, // Deploy separately if needed
  YIELD_CONTROLLER: "" as \`0x\${string}\`, // Deploy separately if needed
  CREATOR_WALLET: "${deployer.address}" as \`0x\${string}\`,
},
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
