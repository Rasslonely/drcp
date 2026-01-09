import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying ImpactNFT with account:", deployer.address);

  // Deploy ImpactNFT
  const ImpactNFT = await ethers.getContractFactory("ImpactNFT");
  const impactNFT = await ImpactNFT.deploy(deployer.address);
  await impactNFT.waitForDeployment();

  const address = await impactNFT.getAddress();
  console.log("✅ ImpactNFT deployed to:", address);

  // Set minter (for testing, we authorize the deployer or the ParametricVault)
  // For now, let's just log it.
  
  console.log("\nVerification command:");
  console.log(`npx hardhat verify --network amoy ${address} ${deployer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
