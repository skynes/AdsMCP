# Current State — Best Approaches & Closest Services

> October 2026 landscape survey

---

## The gap

| Approach | Max Σ | Why capped |
|----------|-------|------------|
| **Platform MCP** (existing account) | **60** | A=0, C=5 — no registration, no payment |
| **Full-cycle agency** (KDirect) | **77** | No MCP, partial auto pay |
| **AI autopilot** (Rivox, Pixero) | **62–68** | Needs **client** OAuth account |
| **Agency Proxy MCP** (designed) | **99** RU | Not built yet |

**No product today reaches 100/100.**

---

## Best current approach: Agency Proxy MCP

### Why not Platform MCP alone?

Synter (27 platforms, Σ=60) is the best aggregator — but:
- Client must already have ad accounts (−25 A)
- Payment is manual UI billing (−15 C)
- No onboarding, no compliance chain

### Why Agency Proxy wins

| Capability | Platform MCP | Agency Proxy |
|------------|--------------|--------------|
| Create org on client tax ID | ❌ | ✅ |
| Client never sees platform | ❌ | ✅ |
| Prepaid float billing | ❌ | ✅ |
| Gov-ID + mandate | ❌ | ✅ |
| Pre-mod before submit | partial | ✅ |
| ORD/ERIR/DSA | ❌ | ✅ |

---

## Closest live services

### Full-cycle managed (Model A — no client cabinet)

| Service | Region | Σ | Platforms | MCP |
|---------|--------|---|-----------|-----|
| **[KDirect](https://kdirect.ru/)** | RU | **77** | Yandex Direct | ❌ |
| **[Koast](https://docs.koast.ai/)** | Global | **71** | Meta via Whop | ❌ |

KDirect: client gives URL → agency launches on **agency Yandex account**, invoice + 4% fee. **Best live proof** of managed-account model.

Koast: "I DON'T HAVE A PROFILE" → creates Meta ad account via Whop partner.

### Autopilot on client account (Model B)

| Service | Σ | Drop URL → Live | Needs client OAuth |
|---------|---|-----------------|-------------------|
| [Rivox](https://rivox.io/) | 68 | ✅ | ✅ |
| [Pixero](https://pixero.ai/) | 62 | ✅ ~9 min Meta | ✅ |
| [AdBot](https://adbot.ai/) | 58 | ✅ 24–48h | ✅ |
| [Hawky](https://hawky.ai/) | 60 | ⚠️ KPI setup | ✅ |

### Best MCP tools (Model C — your account)

| Service | Σ | Platforms | Write |
|---------|---|-----------|-------|
| [Synter](https://syntermedia.ai) | 60 | 27 incl. DV360 | ✅ |
| [Amazon Ads MCP](https://advertising-ai.amazon.com/mcp) | 59 | Amazon | ✅ + create account |
| [getmcpads.com](https://getmcpads.com) | 58 | 14 | ✅ |
| [PaidSync](https://paidsync.ai) | 57 | 14 + OpenAI Ads | ✅ |
| [SvechaPVL/yandex-mcp](https://github.com/SvechaPVL/yandex-mcp) | 57 | Yandex Direct | ✅ 132 tools |

### Agency infrastructure (Model D)

| Service | Region | Role |
|---------|--------|------|
| [Click.ru](https://click.ru/) | RU/CIS | Org create, VK+TG+Direct MCP |
| [eLama](https://elama.ru/) | RU/CIS | 30+ systems, unified billing |
| [LidFly](https://lidfly.ru/) | RU | Hosted MCP aggregator |

---

## Best stack to build Agency Proxy (October 2026)

| Layer | Pick | Why |
|-------|------|-----|
| MCP server | Custom Streamable HTTP | Client contract you own |
| Orchestrator | PostgreSQL state machine | Audit trail for ORD |
| KYC RU | DaData + ESIA | INN + authorized rep |
| KYC UA | EDR + Diia.Signature | EDRPOU + mandate |
| KYC US/EU | Middesk + Sumsub + eIDAS | EIN/VAT + KYB |
| Org RU | Click.ru → Yandex bulk API | MVP → scale |
| Org US | Google MCC + Koast pattern | Proven Meta path |
| Campaign | Fork yandex-mcp + Rivox rules | Deepest RU OSS |
| Pre-mod | Custom RAG + platform policy corpus | 95–98% accept |
| Billing | YooKassa + Stripe + USDC treasury | Prepaid float |
| Docs | Diadoc / Kontur / DocuSign | Auto closing |
| Metrics | Metrika MCP + amoCRM webhook | D=19→20 |

---

## Current problems (October 2026)

### Structural (industry-wide)

1. **Registration is not in any MCP** — except Amazon create-account (partners only)
2. **Payment is UI-only** for 95%+ of MCP tools (C=5)
3. **Two different "AdsMCP" products** — [Adgentek](https://adsmcp.ai/) = in-app monetization, not media buying
4. **No global "KDirect for Meta+Google"** with MCP interface

### Technical

5. Telegram Ads = Playwright not API (−5 B)
6. VK = community MCP only, no official
7. China = 营业执照 gate despite 358-tool Tencent MCP
8. Meta Business Verification = platform gate (−1 A US)

### Legal/compliance

9. RU ERIR/ORD chain — auto possible, edge cases remain
10. EU DSA registry — per-country adapters needed
11. Industry licenses (med, finance) — document upload, not LLM

---

## Score evolution

| Model | RU Σ | Global avg |
|-------|------|------------|
| Platform MCP only | 57 | 45 |
| KDirect-like agency | 77 | 55 |
| Agency Proxy v1 | 93 | 75 |
| Agency Proxy v2 (float) | 97 | 82 |
| Agency Proxy v2.1 (pre-mod + gov-ID) | **99** | **~89** |
| Strict 100 | 100* | — |

*Requires Calltouch offline D + standard B2B scope only.

---

## Recommendation

**Build order:**
1. **P0 Russia** — ESIA + Yandex + float (Σ=99)
2. **P1 USA** — Koast-pattern Meta + Google MCC (Σ=97)
3. **P1 Ukraine** — Diia + EDR, reuse US campaign agent (Σ=91)
4. **P2 EU** — eIDAS + DSA adapters (Σ=94)
5. **P5 China** — local WFOE partner only (Σ=81)

See [REGIONAL-SCORES.md](./REGIONAL-SCORES.md) · [BLOCKERS.md](./BLOCKERS.md).
