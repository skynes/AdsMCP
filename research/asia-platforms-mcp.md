# Азиатские рекламные площадки × MCP

> Дата: 3 октября 2026  
> Регионы: Китай, Корея, Япония, SEA, Индия · + TikTok/Amazon FE  
> Google/ Meta — не единственные: **15+ азиатских MCP** уже существуют

---

## TL;DR

| Регион | Official MCP | Community MCP | API only (нет MCP) |
|--------|-------------|---------------|-------------------|
| **Китай** | ✅ Tencent Marketing MCP | Ocean Engine, mcp-cn-commerce, tencent-ad-mcp (358 tools) | Baidu 推广, Xiaohongshu 聚光 |
| **Корея** | ❌ | Naver SearchAd, Kakao Moment, Kakao Keyword, KoreanAds | Naver GFA |
| **Япония** | ⏳ LY Ads MCP (announced Sep 2026) | — | LY Ads API (бывш. Yahoo Japan) |
| **SEA** | ❌ | Shopee Ads (mcp-shopee-seller), aisar-labs SEA suite | Lazada Ads, Grab Ads |
| **Индия** | ❌ | Flipkart Seller MCP (ads module) | Meesho |
| **Global/Asia** | ✅ TikTok Agentic Hub, Amazon Ads FE | impremishub TikTok RO | — |

**Лидеры по глубине:** Tencent official + community (358 tools) · Naver/Kakao (Korea stack) · Ocean Engine (ByteDance CN) · Shopee/Flipkart (marketplace ads)

---

## Сводная таблица

