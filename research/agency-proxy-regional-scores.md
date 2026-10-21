# Agency Proxy — региональные баллы (Enhanced Model v2 → v2.1)

> Дата: 3 октября 2026  
> Модель: **Agency Proxy MCP** — клиент не видит кабинет площадки; деньги на **float компании** (fiat); MCP переводит на org клиента  
> Связано: [agency-proxy-100-architecture.md](./agency-proxy-100-architecture.md) · [master-unified.md](./master-unified.md)

---

## TL;DR — рейтинг регионов (v2.1)

| # | Регион | Стек | **Σ v2.1** | v2 → v2.1 | Главный остаточный блокер |
|---|--------|------|------------|-----------|---------------------------|
| 1 | **RU/CIS** | Yandex Direct + VK + Telegram | **99** | +2 | ОРД edge + offline D |
| 2 | **US/CA** | Meta MCC + Google Ads MCC | **97** | +4 | Meta Business Verification |
| 3 | **EU/UK** | Meta + Google + DSA registry | **94** | +4 | DSA registry, VAT MOSS |
| 4 | **LATAM** | Meta + Google (WhatsApp Ads) | **91** | +3 | Nota Fiscal, FX |
| 5 | **Global crypto-native** | Telegram TON + Hive USDC | **89** | +4 | слабая атрибуция (D) |
| 6 | **Korea** | Naver SearchAd + Kakao Moment | **88** | +4 | agency onboarding gate |
| 7 | **Japan** | LY Ads (LINE + Yahoo JP) | **87** | +4 | 法人 registration |
| 8 | **SEA** | Shopee Ads + Meta + TikTok | **86** | +4 | fragmented per-country rules |
| 9 | **MENA** | Meta + Google + Snap | **85** | +4 | trade license UAE/KSA |
| 10 | **India** | Flipkart Ads + Meta + Google | **82** | +4 | GSTIN marketplace gate |
| 11 | **China** | Tencent Ads + Ocean Engine | **81** | +4 | 营业执照 + ICP (A gate) |

**Вывод v2.1:** премодерация + gov-ID/rep-auth **снимают B и A blockers** в standard niches. **RU → 99**. Остаток — **platform gates** (Meta verify, CN license), **D** (attribution), **high-risk licenses** (med/finance нужна лицензия, не только текст).

---

## Enhanced Model v2 — что считаем решённым

| Блокер (v1) | Решение v2 | Эффект на rubric |
|-------------|------------|------------------|
| Fiat bridge клиент→площадка | **Float компании** (fiat на балансе agency) → MCP `transfer_to_org` | **C +2** (18→20) |
| Chargeback / postpay | Prepaid only: crypto (USDC/TON) или fiat (Stripe/YooKassa) | **C +2** |
| Insufficient balance | **Подушка +30%** от заказанного бюджета на float | **C +1** (ops → full auto) |
| AML/KYC | Sumsub / Onfido / Jumio + DaData (RU) + Middesk (US EIN) | **A +1…+3** по региону |
| Закрывающие документы | Auto: счёт → акт → e-sign (Кontur/Diadoc/DocuSign) → ERP | **C +1**, ops |
| Dispute handling | AI triage + freeze org (не human-by-default) | **C** stable |

### Enhanced Model v2.1 — премодерация + representative authority

| Блокер (v2) | Решение v2.1 | Эффект |
|-------------|--------------|--------|
| Platform moderation reject | **Pre-mod pipeline**: RAG на правилах площадки (Yandex Direct policy, Meta Ad Standards, VK rules) + landing crawl + creative scorer → submit только если score ≥ threshold | **B +1…+3** |
| Representative authority | **Gov-ID**: RU ESIA/Госуслуги · EU eIDAS/BankID · IN DigiLocker · US SOS + signed POA · + **mandate doc** (e-sign): «уполномочен рекламировать, согласен с правилами, liability» | **A +1…+2** |
| Post-reject loop | Pre-mod → fix → re-score до submit (не reactive retry) | **B** stable |

