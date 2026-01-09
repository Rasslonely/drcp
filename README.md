# DRCP - Disaster Response Coordination Protocol

> **Trustless Humanitarianism. Instant Relief.**

[![Lisk Sepolia](https://img.shields.io/badge/Network-Lisk%20Sepolia-0052FF?style=for-the-badge&logo=ethereum)](https://sepolia-blockscout.lisk.com)
[![The Graph](https://img.shields.io/badge/Indexed%20by-The%20Graph-6747ED?style=for-the-badge)](https://thegraph.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)

---

## 🌍 The Problem

Disaster relief in Southeast Asia faces a **72-hour latency gap**. While victims wait, funds are trapped in bureaucratic processes with:

- ❌ **Hidden fees** - Intermediaries extract 15-30% in "admin costs"
- ❌ **Zero transparency** - Donors can't track where money goes
- ❌ **Slow response** - Funds take 3+ days to reach victims
- ❌ **Fraud risk** - No verification of relief distribution

## 💡 Our Solution

**DRCP** is a parametric disaster relief protocol on **Lisk** that eliminates intermediaries through:

| Feature | Description |
|---------|-------------|
| 🏛️ **DAO Governance** | Token holders vote on fund releases - no central authority |
| 📊 **Radical Transparency** | Every Rupiah tracked on-chain via The Graph |
| ⚡ **Instant Execution** | Smart contracts release funds immediately after DAO approval |
| 🏅 **Impact NFTs** | Soulbound tokens verify volunteer contributions |

---

## 🚀 Live Demo

| Resource | Link |
|----------|------|
| **Web App** | [disaster-protocol.vercel.app](https://disaster-protocol.vercel.app) |
| **Vault Contract** | [0x95A3AC8Cd6A09CD057692f8ee16869734E02CB9E](https://sepolia-blockscout.lisk.com/address/0x95A3AC8Cd6A09CD057692f8ee16869734E02CB9E) |
| **Governor** | [0x8fA50988f36af835de40153E871689148aE54E49](https://sepolia-blockscout.lisk.com/address/0x8fA50988f36af835de40153E871689148aE54E49) |
| **RescueToken** | [0x4080ACE95cf319c40F952D2dCCE21b070270f14d](https://sepolia-blockscout.lisk.com/address/0x4080ACE95cf319c40F952D2dCCE21b070270f14d) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                   │
│  Dashboard │ Donate │ Governance │ Transparency │ Volunteer │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    The Graph (Indexer)                      │
│         Real-time queries for deposits, votes, tasks        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   Lisk Sepolia (Blockchain)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ParametricVault│  │ DRCPGovernor │  │  ImpactNFT   │      │
│  │  (Funds)      │  │   (DAO)      │  │ (Reputation) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Project Structure

```
disaster-protocol/
├── contracts/          # Solidity smart contracts (Hardhat)
├── web-app/            # Next.js 15 frontend
├── subgraph/           # The Graph indexer
├── ai-engine/          # Disaster prediction API (Python)
├── mobile-app/         # React Native app (experimental)
└── SECURITY.md         # Security policy & bug bounty
```

---

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Web App
```bash
cd web-app
cp env.example .env.local
# Fill in NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
npm install
npm run dev
```

### Smart Contracts
```bash
cd contracts
cp .env.example .env
# Fill in PRIVATE_KEY and RPC URLs
npm install
npx hardhat compile
npx hardhat test
```

---

## 🔑 Key Features

### For Donors
- 💳 One-click USDC donations
- 📈 Real-time fund tracking dashboard
- 🧾 On-chain donation receipts

### For Volunteers
- 🏅 Earn Impact NFTs for verified contributions
- 📊 Build portable "Resilience Resume"
- 🗳️ Governance voting power via RescueToken

### For Organizations
- 🏛️ Create relief campaigns with DAO governance
- 📋 Submit task verifications on-chain
- 🔍 Full audit trail for compliance

---

## 🔐 Security

- All contracts follow OpenZeppelin standards
- Role-based access control (ADMIN, DAO, ORACLE)
- Timelock on governance actions
- See [SECURITY.md](./SECURITY.md) for bug bounty program

---

## 🏆 Built For

**Lisk Builders Challenge 2026**

Deployed on Lisk Sepolia testnet with full smart contract verification.

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🤝 Contact

- **Email:** rasstiens@gmail.com
- **GitHub:** [@Rasslonely](https://github.com/Rasslonely)

---

<p align="center">
  <b>Built with ❤️ for disaster victims everywhere</b>
</p>
