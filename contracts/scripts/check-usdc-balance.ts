
import { ethers } from "hardhat";

async function main() {
  const TREASURY = "0xD9207383699f4f7AeB1C8f8f72318aA67f322649";
  const USDC = "0xc8f823d7FbE14d950b188F961aaD53b88E9ddfB8";
  
  const token = await ethers.getContractAt("IERC20", USDC);
  const balance = await token.balanceOf(TREASURY);
  
  console.log(`Treasury: ${TREASURY}`);
  console.log(`Balance: ${ethers.formatUnits(balance, 6)} USDC`);
}

main().catch(console.error);
