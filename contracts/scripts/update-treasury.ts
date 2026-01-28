
import { ethers } from "hardhat";

async function main() {
  const VAULT_ADDRESS = "0x6e1cA331F1f701d7B24f7367f5c8A9D07EeEc518";
  const NEW_TREASURY = "0xD9207383699f4f7AeB1C8f8f72318aA67f322649";

  console.log("Updating Treasury Address...");
  
  const Vault = await ethers.getContractFactory("ParametricVault");
  const vault = Vault.attach(VAULT_ADDRESS);

  // setTreasury requires ADMIN_ROLE
  console.log("Sending transaction to setTreasury...");
  const tx = await vault.setTreasury(NEW_TREASURY);
  
  console.log("Transaction sent:", tx.hash);
  await tx.wait();
  
  console.log("✅ Treasury address updated successfully to:", NEW_TREASURY);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