**Pre-mod stack (архитектура):**

```
landing crawl + creatives
        │
        ▼
┌─ Policy Engine ─────────────────────────────────────┐
│ Corpus: platform rules (PDF/HTML) + Rivox 102 rules │
│ + denylist categories (med, finance, crypto, etc.)  │
│ LLM scorer: policy_violations[], fix_suggestions[]  │
│ Threshold: score ≥ 0.92 → auto-submit                │
│ score 0.80–0.92 → auto-fix loop (max 3)             │
│ score < 0.80 OR high-risk OKVED → human queue       │
└─────────────────────────────────────────────────────┘
```

**Rep-auth stack (архитектура):**

```
submit_inn / EIN / VAT
        │
        ▼
DaData / Middesk / VIES — entity exists + ACTIVE
        │
        ▼
gov_id_verify (region-specific):
  RU: ESIA OAuth → ФИО + SNILS match director/rep in ЕГРЮЛ
  EU: eIDAS node → legal rep of company
  US: Middesk officers + DocuSign POA + checkbox mandate
        │
        ▼
sign_mandate (qualified e-sign / Diadoc / DocuSign):
  «Я уполномочен рекламировать от имени {legal_name}»
  «Согласен с правилами площадок и ОРД/DSA»
  «Принимаю liability за контент»
        │
        ▼
KYC_APPROVED → org_create
```

**Не решено v2.1** (irreducible):

- Platform business verify (Meta video verify, Tencent partner) — **platform gate**
- High-risk **license** (мед. лицензия, фин. регистратор ЦБ) — не текст, а документ
- CN 营业执照 + ICP — gov gate, не заменяется mandate
- Trademark / competitor complaint — spot check human
- Attribution lag / offline CRM (D)

---

## Методология (та же A+B+C+D, контекст agency proxy)

| Критерий | Макс | v2 baseline | Что меряем |
|----------|------|-------------|------------|
| **A** Регистрация | 25 | auto KYC stack | Org/ad account на рекламодателя без ручного KYC |
| **B** Запуск | 35 | API + LLM retry | URL → live, moderation loop |
| **C** Оплата | 20 | **20** при v2 | Client pay → float → org top-up, без chargeback |
| **D** Метрики | 20 | platform + CRM | Stats, goals, weekly agent report |

**Scope:** один «лучший» канал региона + agency infrastructure. Multi-channel в регионе **не суммируется** — берём weighted best (как KDirect = Direct-first).

---

## Детальный расчёт по регионам

### 1. 🇷🇺 RU/CIS — **99/100** (лидер)

| | v2 | **v2.1** | Комментарий v2.1 |
|---|-----|----------|------------------|
| **A** | 24 | **25/25** | DaData + **ESIA/Госуслуги** (rep ∈ ЕГРЮЛ) + **Diadoc mandate** |
| **B** | 34 | **35/35** | Pre-mod на правилах Яндекса/VK + Rivox 102 → submit clean. High-risk → denylist |
| **C** | 20 | **20/20** | без изменений |
| **D** | 19 | **19/20** | Metrika + CRM. −1: offline calls без Calltouch |
| **Σ** | 97 | **99** | **+2** |

**Почему не 100:** D offline (−1). ОРД reconciliation — ops, не rubric. **100 достижим** при Calltouch/Roistat auto-import.

**Стек:** Yandex Direct (primary) · VK Ads · Telegram (Click.ru proxy) · Ozon Performance

---

### 2. 🇺🇸 US/CA — **97/100**

| | v2 | **v2.1** | Комментарий v2.1 |
|---|-----|----------|------------------|
| **A** | 22 | **24/25** | Middesk + **DocuSign POA/mandate** + officer match. −1: **Meta Business Verification** (platform) |
| **B** | 32 | **34/35** | Pre-mod Meta Ad Standards + Google policy corpus. −1: special ad category (political) |
| **C** | 20 | **20/20** | без изменений |
| **D** | 19 | **19/20** | без изменений |
| **Σ** | 93 | **97** | **+4** |

