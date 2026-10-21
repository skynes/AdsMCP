# Agency Proxy — каталог блокеров

> Дата: 3 октября 2026  
> Контекст: Enhanced Model **v2.1** (float, pre-mod, gov-ID, mandate)  
> Связано: [agency-proxy-regional-scores.md](./agency-proxy-regional-scores.md) · [agency-proxy-100-architecture.md](./agency-proxy-100-architecture.md)

---

## TL;DR

| Категория | Кол-во | Статус v2.1 |
|-----------|--------|-------------|
| **Общие частые** | 12 | 4 решены · 8 остаточных |
| **Частные / региональные** | 14 | 2 решены · 12 остаточных |
| **Экзотические / edge** | 16 | почти все остаточные |

**Top-3 irreducible (все регионы):** platform business verify · industry **license** (не текст) · attribution/offline D

---

# ЧАСТЬ 1 — Общие и частые блокеры

> Встречаются в **большинстве регионов** и каналов. Именно они определяют разброс **77–99**, а не оплата.

## 1.1 Решённые в v2/v2.1 (не блокируют score)

| # | Блокер | Решение | Критерий |
|---|--------|---------|----------|
| G-R1 | Fiat bridge клиент → площадка | Float компании + MCP `transfer_to_org` | C |
| G-R2 | Chargeback / postpay | Prepaid only (crypto/fiat) | C |
| G-R3 | Insufficient balance / кампания встала | Подушка **+30%** на float | C |
| G-R4 | Representative authority (чужой ИНН/EIN) | Gov-ID (ESIA/eIDAS/Diia) + **mandate** | A |
| G-R5 | Moderation reject по тексту/landing | **Pre-mod** на правилах площадки (95–98% clean submit) | B |
| G-R6 | AML/KYC ручной | Sumsub / Onfido / DaData / Middesk | A |
| G-R7 | Закрывающие документы | Auto счёт → акт → e-sign → ERP | C ops |
| G-R8 | Dispute triage | AI freeze org + notify | C ops |

---

## 1.2 Остаточные общие (главные минус баллы)

| # | Блокер | Частота | A/B/C/D | Auto? | Что помогает | Где хуже всего |
|---|--------|---------|---------|-------|--------------|----------------|
| **G1** | **Platform business verification** | ~15–40% новых Meta/TikTok | **A −1…−3** | ❌ Platform gate | Human SLA queue 4–24h | US, EU, LatAm |
| **G2** | **Industry license** (мед, фин, алко, pharma, gambling) | ~5–15% клиентов | **B 0% auto** | ❌ | Denylist OKVED/NAICS + upload license doc | RU, US, EU, JP |
| **G3** | **Moderation reject после pre-mod** | ~2–5% submits | **B −1…−2** | ⚠️ Partial | Human review + resubmit | Все |
| **G4** | **Trademark / competitor complaint** | ~1–3% | **B −0…−1** | ❌ | Legal queue | US, EU |
| **G5** | **API gaps** (не все форматы кампаний) | постоянно | **B −1…−3** | ⚠️ | Multi-adapter, Playwright fallback | VK formats, TG, CPM video |
| **G6** | **Attribution lag** (конверсии 1–7 дней) | всегда | **D −1** | ❌ Platform | Delayed reports in MCP | Все |
| **G7** | **Offline conversions** (звонки, визиты, CRM) | ~30–50% B2B | **D −1…−3** | ⚠️ | Calltouch/Roistat/GA4 offline import | RU, UA, LatAm, Africa |
| **G8** | **iOS / cookie loss** | растёт | **D −1…−2** | ❌ Platform | SKAN, consent mode | US, EU |
| **G9** | **Platform ban / rate limit** (aggressive API) | ~1–5% agency accounts | **B risk** | ⚠️ | Human-like pacing (Pixero pattern) | Meta MCC, Google MCC |
| **G10** | **High-risk landing quality** (нет оферты, privacy, SSL) | ~10–20% SME | **B −1…−2** | ⚠️ | Pre-crawl audit + auto-fix template pages | Все |
| **G11** | **Special ad categories** (political, housing, credit) | ~3–8% US/EU | **B −1…−2** | ❌ | Separate flow + platform certification | US, EU |
| **G12** | **Agency MCC single point of failure** | rare but catastrophic | **ops** | ⚠️ | Multi-MCC, client org isolation | US, Global |

