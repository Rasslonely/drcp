# 🛡️ OpenZeppelin Defender Integration

This directory contains configuration for OpenZeppelin Defender monitoring.

## Prerequisites

1. **OpenZeppelin Defender Account** - Sign up at https://defender.openzeppelin.com
2. **Defender Plan** - Starter tier ($99/month) recommended for sentinel features

## Setup Instructions

### 1. Import Contracts into Defender

1. Log into OpenZeppelin Defender
2. Go to **Contracts** → **Add Contract**
3. Select **Polygon** network
4. Enter contract addresses from your deployment:
   - ParametricVault: `0x5ce8cCF75A8Ff90Ba1e73Ba9cBE81dEab6A5dFfB`
   - RescueToken: `0xa5247E2e494186EAe1Df1e2e747C3c920D8AC7a9`
   - DRCPGovernor: (your deployed address)

### 2. Create Sentinels

For each sentinel in `defender-config.ts`:

1. Go to **Sentinels** → **Create Sentinel**
2. Select the contract
3. Configure event monitoring (use ABI from config)
4. Set notification channels:
   - **Webhook**: `https://your-domain.com/api/defender/webhook`
   - **Email**: Your admin email
   - **Telegram**: (optional) Configure bot

### 3. Configure Webhook

Add to your `.env.local`:

```bash
# OpenZeppelin Defender
DEFENDER_API_KEY=your-api-key
DEFENDER_API_SECRET=your-api-secret
DEFENDER_WEBHOOK_SECRET=your-webhook-secret (optional)

# Telegram Notifications (optional)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### 4. Deploy Webhook Endpoint

Deploy your Next.js app - the webhook will be available at:
```
https://your-domain.com/api/defender/webhook
```

Test with:
```bash
curl https://your-domain.com/api/defender/webhook
```

Expected response:
```json
{
  "status": "ok",
  "service": "DRCP Defender Webhook",
  "sentinels": 9
}
```

## Sentinel Summary

| Sentinel | Severity | Description |
|----------|----------|-------------|
| Contract Paused | HIGH | Vault paused by admin |
| Emergency Declared | CRITICAL | Emergency + funds released |
| Large Deposit | MEDIUM | Single deposit > $500 |
| Large Withdrawal | MEDIUM | Single withdrawal > $500 |
| Role Changed | HIGH | AccessControl role changes |
| Proposal Created | LOW | New governance proposal |
| Proposal Executed | MEDIUM | Proposal passed |
| Task Paid | LOW | Volunteer task completed |
| Campaign Created | LOW | New relief campaign |

## Testing Sentinels

After setup, trigger a test event:

1. Make a deposit > $500 on testnet
2. Check Defender dashboard for alert
3. Verify webhook receives notification
4. Check Telegram (if configured)

## Troubleshooting

**Webhook not receiving alerts:**
- Verify URL is publicly accessible
- Check Defender notification channel config
- Review server logs for errors

**Telegram not working:**
- Verify bot token is correct
- Ensure bot has been started (`/start` command)
- Check chat ID is correct (use @userinfobot)
