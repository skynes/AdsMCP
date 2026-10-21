# Asian Advertising Platforms × MCP

> **Date:** October 2026  
> **Regions:** China, Korea, Japan, SEA, India · + TikTok/Amazon FE  
> **Source:** [asia-platforms-mcp.md](../../../asia-platforms-mcp.md)

Google/Meta are not the only options — **15+ Asian MCPs** already exist.

---

## TL;DR

| Region | Official MCP | Community MCP | API only (no MCP) |
|--------|-------------|---------------|-------------------|
| **China** | ✅ Tencent Marketing MCP | Ocean Engine, tencent-ad-mcp (358 tools) | Baidu, Xiaohongshu |
| **Korea** | ❌ | Naver SearchAd, Kakao Moment/Keyword, KoreanAds | Naver GFA |
| **Japan** | ⏳ LY Ads MCP (announced Sep 2026) | — | LY Ads API |
| **SEA** | ❌ | Shopee Ads (mcp-shopee-seller) | Lazada Ads, Grab Ads |
| **India** | ❌ | Flipkart Seller MCP (ads module) | Meesho |
| **Global/Asia** | ✅ TikTok Agentic Hub, Amazon Ads FE | impremishub TikTok RO | — |

**Leaders by depth:** Tencent official + community (358 tools) · Naver/Kakao (Korea stack) · Ocean Engine (ByteDance CN) · Shopee/Flipkart (marketplace ads)

---

## Summary Table