**Почему не 100:** Meta Business Verification — **platform gate** (−1 A). Political ads license (−1 B).

**Стек:** Meta (Koast/Whop) · Google Ads MCC · TikTok · Amazon Ads (create account tool A=10)

---

### 3. 🇪🇺 EU/UK — **94/100**

| | v2 | **v2.1** | Комментарий v2.1 |
|---|-----|----------|------------------|
| **A** | 21 | **23/25** | VIES + **eIDAS/BankID** rep verify + mandate. −2: **DSA registry** per country |
| **B** | 31 | **33/35** | Pre-mod EU policy + GDPR consent in creatives. −2: national ad rules variance |
| **C** | 20 | **20/20** | без изменений |
| **D** | 18 | **18/20** | без изменений |
| **Σ** | 90 | **94** | **+4** |

**Стек:** Meta · Google · Taboola (EU native) · Criteo

---

### 4. 🌎 LATAM — **91/100**

| | v2 | **v2.1** | Комментарий v2.1 |
|---|-----|----------|------------------|
| **A** | 22 | **23/25** | CNPJ/RFC + signed mandate. −2: BR Nota Fiscal |
| **B** | 30 | **32/35** | Pre-mod PT/ES policy corpus. −3: local language nuance |
| **C** | 19 | **19/20** | без изменений |
| **D** | 17 | **17/20** | без изменений |
| **Σ** | 88 | **91** | **+3** |

---

### 5. ⚡ Global crypto-native — **89/100**

| | v2 | **v2.1** | Комментарий v2.1 |
|---|-----|----------|------------------|
| **A** | 23 | **24/25** | Wallet + **signed mandate** + Sumsub above limits. −1: EUR TG cabinet KYC |
| **B** | 28 | **31/35** | Pre-mod TG ad policy before Playwright submit. −4: Playwright fragility |
| **C** | 20 | **20/20** | без изменений |
| **D** | 14 | **14/20** | без изменений — **главный cap** |
| **Σ** | 85 | **89** | **+4** |

**Парадокс:** v2.1 поднимает B, но **D=14** остаётся потолком канала.

---

### 6. 🇰🇷 Korea — **88/100**

| | v2 | **v2.1** | Комментарий v2.1 |
|---|-----|----------|------------------|
| **A** | 19 | **21/25** | Business reg + **Korean real-name verify** + mandate. −4: agency approval gate |
| **B** | 29 | **31/35** | Pre-mod Naver/Kakao rules. −4: KR language |
| **C** | 19 | **19/20** | без изменений |
| **D** | 17 | **17/20** | без изменений |
| **Σ** | 84 | **88** | **+4** |

**Стек:** Naver SearchAd · Kakao Moment · Kakao Keyword

---

### 7. 🇯🇵 Japan — **87/100**

| | v2 | **v2.1** | Комментарий v2.1 |
|---|-----|----------|------------------|
| **A** | 19 | **21/25** | 法人番号 + **e-Gov/eKYC** rep + mandate. −4: LY agency contract |
| **B** | 28 | **30/35** | Pre-mod JP ad standards (薬機法等). −5: JP creative compliance |
| **C** | 19 | **19/20** | без изменений |
| **D** | 17 | **17/20** | без изменений |
| **Σ** | 83 | **87** | **+4** |

---

### 8. 🌏 SEA (SG/MY/TH/VN/ID/PH) — **86/100**

| | v2 | **v2.1** | Комментарий v2.1 |
|---|-----|----------|------------------|
| **A** | 20 | **22/25** | Local biz reg + **Singpass/CorporatePass** (SG) + mandate. −3: 6 countries |
| **B** | 27 | **29/35** | Pre-mod per-country policy packs. −6: fragmentation |
| **C** | 19 | **19/20** | без изменений |
| **D** | 16 | **16/20** | без изменений |
| **Σ** | 82 | **86** | **+4** |

---

### 9. 🇮🇳 India — **82/100**

