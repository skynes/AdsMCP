# Ads MCP Master Matrix Summary

> **Date:** October 2026  
> **Source:** [master-unified.md](../../master-unified.md) · 110+ services · strict **Σ = A + B + C + D** (max 100)

---

## Methodology

| Criterion | Max | Meaning |
|-----------|-----|---------|
| **A** Registration | 25 | 0 = OAuth to existing account; 5 = Telegram login; 10 = Amazon create-account tool |
| **B** Campaign launch | 35 | 0–8 read-only · 22–28 community write · 28–32 hosted write+confirm |
| **C** Payment | 20 | 5 = UI billing only · 12 = TON partial · 15–18 = USDC/crypto |
| **D** Metrics | 20 | 12–14 basic · 18–20 cross-platform + audit |

**Penalties:** Playwright −5 · beta −3…−5 · CSV-only B≤15  
**Context:** Scores assume a **ready ad account**. Media-buying ceiling ≈ **60/100** (A=0, C=5).

**Categories:** `AGG` aggregator · `PLT` per-platform · `CIS` CIS/RU · `ASIA` Asia · `DSP` display/programmatic · `SUP` supply/publisher · `APP` in-app monetization · `AGT` closed agent (not MCP)

**Write flag (W):** ✅ full · ⚠️ partial/gated · ❌ read-only

---

## Ecosystem Map (October 2026)

```
                         GLOBAL ADS MCP UNIFIED LANDSCAPE
    ┌──────────────────────────────────────────────────────────────────────┐
    │  HOSTED AGGREGATORS (Global)          HOSTED AGGREGATORS (Regional)   │
    │  Synter 60 · getmcpads 58            LidFly 53 (RU) · Ask Ads 39     │
    │  PaidSync 57 · AdManage 57             Click.ru 46 (agency RU)       │
    │  MCP Ads 54 · Windsor 53               KoreanAds 19 (KR planning)    │
    └────────────────────────────┬─────────────────────────────────────────┘
                                 │
    ┌────────────────────────────┼─────────────────────────────────────────┐
    │  US/EU PLATFORMS           │  CIS/RU              │  ASIA               │
    │  Amazon 59 · Taboola 57    │  Yandex 57           │  Tencent 52         │
    │  Google 54–56 · Meta 52    │  Telegram 52         │  Naver 47           │
    │  TikTok 55 · Propeller 56  │  LidFly 53           │  Kakao 44           │
    │  Reddit 48–57              │  VK 49               │  Ocean Engine 44    │
    └────────────────────────────┼──────────────────────┼─────────────────────┘
                                 │                      │
    ┌────────────────────────────┴──────────────────────┴─────────────────────┐
    │  DISPLAY / PROGRAMMATIC          SUPPLY / PUBLISHER                      │
    │  Taboola · PropellerAds · Criteo  Kevel 52 · IAB Seller 51 · AdMob 49   │
    │  DV360 · TTD via Synter/cesteral  Kadam pub 45 · GAM community 48        │
    └────────────────────────────┬─────────────────────────────────────────────┘
                                 │
    ┌────────────────────────────┴─────────────────────────────────────────────┐
    │  AI-NATIVE (in-app): Adgentek 62 · Agentic Ads 61 · Hive Ad-Bid 56       │
    └──────────────────────────────────────────────────────────────────────────┘
```

---

## Top 30 Services (strict Σ, descending)

