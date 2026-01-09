import { ethers } from "hardhat";

/**
 * Phase 11: Deploy ProjectTreasury and YieldController
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-phase11.ts --network amoy
 * 
 * After deployment, update:
 *   web-app/src/lib/contracts/deployments.ts
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=".repeat(60));
  console.log("Phase 11: Sustainable Revenue - Deployment");
  console.log("=".repeat(60));
  console.log("Deployer:", deployer.address);
  console.log("");

  // Get existing USDC address (MockUSDC on testnet)
  const USDC_ADDRESS = "0xCAa80AbfeC9871D09911bF488e9Ed230d00093e2";
  const VAULT_ADDRESS = "0xb0EF777A7CD41DC84499Baf51dE16996489d65Dd";
  
  console.log("Using USDC:", USDC_ADDRESS);
  console.log("Using Vault:", VAULT_ADDRESS);
  console.log("");

  // ============ Deploy ProjectTreasury ============
  console.log("1. Deploying ProjectTreasury...");
  const ProjectTreasury = await ethers.getContractFactory("ProjectTreasury");
  const treasury = await ProjectTreasury.deploy(
    USDC_ADDRESS,      // stablecoin
    deployer.address   // admin (you)
  );
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("   ✅ ProjectTreasury:", treasuryAddress);
  console.log("");

  // ============ Deploy YieldController ============
  console.log("2. Deploying YieldController...");
  const YieldController = await ethers.getContractFactory("YieldController");
  const yieldController = await YieldController.deploy(
    USDC_ADDRESS,       // stablecoin
    VAULT_ADDRESS,      // vault
    treasuryAddress,    // treasury (just deployed)
    deployer.address    // admin
  );
  await yieldController.waitForDeployment();
  const yieldAddress = await yieldController.getAddress();
  console.log("   ✅ YieldController:", yieldAddress);
  console.log("");

  // ============ Summary ============
  console.log("=".repeat(60));
  console.log("DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("");
  console.log("📋 Update web-app/src/lib/contracts/deployments.ts:");
  console.log("");
  console.log(`   PROJECT_TREASURY: "${treasuryAddress}",`);
  console.log(`   YIELD_CONTROLLER: "${yieldAddress}",`);
  console.log("");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