### Приоритет G1–G12 (по impact × frequency)

```
Impact × Freq
    │
 G1  │ ████████████  Platform verify (Meta)
 G2  │ ██████████    Industry license
 G7  │ █████████     Offline / CRM (D)
 G5  │ ████████      API gaps
 G3  │ ███████       Post-pre-mod reject
 G10 │ ██████        Landing quality
 G6  │ ██████        Attribution lag
 G11 │ █████         Special ad categories
 G8  │ █████         iOS/cookies
 G9  │ ███           Agency ban
 G4  │ ███           Trademark
 G12 │ ██            MCC SPOF
```

---

# ЧАСТЬ 2 — Частные и региональные блокеры

> Зависят от **конкретного рынка**. Не везде применимы, но там где есть — сильно бьют по A или C.

## 2.1 Регистрация / compliance (A)

| # | Блокер | Регион | A hit | Auto? | Mitigation |
|---|--------|--------|-------|-------|------------|
| R1 | **ОРД / ЕРИР** цепочка ошибок | 🇷🇺 RU | −0…−1 | ⚠️ | Auto ORD nightly reconciliation |
| R2 | **DSA advertiser registry** | 🇪🇺 EU (DE, FR, IE, ES) | −2 | ⚠️ | Per-country adapter |
| R3 | **VIES / VAT MOSS** | 🇪🇺 EU | −1 | ✅ | VIES API + mandate |
| R4 | **LGPD** consent + DPO | 🇧🇷 BR | −1 | ⚠️ | Mandate + privacy template |
| R5 | **Nota Fiscal / e-invoicing** | 🇧🇷 BR | C −2 | ⚠️ | ERP adapter (Omie, ContaAzul) |
| R6 | **Quebec Bill 96** (FR creatives) | 🇨🇦 CA | B −1 | ✅ | Dual pre-mod corpus EN+FR |
| R7 | **PIPEDA** consent | 🇨🇦 CA | D −1 | ✅ | Consent banner auto |
| R8 | **Diia contract** + no RF/BY ties | 🇺🇦 UA | A −1 | ⚠️ | Diia integration onboarding |
| R9 | **Martial law ad restrictions** | 🇺🇦 UA | B −1 | ❌ | Category denylist |
| R10 | **Naver/Kakao agency approval** | 🇰🇷 KR | A −4 | ❌ | Partner agency status |
| R11 | **法人 + LY agency contract** | 🇯🇵 JP | A −4 | ❌ | Local agency partner |
| R12 | **GSTIN + marketplace seller gate** | 🇮🇳 IN | A −5 | ⚠️ | Flipkart seller MCP path |
| R13 | **No unified gov-ID** | 🌍 Africa | A −8 | ⚠️ | Sumsub + CIPC/CAC per country |
| R14 | **FX volatility** (ARS, COP, UAH) | 🇦🇷 AR, 🇨🇴 CO, 🇺🇦 UA | C −1 | ⚠️ | Treasury FX bot, USD float |

---

## 2.2 Запуск / платформы (B)

