# Ads MCP Research Matrix — Platforms × Criteria × Scores

> **Date:** October 2026  
> **Methodology:** [README.md](../../README.md) · Full scores: [MASTER-MATRIX-SUMMARY.md](../MASTER-MATRIX-SUMMARY.md)  
> **Source:** [research-matrix.md](../../../research-matrix.md)

---

## Platform Summary Table

| Platform | Best MCP solution | A | B | C | D | **Σ** | Status |
|----------|-------------------|---|---|---|---|-------|--------|
| **Google Ads** | getmcpads / akelaonline / mharnett | 0 | 28 | 5 | 18 | **56** | Official RO=35; write via community/hosted |
| **Meta (FB/IG)** | AdManage / official / byadsco | 0 | 28 | 5 | 15 | **52** | Official beta rollout −3 |
| **Telegram Ads** | Free-cat/telegram_ads_mcp | 5 | 22 | 12 | 13 | **52** | TON C=12; Playwright −5 |
| **Yandex Direct** | SvechaPVL/yandex-mcp, gmen1057 | 0 | 30 | 5 | 17 | **57** | Community; API v5 |
| **TikTok Ads** | Official Agentic Hub + getmcpads | 0 | 30 | 5 | 15 | **55** | Official R/W |
| **Reddit Ads** | AdManage / desunit / getmcpads | 0 | 22 | 5 | 16 | **48** | No official MCP |
| **Microsoft (Bing)** | Windsor / TrueClicks / pilot | 0 | 0–18 | 5 | 15 | **25** | Official RO pilot |
| **Amazon Ads** | Official beta | 10† | 28 | 5 | 16 | **59**† | Official R/W; partners only |
| **LinkedIn Ads** | Synter / Metadata / getmcpads | 0 | 25 | 5 | 16 | **52** | No official MCP |
| **VK Ads** | lexamarketolog / LidFly | 0 | 24–28 | 5 | 14–16 | **48–49** | Community OSS + hosted |
| **Apple Search Ads** | adport | 0 | 24 | 5 | 14 | **48** | OSS, preview+approve |
| **Pinterest Ads** | getmcpads / official alpha | 0 | 15 | 5 | 14 | **34** | Alpha partners |
| **Snapchat Ads** | getmcpads | 0 | 18 | 5 | 14 | **37** | Announced, not GA |
| **X (Twitter) Ads** | getmcpads | 0 | 20 | 5 | 14 | **39** | No official Ads MCP |

† Amazon: "create account" tool in workflow, partners with API credentials only

---

## Solution × Platform Matrix

| Solution | Type | Google | Meta | Telegram | Yandex | TikTok | Reddit | OSS | **Σ** |
|---------|------|:---:|:---:|:---:|:---:|:---:|:---:|-----|:---:|
| **googleads/google-ads-mcp** | Official OSS | RO ✅ | — | — | — | — | — | Yes | 35 |
| **mharnett/mcp-google-ads** | Community | W ⚠️ | — | — | — | — | — | Yes | 48 |
| **akelaonline/MCP-Google-Ads** | Community | W ⚠️ | — | — | — | — | — | Yes | 50 |
| **mcp.facebook.com/ads** | Official hosted | — | W ⚠️ | — | — | — | — | No | 55 |
| **byadsco/meta-ads-mcp** | Community OSS | — | W ⚠️ | — | — | — | — | Yes | 52 |
| **pipeboard-co/meta-ads-mcp** | Hosted | ✅ | ✅ | — | — | ✅ | ✅ | Partial | 55 |
| **Free-cat/telegram_ads_mcp** | Playwright | — | — | W 🔧 | — | — | — | Yes | 52 |
| **SvechaPVL/yandex-mcp** | Community | — | — | — | W ⚠️ | — | — | Yes | 57 |
| **gmen1057/yandex-direct-mcp** | Community | — | — | — | W ⚠️ | — | — | Yes | 55 |
| **TikTok Agentic Hub** | Official hosted | — | — | — | — | W ⚠️ | — | No | 55 |
| **desunit/reddit-ads-mcp** | Community | — | — | — | — | — | W ⚠️ | Yes | 48 |
| **Amazon Ads MCP** | Official beta | — | — | — | — | — | — | No | 59† |
| **getmcpads.com** | Hosted aggregator | RO/W | RO/W | — | — | RO/W | RO/W | Partial | **58** |
| **Synter** | Hosted aggregator | RO/W | RO/W | — | — | RO/W | RO/W | Yes | **60** |
| **PaidSync** | Hosted aggregator | RO/W | RO/W | — | — | RO/W | RO/W | Partial | **57** |
| **Markifact / Blend / AdManage** | Hosted aggregator | RO/W | RO/W | — | — | RO/W | RO/W | Partial/No | **57** |
| **AdKit** | Hosted aggregator | W draft | W draft | — | — | W draft | W draft | Partial | **54** |

