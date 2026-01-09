
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);

  const mockUsdcAddress = "0x38CFc9ee6FDdBB9482007f640CF6f75c5dDF2248";
  
  console.log("Connecting to MockUSDC at", mockUsdcAddress);
  const mockUSDC = await ethers.getContractAt("MockUSDC", mockUsdcAddress);

  console.log("Checking decimals...");
  const decimals = await mockUSDC.decimals();
  console.log("Decimals:", decimals);

  console.log("Attempting to mint 1000 USDC...");
  try {
    const tx = await mockUSDC.mint(deployer.address, ethers.parseUnits("1000", decimals));
    console.log("Mint tx sent:", tx.hash);
    await tx.wait();
    console.log("Mint confirmed!");
    
    const balance = await mockUSDC.balanceOf(deployer.address);
    console.log("New Balance:", ethers.formatUnits(balance, decimals));
  } catch (error) {
    console.error("Mint failed:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
