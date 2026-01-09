
import { ethers } from "hardhat";

async function main() {
  const provider = ethers.provider;
  const blockNumber = await provider.getBlockNumber();
  console.log("Connected to Amoy! Block:", blockNumber);

  const mockUsdcAddress = "0x38CFc9ee6FDdBB9482007f640CF6f75c5dDF2248";
  const code = await provider.getCode(mockUsdcAddress);
  
  if (code === "0x") {
    console.error("NO CODE at address:", mockUsdcAddress);
  } else {
    console.log("Contract exists at address. Code length:", code.length);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
