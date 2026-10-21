# Architecture — Agency Proxy MCP

> October 2026 · Target Σ: 93–99/100

---

## Overview

```
Client (ChatGPT / Cursor / Widget / Telegram)
        │
        ▼  MCP: submit_tax_id, pay, launch, status
┌────────────────── Agency Proxy MCP ──────────────────┐
│  KYC Engine → Org Factory → ORD/DSA → Billing        │
│  → Pre-mod Engine → Campaign Agent → Optimizer       │
└────────────────────────┬─────────────────────────────┘
                         ▼
              Per-client platform org (client tax ID)
              Agency MCC / Click.ru / eLama backend
```

Client connects **your** MCP (`mcp.yourcompany.ru`), never platform OAuth.

---

## Component map

```
┌─────────────────────────────────────────────────────────┐
│                 CLIENT-FACING LAYER                      │
│  MCP Server (Streamable HTTP) │ Widget │ Telegram bot   │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              ORCHESTRATOR (state machine)                │
│  PostgreSQL: clients, orgs, campaigns, audit_log         │
└─┬─────────┬──────────┬──────────┬──────────┬────────────┘
  │         │          │          │          │
  ▼         ▼          ▼          ▼          ▼
 KYC     Org        ORD/DSA    Billing    Campaign Agent
Engine   Factory    Service               (yandex-mcp fork
         Yandex               YooKassa     + Rivox rules)
         Agency               Stripe
         API                  USDC
```

---

## KYC pipeline (RU example)

```
INN 10 digits → LEGAL · INN 12 → INDIVIDUAL (IP)
        │
        ▼
DaData findById/party
        │
        ▼
Rules engine:
  ACTIVE? · not bankrupt? · OKVED not on denylist?
  duplicate INN in DB?
        │
        ▼
ESIA OAuth → rep matches EGRUL director/signatory
        │
        ▼
Diadoc mandate signed
        │
        ▼
KYC_APPROVED
```

---

## Org factory

**Primary:** Yandex `AgencyClients.addPassportOrganization` (requires agency API approval)

**MVP fallback:** Click.ru / eLama automation

**Constraint:** 1 INN = 1 Yandex org — platform forbids shared advertiser login.

---

## Billing

| Event | Auto action |
|-------|-------------|
| Payment received | Credit client wallet + top-up Direct org |
| Balance < 10% budget | Alert + optional auto-invoice |
| Budget cap hit | Pause campaigns via API |
| Dispute | AI triage + freeze org |

Float holds **+30% cushion** above client ordered budget.

---

## Campaign agent

Fork: **SvechaPVL/yandex-mcp** (132 tools) + **Rivox** audit (102 rules) + orchestrator.

```
URL → crawl → Wordstat → LLM ads → Metrika check
    → Direct API Campaigns.add → moderation poll → resume LIVE
    → weekly optimizer cron
```

---

## Pre-moderation engine

| Input | Corpus |
|-------|--------|
| Landing HTML | Platform policy PDFs/HTML |
| Ad copy | Rivox 102 rules |
| Category | OKVED/NAICS denylist |

Output: `policy_violations[]`, `fix_suggestions[]`, `score 0–1`

---

## MCP client config

```json
{
  "mcpServers": {
    "your-agency": {
      "url": "https://mcp.yourcompany.ru/v1",
      "headers": {
        "Authorization": "Bearer ${CLIENT_API_KEY}"
      }
    }
  }
}
```

**Never expose to client:** platform OAuth, agency token, DaData key.

---

## MVP roadmap

| Phase | Deliverable | Σ after |
|-------|-------------|---------|
| M1 | MCP: tax_id, confirm, pay, status + DaData | A=20 |
| M2 | Click.ru/eLama org automation | A=22 |
| M3 | ORD + billing webhook | C=16 |
| M4 | URL → live Direct | B=30, **Σ≈85** |
| M5 | Yandex addPassportOrganization | A=23 |
| M6 | Optimizer + stats + VK channel | B=33, **Σ≈93** |
| M7 | ESIA + pre-mod + float v2.1 | **Σ≈99** |

---

## Risks

| Risk | Mitigation |
|------|------------|
| Yandex bulk org API denied | Click.ru/eLama parallel + apply for API |
| Moderation reject | Pre-mod + niche classifier |
| Wrong tax ID / fraud | ESIA/Diia + mandate liability |
| ORD/ERIR fines | Nightly reconciliation job |
| Agency MCC ban | Multi-MCC + human-like API pacing |
