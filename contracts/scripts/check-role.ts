
import { ethers } from "hardhat";

async function main() {
  const VAULT_ADDRESS = "0x6e1cA331F1f701d7B24f7367f5c8A9D07EeEc518";
  const USER = "0x5f80439206742Ac04e031665d1DFEDe11C9730aD";
  
  const Vault = await ethers.getContractAt("ParametricVault", VAULT_ADDRESS);
  const DAO_ROLE = await Vault.DAO_ROLE();
  const hasDAO = await Vault.hasRole(DAO_ROLE, USER);
  
  console.log(`Address: ${USER}`);
  console.log(`DAO_ROLE: ${DAO_ROLE}`);
  console.log(`Has DAO_ROLE: ${hasDAO}`);
}

main().catch(console.error);