| | v2 | **v2.1** | Комментарий v2.1 |
|---|-----|----------|------------------|
| **A** | 18 | **20/25** | GSTIN + **DigiLocker/Aadhaar** authorized signatory + mandate. −5: marketplace gate |
| **B** | 26 | **28/35** | Pre-mod Meta/Google + ASCI India rules. −7: languages |
| **C** | 18 | **18/20** | без изменений |
| **D** | 16 | **16/20** | без изменений |
| **Σ** | 78 | **82** | **+4** |

---

### 10. 🇨🇳 China — **81/100** (хороший API, жёсткий A)

| | v2 | **v2.1** | Комментарий v2.1 |
|---|-----|----------|------------------|
| **A** | 14 | **16/25** | Mandate + local rep verify. **营业执照 + ICP + partner** — irreducible. −9 |
| **B** | 30 | **32/35** | Pre-mod censorship + 广告法 corpus. −3: sensitive categories |
| **C** | 17 | **17/20** | без изменений |
| **D** | 16 | **16/20** | без изменений |
| **Σ** | 77 | **81** | **+4** |

**Парадокс CN:** pre-mod поднимает B, но **A gate** (license) не снимается mandate.

---

### 11. 🌍 MENA (UAE/KSA/EG) — **85/100**

| | v2 | **v2.1** | Комментарий v2.1 |
|---|-----|----------|------------------|
| **A** | 19 | **21/25** | UAE DED/KSA CR + **UAE Pass** + mandate. −4: license categories |
| **B** | 28 | **30/35** | Pre-mod cultural/religious rules. −5: sensitive content |
| **C** | 18 | **18/20** | без изменений |
| **D** | 16 | **16/20** | без изменений |
| **Σ** | 81 | **85** | **+4** |

---

## Сравнение v1 → v2 → v2.1 (RU baseline)

| Критерий | v1 | v2 | **v2.1** | Δ v2→v2.1 |
|----------|----|----|----------|-----------|
| A | 23 | 24 | **25** | +1 (ESIA + mandate) |
| B | 33 | 34 | **35** | +1 (pre-mod policy engine) |
| C | 18 | 20 | **20** | 0 |
| D | 19 | 19 | **19** | 0 |
| **Σ** | **93** | **97** | **99** | **+2** |

---

## Что всё ещё мешает 100 — по категориям (все регионы)

### A — регистрация (v2.1 residual)

| Блокер | RU | US | CN | v2.1 status |
|--------|----|----|-----|-------------|
| Platform business verify | ✅ | ❌ Meta −1 | ❌ Tencent −9 | **Platform gate** |
| License / 营业执照 | denylist | state licenses | ❌ gate | Pre-mod **не заменяет** license doc |
| Representative authority | ✅ ESIA | ✅ POA | ⚠️ local rep | **Solved** standard B2B |
| Foreign entity | ⚠️ | ✅ | ❌ | По региону |

### B — запуск (v2.1 residual)

| Блокер | v2 auto rate | v2.1 auto rate | Остаток |
|--------|--------------|----------------|---------|
| Policy text reject | 70–95% | **95–98%** | pre-mod before submit |
| High-risk **license** | 0% | 0% | med/finance need **doc**, not text fix |
| Trademark complaint | — | ~2% | human spot check |
| API gaps | per platform | per platform | multi-adapter |
| Platform ban risk | — | — | human-like pacing |

### C — оплата (v2 ≈ solved)

| Edge case | Status v2 |
|-----------|-----------|
| Float insolvency | +30% cushion + credit line |
| FX mismatch crypto→fiat | Treasury bot, not client-facing |
| Tax invoice mismatch | Auto ERP |

**Остаточный −0…−2:** только CN corporate banking friction, BR Nota Fiscal.

### D — метрики (−1…−6)

| Блокер | All regions |
|--------|-------------|
| Attribution lag 1–7d | Platform limitation |
| Offline / calls | CRM integration optional |
| iOS / cookies | −1…−2 global |
| Crypto/TG weak D | −6 for crypto-native |

