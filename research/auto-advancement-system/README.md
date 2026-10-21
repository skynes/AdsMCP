# AdsMCP 100% Auto Advancement System

> **Research & architecture** for fully autonomous advertising operations via AI agents and MCP  
> October 2026 · [Documentation](./docs/) · [Research archive](./research/)

---

## Concept

**AdsMCP 100% Auto Advancement System** is a blueprint for closing the **entire advertising lifecycle** with a single AI agent — from first contact to live campaigns and performance reporting — **without human intervention** on the happy path.

```
Registration → Company verification → Payment → Campaign launch → Results monitoring
        ↑______________________________________________|
                    closed loop · agent-driven
```

The client never touches ad platform UIs (Yandex Direct, Meta Ads Manager, Google Ads). They interact through **ChatGPT, Cursor, a web widget, or Telegram** via **Agency Proxy MCP**.

### Two layers (do not confuse)

| Layer | What it is | Example |
|-------|------------|---------|
| **Platform MCP** | Tools for **your existing** ad account | `google-ads-mcp`, `yandex-mcp` |
| **Agency Proxy MCP** | **Your product** — onboarding + billing + launch on **agency accounts** | **You build this** |

Platform MCP maxes at **~60/100** (existing account required). Agency Proxy targets **93–99/100**.

---

## Scoring methodology (A + B + C + D = 100)

| Criterion | Max | What we measure |
|-----------|-----|-----------------|
| **A. Account registration** | 25 | Ad account / org created without manual KYC |
| **B. Campaign launch** | 35 | Create, moderate, go live via API |
| **C. Payment** | 20 | Agent or automated payment rail; no chargebacks |
| **D. Metrics & analytics** | 20 | Stats, ROAS, alerts, CRM sync |

**Enhanced Model v2.1** assumptions: company fiat float · prepaid + 30% cushion · auto AML/KYC · auto invoicing · **pre-moderation** · **gov-ID + signed mandate**.

---

## Regional scores (v2.1)

| Region | Σ | Tier | Primary stack |
|--------|---|------|---------------|
| Russia | **99** | S | Yandex Direct, VK, Telegram |
| USA | **97** | S | Meta MCC, Google MCC |
| Europe | **94** | A | Meta, Google, Taboola |
| Canada | **94** | A | Meta, Google (bilingual) |
| Ukraine | **91** | A | Google, Meta, Diia + EDR |
| Brazil | **88** | B | Meta, Google, CNPJ |
| LatAm (ex-BR) | **86** | B | Meta, WhatsApp Ads |
| Asia (ex-CN) | **85** | B | Naver, Kakao, Shopee |
| China | **81** | C | Tencent, Ocean Engine |
| Africa | **77** | C | Meta mobile-first |

Details: [docs/REGIONAL-SCORES.md](./docs/REGIONAL-SCORES.md)

---

## Ideal pipeline

```
Client (MCP / chat / widget)
        │
        ▼
┌── Agency Proxy MCP ──────────────────────────────────────┐
│ 1. submit_landing_url → crawl + business understanding    │
│ 2. submit_tax_id → KYC (DaData / Middesk / EDR / eIDAS) │
│ 3. gov_id_verify → ESIA / Diia / eIDAS + signed mandate   │
│ 4. create_payment → crypto or fiat → agency float (+30%)  │
│ 5. transfer_to_org → platform ad account top-up           │
│ 6. ord_compliance → labeling (RU ERIR / EU DSA)           │
│ 7. pre_moderation → policy RAG → score ≥ 0.92             │
│ 8. launch_campaign → API create + moderation poll         │
│ 9. get_campaign_stats → Metrika / GA4 + CRM webhooks      │
└──────────────────────────────────────────────────────────┘
        │
        ▼
Per-client org on agency MCC (client tax ID, client never sees platform)
```

