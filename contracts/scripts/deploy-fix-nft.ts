
import { ethers, network } from "hardhat";

/**
 * Deploy Script: Fix NFT Logic (Vault <-> NFT Connection)
 * 
 * Objectives:
 * 1. Deploy new ImpactNFT (replaces old one)
 * 2. Deploy new ParametricVault (linked to new NFT)
 * 3. Authorize Vault as "Minter" in NFT contract (CRITICAL)
 * 4. Setup Protocol Fees & Treasury
 * 5. Grant DAO roles
 * 
 * Usage: npx hardhat run scripts/deploy-fix-nft.ts --network lisk-sepolia
 */

// ============ REUSED ADDRESSES ============
const EXISTING = {
  MOCK_USDC: "0xc8f823d7FbE14d950b188F961aaD53b88E9ddfB8",
  PROJECT_TREASURY: "0xD9207383699f4f7AeB1C8f8f72318aA67f322649", // CORRECT NEW TREASURY
  GOVERNOR: "0x8fA50988f36af835de40153E871689148aE54E49",
  TIMELOCK: "0xb38c87D42AA5fbF778e1093c61D5e4a010996EB0",
};

async function main() {
  const networkName = network.name;
  console.log(`\n🚀 Deploying NFT Logic Fix on ${networkName}...\n`);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ============ 1. Deploy ImpactNFT ============
  console.log("1️⃣ Deploying ImpactNFT (Soulbound)...");
  const NFTFactory = await ethers.getContractFactory("ImpactNFT");
  const nft = await NFTFactory.deploy(deployer.address);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("   ✅ ImpactNFT deployed to:", nftAddress);

  // ============ 2. Deploy ParametricVault ============
  console.log("\n2️⃣ Deploying ParametricVault (Linked to NFT)...");
  const VaultFactory = await ethers.getContractFactory("ParametricVault");
  const vault = await VaultFactory.deploy(
    EXISTING.MOCK_USDC,
    nftAddress,           // Inject NFT address
    deployer.address,
    EXISTING.PROJECT_TREASURY
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("   ✅ ParametricVault deployed to:", vaultAddress);

  // ============ 3. Wire Permissions (The Missing Link) ============
  console.log("\n3️⃣ Wiring Permissions (Critical Step)...");
  
  // A. Set Vault as Minter in NFT
  console.log("   👉 Authorizing Vault to mint NFTs...");
  const txMinter = await nft.setMinter(vaultAddress, true);
  await txMinter.wait();
  console.log("   ✅ Minter Role Set: Vault can now mint NFTs!");

  // B. Grant DAO Roles (Governor + Timelock)
  console.log("   👉 Granting DAO Roles...");
  const daoRole = await vault.DAO_ROLE();
  
  const txGov = await vault.grantRole(daoRole, EXISTING.GOVERNOR);
  await txGov.wait();
  console.log("   ✅ Governor granted DAO_ROLE");

  const txTime = await vault.grantRole(daoRole, EXISTING.TIMELOCK);
  await txTime.wait();
  console.log("   ✅ Timelock granted DAO_ROLE");

  // ============ 4. Verify Configuration ============
  console.log("\n4️⃣ Verifying Configuration...");
  const isMinter = await nft.minters(vaultAddress);
  const connectedNFT = await vault.impactNFT();
  
  if (isMinter && connectedNFT === nftAddress) {
      console.log("   ✅ SUCCESS: Vault is authorized and connected to correct NFT.");
  } else {
      console.log("   🚨 ERROR: Permissions mismatch! Please check.");
  }

  // ============ Summary ============
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY (COPY THESE TO FRONTEND)");
  console.log("=".repeat(60));
  console.log(`
export const IMPACT_NFT_ADDRESS = "${nftAddress}" as \`0x\${string}\`;
export const VAULT_ADDRESS = "${vaultAddress}" as \`0x\${string}\`;
  `);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
