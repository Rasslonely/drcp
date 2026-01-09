
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MockUSDC with account:", deployer.address);

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const address = await mockUSDC.getAddress();

  console.log("New MockUSDC deployed to:", address);
  console.log("Please update deployments.ts with this address!");
  
  // Verify decimals
  const decimals = await mockUSDC.decimals();
  console.log("Decimals:", decimals);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
