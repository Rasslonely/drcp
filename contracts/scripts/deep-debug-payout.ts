
import { ethers } from "hardhat";

async function main() {
  const VAULT_ADDRESS = "0x6e1cA331F1f701d7B24f7367f5c8A9D07EeEc518";
  const ADMIN_WALLET = "0x5f80439206742Ac04e031665d1DFEDe11C9730aD";
  const CREATOR_WALLET = "0xB8735c09D3D78Bcb4cA54E4cc753A07A40F87d96";
  const TASK_ID = 1;

  console.log("🔍 DEEP DEBUG: verifyAndPay failure");
  console.log("Vault:", VAULT_ADDRESS);

  const Vault = await ethers.getContractAt("ParametricVault", VAULT_ADDRESS);

  // 1. ROLE CHECK
  const DAO_ROLE = await Vault.DAO_ROLE();
  const adminHasRole = await Vault.hasRole(DAO_ROLE, ADMIN_WALLET);
  const creatorHasRole = await Vault.hasRole(DAO_ROLE, CREATOR_WALLET);
  
  console.log("\n--- Roles ---");
  console.log(`Admin Wallet (${ADMIN_WALLET}) has DAO_ROLE: ${adminHasRole}`);
  console.log(`Creator Wallet (${CREATOR_WALLET}) has DAO_ROLE: ${creatorHasRole}`);

  // 2. VAULT STATE
  const state = await Vault.currentState();
  const states = ["IDLE", "ALERT", "EMERGENCY", "RELIEF_ACTIVE", "SETTLED"];
  console.log("\n--- Vault State ---");
  console.log(`Current State: ${state} (${states[state]})`);

  // 3. TASK CHECK
  const task = await Vault.getTask(TASK_ID);
  const statuses = ["OPEN", "CLAIMED", "PROOF_SUBMITTED", "VERIFIED", "PAID", "CANCELLED"];
  console.log("\n--- Task Details ---");
  console.log(`ID: ${task.id}`);
  console.log(`Status: ${task.status} (${statuses[task.status]})`);
  console.log(`Reward: ${ethers.formatUnits(task.reward, 6)} USDC`);
  console.log(`Volunteer: ${task.volunteer}`);

  // 4. FIND EMERGENCY & FUNDS (Bypass private counter)
  console.log("\n--- Fund Allocation Check ---");
  let activeEmergencyFound = false;
  // Brute force check first 10 IDs since counter is private
  for (let i = 1; i <= 10; i++) {
    try {
      const emergency = await Vault.getEmergency(i);
      if (emergency.id != 0n) {
        console.log(`Emergency #${i}:`);
        console.log(`  Allocated: ${ethers.formatUnits(emergency.fundsAllocated, 6)} USDC`);
        console.log(`  Distributed: ${ethers.formatUnits(emergency.fundsDistributed, 6)} USDC`);
        console.log(`  Is Active: ${emergency.isActive}`);
        
        const available = emergency.fundsAllocated - emergency.fundsDistributed;
        console.log(`  Available for Payouts: ${ethers.formatUnits(available, 6)} USDC`);
        
        if (emergency.isActive) activeEmergencyFound = true;
      }
    } catch (e) {}
  }

  if (!activeEmergencyFound) {
    console.log("\n⚠️ WARNING: No active emergency found. verifyAndPay might fail if it relies on emergency funds.");
  }

  // 5. USDC BALANCE
  const USDC_ADDR = await Vault.stablecoin();
  const USDC = await ethers.getContractAt("IERC20", USDC_ADDR);
  const vaultUSDC = await USDC.balanceOf(VAULT_ADDRESS);
  console.log("\n--- Balances ---");
  console.log(`Vault USDC Balance: ${ethers.formatUnits(vaultUSDC, 6)} USDC`);
}

main().catch(console.error);
