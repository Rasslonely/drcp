
import { ethers } from "hardhat";

async function main() {
  const VAULT_ADDRESS = "0x6e1cA331F1f701d7B24f7367f5c8A9D07EeEc518";
  const NFT_ADDRESS = "0x7D1E0D4C089c6FC1F4500f6C98365DDA6D316E8B";

  console.log("🚀 Authorizing Vault as Minter on ImpactNFT...");
  console.log("Vault:", VAULT_ADDRESS);
  console.log("NFT:", NFT_ADDRESS);

  const NFT = await ethers.getContractAt("ImpactNFT", NFT_ADDRESS);
  
  // Need to be run by the owner/deployer
  console.log("Sending transaction to setMinter...");
  const tx = await NFT.setMinter(VAULT_ADDRESS, true);
  
  console.log("Transaction sent:", tx.hash);
  await tx.wait();
  
  console.log("✅ Success! Vault is now authorized to mint Impact NFTs.");
}

main().catch(console.error);