| # | Блокер | Регион | B hit | Auto? | Mitigation |
|---|--------|--------|-------|-------|------------|
| R15 | **Yandex `addPassportOrganization`** — API по заявке | 🇷🇺 RU | A −1 | ⚠️ | Click.ru/eLama MVP parallel |
| R16 | **VK greenfield** — нет official MCP, community gaps | 🇷🇺 RU | B −1 | ⚠️ | lexamarketolog/vk-ads-mcp |
| R17 | **Telegram Ads — Playwright**, не API | 🇷🇺 CIS | B −5 | ⚠️ | Click.ru proxy, server-side Playwright |
| R18 | **Multi-country rule sets** | 🌏 SEA | B −6 | ⚠️ | Country policy packs |
| R19 | **JP 薬機法** (pharma creative law) | 🇯🇵 JP | B −2 | ❌ | JP legal review queue |
| R20 | **ANPD consumer protection** | 🇧🇷 BR | B −1 | ⚠️ | Strict pre-mod PT-BR |
| R21 | **Mobile-first landing** (low bandwidth) | 🌍 Africa | B −2 | ⚠️ | Lite landing auto-generator |
| R22 | **Language diversity** (10+ langs) | 🌍 Africa, 🌏 SEA | B −2 | ⚠️ | LLM localize + pre-mod per lang |

---

## 2.3 Оплата (C) — частные остатки

| # | Блокер | Регион | C hit | Auto? | Mitigation |
|---|--------|--------|-------|-------|------------|
| R23 | **CN corporate banking** / WeChat Pay only | 🇨🇳 CN | C −3 | ⚠️ | Local WFOE treasury |
| R24 | **Pix reconciliation** | 🇧🇷 BR | C −2 | ⚠️ | Pix webhook adapter |
| R25 | **M-Pesa / Flutterwave** fragmentation | 🌍 Africa | C −3 | ⚠️ | Per-country payment adapter |
| R26 | **Crypto banned** | 🇨🇳 CN, 🇰🇷 KR | C −1 | ❌ | Fiat only |

---

# ЧАСТЬ 3 — Экзотические и edge-case блокеры

> Редкие, но болезненные. Обычно **human queue** или **legal**.

## 3.1 Platform / legal edge

| # | Блокер | Частота | Критерий | Регионы |
|---|--------|---------|----------|---------|
| E1 | **营业执照** (business license China) | CN only, 100% greenfield | A −9 | 🇨🇳 |
| E2 | **ICP备案** (site registration China) | CN, if landing in CN | A/B −2 | 🇨🇳 |
| E3 | **Tencent / Ocean Engine partner gate** | CN | A −3 | 🇨🇳 |
| E4 | **CN censorship / 广告法** sensitive categories | CN | B −3 | 🇨🇳 |
| E5 | **Meta video selfie verification** | US/EU, ~10–20% | A −1 | Global |
| E6 | **Google Ads identity verification** | US/EU, occasional | A −1 | Global |
| E7 | **TikTok BC verification** | Global | A −1 | Global |
| E8 | **Whop/Koast ad account limits** (10 accounts) | US Meta | A scale | Global |
| E9 | **Sanctions / PEP screening** hit | <1% | A freeze | RU, UA, Global |
| E10 | **Dual-use / export control** (tech ads to restricted countries) | <1% | A/B block | US, EU |

## 3.2 Technical edge

| # | Блокер | Частота | Критерий | Примечание |
|---|--------|---------|----------|------------|
| E11 | **Learning phase** — кампания live, но алгоритм не обучился | ~30% new campaigns | D perf | Не rubric B, но клиентский «не работает» |
| E12 | **Metrika/GA4 not installed** on client site | ~20% SME | D −2 | Auto-inject counter via tag manager API |
| E13 | **Domain age / trust** — новый домен, low Quality Score | ~15% | B perf | Warm-up strategy |
| E14 | **Shared IP / cloaking false positive** | <1% | B ban | Clean dedicated infra |
| E15 | **OAuth token expiry** mid-campaign | ops | B pause | Auto-refresh (standard) |
| E16 | **Concurrent org create race** (1 INN = 1 org) | <1% | A dup | Idempotency lock in orchestrator |

## 3.3 Niche / industry exotic