---

## Карта: где строить первым (v2.1)

```
Σ v2.1
100 ┤  ◉ RU (99→100 с Calltouch)
 97 ┤     ● US
 94 ┤        ● EU
 91 ┤           ● LATAM
 89 ┤              ● Crypto
 88 ┤                 ● KR
 87 ┤                    ● JP
 86 ┤                       ● SEA
 85 ┤                          ● MENA
 82 ┤                             ● IN
 81 ┤                                ● CN
    └────────────────────────────────────
```

**Стратегия:**

1. **MVP RU** — **99**, ESIA + pre-mod + float → **100** с Calltouch
2. **Expand US** — **97**, Meta verify = единственный A blocker
3. **EU** — **94**, DSA adapter
4. **CN** — **81**, только local partner (license gate)
5. **Crypto** — treasury; D=14 cap

---

## Strict 100/100 — когда возможен (v2.1)

| Условие | Σ | Регион |
|---------|---|--------|
| Standard B2B, denylist OKVED, pre-mod, ESIA, float | **100** | RU (+ Calltouch D) |
| Above + Meta verify in human SLA queue | **99** | US |
| Platform gates remain | **≤97** | US without Meta bypass |
| License-gated niches (med, finance, CN) | **≤85** | any |

**RU v2.1 max:** **99/100** strict · **100/100** с offline attribution  
**Global weighted avg v2.1:** **~89/100** (было ~86)  
**Irreducible blockers:** platform verify (Meta/Tencent), industry **license** (not text), CN 营业执照, D attribution on crypto

---

## 10 регионов — полный расчёт v2.1

> Модель: float + prepaid +30% · AML auto · auto docs · **pre-mod** · **gov-ID + mandate**  
> Азия = **без Китая** (CN отдельная строка). Северная Америка = **USA** (CA отдельно).

### Сводная таблица

| # | Регион | **Σ** | A | B | C | D | Tier | Главный стек | Gov-ID / KYC |
|---|--------|-------|---|---|---|---|------|--------------|--------------|
| 1 | **🇷🇺 Россия** | **99** | 25 | 35 | 20 | 19 | 🟢 S | Yandex Direct, VK, Telegram | ESIA + DaData + Diadoc |
| 2 | **🇺🇸 Северная Америка (USA)** | **97** | 24 | 34 | 20 | 19 | 🟢 S | Meta MCC, Google MCC, TikTok | Middesk EIN + DocuSign POA |
| 3 | **🇨🇦 Канада** | **94** | 23 | 33 | 20 | 18 | 🟢 A | Meta, Google, Amazon CA | Corporations Canada + FINTRAC |
| 4 | **🇪🇺 Европа** | **94** | 23 | 33 | 20 | 18 | 🟢 A | Meta, Google, Taboola, Criteo | eIDAS / BankID + mandate |
| 5 | **🇧🇷 Бразилия** | **88** | 22 | 31 | 18 | 17 | 🟡 B | Meta, Google, TikTok | CNPJ Receita + LGPD mandate |
| 6 | **🌏 Азия (ex-CN)** | **85** | 20 | 29 | 19 | 17 | 🟡 B | Naver, Kakao, Shopee, Flipkart, TikTok | KR real-name · IN DigiLocker · SG Singpass |
| 7 | **🌎 Южная Америка (ex-BR)** | **86** | 21 | 30 | 18 | 17 | 🟡 B | Meta, Google, WhatsApp Ads | RFC/RUT/CUIT + mandate |
| 8 | **🇺🇦 Украина** | **91** | 23 | 32 | 19 | 17 | 🟢 A | Google, Meta, TikTok | ЄДР (EDRPOU) + Diia.Signature |
| 9 | **🇨🇳 Китай** | **81** | 16 | 32 | 17 | 16 | 🟠 C | Tencent Ads, Ocean Engine | 营业执照 + local partner (mandate ≠ license) |
| 10 | **🌍 Африка** | **77** | 17 | 28 | 17 | 15 | 🟠 C | Meta, Google, Jumia | CIPC/CAC/eCitizen + Sumsub (нет unified gov-ID) |

