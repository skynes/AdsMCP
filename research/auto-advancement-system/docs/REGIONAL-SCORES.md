# Regional Scores — Enhanced Model v2.1

> Agency Proxy MCP · October 2026  
> Σ = A + B + C + D (max 100)

---

## 10 regions

| # | Region | **Σ** | A | B | C | D | Tier | Primary stack | Gov-ID |
|---|--------|-------|---|---|---|---|------|---------------|--------|
| 1 | Russia | **99** | 25 | 35 | 20 | 19 | S | Yandex, VK, Telegram | ESIA + DaData + Diadoc |
| 2 | USA (North America) | **97** | 24 | 34 | 20 | 19 | S | Meta MCC, Google MCC | Middesk + DocuSign |
| 3 | Canada | **94** | 23 | 33 | 20 | 18 | A | Meta, Google | Corporations Canada |
| 4 | Europe | **94** | 23 | 33 | 20 | 18 | A | Meta, Google, Taboola | eIDAS / BankID |
| 5 | Ukraine | **91** | 23 | 32 | 19 | 17 | A | Google, Meta | EDR + Diia |
| 6 | Brazil | **88** | 22 | 31 | 18 | 17 | B | Meta, Google | CNPJ + LGPD |
| 7 | LatAm (ex-BR) | **86** | 21 | 30 | 18 | 17 | B | Meta, WhatsApp | RFC/RUT + mandate |
| 8 | Asia (ex-CN) | **85** | 20 | 29 | 19 | 17 | B | Naver, Kakao, Shopee | per-country |
| 9 | China | **81** | 16 | 32 | 17 | 16 | C | Tencent, Ocean Engine | 营业执照 gate |
| 10 | Africa | **77** | 17 | 28 | 17 | 15 | C | Meta mobile | CIPC/CAC + Sumsub |

**Tier:** S ≥97 · A 90–96 · B 85–89 · C 75–84

---

## v2.1 assumptions (all regions)

| Blocker | Solution | Effect |
|---------|----------|--------|
| Fiat bridge | Company float → MCP transfer | C = 20 |
| Chargeback | Prepaid only | C = 20 |
| Balance gaps | +30% cushion | C stable |
| Rep authority | Gov-ID + mandate | A +1…+2 |
| Text moderation | Pre-mod policy RAG | B +1…+3 |
| AML/KYC | Sumsub / DaData / Middesk | A +1…+3 |
| Closing docs | Auto e-sign + ERP | C ops |

---

## Regional notes

### Russia — 99 (leader)
- **A=25:** ESIA + DaData + Diadoc mandate
- **B=35:** Yandex/VK pre-mod + Rivox 102
- **Path to 100:** Calltouch offline → D=20

### USA — 97
- **−1 A:** Meta Business Verification (platform gate)
- **−1 B:** political / special ad categories

### Europe — 94
- **−2 A:** DSA registry per country
- Sub-regions: Nordics **96**, DACH **92**, UK **93**

### Ukraine — 91
- EDR + Diia.Signature (no Yandex greenfield)
- Google + Meta only
- −2 A: Diia contract, martial law categories

### China — 81 (API paradox)
- **B=32:** tencent-ad-mcp 358 tools (deepest API)
- **A=16:** 营业执照 + ICP irreducible
- Strategy: local WFOE partner only

### Africa — 77
- Meta mobile-first
- No unified gov-ID (−8 A)
- ZA **82**, NG/KE **78**, rest **72**

---

## Capability matrix

| Capability | RU | UA | EU | USA | CN | AF |
|------------|:--:|:--:|:--:|:---:|:--:|:--:|
| Auto org create | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| Gov-ID rep verify | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Pre-mod 95%+ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Float +30% | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| Crypto client pay | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ |
| Local search ads | Yandex | ❌ | ❌ | ❌ | Tencent | ❌ |

---

## Rollout priority

| Phase | Region | Σ |
|-------|--------|---|
| P0 | Russia | 99 |
| P1 | USA + Ukraine | 97 / 91 |
| P2 | Europe + Canada | 94 |
| P3 | Brazil + LatAm | 88 / 86 |
| P4 | Asia | 85 |
| P5 | China + Africa | 81 / 77 |

---

## Score evolution (Russia baseline)

| Model | Σ | Δ |
|-------|---|---|
| Platform MCP only | 57 | — |
| Agency Proxy v1 | 93 | — |
| v2 (float + prepaid) | 97 | +4 |
| v2.1 (pre-mod + gov-ID) | **99** | +2 |
| + Calltouch offline | **100** | +1 |

**Global weighted avg v2.1:** ~89/100