**Legend:** ✅ Full via MCP/API · ⚠️ Partial / human confirm / beta · ❌ Unavailable · 🔧 Playwright/browser (no API)

---

## Scoring by Criterion

### A. Account registration (0–25)

| Platform | Reality | MCP coverage | Score |
|----------|---------|--------------|-------|
| Google Ads | Google account, billing, often MCC; dev token separate | ❌ No MCP registers | **0** |
| Meta | Business Manager, payment method, business verification | ❌ OAuth to existing | **0** |
| Telegram Ads | Telegram login + phone; EUR cabinet via partners | 🔧 Playwright can login, not KYC | **5** |
| Yandex Direct | Yandex ID + contract + top-up | ❌ | **0** |
| Amazon Ads | Partner API credentials; create-account tool | ⚠️ Partners only | **10** |

**Conclusion:** Registration is a systemic blocker. Even Amazon's create-account tool requires partner status.

---

### B. Campaign launch (0–35)

| Solution | Create | Edit | Pause/Enable | Launch pack | Score |
|---------|:---:|:---:|:---:|:---:|:---:|
| Google official | ❌ | ❌ | ❌ | — | **0** |
| mharnett/mcp-google-ads | ✅ PAUSED | ✅ | ✅ | ⚠️ Demand Gen E2E | **28** |
| Meta official | ✅ | ✅ | ✅ | ✅ | **32** |
| Yandex gmen1057 | ✅ direct_launch_pack | ✅ | ✅ | ✅ | **30** |
| Telegram Free-cat | ✅ create_ad | ✅ update | ✅ status | ⚠️ | **25** |
| TikTok official | ✅ | ✅ | ✅ | ⚠️ | **30** |
| getmcpads (Google) | ✅ preview+confirm | ✅ | ✅ | ⚠️ | **28** |

---

### C. Payment (0–20)

| Platform | Payment method | MCP can pay? | Score |
|----------|---------------|--------------|-------|
| Google Ads | Card, invoicing, MCC billing | ❌ UI only | **5** |
| Meta | Card, PayPal, invoicing | ❌ | **5** |
| **Telegram Ads** | **TON (crypto)** | ⚠️ increase_budget via UI | **12** |
| Yandex Direct | Card, invoice, agencies | ❌ | **5** |
| TikTok | Card, invoicing | ❌ | **5** |

**Best crypto candidate:** Telegram Ads (TON). Wallet top-up and EUR cabinet KYC remain outside MCP.

---

### D. Metrics & analytics (0–20)

| Solution | Reporting | Breakdowns | Export | Alerts | Score |
|---------|:---:|:---:|:---:|:---:|:---:|
| Google official | ✅ GAQL search | ✅ | ⚠️ | ❌ | **18** |
| Meta official | ✅ insights | ✅ | ⚠️ | ❌ | **18** |
| Yandex SvechaPVL | ✅ + Wordstat + Metrika | ✅ | ✅ | ❌ | **19** |
| getmcpads | ✅ 1555 metrics | ✅ cross-platform | ✅ | ✅ Pro | **18** |
| PaidSync | ✅ 460+ tools | ✅ tracking stack | ✅ | ✅ | **20** |

---

## Aggregator Comparison

