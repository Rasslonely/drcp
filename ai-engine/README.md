# AI Engine

> ⚠️ **FUTURE IMPLEMENTATION - NOT CURRENTLY ACTIVE**
> 
> This AI Engine is designed for Phase 2+ of DRCP. The current MVP uses **DAO-only governance** for fund release decisions.
> 
> When implemented, this engine will provide automated disaster prediction and Oracle integration.

---

## Current Status: PLANNED (Not Deployed)

The disaster relief protocol currently operates in **DAO-Only Mode**:
- All fund release decisions are made via DAO governance voting
- No automated Oracle triggers
- Zero infrastructure cost

## Future Vision

When activated, this AI Engine will:
1. Fetch real-time data from BMKG, USGS, GDACS
2. Calculate risk scores using rule-based/ML models
3. Push scores to Chainlink Functions Oracle
4. Enable auto-release for severity ≥80 (CRITICAL)

## Directory Structure

```
ai-engine/
├── app/
│   ├── main.py           # FastAPI entry point
│   ├── routers/          # API endpoints
│   ├── models/           # Prediction models
│   └── services/         # External API integrations
├── chainlink/
│   └── functions-source.js  # Chainlink Functions script
└── requirements.txt
```

## Setup (For Future Use)

```bash
cd ai-engine
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Integration Path

When ready to activate:
1. Deploy AI Engine to Railway/Render
2. Set `NEXT_PUBLIC_AI_ENGINE_URL` in web-app
3. Deploy Chainlink Functions consumer contract
4. Grant `ORACLE_ROLE` to Chainlink DON address
