import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun", // Required for OpenZeppelin 5.x mcopy instruction
    },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    // Polygon Amoy Testnet
    amoy: {
      url: "https://polygon-amoy.drpc.org",
      chainId: 80002,
      accounts: [PRIVATE_KEY],
    },
    // Lisk Sepolia Testnet (for Lisk Builders Challenge)
    "lisk-sepolia": {
      url: "https://rpc.sepolia-api.lisk.com",
      chainId: 4202,
      accounts: [PRIVATE_KEY],
    },
    // Lisk Mainnet (future)
    lisk: {
      url: "https://rpc.api.lisk.com",
      chainId: 1135,
      accounts: [PRIVATE_KEY],
    },
    // Polygon Mainnet (future production)
    polygon: {
      url: "https://polygon-rpc.com",
      chainId: 137,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: POLYGONSCAN_API_KEY,
      // Lisk uses Blockscout, no API key needed
      "lisk-sepolia": "no-api-key-needed",
      lisk: "no-api-key-needed",
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
      // Lisk Sepolia Blockscout
      {
        network: "lisk-sepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com",
        },
      },
      // Lisk Mainnet Blockscout
      {
        network: "lisk",
        chainId: 1135,
        urls: {
          apiURL: "https://blockscout.lisk.com/api",
          browserURL: "https://blockscout.lisk.com",
        },
      },
    ],
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
};

export default config;