| Aggregator | A | B | C | D | **Σ** | Platforms | Write | OSS |
|-----------|---|---|---|---|-------|-----------|-------|-----|
| **Synter** | 0 | 32 | 5 | 18 | **60** | 27 | ✅ gated | Yes |
| **getmcpads.com** | 0 | 30 | 5 | 18 | **58** | 14 | ✅ preview | Partial |
| **PaidSync** | 0 | 32 | 5 | 20 | **57** | 14 | ✅ gated | Partial |
| **Markifact / Blend / AdManage** | 0 | 29–32 | 5 | 15–18 | **57** | 8–20+ | ✅ | Partial/No |
| **Adspirer** | 0 | 30 | 5 | 16 | **56** | 6+ | ✅ | Partial |
| **InsightfulPipe** | 0 | 27 | 5 | 18 | **55** | 46 | ✅ RO/RW | No |
| **Pipeboard** | 0 | 28 | 5 | 17 | **55** | 5 | ✅ | Partial |
| **MCP Ads** | 0 | 31 | 5 | 18 | **54** | 10+ | ✅ paused | Yes |
| **AdKit** | 0 | 27 | 5 | 17 | **54** | 7+ | ✅ draft | Partial |
| **Windsor.ai** | 0 | 26 | 5 | 17 | **53** | 350+† | ✅ select | No |

**Pros:** One OAuth, unified confirm/preview, cross-platform reports.  
**Cons:** Still need ready accounts; write often paywalled; vendor lock-in.

---

## Proximity to 100/100

```
100 ┤                                    [ideal — does not exist]
 75 ┤                                    [theoretical ceiling]
 60 ┤ Synter ●  Pixero (agent)
 59 ┤ Amazon Official ●
 58 ┤ getmcpads ●  Markifact ●  Blend ●  AdManage ●
 57 ┤ Yandex ●  Taboola ●  PropellerAds ●  PaidSync ●
 55 ┤ TikTok ●  Pipeboard ●  InsightfulPipe ●
 52 ┤ Meta official ●  AdLoop ●  Telegram ●
 48 ┤ Reddit ●  VK ●  adport ●
 35 ┤ Google Official RO ●
 25 ┤ Microsoft pilot ●
```

### Top 5 for "almost full cycle" (with ready account)

1. **Synter** — 60/100 — 27 platforms incl. DV360, Taboola, StackAdapt
2. **Amazon Ads MCP** — 59/100 — create account tool (A=10), partners only
3. **getmcpads.com** — 58/100 — 14 platforms, preview writes, 1555 metrics
4. **Markifact / Blend / AdManage / PaidSync** — 57/100 — write + safety / bulk / tracking
5. **Yandex SvechaPVL** — 57/100 — 132 tools incl. Wordstat/Metrika

---

## Development Gaps (MVP priorities)

| Gap | Difficulty | ROI |
|-----|-----------|-----|
| **Onboarding wizard** (OAuth + billing checklist + account health) | Medium | High |
| **Unified campaign schema** → platform adapters | High | High |
| **Preview → confirm → audit log** | Low | Critical for trust |
| **Telegram Ads API layer** or stable Playwright | Medium | Unique (TON) |
| **Payment orchestration** (TON wallet, Stripe delegated) | Very high | Game changer |
| **Account registration automation** | Legally impractical | KYC blocker |

### Recommended MVP architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ AI Agent    │────▶│ Ads MCP Hub  │────▶│ Platform        │
│ (Cursor)    │     │ (your code)  │     │ Adapters        │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │                ├─ Yandex (API v5)
                           │                ├─ Telegram (Playwright)
                           ▼                ├─ Google (wrap mharnett)
                    ┌──────────────┐         ├─ Meta (proxy official)
                    │ Safety Layer │         └─ TikTok (Agentic Hub)
                    │ dry-run      │
                    │ confirm      │
                    │ audit SQLite │
                    └──────────────┘
```

**Priority platforms for RU/CIS audience:**
1. Yandex Direct — no official MCP, mature community, API v5 documented
2. Telegram Ads — TON, no official MCP competition
3. VK Ads — community MCP mature (lexamarketolog 55 tools, LidFly 76)
4. Google/Meta — via official/community, don't reinvent

---

## Not Media-Buying MCP

| Product | What it does | Confusion |
|---------|-------------|-----------|
| **Adgentek AdsMCP** (adsmcp.ai) | Shows ads *in AI chats* (ads.serve) | Name "AdsMCP" but publisher ad server |
| **Google Analytics MCP** | Read-only site analytics | Adjacent, not campaigns |
| **OpenAI Ads Manager** | Beta ads in ChatGPT | No official MCP server |

*Source: [adsMCP/research-matrix.md](../../../research-matrix.md)*
