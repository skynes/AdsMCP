# Blocker Catalog

> Enhanced Model v2.1 · October 2026  
> Full detail migrated from research phase

---

## Summary

| Category | Count | v2.1 status |
|----------|-------|-------------|
| Common frequent | 12 | 8 solved · 4 residual |
| Regional / private | 26 | 2 solved · 24 residual |
| Exotic / edge | 30 | mostly residual |

**Top 3 irreducible:** platform business verify · industry license (document) · offline attribution (D)

---

# Part 1 — Common & frequent

## Solved in v2/v2.1 ✅

| ID | Blocker | Solution | Criterion |
|----|---------|----------|-----------|
| G-R1 | Fiat bridge client → platform | Company float + MCP transfer | C |
| G-R2 | Chargeback / postpay | Prepaid only | C |
| G-R3 | Insufficient balance | +30% float cushion | C |
| G-R4 | Representative authority | Gov-ID + signed mandate | A |
| G-R5 | Text/landing moderation reject | Pre-mod (95–98% clean) | B |
| G-R6 | Manual AML/KYC | Sumsub / DaData / Middesk | A |
| G-R7 | Closing documents | Auto invoice → e-sign → ERP | C |
| G-R8 | Dispute triage | AI freeze + notify | C |

## Residual common ❌

| ID | Blocker | Frequency | Hit | Auto? |
|----|---------|-----------|-----|-------|
| **G1** | Platform business verification (Meta video, TikTok BC) | 15–40% | A −1…−3 | ❌ Platform gate |
| **G2** | Industry license (med, finance, alcohol, pharma, gambling) | 5–15% | B 0% | ❌ Need **document** |
| **G3** | Post-pre-mod moderation reject | 2–5% | B −1…−2 | ⚠️ Human queue |
| **G4** | Trademark / competitor complaint | 1–3% | B −0…−1 | ❌ Legal |
| **G5** | API gaps (not all campaign formats) | constant | B −1…−3 | ⚠️ Multi-adapter |
| **G6** | Attribution lag (1–7 days) | always | D −1 | ❌ Platform |
| **G7** | Offline conversions (calls, CRM) | 30–50% B2B | D −1…−3 | ⚠️ Calltouch/GA4 |
| **G8** | iOS / cookie loss | growing | D −1…−2 | ❌ Platform |
| **G9** | Platform ban / API rate limit | 1–5% | B risk | ⚠️ Human-like pacing |
| **G10** | Bad landing (no privacy, offer, SSL) | 10–20% SME | B −1…−2 | ⚠️ Pre-crawl audit |
| **G11** | Special ad categories (political, housing, credit) | 3–8% US/EU | B −1…−2 | ❌ Platform cert |
| **G12** | Agency MCC ban (all clients offline) | rare | ops | ⚠️ Multi-MCC |

---

# Part 2 — Regional & private

## Registration / compliance (A)

| ID | Blocker | Region |
|----|---------|--------|
| R1 | ERIR / ORD chain errors | Russia |
| R2 | DSA advertiser registry | EU (DE, FR, IE, ES) |
| R3 | VAT MOSS | EU |
| R4 | LGPD | Brazil |
| R5 | Nota Fiscal / e-invoicing | Brazil |
| R6 | Quebec Bill 96 (FR creatives) | Canada |
| R7 | PIPEDA consent | Canada |
| R8 | Diia contract + no RF/BY ties | Ukraine |
| R9 | Martial law ad restrictions | Ukraine |
| R10 | Naver/Kakao agency approval | Korea |
| R11 | 法人 + LY agency contract | Japan |
| R12 | GSTIN + marketplace seller gate | India |
| R13 | No unified gov-ID | Africa |
| R14 | FX volatility (ARS, COP, UAH) | AR, CO, UA |

## Launch / platforms (B)

| ID | Blocker | Region |
|----|---------|--------|
| R15 | Yandex addPassportOrganization — approval required | Russia |
| R16 | VK — no official MCP | Russia |
| R17 | Telegram Ads — Playwright not API | CIS |
| R18 | Multi-country rule sets | SEA |
| R19 | JP pharmaceutical law (薬機法) | Japan |
| R20 | ANPD consumer protection | Brazil |
| R21 | Mobile-first landing (low bandwidth) | Africa |
| R22 | Language diversity (10+ langs) | Africa, SEA |

## Payment residual (C)

| ID | Blocker | Region |
|----|---------|--------|
| R23 | CN corporate banking / WeChat Pay only | China |
| R24 | Pix reconciliation | Brazil |
| R25 | M-Pesa / Flutterwave fragmentation | Africa |
| R26 | Crypto banned | China, Korea |

---

# Part 3 — Exotic & edge

## Platform / legal

| ID | Blocker | Where |
|----|---------|-------|
| E1 | 营业执照 (CN business license) | China 100% greenfield |
| E2 | ICP备案 (site registration) | China |
| E3 | Tencent / Ocean Engine partner gate | China |
| E4 | CN censorship / 广告法 | China |
| E5 | Meta video selfie verification | US/EU |
| E6 | Google Ads identity verification | US/EU |
| E7 | TikTok BC verification | Global |
| E8 | Whop/Koast 10 account limit | US Meta |
| E9 | Sanctions / PEP hit | <1% |
| E10 | Export control (dual-use ads) | US/EU |

## Niche / industry

| ID | Blocker | Sectors |
|----|---------|---------|
| E17 | Medical license + disclaimers | Clinics, pharma |
| E18 | Financial regulator / central bank | MFO, brokers |
| E19 | Alcohol / tobacco age gate | HoReCa |
| E20 | Gambling license | Betting |
| E21 | Political ads authorization | Elections |
| E22 | COPPA / children | Apps |
| E23 | CBD / cannabis state-by-state | US |
| E24 | Weapons / ammo | E-commerce |

---

## Human queue (v2.1)

| Queue | % clients | SLA |
|-------|-----------|-----|
| Fully auto happy path | **90–95%** | 0h |
| Post-pre-mod reject | 2–5% | 4h |
| Platform verify pending | 3–10% | 24h |
| Industry license upload | 3–8% | 24h |
| Trademark/legal | 1–2% | 48h |

---

## Top blockers by region

| Region | #1 | #2 | #3 |
|--------|----|----|-----|
| Russia | med/finance license | ERIR edge | offline D |
| Ukraine | martial law categories | offline D | Diia onboarding |
| USA | Meta verify | special ad cats | iOS SKAN |
| EU | DSA registry | cookies | GDPR |
| China | 营业执照 | ICP | partner gate |
| Africa | no gov-ID | mobile B | weak D |