**Tier:** 🟢 S ≥97 · 🟢 A 90–96 · 🟡 B 85–89 · 🟠 C 75–84 · 🔴 D <75

```
Σ v2.1 (10 регионов)
100 ┤ ◉ RU 99
 97 ┤    ● USA
 94 ┤       ● EU  ● CA
 91 ┤             ● UA
 88 ┤                ● BR
 86 ┤                   ● LatAm  ● Asia
 81 ┤                          ● CN
 77 ┤                             ● Africa
    └──────────────────────────────────
```

---

### 🇷🇺 Россия — **99/100** 🟢 S

| Критерий | Балл | Детали |
|----------|------|--------|
| A | 25 | DaData INN/OGRN + **ESIA** (rep ∈ ЕГРЮЛ) + **Diadoc mandate** + ORD auto |
| B | 35 | Yandex/VK API + **pre-mod** (Direct policy + Rivox 102) + Metrika auto |
| C | 20 | YooKassa/crypto → float +30% → org top-up. Auto акт/счёт |
| D | 19 | Metrika + amoCRM/B24. −1 без Calltouch |

**Стек MCP:** SvechaPVL/yandex-mcp · lexamarketolog/vk-ads-mcp · Click.ru TG proxy  
**Потолок 100:** + Calltouch/Roistat → D=20  
**Blocker:** med/finance OKVED (license doc, не pre-mod)

---

### 🇺🇦 Украина — **91/100** 🟢 A

| Критерий | Балл | Детали |
|----------|------|--------|
| A | 23 | **ЄДР** (EDRPOU API/bulk) + **Diia.Signature** mandate + signer ↔ EDR `representationMode`. −2: Diia contract + no RF/BY ties; martial law category limits |
| B | 32 | Google/Meta/TikTok API + pre-mod EN/UA. Нет локального search-гиганта (Yandex недоступен для UA greenfield) |
| C | 19 | LiqPay/WayForPay/UAH float. −1: FX/volatility |
| D | 17 | GA4 + базовый CRM (Kommo/KeyCRM). −3: offline-heavy SME |

**Gov-ID flow:** `submit_edrpou` → EDR lookup → Diia.Signature «уполномочен рекламировать» → Meta/Google org  
**Особенность:** рекламный рынок = **Google + Meta** (не Yandex). ОРД-маркировка UA — отдельный compliance layer (не RU ЕРИР).  
**Потолок 94:** + offline call tracking + stable UAH treasury

---

### 🇨🇳 Китай — **81/100** 🟠 C

| Критерий | Балл | Детали |
|----------|------|--------|
| A | 16 | **营业执照** + ICP备案 + Tencent/Ocean **partner approval**. Mandate помогает liability, **не заменяет license**. −9 |
| B | 32 | tencent-ad-mcp **358 tools** + pre-mod 广告法/censorship corpus. −3: sensitive categories |
| C | 17 | WeChat Pay / CN corporate banking. Crypto banned. −3 |
| D | 16 | Tencent reporting силён once in. −4 cross-channel |

**Парадокс:** лучший API (B=32), худший onboarding (A=16).  
**Стратегия:** только через **local partner WFOE**, не solo agency proxy.

---

### 🇪🇺 Европа — **94/100** 🟢 A

| Критерий | Балл | Детали |
|----------|------|--------|
| A | 23 | **VIES** VAT + **eIDAS** (DE/FR/NL nodes) + mandate. −2: **DSA advertiser registry** (DE, FR, IE, ES — per country) |
| B | 33 | Meta/Google/Taboola API + pre-mod GDPR consent strings + national ad rules |
| C | 20 | SEPA/Stripe/USDC → EUR float +30% |
| D | 18 | GA4 consent mode + CRM. −2: cookie deprecation |

**Подрегионы (A/B variance):**

