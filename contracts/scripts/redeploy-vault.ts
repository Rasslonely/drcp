import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Redeploying ParametricVault to Polygon Amoy...");
  console.log("Deployer:", deployer.address);

  // Use the existing MockUSDC address from deployments
  const MOCK_USDC = "0xCAa80AbfeC9871D09911bF488e9Ed230d00093e2";

  const VaultFactory = await ethers.getContractFactory("ParametricVault");
  const vault = await VaultFactory.deploy(MOCK_USDC, deployer.address);
  await vault.waitForDeployment();
  
  const vaultAddress = await vault.getAddress();
  console.log("\n✅ ParametricVault redeployed to:", vaultAddress);
  
  console.log("\n📝 NEXT STEPS:");
  console.log("1. Update 'VAULT_ADDRESS' in 'web-app/src/lib/contracts/deployments.ts'");
  console.log(`2. Verify on Polygonscan: npx hardhat verify --network amoy ${vaultAddress} ${MOCK_USDC} ${deployer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
