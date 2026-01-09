# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow responsible disclosure practices.

### 🚨 DO NOT open a public issue for security vulnerabilities

Instead, please report vulnerabilities via one of these channels:

1. **Email:** rasstiens@gmail.com
2. **GitHub Security Advisory:** [Create a private advisory](../../security/advisories/new)

### What to Include

When reporting a vulnerability, please include:

- **Description:** Clear explanation of the vulnerability
- **Impact:** Potential consequences if exploited
- **Steps to Reproduce:** Detailed reproduction steps
- **Affected Components:** Contract name, function, or frontend area
- **Proof of Concept:** Code or transaction demonstrating the issue (if available)

### Response Timeline

| Stage | Timeline |
|-------|----------|
| Initial Response | Within 48 hours |
| Triage & Assessment | Within 5 business days |
| Fix Development | Varies by severity |
| Public Disclosure | After fix deployed + 30 days |

---

## Scope

### In Scope ✅

| Category | Details |
|----------|---------|
| Smart Contracts | All contracts in `contracts/src/` |
| Frontend Security | XSS, CSRF, authentication bypasses |
| API Security | Rate limiting bypasses, injection |
| Dependency Vulnerabilities | Critical CVEs in dependencies |

**Contracts of Interest:**
- `ParametricVault.sol` - Core vault logic, fund management
- `RescueToken.sol` - Governance token, voting power
- `DRCPGovernor.sol` - Proposal creation and execution
- `ImpactNFT.sol` - Volunteer reputation system

### Out of Scope ❌

- **Third-party services** (Alchemy, WalletConnect, The Graph)
- **Known issues** documented in `AUDIT_PREP.md`
- **Theoretical attacks** without proof of concept
- **Social engineering** attacks
- **Denial of service** via spam transactions (gas griefing is in scope)
- **Issues requiring physical access** to user device

---

## Bug Bounty Program 🏆

We reward security researchers who help keep DRCP safe.

### Severity Levels & Rewards

| Severity | Description | Reward |
|----------|-------------|--------|
| **Critical** | Loss of funds, governance takeover, unauthorized minting | Up to **$500 USDC** |
| **High** | Denial of service, bypassing access control, data exposure | Up to **$200 USDC** |
| **Medium** | Logic errors that could lead to fund loss with user interaction | Up to **$50 USDC** |
| **Low** | Minor issues, informational findings | Public credit |

### Severity Guidelines

**Critical:**
- Direct theft of user funds
- Unauthorized access to vault funds
- Governance manipulation (vote stuffing, proposal hijacking)
- Smart contract upgrade to malicious code

**High:**
- Permanent denial of service to core functionality
- Bypassing role-based access control
- Sensitive data exposure (private keys, API secrets)

**Medium:**
- Logic errors requiring specific conditions to exploit
- Front-running vulnerabilities with limited impact
- Incorrect state transitions

**Low:**
- Minor UI inconsistencies with security implications
- Best practice violations
- Gas optimization suggestions

### Payment Process

1. Report verified by team
2. Severity agreed upon
3. Fix developed and deployed
4. Reward paid via USDC on Lisk Sepolia

---

## Safe Harbor

We will not pursue legal action against researchers who:

- Make a good faith effort to avoid privacy violations
- Avoid actions that could negatively impact service to users
- Do not exploit vulnerabilities beyond proof of concept
- Report findings promptly and responsibly
- Wait for fix deployment before public disclosure

---

## Recognition

Researchers who responsibly disclose valid vulnerabilities will be:

- Credited in our Hall of Fame (if desired)
- Mentioned in security advisories
- Eligible for future beta testing access

---

## Contact

- **Security Email:** rasstiens@gmail.com
- **GitHub:** [Create Security Advisory](../../security/advisories/new)
- **Response Time:** 48 hours

---

*Last Updated: 2026-01-09*