| # | Platform | Country | MCP | Endpoint / Repo | Tools | Write | OSS | Σ |
|---|----------|---------|-----|-----------------|-------|-------|-----|---|
| 1 | **Tencent Marketing** | CN | ✅ official | `ai.e.qq.com/mcp-servers/*` | 27+ | ✅ | No | **49** |
| 2 | **tencent-ad-mcp** | CN | community | [andyleimc-source/tencent-ad-mcp](https://github.com/andyleimc-source/tencent-ad-mcp) | **358** | ✅ | Yes | **52** |
| 3 | **Ocean Engine** | CN | community | [virgoC0der/go-mcp](https://github.com/virgoC0der/go-mcp) | 6+ | ⚠️ opt-in | Yes | **44** |
| 4 | **Naver SearchAd** (write) | KR | community | [@packative/naver-searchad-mcp](https://www.npmjs.com/package/@packative/naver-searchad-mcp) | **47** | ✅ | Yes | **47** |
| 5 | **Kakao Moment** (write) | KR | community | [kakao-moment-mcp PyPI](https://pypi.org/project/kakao-moment-mcp/) | 13+ | ✅ | Yes | **44** |
| 6 | **KoreanAds** | KR | ✅ hosted | `https://koreanads.com/mcp` | 12 | ❌ planning | No | **19** |
| 7 | **Shopee Ads** | SEA | community | [mcp-shopee-seller](https://pypi.org/project/mcp-shopee-seller/) | 8 ads | ✅ | Yes | **41** |
| 8 | **Flipkart Ads** | IN | community | [ron2111/flipkart-seller-mcp](https://github.com/ron2111/flipkart-seller-mcp) | ads module | ✅ | Yes | **41** |
| 9 | **TikTok Ads** | CN/Global | ✅ official | Agentic Hub | many | ✅ | No | **55** |
| 10 | **Amazon Ads FE** | JP/AU/SG | ✅ official | Hosted beta | many | ✅ | Partial | **59** |

---

## China

### Tencent Marketing MCP — official

| Field | Value |
|-------|-------|
| Portal | https://developers.e.qq.com/mcp |
| Endpoints | `ai.e.qq.com/mcp-servers/adgroup`, `/creative`, `/ad-report`, `/assets` |
| Platforms | Tencent Ads, WeChat marketing, Youlianghui |
| Score | A=0 · B=28 · C=5 · D=16 → **49** |

### tencent-ad-mcp — community, 358 tools

| Field | Value |
|-------|-------|
| GitHub | [andyleimc-source/tencent-ad-mcp](https://github.com/andyleimc-source/tencent-ad-mcp) |
| Coverage | Full Marketing API v3.0: adgroups, creatives, reports, audiences, WeChat channels |
| Score | **52** — deepest CN MCP |

### Ocean Engine MCP (ByteDance domestic)

| Field | Value |
|-------|-------|
| GitHub | [virgoC0der/go-mcp](https://github.com/virgoC0der/go-mcp) |
| Platforms | 巨量广告, 巨量千川, 本地推, 星图 |
| Write | `OCEANENGINE_ENABLE_WRITES=1` |
| Note | TikTok Ads international = separate official MCP. Ocean Engine = **domestic China** |
| Score | **44** |

### No MCP yet (API exists)

| Platform | API | Notes |
|----------|-----|-------|
| **Baidu 推广** | ✅ Search Feed API | Baidu Cloud has AI MCP servers — NOT for Baidu Ads |
| **Xiaohongshu 聚光** | ✅ Marketing API | Partner-gated — MCP wrapper opportunity |
| **Weibo 粉丝通** | ✅ API | No MCP found |

---

## Korea — PlatAid ecosystem

PlatAid family (shared OAuth architecture, Cloud Run hosted):

| Platform | Repo | Tools | Write |
|----------|------|-------|-------|
| **Naver SearchAd** | [PlatAid/naver-searchad-mcp](https://github.com/PlatAid/naver-searchad-mcp) | 20+ | RO |
| **Naver SearchAd** (alt) | [@packative/naver-searchad-mcp](https://www.npmjs.com/package/@packative/naver-searchad-mcp) | **47** | ✅ full CRUD |
| **Kakao Moment** | [PlatAid/kakao-moment-mcp](https://github.com/PlatAid/kakao-moment-mcp) | 24 | RO |
| **Kakao Moment** (write) | [kakao-moment-mcp PyPI](https://pypi.org/project/kakao-moment-mcp/) | 13+ | ✅ budget/bid/status |
| **Kakao Keyword Ads** | [PlatAid/kakao-keywordad-mcp](https://github.com/PlatAid/kakao-keywordad-mcp) | 21 | RO |

**KoreanAds** — different category: media planning MCP, not campaign CRUD (`https://koreanads.com/mcp`, Σ=19).

---

## Japan — LY Ads

| Event | Date | Detail |
|-------|------|--------|
| LINE + Yahoo Japan merge | Apr 1, 2026 | **LY Ads Display Ads** unified platform |
| LINE Ads sunset | ~Oct 2026 | Migrate to LY Ads Display Ads |
| **LY Ads MCP Server** | Announced Sep 15, 2026 | Developer Center — tool list not public yet |

**Gap:** No community LY Ads / Yahoo Japan Search Ads MCP yet — greenfield (~2 weeks with LY Ads API).

---

## Southeast Asia — Marketplace ads

### Shopee Ads ✅

| Field | Value |
|-------|-------|
| Package | [mcp-shopee-seller](https://pypi.org/project/mcp-shopee-seller/) v0.5.0 |
| Ads tools | get_ads_balance, create_ads_campaign, pause_ads, resume_ads, delete_ads |
| Regions | MY, ID, SG, TH, VN, PH, TW, BR |
| Score | **41** |

### Lazada / Grab / Tokopedia

| Platform | MCP | Ads? |
|----------|-----|------|
| **Lazada** | [@aisar-labs/lazada-mcp](https://www.npmjs.com/package/@aisar-labs/lazada-mcp) | ❌ seller only |
| **Grab** | [@aisar-labs/grab-merchant-mcp](https://www.npmjs.com/package/@aisar-labs/grab-merchant-mcp) | ❌ food merchant, not GrabAds |
| **TikTok Shop** | [@aisar-labs/tiktok-shop-mcp](https://www.npmjs.com/package/@aisar-labs/tiktok-shop-mcp) | ❌ e-commerce, not TikTok Ads |

---

## India

### Flipkart Ads ✅ (via Seller MCP)

| Field | Value |
|-------|-------|
| GitHub | [ron2111/flipkart-seller-mcp](https://github.com/ron2111/flipkart-seller-mcp) |
| Tool | `flipkart_manage_ads`: list_campaigns, get_metrics, update_budget, update_bid |
| Types | PLA, PCA, Smart ROI |
| Score | **41** |

**Meesho:** Supplier API only — no MCP, no ads API.

---

## Global platforms with Asia relevance

| Platform | Asia connection | MCP |
|----------|----------------|-----|
| **TikTok Ads** | ByteDance; huge in SEA | ✅ Official Agentic Hub (Jun 2026) |
| **Amazon Ads** | FE region: JP, AU, SG, IN | ✅ Official; `set_active_region fe` |
| **Criteo** | Strong in JP/KR retail media | ✅ Official + Synter |
| **PubMatic** | SSP, strong APAC | ✅ `mcp.pubmatic.com` |

---

## Asia vs Google — MCP maturity

```
                    MCP maturity (advertising)
    high ┤  Tencent (358)  TikTok official  Amazon FE
         │  Naver/Kakao (KR)   Ocean Engine
    mid  ┤  Shopee/Flipkart ads   mcp-cn-commerce
    low  ┤  KoreanAds (planning)  Baidu AI MCP (not ads)
    none ┤  Baidu 推广  Xiaohongshu  Lazada Ads  Meesho
         └──────────────────────────────────────────────
              CN      KR      JP      SEA     IN
```

**Conclusion:** Google is not the only option — **official MCP** exists at Tencent, TikTok, Amazon; **community** covers Naver, Kakao, Ocean Engine, Shopee, Flipkart.

---

## Greenfield opportunities

| Platform | Region | API maturity | Priority |
|----------|--------|-------------|----------|
| **Xiaohongshu 聚光** | CN | High (batch CRUD) | ⭐⭐⭐ |
| **Baidu 推广** | CN | High | ⭐⭐⭐ |
| **LY Ads Search/Display** | JP | API renamed, stable domains | ⭐⭐⭐ |
| **Lazada Sponsored** | SEA | Medium | ⭐⭐ |
| **GrabAds** | SEA | Medium | ⭐⭐ |
| **Naver GFA** | KR | Partner-only | ⭐⭐ |

---

## PlatAid Korea stack — architectural pattern

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
```

Model for other Asian markets: one auth layer → per-platform MCP servers.

*Source: [adsMCP/asia-platforms-mcp.md](../../../asia-platforms-mcp.md)*