| # | Платформа | Страна | MCP | Endpoint / Repo | Tools | Write | OSS | Σ† |
|---|-----------|--------|-----|-----------------|-------|-------|-----|-----|
| 1 | **Tencent Marketing** (腾讯营销) | CN | ✅ **official** | `ai.e.qq.com/mcp-servers/*` | 27+ basic, 6 fast | ✅ | Нет | **49** |
| 2 | **tencent-ad-mcp** | CN | community | [andyleimc-source/tencent-ad-mcp](https://github.com/andyleimc-source/tencent-ad-mcp) | **358** | ✅ | **Да** | **52** |
| 3 | **Ocean Engine** (巨量引擎) | CN | community | [virgoC0der/go-mcp](https://github.com/virgoC0der/go-mcp) | 6+ | ⚠️ opt-in | **Да** | **44** |
| 4 | **mcp-cn-commerce** | CN | community | [hhx465453939/mcp-cn-commerce](https://github.com/hhx465453939/mcp-cn-commerce) | multi | ⚠️ RO | **Да** | **27** |
| 5 | **Naver SearchAd** (네이버) | KR | community | [PlatAid/naver-searchad-mcp](https://github.com/PlatAid/naver-searchad-mcp) | 20+ | ❌ RO | **Да** | **22** |
| 6 | **Naver SearchAd** (write) | KR | community | [@packative/naver-searchad-mcp](https://www.npmjs.com/package/@packative/naver-searchad-mcp) | **47** | ✅ | **Да** | **47** |
| 7 | **Kakao Moment** (카카오모먼트) | KR | community | [PlatAid/kakao-moment-mcp](https://github.com/PlatAid/kakao-moment-mcp) | 24 | ❌ RO | **Да** | **21** |
| 8 | **Kakao Moment** (write) | KR | community | [kakao-moment-mcp](https://pypi.org/project/kakao-moment-mcp/) | 13+ | ✅ | **Да** | **44** |
| 9 | **Kakao Keyword Ads** | KR | community | [PlatAid/kakao-keywordad-mcp](https://github.com/PlatAid/kakao-keywordad-mcp) | 21 | ❌ RO | **Да** | **21** |
| 10 | **KoreanAds** | KR | ✅ hosted | `https://koreanads.com/mcp` | 12 | ❌ planning | Нет | **19** |
| 11 | **LY Ads** (LINE+Yahoo JP) | JP | ⏳ announced | Developer Center Sep 2026 | TBD | TBD | — | **—** |
| 12 | **Shopee Ads** | SEA | community | [mcp-shopee-seller](https://pypi.org/project/mcp-shopee-seller/) | 8 ads | ✅ | **Да** | **41** |
| 13 | **Flipkart Ads** | IN | community | [ron2111/flipkart-seller-mcp](https://github.com/ron2111/flipkart-seller-mcp) | ads module | ✅ | **Да** | **41** |
| 14 | **TikTok Ads** | CN/Global | ✅ **official** | Agentic Hub | many | ✅ | Нет | **55** |
| 15 | **Amazon Ads FE** | JP/AU/SG | ✅ **official** | Hosted beta | many | ✅ | Частично | **59** |
| 16 | **Baidu 推广** | CN | ❌ | — | — | — | — | **—** |
| 17 | **Xiaohongshu 聚光** | CN | ❌ | API only (partner-gated) | — | — | — | **—** |
| 18 | **Lazada Ads** | SEA | ❌ | [@aisar-labs/lazada-mcp](https://www.npmjs.com/package/@aisar-labs/mcp-lazada) — seller, **не ads** | — | — | — | **—** |

† Σ = A+B+C+D strict scoring (demand-side context). KoreanAds — media planning, не campaign CRUD.

---

## По регионам

### 🇨🇳 Китай — самый насыщенный MCP-ландшафт

#### Tencent Marketing MCP — **official**

| Поле | Значение |
|------|----------|
| Portal | https://developers.e.qq.com/mcp |
| Endpoints | `ai.e.qq.com/mcp-servers/adgroup`, `/creative`, `/ad-report`, `/assets` |
| Tools | Basic MCP: create/update/get adgroups, dynamic creatives, daily/hourly reports, marketing assets |
| Fast MCP | Scenario-based: 40+ params → 4 required (WeChat mini-games, etc.) |
| Platforms | Tencent Ads, WeChat marketing, 优量汇 (Youlianghui) |

**Оценка:** A=0 · B=28 · C=5 · D=16 → **49**

#### tencent-ad-mcp — community, **358 tools**

| Поле | Значение |
|------|----------|
| GitHub | [andyleimc-source/tencent-ad-mcp](https://github.com/andyleimc-source/tencent-ad-mcp) |
| Coverage | Full Marketing API v3.0: adgroups, creatives, reports, audiences, funds, leads, WeChat channels, landing pages, AI creatives |
| Auth | OAuth auto-refresh, `TENCENT_AD_*` env vars |

**Оценка:** A=0 · B=30 · C=5 · D=17 → **52** — deepest CN MCP

#### Ocean Engine MCP (巨量引擎 / ByteDance domestic)

| Поле | Значение |
|------|----------|
| GitHub | [virgoC0der/go-mcp](https://github.com/virgoC0der/go-mcp) |
| Platforms | 巨量广告, 巨量千川, 本地推, 星图 |
| Tools | `oceanengine_list_campaigns`, `oceanengine_list_ads`, `oceanengine_get_report`, optional status/budget writes |
| Write | `OCEANENGINE_ENABLE_WRITES=1` |

**Note:** TikTok Ads international = separate official MCP. Ocean Engine = **domestic China** ByteDance ads.

**Оценка:** A=0 · B=24 · C=5 · D=15 → **44**

#### mcp-cn-commerce — multi-platform CN e-commerce + ads read

| Platform | Type | MCP status |
|----------|------|------------|
| 巨量引擎 / 千川 | Ads | ✅ read (reports, plans, balance) |
| 抖店 | E-commerce | ✅ orders/products |
| 淘宝 / 拼多多 / 京东 / 快手 / 小红书 / 微信小店 | E-commerce | ✅ read |

GitHub: [hhx465453939/mcp-cn-commerce](https://github.com/hhx465453939/mcp-cn-commerce) — **не** full ads write, но covers CN commerce stack.

#### ❌ Нет MCP (API only)

| Platform | API | Notes |
|----------|-----|-------|
| **Baidu 推广** (百度营销) | ✅ Search Feed API | Baidu Cloud has 13 AI MCP servers — **NOT** for Baidu Ads |
| **Baidu 优选 MCP** | E-commerce | Product search/comparison — not ad buying |
| **Xiaohongshu 聚光** | ✅ Marketing API | Partner-gated; campaigns/creatives CRUD — **MCP wrapper opportunity** |
| **Weibo 粉丝通** | ✅ API | No MCP found |

---

### 🇰🇷 Корея — сильнейший community MCP stack в Азии

PlatAid ecosystem (shared OAuth architecture, Cloud Run hosted):

| Platform | Repo | Tools | Write | Transport |
|----------|------|-------|-------|-----------|
| **Naver SearchAd** | [PlatAid/naver-searchad-mcp](https://github.com/PlatAid/naver-searchad-mcp) | 20+ | RO | stdio + hosted OAuth |
| **Naver SearchAd** (alt) | [@packative/naver-searchad-mcp](https://www.npmjs.com/package/@packative/naver-searchad-mcp) | **47** | ✅ full CRUD | npm |
| **Kakao Moment** | [PlatAid/kakao-moment-mcp](https://github.com/PlatAid/kakao-moment-mcp) | 24 | RO | Kakao Business OAuth |
| **Kakao Moment** (alt) | [kakao-moment-mcp PyPI](https://pypi.org/project/kakao-moment-mcp/) | 13+ | ✅ budget/bid/status | stdio |
| **Kakao Keyword Ads** | [PlatAid/kakao-keywordad-mcp](https://github.com/PlatAid/kakao-keywordad-mcp) | 21 | RO | same auth as Moment |

**KoreanAds** — другая категория: media planning MCP, не campaign management.

| Field | Value |
|-------|-------|
| URL | https://koreanads.com/mcp |
| Tools | 12: ad product search, media mix, brief recommendations, pricing |
| Use case | **Media buyer planning** Korean inventory — DB-grounded, not live campaign CRUD |

**❌ Naver GFA** (성과형 디스플레이) — separate partner-only API, out of scope for SearchAd MCP.

---

### 🇯🇵 Япония — LY Ads интеграция + MCP анонс

| Event | Date | Detail |
|-------|------|--------|
| LINE + Yahoo Japan merge | Apr 1, 2026 | **LY Ads Display Ads** unified platform |
| LINE Ads sunset | ~Oct 2026 | Migrate to LY Ads Display Ads |
| Yahoo Japan Ads API → | Renamed | **LY Ads API** (domains unchanged) |
| **LY Ads MCP Server** | Announced Sep 15, 2026 | Developer Center — **tool list not public yet** |

**Publisher side:** LY Ads Network (App) — monetization SDK for LINE+Yahoo inventory (like AdMob). No MCP for publishers found.

**Gap:** No community LY Ads / Yahoo Japan Search Ads MCP yet — **greenfield** (~2 weeks with LY Ads API).

---

### 🌏 Southeast Asia — marketplace ads via seller MCP

#### Shopee Ads ✅

| Field | Value |
|------|----------|
| Package | [mcp-shopee-seller](https://pypi.org/project/mcp-shopee-seller/) v0.5.0 |
| Ads tools | `get_ads_balance`, `get_ads_shop_info`, `get_ads_daily_performance`, `get_recommended_keywords`, `create_ads_campaign`, `pause_ads`, `resume_ads`, `delete_ads` |
| Regions | MY, ID, SG, TH, VN, PH, TW, BR |
| Also | [sellabot-mcp](https://github.com/RextonWong/sellabot-mcp), [@aisar-labs/mcp-shopee](https://www.npmjs.com/package/@aisar-labs/mcp-shopee) — seller ops, limited ads |

**Оценка:** A=0 · B=22 · C=5 · D=14 → **41**

#### Lazada / Grab / Tokopedia

| Platform | MCP | Ads? |
|----------|-----|------|
| **Lazada** | [@aisar-labs/lazada-mcp](https://www.npmjs.com/package/@aisar-labs/mcp-lazada) | ❌ seller only (products, orders) |
| **Grab** | [@aisar-labs/grab-merchant-mcp](https://www.npmjs.com/package/@aisar-labs/grab-merchant-mcp) | ❌ food merchant, not GrabAds |
| **Tokopedia** | [@aisar-labs/tokopedia-mcp](https://www.npmjs.com/package/@aisar-labs/tokopedia-mcp) | ❌ seller only |
| **TikTok Shop** | [@aisar-labs/tiktok-shop-mcp](https://www.npmjs.com/package/@aisar-labs/tiktok-shop-mcp) | ❌ e-commerce, not TikTok Ads |

**aisar-labs/zeptoclaw-sea** — 35 MCP servers for SEA business automation; **none dedicated to Lazada/Grab advertising APIs**.

---

### 🇮🇳 Индия

#### Flipkart Ads ✅ (via Seller MCP)

| Field | Value |
|------|----------|
| GitHub | [ron2111/flipkart-seller-mcp](https://github.com/ron2111/flipkart-seller-mcp) |
| Tool | `flipkart_manage_ads`: list_campaigns, get_metrics, update_budget, update_bid |
| Types | PLA, PCA, Smart ROI |
| Auth | Flipkart Seller Hub Developer Access + Ads scope |

**Also:** Flipkart **Saarthi** (Aug 2026) — AI campaign dashboard in-platform, not MCP.

**Оценка:** A=0 · B=22 · C=5 · D=14 → **41**

#### Meesho ❌

Supplier API (partner-gated) — catalog, orders, returns. **No MCP, no ads API.**

---

## Global platforms with Asia relevance

| Platform | Asia connection | MCP |
|----------|----------------|-----|
| **TikTok Ads** | ByteDance; huge in SEA | ✅ Official Agentic Hub (Jun 2026) |
| **Amazon Ads** | FE region: JP, AU, SG, IN | ✅ Official; `set_active_region fe` |
| **Criteo** | Strong in JP/KR retail media | ✅ Official + Synter |
| **PubMatic** | SSP, strong APAC | ✅ `mcp.pubmatic.com` |

---

## Сравнение: Азия vs Google

```
                    MCP maturity (advertising)
    high ┤  Tencent (358)  TikTok official  Amazon FE
         │  Naver/Kakao (KR)   Ocean Engine
         │  Tencent official
    mid  ┤  Shopee/Flipkart ads   mcp-cn-commerce
         │  Flipkart Saarthi (in-app AI, not MCP)
    low  ┤  KoreanAds (planning)  Baidu AI MCP (not ads)
         │  LY Ads MCP ⏳
    none ┤  Baidu 推广  Xiaohongshu  Lazada Ads  Meesho
         └──────────────────────────────────────────────
              CN      KR      JP      SEA     IN
```

**Вывод:** Google **не** единственный — в Азии **official MCP** уже есть у Tencent, TikTok, Amazon; **community** покрывает Naver, Kakao, Ocean Engine, Shopee, Flipkart. Пробелы: Baidu, Xiaohongshu, Lazada Ads, LY Ads (API есть, MCP скоро).

---

## Greenfield opportunities (API ✅, MCP ❌)

| Platform | Region | API maturity | Priority |
|----------|--------|-------------|----------|
| **Xiaohongshu 聚光** | CN | High (batch CRUD) | ⭐⭐⭐ |
| **Baidu 推广** | CN | High | ⭐⭐⭐ |
| **LY Ads Search/Display** | JP | API renamed, stable domains | ⭐⭐⭐ |
| **Lazada Sponsored** | SEA | Medium | ⭐⭐ |
| **GrabAds** | SEA | Medium | ⭐⭐ |
| **Naver GFA** | KR | Partner-only | ⭐⭐ |
| **Meesho** | IN | No ads API | ⭐ |

---

## PlatAid Korea stack — архитектурный паттерн

```
┌─────────────────────────────────────────────────┐
│  PlatAid MCP Family (shared Kakao Business OAuth) │
├─────────────────────────────────────────────────┤
│  naver-searchad-mcp    │ Search ads RO + write  │
│  kakao-moment-mcp      │ Display/social RO      │
│  kakao-keywordad-mcp   │ Search ads RO          │
│  kakao-moment-mcp PyPI │ Display write (budget) │
└─────────────────────────────────────────────────┘
         Cloud Run hosted + stdio local
         Google Workspace OAuth OR Kakao Business OAuth
```

Модель для других азиатских рынков: один auth layer → per-platform MCP servers.

---

## Связанные документы

- [master-scores.md](./master-scores.md) — общие баллы
- [publisher-supply-mcp.md](./publisher-supply-mcp.md) — supply-side / площадки
- [new-names-round2.md](./new-names-round2.md) — round 2 findings
- [research-matrix.md](./research-matrix.md) — Yandex/VK в основной матрице
- [cis-platforms-mcp.md](./cis-platforms-mcp.md) — СНГ/RU: LidFly, Click.ru, Ozon, Avito
