# Ideal Pipeline — End-to-End Agent Flow

> Enhanced Model v2.1 · October 2026

---

## Vision

One agent closes the loop:

**Registration → Company verification → Payment → Launch → Results** — zero human steps on happy path.

---

## State machine

```
submit_landing_url
        │
        ▼
   KYC_PENDING ── DaData/Middesk/EDR + gov-ID + mandate
        │
        ▼
   KYC_APPROVED
        │
   ┌────┴────┐
   ▼         ▼
ORG_CREATING  PAYMENT_PENDING  (parallel OK)
   │         │
   └────┬────┘
        ▼
   ORD_SETUP / DSA registry
        │
        ▼
   PRE_MODERATION ── policy RAG score ≥ 0.92
        │
        ▼
   LAUNCHING ── API create + moderation poll (15 min)
        │
        ▼
   LIVE ── optimizer cron + MCP stats
        │
   ┌────┼────┐
   ▼    ▼    ▼
PAUSED  MANUAL_REVIEW  CHURNED
```

---

## Stage details

### 1. Registration & KYC (A = 25)

| Step | Tool | Backend |
|------|------|---------|
| Landing crawl | `submit_landing_url` | Playwright/crawl4ai |
| Tax ID | `submit_tax_id` | DaData (RU) · Middesk (US) · EDR (UA) · VIES (EU) |
| Gov-ID rep | `gov_id_verify` | ESIA · Diia · eIDAS · BankID |
| Mandate | `sign_mandate` | Diadoc · DocuSign · qualified e-sign |
| Confirm | `confirm_advertiser` | Client confirms entity card |

**Rule:** 1 tax ID = 1 platform org (no shared logins).

### 2. Company / org creation (A)

| Region | Method |
|--------|--------|
| RU | Yandex `AgencyClients.addPassportOrganization` or Click.ru/eLama |
| US | Google MCC `createCustomer` · Koast/Whop for Meta |
| EU | Same + DSA registry adapter per country |
| UA | Google/Meta org on agency MCC |

### 3. Payment (C = 20)

```
Client pays (crypto USDC/TON or fiat Stripe/YooKassa)
        → Agency float (+30% cushion)
        → MCP transfer_to_org
        → Platform org balance
        → Auto invoice + e-sign closing docs
```

### 4. Compliance

| Region | System |
|--------|--------|
| RU | ERIR / ORD auto from DaData + contract template |
| EU | DSA advertiser registry (DE, FR, IE, ES) |
| US | Political ads certification if applicable |

### 5. Pre-moderation (B)

```
landing + ad copy
    → Policy RAG (platform rules + Rivox 102)
    → score ≥ 0.92 → submit
    → 0.80–0.92 → auto-fix loop (max 3)
    → < 0.80 or high-risk NAICS → human queue
```

**Target:** 95–98% first-pass platform acceptance.

### 6. Launch (B = 35)

| Step | Action |
|------|--------|
| Semantic | Wordstat / Google Keyword Planner API |
| Creative | LLM ad groups + text ads |
| Tracking | Metrika / GA4 counter + goals auto-check |
| Submit | Direct API v5 · Meta Marketing API · etc. |
| Poll | Moderation status every 15 min until ACCEPTED |
| Resume | `Campaigns.resume` → LIVE |

### 7. Results (D = 20)

| Source | Integration |
|--------|-------------|
| Platform | Metrika · GA4 · Meta Insights API |
| CRM | amoCRM · Bitrix24 · HubSpot webhooks |
| Offline | Calltouch · Roistat · GA4 offline import |
| Agent | Weekly optimizer + MCP `get_campaign_stats` |

---

## MCP tool contract (client-facing)

### Onboarding
- `submit_landing_url` · `submit_tax_id` · `get_tax_id_suggestions`
- `confirm_advertiser` · `gov_id_verify` · `sign_mandate`
- `get_onboarding_status`

### Billing
- `set_monthly_budget` · `create_payment` · `get_balance`
- `pause_all_campaigns` (confirm=true)

### Campaign
- `launch_campaign` · `get_campaign_stats` · `get_audit_report`

Write tools require `confirm=true` for financial and launch operations.

---

## Human queue (by design)

| Queue | % clients | SLA |
|-------|-----------|-----|
| Fully auto | 90–95% | 0h |
| Post-pre-mod reject | 2–5% | 4h |
| Platform verify pending | 3–10% | 24h |
| Industry license | 3–8% | 24h |

Human queue = **verification service**, not automation failure.

---

## Regional pipeline variants

| Region | Σ | Pipeline delta |
|--------|---|----------------|
| Russia | 99 | + ERIR · ESIA · Yandex pre-mod corpus |
| USA | 97 | + Meta verify wait · Middesk |
| Ukraine | 91 | + Diia · EDR · no Yandex |
| China | 81 | + WFOE partner · 营业执照 gate before step 2 |

See [REGIONAL-SCORES.md](./REGIONAL-SCORES.md).
