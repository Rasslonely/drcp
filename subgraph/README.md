# DRCP Subgraph

Subgraph for the Disaster Response Coordination Protocol (DRCP) ParametricVault contract on Polygon Amoy testnet.

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

## Deploy to The Graph Studio

### 1. Create Subgraph

1. Go to [The Graph Studio](https://thegraph.com/studio/)
2. Connect your wallet
3. Click "Create a Subgraph"
4. Name: `drcp-polygon-amoy`
5. Network: `Polygon Amoy`

### 2. Authenticate

```bash
graph auth --studio <DEPLOY_KEY>
```

Get your deploy key from the subgraph page in Graph Studio.

### 3. Deploy

```bash
graph deploy --studio drcp-polygon-amoy
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
