import { ethers, network } from "hardhat";

/**
 * Deploy Extra Contracts: ImpactNFT, YieldController, ProjectTreasury
 * 
 * Run AFTER main deploy.ts to add missing contracts to existing deployment.
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-extras.ts --network lisk-sepolia
 */

// Network-specific configurations
const NETWORK_CONFIG: Record<string, { name: string; symbol: string }> = {
  "lisk-sepolia": { name: "Lisk Sepolia Testnet", symbol: "ETH" },
  amoy: { name: "Polygon Amoy Testnet", symbol: "MATIC" },
  lisk: { name: "Lisk Mainnet", symbol: "ETH" },
  polygon: { name: "Polygon Mainnet", symbol: "MATIC" },
  hardhat: { name: "Hardhat Local", symbol: "ETH" },
};

// ============================================================================
// EXISTING DEPLOYMENT ADDRESSES - UPDATE THESE BEFORE RUNNING
// ============================================================================
const EXISTING_DEPLOYMENTS: Record<string, { VAULT_ADDRESS: string; MOCK_USDC: string }> = {
  "lisk-sepolia": {
    VAULT_ADDRESS: "0x4Dd3ec9705820Bf0635fb90b2ff1BC06e0b441a7",
    MOCK_USDC: "0xc8f823d7FbE14d950b188F961aaD53b88E9ddfB8",
  },
  amoy: {
    VAULT_ADDRESS: "0x5ce8cCF75A8Ff90Ba1e73Ba9cBE81dEab6A5dFfB",
    MOCK_USDC: "0xCAa80AbfeC9871D09911bF488e9Ed230d00093e2",
  },
};

async function main() {
  const networkName = network.name;
  const config = NETWORK_CONFIG[networkName] || NETWORK_CONFIG.hardhat;
  const existingDeployment = EXISTING_DEPLOYMENTS[networkName];
  const chainId = (await ethers.provider.getNetwork()).chainId;

  if (!existingDeployment) {
    console.error(`❌ No existing deployment found for network: ${networkName}`);
    console.error("Please update EXISTING_DEPLOYMENTS in this script with your addresses.");
    process.exit(1);
  }

  console.log(`🚀 Deploying Extra Contracts to ${config.name}...\n`);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), config.symbol + "\n");
  console.log("Existing Vault:", existingDeployment.VAULT_ADDRESS);
  console.log("Existing USDC:", existingDeployment.MOCK_USDC, "\n");

  // ============ Deploy ImpactNFT ============
  console.log("1️⃣ Deploying ImpactNFT...");
  const ImpactNFTFactory = await ethers.getContractFactory("ImpactNFT");
  const impactNFT = await ImpactNFTFactory.deploy(deployer.address);
  await impactNFT.waitForDeployment();
  const impactNFTAddress = await impactNFT.getAddress();
  console.log("   ✅ ImpactNFT deployed to:", impactNFTAddress);

  // ============ Deploy ProjectTreasury ============
  console.log("\n2️⃣ Deploying ProjectTreasury...");
  const ProjectTreasuryFactory = await ethers.getContractFactory("ProjectTreasury");
  const projectTreasury = await ProjectTreasuryFactory.deploy(
    existingDeployment.MOCK_USDC, // stablecoin
    deployer.address // initial owner
  );
  await projectTreasury.waitForDeployment();
  const projectTreasuryAddress = await projectTreasury.getAddress();
  console.log("   ✅ ProjectTreasury deployed to:", projectTreasuryAddress);

  // ============ Deploy YieldController ============
  console.log("\n3️⃣ Deploying YieldController...");
  const YieldControllerFactory = await ethers.getContractFactory("YieldController");
  const yieldController = await YieldControllerFactory.deploy(
    existingDeployment.MOCK_USDC, // stablecoin
    existingDeployment.VAULT_ADDRESS, // vault
    projectTreasuryAddress, // treasury (just deployed)
    deployer.address // admin
  );
  await yieldController.waitForDeployment();
  const yieldControllerAddress = await yieldController.getAddress();
  console.log("   ✅ YieldController deployed to:", yieldControllerAddress);

  // ============ Summary ============
  console.log("\n" + "=".repeat(60));
  console.log("📋 EXTRA CONTRACTS DEPLOYED");
  console.log("=".repeat(60));
  console.log(`
🏆 ImpactNFT:       ${impactNFTAddress}
🏦 ProjectTreasury: ${projectTreasuryAddress}
📈 YieldController: ${yieldControllerAddress}

Network: ${config.name}
ChainId: ${chainId}
  `);

  // ============ Copy-paste for deployments.ts ============
  console.log("=".repeat(60));
  console.log("📦 UPDATE deployments.ts with:");
  console.log("=".repeat(60));
  console.log(`
ImpactNFT: "${impactNFTAddress}" as \`0x\${string}\`,
PROJECT_TREASURY: "${projectTreasuryAddress}" as \`0x\${string}\`,
YIELD_CONTROLLER: "${yieldControllerAddress}" as \`0x\${string}\`,
  `);

  // ============ Verification Commands ============
  console.log("=".repeat(60));
  console.log("📝 VERIFICATION COMMANDS");
  console.log("=".repeat(60));
  console.log(`
npx hardhat verify --network ${networkName} ${impactNFTAddress} ${deployer.address}
npx hardhat verify --network ${networkName} ${projectTreasuryAddress} ${existingDeployment.MOCK_USDC} ${deployer.address}
npx hardhat verify --network ${networkName} ${yieldControllerAddress} ${existingDeployment.VAULT_ADDRESS} ${existingDeployment.MOCK_USDC} ${deployer.address}
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