| Подрегион | Σ | Δ vs EU avg | Примечание |
|-----------|---|-------------|------------|
| Nordics (SE/NO/DK/FI) | **96** | +2 | BankID — лучший gov-ID |
| DACH (DE/AT/CH) | **92** | −2 | DSA DE + strict rules |
| UK | **93** | −1 | post-Brexit, ICO |
| Eastern EU (PL/CZ/RO) | **93** | −1 | eIDAS OK, меньше DSA friction |
| Southern EU (IT/ES/GR) | **92** | −2 | language pre-mod |

---

### 🌏 Азия (без Китая) — **85/100** 🟡 B

Weighted avg: KR 25% · JP 20% · SEA 30% · IN 25%

| Критерий | Балл | Детали |
|----------|------|--------|
| A | 20 | **Нет единого gov-ID**. KR real-name · JP 法人 · SG Singpass · IN DigiLocker — по адаптерам. −5 avg |
| B | 29 | Naver/Kakao/Shopee/Flipkart MCP + Meta/TikTok. −6: 10+ country rule sets |
| C | 19 | Local banking + Stripe. Crypto restricted (KR/JP). −1 |
| D | 17 | Platform reporting OK, cross-channel weak. −3 |

**Подрегионы:**

| Подрегион | Σ | Стек | A blocker |
|-----------|---|------|-----------|
| 🇰🇷 Korea | **88** | Naver + Kakao | agency approval |
| 🇯🇵 Japan | **87** | LY Ads | 法人 + JP creative law |
| 🌏 SEA | **86** | Shopee + Meta + TikTok | 6 countries fragmented |
| 🇮🇳 India | **82** | Flipkart + Meta + Google | GSTIN marketplace |

**Стратегия:** **не один MCP**, а **country adapter layer** + unified orchestrator.

---

### 🇺🇸 Северная Америка (USA) — **97/100** 🟢 S

| Критерий | Балл | Детали |
|----------|------|--------|
| A | 24 | Middesk EIN + state SOS + **DocuSign POA/mandate**. −1: **Meta Business Verification** |
| B | 34 | Google Ads API + Meta Marketing API + pre-mod Ad Standards. −1: political/special ads |
| C | 20 | Stripe ACH/card + USDC → USD float +30% |
| D | 19 | GA4 + offline conv. −1: iOS SKAN |

**Примечание:** Мексика (RFC) = **89** — если нужен continental NA avg (US 90% + MX 10%) → **96**.

---

### 🇨🇦 Канада — **94/100** 🟢 A

| Критерий | Балл | Детали |
|----------|------|--------|
| A | 23 | **Corporations Canada** / provincial registry + **FINTRAC** AML + mandate. −2: bilingual compliance |
| B | 33 | Meta/Google + pre-mod **EN + FR** (Bill 96 Quebec). −2 vs US |
| C | 20 | Stripe CAD + USDC → CAD float |
| D | 18 | GA4 + PIPEDA consent. −2 |

**Отличие от USA:** обязательный **French creative variant** для QC → pre-mod corpus ×2.

---

### 🌎 Южная Америка (без Бразилии) — **86/100** 🟡 B

AR · CL · CO · PE · UY · EC · VE

| Критерий | Балл | Детали |
|----------|------|--------|
| A | 21 | CUIT (AR) / RUT (CL) / NIT (CO) APIs + Sumsub + mandate. −4: registry quality varies |
| B | 30 | Meta + Google + WhatsApp Click-to-WhatsApp. Pre-mod ES. −5: local language nuance |
| C | 18 | Stripe LATAM + USDC. −2: FX (ARS, COP volatility), local rails |
| D | 17 | Meta pixel dominant. −3: offline economies |

**Лидер sub-region:** Chile **88** (stable registry). Argentina **83** (FX/ARS).

---

### 🇧🇷 Бразилия — **88/100** 🟡 B

