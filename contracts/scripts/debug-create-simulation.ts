import { ethers } from "hardhat";

async function main() {
  const VAULT_ADDRESS = "0x5ce8cCF75A8Ff90Ba1e73Ba9cBE81dEab6A5dFfB";
  const ADMIN_WALLET = "0x5f80439206742Ac04e031665d1DFEDe11C9730aD";
  
  console.log("🔍 Simulating createCampaign on-chain...");

  const vault = await ethers.getContractAt("ParametricVault", VAULT_ADDRESS);

  // Match the frontend inputs
  const name = "banjir";
  const description = "relief";
  const targetAmount = ethers.parseUnits("5000", 6);
  const deadline = 0; // Leaving empty as in screenshot
  const geoHash = ethers.encodeBytes32String("medan");

  console.log("Parameters:");
  console.log("- Name:", name);
  console.log("- Target:", targetAmount.toString(), "USDC (6 dec)");
  console.log("- GeoHash:", geoHash);

  try {
    // Simulate as the admin wallet
    const result = await vault.createCampaign.staticCall(
      name,
      description,
      targetAmount,
      deadline,
      geoHash,
      { from: ADMIN_WALLET }
    );
    console.log("\n✅ Simulation successful! ID:", result.toString());
  } catch (error: any) {
    console.log("\n❌ Simulation FAILED!");
    console.log("Error Message:", error.message);
    if (error.data) {
        console.log("Error Data:", error.data);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