Full spec: [docs/IDEAL-PIPELINE.md](./docs/IDEAL-PIPELINE.md) · [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## Best current approach (October 2026)

**Agency Proxy MCP** on owned agency accounts — not “connect your Google OAuth.”

| Component | Best available | Role |
|-----------|----------------|------|
| RU full-cycle reference | [KDirect](https://kdirect.ru/) (Σ≈77) | Proves managed-account model |
| RU MCP launch depth | [SvechaPVL/yandex-mcp](https://github.com/SvechaPVL/yandex-mcp) (132 tools) | Campaign agent fork |
| Global multi-platform MCP | [Synter](https://syntermedia.ai) (Σ=60) | 27 platforms, needs your account |
| Meta without client BM | [Koast](https://docs.koast.ai/) + Whop (Σ≈71) | Creates ad account for client |
| US URL→live agent | [Pixero](https://pixero.ai/) (Σ≈60) | Meta, closed SaaS |
| RU agency infra | Click.ru / eLama | Org creation without Yandex bulk API |
| KYC RU | DaData + ESIA | INN/OGRN + authorized rep |
| KYC UA | EDR + Diia.Signature | EDRPOU + mandate |
| KYC Global | Sumsub / Onfido / Middesk | AML + KYB |
| Pre-mod | Custom policy RAG + Rivox 102 rules | 95–98% clean submit |
| Billing | YooKassa / Stripe / USDC float | Prepaid, no chargeback |

Details: [docs/CURRENT-STATE.md](./docs/CURRENT-STATE.md)

---

## Closest services to the ideal

| Service | Model | Σ | Gap vs ideal |
|---------|-------|---|--------------|
| **Agency Proxy (designed)** | Managed account + MCP | **99** RU | Not built yet |
| **KDirect** | RU managed Direct | 77 | No MCP, manual KYC |
| **Koast** | Meta via Whop | 71 | Meta only, verify gate |
| **Rivox** | Autopilot on client OAuth | 68 | Needs client cabinet |
| **Pixero** | URL→Meta ~9 min | 62 | Client Meta account |
| **Synter** | 27-platform MCP | 60 | A=0, C=5 |
| **AdBot** | Google+Meta flat fee | 58 | Client accounts |

No existing product reaches **100/100**. Closest **live** full-cycle: **KDirect (RU)**. Closest **global MCP**: **Synter**.

---

## Remaining blockers (summary)

### Common (all regions)
1. **Platform business verification** (Meta video, TikTok BC) — platform gate  
2. **Industry license** (medical, finance, gambling) — document, not text  
3. **Offline attribution** (calls, CRM) — optional integration  
4. **API gaps** — not all ad formats via API  
5. **Post-pre-mod reject** — ~2–5% human queue  

Full catalog: [docs/BLOCKERS.md](./docs/BLOCKERS.md)

---

## Research archive

110+ services surveyed across CIS, Asia, US/EU, display, supply, agencies.

| Document | Content |
|----------|---------|
| [research/MASTER-MATRIX-SUMMARY.md](./research/MASTER-MATRIX-SUMMARY.md) | Top scores, methodology |
| [research/regions/CIS-PLATFORMS.md](./research/regions/CIS-PLATFORMS.md) | LidFly, Yandex, VK, Telegram |
| [research/regions/ASIA-PLATFORMS.md](./research/regions/ASIA-PLATFORMS.md) | Tencent, Naver, Kakao, Shopee |
| [research/agencies/FULL-CYCLE-AGENCIES.md](./research/agencies/FULL-CYCLE-AGENCIES.md) | KDirect, Koast, Rivox, Pixero |
| [research/catalogs/AGGREGATORS.md](./research/catalogs/AGGREGATORS.md) | Synter, getmcpads, PaidSync… |
| [research/catalogs/OSS-GITHUB.md](./research/catalogs/OSS-GITHUB.md) | ~80 GitHub MCP repos |
| [docs/RESEARCH-INDEX.md](./docs/RESEARCH-INDEX.md) | Complete index |

| [docs/LINKS.md](./docs/LINKS.md) | Verified links registry (Oct 2026) |
| [docs/LINKS.md](./docs/LINKS.md) | **Verified links registry** (Oct 2026) |

Source materials (Russian originals) remain in parent repo [`../`](../).

---

## Documentation map

```
ads-mcp-100-auto-advancement-system/
├── README.md          ← you are here (EN)
├── README.ru.md       ← Русский
├── README.es.md       ← Español
├── README.zh-CN.md    ← 中文
└── docs/
    ├── IDEAL-PIPELINE.md
    ├── ARCHITECTURE.md
    ├── BLOCKERS.md
    ├── REGIONAL-SCORES.md
    ├── CURRENT-STATE.md
    └── RESEARCH-INDEX.md
```

---

## Key conclusions

1. **Platform MCP alone cannot exceed ~60/100** — registration and payment are systemic gaps.  
2. **Agency Proxy MCP** is the viable path to **93–99/100**.  
3. **Russia (99)** and **USA (97)** are first rollout targets.  
4. **China (81)** needs local WFOE partner despite best API depth.  
5. **90–95% of clients** can run fully auto on happy path; human queue is product feature, not failure.  
6. **Strict 100/100** requires scope limit: standard B2B, denylist high-risk OKVED/NAICS, single channel.

---

## License

MIT — research and architecture documentation. Platform APIs and trademarks belong to their respective owners.

---

*AdsMCP 100% Auto Advancement System · Research branch `cursor/ads-mcp-research-f337` · October 2026*
