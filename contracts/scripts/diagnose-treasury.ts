
import { ethers } from "hardhat";

async function main() {
  const VAULT_ADDRESS = "0x6e1cA331F1f701d7B24f7367f5c8A9D07EeEc518";
  const FRONTEND_TREASURY = "0xD9207383699f4f7AeB1C8f8f72318aA67f322649";
  const MOCK_USDC = "0xc8f823d7FbE14d950b188F961aaD53b88E9ddfB8";

  console.log("--- Treasury Diagnostic ---");
  console.log("Vault:", VAULT_ADDRESS);
  console.log("Frontend Treasury:", FRONTEND_TREASURY);

  const Vault = await ethers.getContractAt("ParametricVault", VAULT_ADDRESS);
  const USDC = await ethers.getContractAt("IERC20", MOCK_USDC);

  // 1. Check current treasury in Vault
  const info = await Vault.getProtocolFeeInfo();
  console.log("\nVault.getProtocolFeeInfo():");
  console.log("  Treasury Address:", info.treasuryAddr);
  console.log("  Total Collected:", ethers.formatUnits(info.totalCollected, 6), "USDC");

  // 2. Check USDC balances
  const balanceFrontend = await USDC.balanceOf(FRONTEND_TREASURY);
  const balanceLegacy = await USDC.balanceOf("0xd861026738CD681890438ED4349b684E9f0113A7");
  
  console.log("\nUSDC Balances:");
  console.log(`  Frontend Treasury (${FRONTEND_TREASURY}):`, ethers.formatUnits(balanceFrontend, 6), "USDC");
  console.log(`  Legacy Treasury (0xd861...):`, ethers.formatUnits(balanceLegacy, 6), "USDC");

  // 3. Check if addresses are contracts
  const codeFrontend = await ethers.provider.getCode(FRONTEND_TREASURY);
  console.log("\nContract Verification:");
  console.log(`  Is Frontend Treasury a contract?`, codeFrontend !== "0x");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