| # | Блокер | Отрасли | Критерий |
|---|--------|---------|----------|
| E17 | **Мед. лицензия + дисклеймеры** | Клиники, pharma | B 0% без doc |
| E18 | **Фин. регистратор / ЦБ** | МФО, брокеры, crypto | B 0% без doc |
| E19 | **Алкоголь / tobacco age gate** | E-com, HoReCa | B −2, geo restrictions |
| E20 | **Gambling license** | Betting | B 0%, geo whitelist |
| E21 | **Political ads authorization** | Elections, PACs | B 0%, US/EU |
| E22 | **Children / COPPA** | Apps, games | B −2, US |
| E23 | **CBD / cannabis** state-by-state | US | B 0% most platforms |
| E24 | **Weapons / ammo** | E-com | B 0% |

## 3.4 Operational / business exotic

| # | Блокер | Impact |
|---|--------|--------|
| E25 | **Agency account ban** → все клиенты offline | Catastrophic SPOF |
| E26 | **Platform ToS change** (новое правило overnight) | Pre-mod corpus stale 24–48h |
| E27 | **Client churn mid-ORD contract** | RU legal cleanup |
| E28 | **Cross-border advertiser** (RU company → EU audience) | A + B compliance mix |
| E29 | **White-label reseller** chain liability | Mandate chain unclear |
| E30 | **AI-generated misleading claims** (FTC/ФАС) | B + legal, pre-mod + human |

---

# Матрица: блокер × решённость v2.1

| Блокер | v1 | v2 | v2.1 | Irreducible? |
|--------|----|----|------|--------------|
| Fiat bridge | ❌ | ✅ | ✅ | — |
| Chargeback | ❌ | ✅ | ✅ | — |
| Rep authority | ❌ | ⚠️ | ✅ | — |
| Text moderation | ❌ | ⚠️ | ✅ 95%+ | — |
| Platform verify | ❌ | ❌ | ❌ | **Yes** |
| Industry license | ❌ | ❌ | ❌ | **Yes** |
| Offline D | ❌ | ❌ | ⚠️ | Partial |
| CN 营业执照 | ❌ | ❌ | ❌ | **Yes** |
| API gaps | ❌ | ⚠️ | ⚠️ | Partial |
| Agency ban | ❌ | ⚠️ | ⚠️ | Partial |

---

# Human queue — что туда попадает (v2.1)

| Очередь | % клиентов | SLA target | Auto-triage? |
|---------|------------|------------|--------------|
| Standard B2B happy path | **90–95%** | 0h (fully auto) | ✅ |
| Post-pre-mod reject | 2–5% | 4h | ⚠️ AI suggests fix |
| Platform verify pending | 3–10% | 24h | ❌ wait platform |
| Industry license upload | 3–8% | 24h | ❌ doc review |
| Trademark/legal | 1–2% | 48h | ❌ legal |
| Sanctions/PEP | <1% | freeze | ✅ auto freeze |
| CN / Africa greenfield | varies | 72h+ | ❌ partner |

---

# Quick reference: топ блокеров по региону

| Регион | #1 | #2 | #3 |
|--------|----|----|-----|
| 🇷🇺 RU | med/finance license | ОРД edge | offline D |
| 🇺🇦 UA | martial law categories | offline D | Diia onboarding |
| 🇺🇸 USA | Meta verify | special ad cats | iOS SKAN |
| 🇪🇺 EU | DSA registry | cookie/consent | GDPR pre-mod |
| 🇨🇦 CA | FR bilingual | PIPEDA | = EU-like |
| 🇧🇷 BR | Nota Fiscal | LGPD | Pix recon |
| 🌎 LatAm | FX volatility | ES pre-mod nuance | offline D |
| 🌏 Asia | no unified gov-ID | multi-country B | agency gates KR/JP |
| 🇨🇳 CN | 营业执照 | ICP | partner gate |
| 🌍 Africa | no gov-ID | mobile B | weak D |

---

## Связанные документы

- [agency-proxy-regional-scores.md](./agency-proxy-regional-scores.md) — Σ по 10 регионам
- [agency-proxy-100-architecture.md](./agency-proxy-100-architecture.md) — архитектура и state machine
