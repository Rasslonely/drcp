# DRCP Subgraph

Subgraph for the Disaster Response Coordination Protocol (DRCP) ParametricVault contract on Lisk Sepolia testnet.

## Setup

```bash
cd subgraph
npm install
```

## Build

```bash
npm run codegen  # Generate types from schema
npm run build    # Compile subgraph to WASM
```

## Deploy to Goldsky (Recommended for Lisk)

Goldsky provides faster indexing for Lisk Sepolia.

### 1. Create Subgraph on Goldsky

1. Go to [Goldsky](https://goldsky.com/)
2. Create mapping for Lisk Sepolia

### 2. Deploy

```bash
goldsky subgraph deploy drcp-lisk-sepolia/v1.0.0
```

## Deploy to The Graph Studio (Alternative)

### 1. Create Subgraph

1. Go to [The Graph Studio](https://thegraph.com/studio/)
2. Name: `drcp-lisk-sepolia`
3. Network: `Lisk Sepolia`

### 2. Authenticate

```bash
graph auth --studio <DEPLOY_KEY>
```

### 3. Deploy

```bash
graph deploy --studio drcp-lisk-sepolia
```

### 4. Verify

Check the Studio dashboard for indexing progress. Once synced, test queries in the playground.

## Example Queries

### Get Recent Deposits
```graphql
query GetRecentDeposits {
  deposits(first: 10, orderBy: blockTimestamp, orderDirection: desc) {
    id
    donor
    amount
    blockTimestamp
    transactionHash
  }
}
```

### Get Vault Stats
```graphql
query GetVaultStats {
  vaultStats(id: "global") {
    totalDeposits
    totalWithdrawals
    totalTaskPayouts
    depositCount
    completedTaskCount
  }
}
```

### Get Donor History
```graphql
query GetDonorHistory($donor: Bytes!) {
  deposits(where: { donor: $donor }, orderBy: blockTimestamp, orderDirection: desc) {
    amount
    blockTimestamp
    transactionHash
  }
  donorStats(id: $donor) {
    totalDonated
    depositCount
  }
}
```

### Get Volunteer Stats
```graphql
query GetVolunteerLeaderboard {
  volunteerStats(first: 10, orderBy: totalEarned, orderDirection: desc) {
    id
    totalEarned
    tasksCompleted
  }
}
```

## Entities

| Entity | Description |
|--------|-------------|
| `Deposit` | Individual donation records |
| `Withdrawal` | Donor withdrawals |
| `Task` | Volunteer tasks (lifecycle tracked) |
| `TaskVerified` | Completed task payouts |
| `Emergency` | Disaster declarations |
| `VaultStats` | Global aggregated stats |
| `DonorStats` | Per-donor aggregated stats |
| `VolunteerStats` | Per-volunteer aggregated stats |