| Критерий | Балл | Детали |
|----------|------|--------|
| A | 22 | **CNPJ** Receita Federal API + CPF director match + **LGPD** mandate. −3: Nota Fiscal / e-invoicing complexity |
| B | 31 | Meta + Google + TikTok. Pre-mod **PT-BR**. −4: ANPD / consumer protection strict |
| C | 18 | Pix + boleto + Stripe. −2: Pix reconciliation automation |
| D | 17 | Meta + GA4. −3 |

**Отличие от LatAm ex-BR:** CNPJ API сильный (лучше A), но **Nota Fiscal + LGPD** сложнее C.

---

### 🌍 Африка — **77/100** 🟠 C

| Критерий | Балл | Детали |
|----------|------|--------|
| A | 17 | **Нет unified gov-ID**. ZA CIPC · NG CAC · KE eCitizen · Sumsub fallback. −8 |
| B | 28 | Meta (dominant mobile) + Google. Pre-mod mobile-first landing. −7: bandwidth, language diversity |
| C | 17 | M-Pesa · Flutterwave · Paystack · USDC. −3: multi-currency, float FX |
| D | 15 | Weak pixel/CRM adoption. −5 offline |

**Подрегионы:**

| Подрегион | Σ | Стек | Примечание |
|-----------|---|------|------------|
| 🇿🇦 South Africa | **82** | Meta + Google | CIPC OK, best infra |
| 🇳🇬 Nigeria | **78** | Meta + Google | CAC + Flutterwave |
| 🇰🇪 Kenya | **78** | Meta + Google | M-Pesa native |
| 🌍 Rest (15+ countries) | **72** | Meta only | Sumsub-heavy, manual A |

**Стратегия:** Meta-first mobile agency proxy; **не пытаться unified A** — country adapter + Sumsub.

---

## Сравнительная матрица возможностей

| Возможность | RU | UA | CN | EU | Asia | USA | CA | LatAm | BR | AF |
|-------------|:--:|:--:|:--:|:--:|:--:|:---:|:--:|:-----:|:--:|:--:|
| Auto org create | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Gov-ID rep verify | ✅ ESIA | ✅ Diia | ❌ | ✅ eIDAS | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ |
| Pre-mod → 95%+ accept | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Float +30% cushion | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| Crypto client pay | ✅ | ⚠️ | ❌ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Local search ads | ✅ Yandex | ❌ | ✅ Tencent | ❌ | ✅ Naver | ❌ | ❌ | ❌ | ❌ | ❌ |
| MCP write depth | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐ |
| **Σ v2.1** | **99** | **91** | **81** | **94** | **85** | **97** | **94** | **86** | **88** | **77** |

---

## Приоритет rollout (10 регионов)

| Phase | Регион | Σ | Зачем |
|-------|--------|---|-------|
| **P0** | 🇷🇺 Россия | 99 | MVP, полный стек, ESIA |
| **P1** | 🇺🇸 USA | 97 | scale, Koast-pattern Meta |
| **P1** | 🇺🇦 Украина | 91 | Diia + EDR, Google/Meta, low friction |
| **P2** | 🇪🇺 Europe | 94 | eIDAS unified adapter |
| **P2** | 🇨🇦 Canada | 94 | US codebase + FR pre-mod |
| **P3** | 🇧🇷 Brazil | 88 | CNPJ strong, Nota Fiscal adapter |
| **P3** | 🌎 LatAm | 86 | ES corpus reuse from BR |
| **P4** | 🌏 Asia | 85 | country-by-country adapters |
| **P5** | 🇨🇳 China | 81 | local partner only |
| **P5** | 🌍 Africa | 77 | Meta mobile, Sumsub A |

---

## Связанные документы

- [agency-proxy-100-architecture.md](./agency-proxy-100-architecture.md) — v1 схема (93 RU)
- [full-cycle-agencies.md](./full-cycle-agencies.md) — KDirect 77, Koast 71
- [asia-platforms-mcp.md](./asia-platforms-mcp.md) · [cis-platforms-mcp.md](./cis-platforms-mcp.md)
