# DRCP Contracts

Smart contracts for the Disaster Response Coordination Protocol.

## Setup

```bash
cd contracts
npm install
```

## Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Run tests with coverage
npm run coverage

# Deploy to Lisk Sepolia
npm run deploy:lisk

# Verifying on Lisk Blockscout (automated during deployment in config)
# npx hardhat verify --network lisk-sepolia <CONTRACT_ADDRESS> <ARGUMENTS>
```

## Contracts

| Contract | Description |
|----------|-------------|
| `RescueToken.sol` | ERC-20 governance token with voting capabilities |
| `ParametricVault.sol` | Parametric vault with automated fund release |
| `DRCPGovernor.sol` | DAO governance with proposal/voting system |
| `DRCPTimelock.sol` | Timelock for governance actions |

## Network

**Lisk Sepolia Testnet**
- Chain ID: 4202
- RPC: `https://rpc.sepolia-api.lisk.com`
- Explorer: `https://sepolia-blockscout.lisk.com`
