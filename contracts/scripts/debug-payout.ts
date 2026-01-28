
import { ethers } from "hardhat";

async function main() {
  const VAULT_ADDRESS = "0x6e1cA331F1f701d7B24f7367f5c8A9D07EeEc518";
  const USER_ADDRESS = "0x5f80439206742Ac04e031665d1DFEDe11C9730aD";
  const MOCK_USDC = "0xc8f823d7FbE14d950b188F961aaD53b88E9ddfB8";
  const TASK_ID = 1; // From screenshot

  const Vault = await ethers.getContractAt("ParametricVault", VAULT_ADDRESS);
  const USDC = await ethers.getContractAt("IERC20", MOCK_USDC);

  console.log("--- Diagnostic Start ---");
  
  // 1. Check Role
  const DAO_ROLE = await Vault.DAO_ROLE();
  const hasRole = await Vault.hasRole(DAO_ROLE, USER_ADDRESS);
  console.log(`User ${USER_ADDRESS} has DAO_ROLE: ${hasRole}`);

  if (!hasRole) {
    const adminRole = await Vault.DEFAULT_ADMIN_ROLE();
    const isAdmin = await Vault.hasRole(adminRole, USER_ADDRESS);
    console.log(`User ${USER_ADDRESS} has DEFAULT_ADMIN_ROLE: ${isAdmin}`);
  }

  // 2. Check Task
  const task = await Vault.getTask(TASK_ID);
  console.log(`Task ID: ${task.id}`);
  console.log(`Task Status: ${task.status} (2 = PROOF_SUBMITTED)`);
  console.log(`Task Reward: ${ethers.formatUnits(task.reward, 6)} USDC`);
  console.log(`Volunteer: ${task.volunteer}`);

  // 3. Check Vault Balance
  const vaultUSDC = await USDC.balanceOf(VAULT_ADDRESS);
  console.log(`Vault USDC Balance: ${ethers.formatUnits(vaultUSDC, 6)} USDC`);

  // 4. Check Vault State
  const state = await Vault.currentState();
  console.log(`Vault Current State: ${state} (3 = EMERGENCY, 4 = RELIEF_ACTIVE)`);

  const vaultBalance = await Vault.getVaultBalance();
  console.log(`Vault getVaultBalance(): ${ethers.formatUnits(vaultBalance, 6)} USDC`);

  console.log("--- Diagnostic End ---");
}

main().catch(console.error);
