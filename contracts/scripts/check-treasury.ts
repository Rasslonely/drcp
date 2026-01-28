
import { ethers } from "hardhat";

async function main() {
  const VAULT_ADDRESS = "0x6e1cA331F1f701d7B24f7367f5c8A9D07EeEc518"; 
  
  console.log("Checking Treasury Configuration...");
  console.log("Vault Address:", VAULT_ADDRESS);
  
  const Vault = await ethers.getContractFactory("ParametricVault");
  const vault = Vault.attach(VAULT_ADDRESS);

  // Get current treasury info
  const info = await vault.getProtocolFeeInfo();
  
  console.log("\n[On-Chain Configuration]");
  console.log("------------------------");
  console.log("Fee Rate (BPS):", info[0].toString(), "(0.5%)");
  console.log("Treasury Address:", info[2]);
  console.log("Total Fees Collected:", ethers.formatUnits(info[3], 6), "USDC");
  
  console.log("\n[Frontend Configuration]");
  console.log("------------------------");
  console.log("Expected Treasury:", "0xD9207383699f4f7AeB1C8f8f72318aA67f322649");
  
  if (info[2].toLowerCase() !== "0xD9207383699f4f7AeB1C8f8f72318aA67f322649".toLowerCase()) {
      console.log("\n🚨 MISMATCH DETECTED!");
      console.log("The contract is sending money to the OLD address, but the UI is watching the NEW address.");
      console.log("Fix: Must call setTreasury() on the contract.");
  } else {
      console.log("\n✅ Configuration Matches. Check USDC balance of treasury address.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
