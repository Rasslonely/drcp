
import { ethers } from "hardhat";

async function main() {
  const address = "0xD9207383699f4f7AeB1C8f8f72318aA67f322649";
  const code = await ethers.provider.getCode(address);
  console.log(`Address: ${address}`);
  console.log(`Code: ${code === "0x" ? "EOA (No Code)" : "Contract (" + code.length + " bytes)"}`);
}

main().catch(console.error);
