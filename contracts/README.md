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

# Deploy to Polygon Amoy
npm run deploy:amoy
```

## Contracts

| Contract | Description |
|----------|-------------|
| `RescueToken.sol` | ERC-20 governance token with voting capabilities |
| `ParametricVault.sol` | Parametric vault with automated fund release |
| `DRCPGovernor.sol` | DAO governance with proposal/voting system |
| `DRCPTimelock.sol` | Timelock for governance actions |

## Network

**Polygon Amoy Testnet**
- Chain ID: 80002
- RPC: `https://rpc-amoy.polygon.technology`
- Faucet: `https://faucet.polygon.technology`