| # | Service | Cat | Region | Platform | A | B | C | D | **Σ** | W | OSS |
|---|---------|-----|--------|----------|---|---|---|---|-------|---|-----|
| 1 | [Adgentek AdsMCP](https://adsmcp.ai/) | APP | Global | In-app monetization | 15 | 15 | 15 | 12 | **62** | ✅ | Yes |
| 2 | [Agentic Ads](https://github.com/nicofains1/agentic-ads) | APP | Global | Agent ad network | 15 | 20 | 12 | 14 | **61** | ✅ | Yes |
| 3 | [Synter](https://syntermedia.ai) | AGG | Global | 27 platforms | 0 | 32 | 5 | 18 | **60** | ✅ | Yes |
| 4 | [Pixero AI](https://pixero.ai) | AGT | Global | Multi (agent) | 0 | 32 | 5 | 18 | **60** | ✅ | No |
| 5 | [Amazon Ads MCP](https://advertising-ai.amazon.com/mcp) | PLT | Global | Amazon | 10 | 28 | 5 | 16 | **59** | ✅ | No |
| 6 | [getmcpads.com](https://getmcpads.com) | AGG | Global | 14 platforms | 0 | 30 | 5 | 18 | **58** | ✅ | Partial |
| 7 | [Pixel / Metadata agent](https://metadata.io) | AGT | Global | B2B ads | 0 | 30 | 5 | 18 | **58** | ✅ | No |
| 8 | [PaidSync](https://paidsync.ai) | AGG | Global | 14 incl. OpenAI Ads | 0 | 32 | 5 | 20 | **57** | ✅ | Partial |
| 9 | [Markifact](https://markifact.com) | AGG | Global | 20+ | 0 | 29 | 5 | 18 | **57** | ✅ | Partial |
| 10 | [Blend MCP](https://blend-ai.com/mcp) | AGG | Global | 8 | 0 | 30 | 5 | 17 | **57** | ✅ | No |
| 11 | [AdManage.ai](https://admanage.ai/mcp) | AGG | Global | 9 | 0 | 32 | 5 | 15 | **57** | ✅ | No |
| 12 | [Taboola Realize](https://github.com/taboola/realize-mcp) | DSP | Global | Taboola native | 0 | 30 | 5 | 17 | **57** | ✅ | Yes |
| 13 | [SvechaPVL/yandex-mcp](https://github.com/SvechaPVL/yandex-mcp) | CIS | RU | Yandex Direct+Metrika | 0 | 30 | 5 | 17 | **57** | ✅ | Yes |
| 14 | [Yurich-ru/yandex-ads-mcp](https://github.com/Yurich-ru/yandex-ads-mcp) | CIS | RU | Yandex 152 tools | 0 | 30 | 5 | 17 | **57** | ✅ | Yes |
| 15 | [Adspirer](https://adspirer.com) | AGG | Global | 6+ | 0 | 30 | 5 | 16 | **56** | ✅ | Partial |
| 16 | [PropellerAds MCP](https://github.com/propellerads/propeller-mcp) | DSP | Global | Push/Pop/TG | 0 | 30 | 5 | 16 | **56** | ✅ | Yes |
| 17 | [getmcpads Google/Meta](https://getmcpads.com) | PLT | Global | Google/Meta | 0 | 28 | 5 | 18 | **56** | ✅ | Partial |
| 18 | [Hive Ad-Bid](https://github.com/srotzin/hive-ad-bid) | APP | Global | USDC CPM auction | 10 | 18 | 18 | 10 | **56** | ✅ | Yes |
| 19 | [TikTok Agentic Hub](https://ads.tiktok.com/) | PLT | Global/Asia | TikTok | 0 | 30 | 5 | 15 | **55** | ✅ | No |
| 20 | [akelaonline/MCP-Google-Ads](https://github.com/akelaonline/MCP-Google-Ads) | PLT | Global | Google | 0 | 28 | 5 | 17 | **55** | ✅ | Yes |
| 21 | [gmen1057/yandex-direct-mcp](https://github.com/gmen1057/yandex-direct-mcp) | CIS | RU | Yandex Direct | 0 | 30 | 5 | 15 | **55** | ✅ | Yes |
| 22 | [Criteo MCP](https://criteo.com) | DSP | Global | Criteo | 0 | 28 | 5 | 17 | **55** | ✅ | No |
| 23 | [InsightfulPipe](https://insightfulpipe.com) | AGG | Global | 46 sources | 0 | 27 | 5 | 18 | **55** | ⚠️ | No |
| 24 | [Pipeboard](https://pipeboard.co) | AGG | Global | 5 | 0 | 28 | 5 | 17 | **55** | ✅ | Partial |
| 25 | [Muze AI](https://muzecmo.com) | AGT | Global | Multi agent | 0 | 28 | 5 | 17 | **55** | ✅ | No |
| 26 | [MCP Ads](https://mcp-ads.com) | AGG | Global | 10+ (3363 actions) | 0 | 31 | 5 | 18 | **54** | ✅ | Yes |
| 27 | [AdKit](https://adkit.so) | AGG | Global | 7+ | 0 | 27 | 5 | 17 | **54** | ✅ | Partial |
| 28 | [axisrow/yandex-direct-mcp](https://github.com/axisrow/yandex-direct-mcp-plugin) | CIS | RU | Yandex 149 tools | 0 | 30 | 5 | 15 | **55** | ✅ | Yes |
| 29 | [Windsor.ai MCP](https://mcp.windsor.ai/) | AGG | Global | 350+† | 0 | 26 | 5 | 17 | **53** | ⚠️ | No |
| 30 | [LidFly](https://lidfly.ru/mcp/v3) | CIS | RU | Direct+VK+Avito | 0 | 30 | 5 | 18 | **53** | ✅ | No |

† Windsor/Catchr — many sources, ad write on subset only

---

## Best MCP per Platform

| Platform | Region | Best solution | Σ | OSS |
|----------|--------|---------------|---|-----|
| **Amazon** | Global | Official beta | **59** | No |
| **Google Ads** | Global | getmcpads / MCP Ads / akelaonline | **54–56** | Yes |
| **Meta** | Global | AdManage / ZuckerBot / cedricarlos07 | **49–57** | Yes |
| **TikTok** | Global/Asia | Agentic Hub / getmcpads | **55** | Partial |
| **Yandex Direct** | CIS | SvechaPVL / Yurich-ru | **57** | Yes |
| **VK Ads** | CIS | lexamarketolog / LidFly | **49–53** | Yes |
| **Telegram Ads** | CIS | Free-cat (TON) | **52** | Yes |
| **Tencent Ads** | CN | tencent-ad-mcp (358 tools) | **52** | Yes |
| **Naver SearchAd** | KR | packative npm | **47** | Yes |
| **Kakao Moment** | KR | kakao-moment-mcp PyPI | **44** | Yes |
| **Ocean Engine** | CN | virgoC0der/go-mcp | **44** | Yes |
| **Shopee Ads** | SEA | mcp-shopee-seller | **41** | Yes |
| **Flipkart Ads** | IN | flipkart-seller-mcp | **41** | Yes |
| **Ozon Performance** | RU | ozon-mcp-server | **43** | Yes |
| **Taboola/Native** | Global | Taboola Realize | **57** | Yes |
| **PropellerAds/CPM** | Global | propeller-mcp | **56** | Yes |
| **Multi RU hosted** | CIS | LidFly v3 | **53** | No |

---

## Regional Top 10 Highlights

### Global (media buying)

Synter **60** · Amazon **59** · getmcpads **58** · PaidSync/Markifact/Blend/AdManage **57** · Taboola **57** · PropellerAds **56** · TikTok **55** · MCP Ads **54** · Windsor/HilltopAds **53**

### CIS/RU

Yandex SvechaPVL/Yurich-ru **57** · LidFly **53** · Telegram Free-cat **52** · lexamarketolog VK **49** · Click.ru **46** · Ozon **43**

### Asia

Tencent community **52** · TikTok **55** · Naver write **47** · Ocean Engine/Kakao **44** · Shopee/Flipkart **41**

---

## Key Conclusions

1. **126 entries** in master table; **~85 with MCP**, **~41 greenfield** (API only or announced).
2. **Media buying maximum: 60/100** (Synter). In-app monetization reaches **62** (Adgentek) — different category.
3. **Google is not the only option:** Tencent 358 tools (CN), Yandex 152 (RU), Naver 47 (KR), PropellerAds 56 (CPM).
4. **CIS is the most mature regional stack:** 3 hosted aggregators (LidFly, Ask Ads, Click.ru) + 10+ Yandex/VK OSS repos.
5. **Asia is community-driven:** PlatAid KR stack, tencent-ad-mcp CN; official MCP only Tencent + TikTok.
6. **Supply-side lags:** Kevel 52 is best ad server MCP; most SSP/publisher tools are greenfield.
7. **Telegram TON** is the only C=12 (best partial crypto payment in platform MCP context).
8. **Amazon** is the only A=10 (create account tool).
9. **Closed agents** (Pixero 60, Pixel 58) compete on B but lack protocol/OSS.
10. **Greenfield priority:** OpenAI Ads · Baidu/Xiaohongshu CN · Kaspi KZ · eLama RU · Lazada SEA · LY Ads JP.

---

## Related Documents

| Document | Content |
|----------|---------|
| [regions/CIS-PLATFORMS.md](./regions/CIS-PLATFORMS.md) | CIS/RU deep-dive |
| [regions/ASIA-PLATFORMS.md](./regions/ASIA-PLATFORMS.md) | Asia deep-dive |
| [catalogs/AGGREGATORS.md](./catalogs/AGGREGATORS.md) | Hosted aggregators |
| [catalogs/OSS-GITHUB.md](./catalogs/OSS-GITHUB.md) | GitHub catalog |
| [matrices/RESEARCH-MATRIX.md](./matrices/RESEARCH-MATRIX.md) | Platform scoring matrix |

*Source: [adsMCP/master-unified.md](../../master-unified.md)*
