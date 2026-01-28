
import { ethers } from "hardhat";

async function main() {
  const VAULT_ADDRESS = "0x6e1cA331F1f701d7B24f7367f5c8A9D07EeEc518";
  const NFT_ADDRESS = "0x7D1E0D4C089c6FC1F4500f6C98365DDA6D316E8B";

  console.log("🔍 Checking NFT Minter Role...");
  console.log("Vault:", VAULT_ADDRESS);
  console.log("NFT:", NFT_ADDRESS);

  const NFT = await ethers.getContractAt("ImpactNFT", NFT_ADDRESS);
  const isMinter = await NFT.minters(VAULT_ADDRESS);

  console.log(`\nIs Vault an authorized minter? ${isMinter}`);
  
  if (!isMinter) {
    console.log("\n🚨 FOUND IT! The Vault is NOT a minter. This is why the NFT failed to mint.");
  } else {
    console.log("\n✅ Vault is a minter. The issue might be elsewhere (gas or logic).");
  }
}

main().catch(console.error);
