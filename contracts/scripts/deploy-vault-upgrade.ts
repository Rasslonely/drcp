import { ethers, network } from "hardhat";

/**
 * Deploy ParametricVault Only (Upgrade Script)
 * 
 * Use this when you only need to upgrade the vault contract
 * while keeping all other contracts (Governor, Token, NFT, etc.) the same.
 * 
 * Usage: npx hardhat run scripts/deploy-vault-upgrade.ts --network lisk-sepolia
 */

// ============ EXISTING ADDRESSES (Lisk Sepolia) ============
// These are already deployed and will be reused
const EXISTING = {
  MOCK_USDC: "0xc8f823d7FbE14d950b188F961aaD53b88E9ddfB8",
  PROJECT_TREASURY: "0xD9207383699f4f7AeB1C8f8f72318aA67f322649",
  GOVERNOR: "0x8fA50988f36af835de40153E871689148aE54E49",
  TIMELOCK: "0xb38c87D42AA5fbF778e1093c61D5e4a010996EB0",
  IMPACT_NFT: "0x7D1E0D4C089c6FC1F4500f6C98365DDA6D316E8B",
  // Old vault (for reference)
  OLD_VAULT: "0x95A3AC8Cd6A09CD057692f8ee16869734E02CB9E",
};

async function main() {
  const networkName = network.name;
  console.log(`\n🚀 Upgrading ParametricVault on ${networkName}...\n`);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ============ Deploy New ParametricVault ============
  console.log("1️⃣ Deploying new ParametricVault (with 0.5% fee)...");
  console.log("   - Using existing USDC:", EXISTING.MOCK_USDC);
  console.log("   - Using existing Treasury:", EXISTING.PROJECT_TREASURY);
  
  const VaultFactory = await ethers.getContractFactory("ParametricVault");
  const vault = await VaultFactory.deploy(
    EXISTING.MOCK_USDC,
    EXISTING.IMPACT_NFT,
    deployer.address,
    EXISTING.PROJECT_TREASURY
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  
  console.log("   ✅ New ParametricVault deployed to:", vaultAddress);
  console.log("   📌 Protocol Fee: 0.5% (50 basis points)");

  // ============ Grant DAO Roles ============
  console.log("\n2️⃣ Granting DAO roles to Governor & Timelock...");
  const daoRole = await vault.DAO_ROLE();
  
  // Grant to Governor
  const tx1 = await vault.grantRole(daoRole, EXISTING.GOVERNOR);
  await tx1.wait();
  console.log("   ✅ Governor granted DAO_ROLE");
  
  // Grant to Timelock  
  const tx2 = await vault.grantRole(daoRole, EXISTING.TIMELOCK);
  await tx2.wait();
  console.log("   ✅ Timelock granted DAO_ROLE");

  // ============ Verify Protocol Fee ============
  console.log("\n3️⃣ Verifying protocol fee configuration...");
  const feeBps = await vault.protocolFeeBps();
  const treasury = await vault.treasury();
  const maxFee = await vault.MAX_FEE_BPS();
  
  console.log(`   Fee Rate: ${Number(feeBps) / 100}%`);
  console.log(`   Max Fee: ${Number(maxFee) / 100}%`);
  console.log(`   Treasury: ${treasury}`);

  // ============ Summary ============
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`
🆕 NEW VAULT: ${vaultAddress}
📊 Protocol Fee: 0.5% (50 bps)
💰 Treasury: ${EXISTING.PROJECT_TREASURY}

🔗 Reused Contracts (unchanged):
   - MockUSDC: ${EXISTING.MOCK_USDC}
   - Governor: ${EXISTING.GOVERNOR}
   - Timelock: ${EXISTING.TIMELOCK}
   - Treasury: ${EXISTING.PROJECT_TREASURY}

⚠️  Old Vault (deprecated): ${EXISTING.OLD_VAULT}
  `);

  // ============ Update Instructions ============
  console.log("=".repeat(60));
  console.log("📝 NEXT STEPS");
  console.log("=".repeat(60));
  console.log(`
1. Update deployments.ts:
   VAULT_ADDRESS: "${vaultAddress}" as \`0x\${string}\`,

2. Verify on Blockscout:
   npx hardhat verify --network ${networkName} ${vaultAddress} ${EXISTING.MOCK_USDC} ${deployer.address} ${EXISTING.PROJECT_TREASURY}

3. Test donation flow on frontend
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
