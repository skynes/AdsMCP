# Единая мастер-матрица Ads MCP — все регионы, все категории

> Дата: 3 октября 2026  
> **110+ сервисов** · strict **Σ = A + B + C + D** (макс 100)  
> Методология: [README](./README.md) · Детали: [master-scores.md](./master-scores.md)

---

## Методология (кратко)

| Критерий | Макс | Суть |
|----------|------|------|
| **A** Регистрация | 25 | 0 = OAuth к существующему аккаунту; 5 = Telegram login; 10 = Amazon create-account |
| **B** Запуск кампании | 35 | 0–8 RO · 22–28 community write · 28–32 hosted write+confirm |
| **C** Оплата | 20 | 5 = UI billing · 12 = TON partial · 15–18 = USDC/crypto |
| **D** Метрики | 20 | 12–14 basic · 18–20 cross-platform + audit |

**Штрафы:** Playwright −5 · beta −3…−5 · CSV-only B≤15  
**Контекст:** оценки при **готовом аккаунте**. Потолок media buying ≈ **60/100** (A=0, C=5).

**Категории:** `AGG` агрегатор · `PLT` per-platform · `CIS` СНГ · `ASIA` Азия · `DSP` display/programmatic · `SUP` supply/publisher · `APP` in-app monetization · `AGT` closed agent (не MCP)

---

## Карта экосистемы (окт 2026)

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

## Мастер-таблица — все сервисы (Σ ↓)

| # | Сервис | Cat | Регион | Платформа | A | B | C | D | **Σ** | W | OSS |
|---|--------|-----|--------|-----------|---|---|---|---|-------|---|-----|
| 1 | [Adgentek AdsMCP](https://adsmcp.ai/) | APP | Global | In-app monetization | 15 | 15 | 15 | 12 | **62** | ✅ | Да |
| 2 | [Agentic Ads](https://github.com/nicofains1/agentic-ads) | APP | Global | Agent ad network | 15 | 20 | 12 | 14 | **61** | ✅ | Да |
| 3 | [Synter](https://syntermedia.ai) | AGG | Global | 27 platforms | 0 | 32 | 5 | 18 | **60** | ✅ | Да |
| 4 | [Pixero AI](https://pixero.ai) | AGT | Global | Multi (agent) | 0 | 32 | 5 | 18 | **60** | ✅ | Нет |
| 5 | [Amazon Ads MCP](https://advertising-ai.amazon.com/mcp) | PLT | Global | Amazon | 10 | 28 | 5 | 16 | **59** | ✅ | Нет |
| 6 | [getmcpads.com](https://getmcpads.com) | AGG | Global | 14 platforms | 0 | 30 | 5 | 18 | **58** | ✅ | Частично |
| 7 | [Pixel / Metadata agent](https://metadata.io) | AGT | Global | B2B ads | 0 | 30 | 5 | 18 | **58** | ✅ | Нет |
| 8 | [PaidSync](https://paidsync.ai) | AGG | Global | 14 incl. OpenAI Ads | 0 | 32 | 5 | 20 | **57** | ✅ | Частично |
| 9 | [Markifact](https://markifact.com) | AGG | Global | 20+ | 0 | 29 | 5 | 18 | **57** | ✅ | Частично |
| 10 | [Blend MCP](https://blend-ai.com/mcp) | AGG | Global | 8 | 0 | 30 | 5 | 17 | **57** | ✅ | Нет |
| 11 | [AdManage.ai](https://admanage.ai/mcp) | AGG | Global | 9 | 0 | 32 | 5 | 15 | **57** | ✅ | Нет |
| 12 | [Taboola Realize](https://github.com/taboola/realize-mcp) | DSP | Global | Taboola native | 0 | 30 | 5 | 17 | **57** | ✅ | Да |
| 13 | [SvechaPVL/yandex-mcp](https://github.com/SvechaPVL/yandex-mcp) | CIS | RU | Yandex Direct+Metrika | 0 | 30 | 5 | 17 | **57** | ✅ | Да |
| 14 | [Yurich-ru/yandex-ads-mcp](https://github.com/Yurich-ru/yandex-ads-mcp) | CIS | RU | Yandex 152 tools | 0 | 30 | 5 | 17 | **57** | ✅ | Да |
| 15 | [Adspirer](https://adspirer.com) | AGG | Global | 6+ | 0 | 30 | 5 | 16 | **56** | ✅ | Частично |
| 16 | [PropellerAds MCP](https://github.com/propellerads/propeller-mcp) | DSP | Global | Push/Pop/TG | 0 | 30 | 5 | 16 | **56** | ✅ | Да |
| 17 | [getmcpads Google/Meta](https://getmcpads.com) | PLT | Global | Google/Meta | 0 | 28 | 5 | 18 | **56** | ✅ | Частично |
| 18 | [Hive Ad-Bid](https://github.com/srotzin/hive-ad-bid) | APP | Global | USDC CPM auction | 10 | 18 | 18 | 10 | **56** | ✅ | Да |
| 19 | [TikTok Agentic Hub](https://ads.tiktok.com/) | PLT | Global/Asia | TikTok | 0 | 30 | 5 | 15 | **55** | ✅ | Нет |
| 20 | [akelaonline/MCP-Google-Ads](https://github.com/akelaonline/MCP-Google-Ads) | PLT | Global | Google | 0 | 28 | 5 | 17 | **55** | ✅ | Да |
| 21 | [gmen1057/yandex-direct-mcp](https://github.com/gmen1057/yandex-direct-mcp) | CIS | RU | Yandex Direct | 0 | 30 | 5 | 15 | **55** | ✅ | Да |
| 22 | [Criteo MCP](https://criteo.com) | DSP | Global | Criteo | 0 | 28 | 5 | 17 | **55** | ✅ | Нет |
| 23 | [InsightfulPipe](https://insightfulpipe.com) | AGG | Global | 46 sources | 0 | 27 | 5 | 18 | **55** | ⚠️ | Нет |
| 24 | [Pipeboard](https://pipeboard.co) | AGG | Global | 5 | 0 | 28 | 5 | 17 | **55** | ✅ | Частично |
| 25 | [Muze AI](https://muzecmo.com) | AGT | Global | Multi agent | 0 | 28 | 5 | 17 | **55** | ✅ | Нет |
| 26 | [MCP Ads](https://mcp-ads.com) | AGG | Global | 10+ (3363 actions) | 0 | 31 | 5 | 18 | **54** | ✅ | Да |
| 27 | [AdKit](https://adkit.so) | AGG | Global | 7+ | 0 | 27 | 5 | 17 | **54** | ✅ | Частично |
| 28 | [axisrow/yandex-direct-mcp](https://github.com/axisrow/yandex-direct-mcp-plugin) | CIS | RU | Yandex 149 tools | 0 | 30 | 5 | 15 | **55** | ✅ | Да |
| 29 | [Windsor.ai MCP](https://mcp.windsor.ai/) | AGG | Global | 350+† | 0 | 26 | 5 | 17 | **53** | ⚠️ | Нет |
| 30 | [LidFly](https://lidfly.ru/mcp/v3) | CIS | RU | Direct+VK+Avito | 0 | 30 | 5 | 18 | **53** | ✅ | Нет |
| 31 | [HilltopAds MCP](https://mcp.hilltopads.com/mcp) | DSP | Global | Pop/Push | 0 | 28 | 5 | 15 | **53** | ✅ | Нет |
| 32 | [mharnett/mcp-google-ads](https://github.com/mharnett/mcp-google-ads) | PLT | Global | Google | 0 | 28 | 5 | 15 | **53** | ✅ | Да |
| 33 | [GDN via getmcpads](https://getmcpads.com) | DSP | Global | Google Display | 0 | 25 | 5 | 18 | **53** | ✅ | Частично |
| 34 | [andyleimc/tencent-ad-mcp](https://github.com/andyleimc-source/tencent-ad-mcp) | ASIA | CN | Tencent 358 tools | 0 | 30 | 5 | 17 | **52** | ✅ | Да |
| 35 | [Kevel MCP](https://mcp.kevel.com/) | SUP | Global | Ad server / retail | 0 | 30 | 5 | 17 | **52** | ✅ | Нет |
| 36 | [Hyper AI MCP](https://hyperfx.ai/mcp) | AGG | Global | 10+‡ | 0 | 29 | 5 | 18 | **52** | ✅ | Нет |
| 37 | [Metadata.io MCP](https://metadata.io/mcp-server) | AGG | Global | 8 B2B | 0 | 28 | 5 | 14 | **52** | ✅ | Нет |
| 38 | [AdLoop Cloud](https://getadloop.com) | AGG | Global | 3 | 0 | 28 | 5 | 14 | **52** | ✅ | Да |
| 39 | [Adplane](https://mcp.adplane.ai) | AGG | Global | 2 | 0 | 28 | 5 | 14 | **52** | ✅ | Нет |
| 40 | [Meta Official MCP](https://mcp.facebook.com/ads) | PLT | Global | Meta | 0 | 27 | 5 | 15 | **52** | ✅ | Нет |
| 41 | [Free-cat/telegram_ads_mcp](https://github.com/Free-cat/telegram_ads_mcp) | CIS | RU | Telegram TON | 5 | 22 | 12 | 13 | **52** | ✅ | Да |
| 42 | [HireOtto](https://hireotto.com) | PLT | Global | Google | 0 | 28 | 5 | 14 | **52** | ✅ | Да |
| 43 | [byadsco/meta-ads-mcp](https://github.com/byadsco/meta-ads-mcp) | PLT | Global | Meta | 0 | 28 | 5 | 14 | **52** | ✅ | Да |
| 44 | [armavita-meta-ads-mcp](https://github.com/EfrainTorres/armavita-meta-ads-mcp) | PLT | Global | Meta | 0 | 28 | 5 | 14 | **52** | ✅ | Да |
| 45 | [Draivix/aidvertaiser](https://github.com/Draivix/aidvertaiser) | AGG | Global | 8 | 0 | 26 | 5 | 16 | **52** | ✅ | Да |
| 46 | [Lexi AI](https://lexilexi.ai) | AGT | Global | Multi agent | 0 | 28 | 5 | 14 | **52** | ✅ | Нет |
| 47 | [Tencent Marketing official](https://developers.e.qq.com/mcp) | ASIA | CN | Tencent Ads | 0 | 28 | 5 | 16 | **49** | ✅ | Нет |
| 48 | [IAB Seller Agent](https://iabtechlab.github.io/seller-agent/) | SUP | Global | SSP/Publisher | 0 | 28 | 5 | 18 | **51** | ✅ | Да |
| 49 | [AdRoll MCP](https://help.adroll.com) | DSP | Global | Retargeting | 0 | 25 | 5 | 16 | **51** | ⚠️ | Нет |
| 50 | [Opus Growth](https://opus-growth.com) | AGG | Global | 4+ | 0 | 27 | 5 | 14 | **51** | ✅ | Да |
| 51 | [lexamarketolog/vk-ads-mcp](https://github.com/lexamarketolog/vk-ads-mcp) | CIS | RU | VK Ads 55 tools | 0 | 28 | 5 | 16 | **49** | ✅ | Да |
| 52 | [ZuckerBot](https://zuckerbot.ai) | AGG | Global | Meta only | 0 | 28 | 5 | 16 | **49** | ✅ | Да |
| 53 | [cedricarlos07/meta-ads-mcp](https://github.com/cedricarlos07/meta-ads-mcp) | PLT | Global | Meta | 0 | 28 | 5 | 16 | **49** | ✅ | Да |
| 54 | [admob-manager-mcp](https://github.com/ParkSangGwon/admob-mcp-server) | SUP | Global | AdMob pub | 0 | 28 | 5 | 16 | **49** | ✅ | Да |
| 55 | [DV360 via cesteral](https://github.com/cesteral/mcp-open-advertising) | DSP | Global | DV360 | 0 | 22 | 5 | 17 | **44** | ✅ | Да |
| 56 | [Outbrain/Zemanta via Synter](https://syntermedia.ai) | DSP | Global | Native prog. | 0 | 22 | 5 | 15 | **47** | ✅ | Нет |
| 57 | [adsap.ai](https://adsap.ai) | AGG | Global | Google+Meta | 0 | 26 | 5 | 14 | **50** | ✅ | Нет |
| 58 | [cesteral/mcp-open-advertising](https://github.com/cesteral/mcp-open-advertising) | AGG | Global | 12 programmatic | 0 | 26 | 5 | 14 | **50** | ✅ | Да |
| 59 | [Catchr.io MCP](https://api.catchr.io/mcp) | AGG | Global | 100+† | 0 | 22 | 5 | 18 | **50** | ⚠️ | Нет |
| 60 | [Ryze AI](https://get-ryze.ai) | AGG | Global | 4 | 0 | 28 | 5 | 17 | **50** | ✅ | Частично |
| 61 | [askads/mcp-yandex-direct](https://github.com/askads/mcp-yandex-direct) | CIS | RU | Yandex local write | 0 | 26 | 5 | 14 | **50** | ✅ | Да |
| 62 | [Koast.ai](https://koast.ai) | AGT | Global | Meta agent | 0 | 26 | 5 | 14 | **50** | ✅ | Нет |
| 63 | [AdRoll / Criteo display](https://criteo.com) | DSP | Global | Commerce display | 0 | 28 | 5 | 17 | **50** | ✅ | Нет |
| 64 | [packative/naver-searchad-mcp](https://www.npmjs.com/package/@packative/naver-searchad-mcp) | ASIA | KR | Naver SearchAd | 0 | 26 | 5 | 16 | **47** | ✅ | Да |
| 65 | [Click.ru MCP](https://help.click.ru/7886) | CIS | RU | VK+TG+Direct agency | 0 | 26 | 5 | 15 | **46** | ✅ | Нет |
| 66 | [Adrex AI](https://adrex.ai) | AGG | Global | 2 | 0 | 26 | 5 | 15 | **46** | ✅ | Да |
| 67 | [RoASr MCP](https://roasr.com) | CIS | RU | Meta+Google+Yandex audit | 0 | 8 | 5 | 18 | **46** | ⚠️ | Да |
| 68 | [TrueClicks](https://data.trueclicks.com/mcp) | AGG | Global | 3 RO | 0 | 18 | 5 | 18 | **46** | ❌ | Частично |
| 69 | [Prebid Sales Agent](https://github.com/prebid/salesagent) | SUP | Global | AdCP deals | 0 | 26 | 5 | 15 | **46** | ✅ | Да |
| 70 | [The Trade Desk via cesteral](https://github.com/cesteral/mcp-open-advertising) | DSP | Global | TTD | 0 | 20 | 5 | 16 | **41** | ✅ | Да |
| 71 | [v-p3truk/mcp-google-ads](https://github.com/v-p3truk/mcp-google-ads) | PLT | Global | Google | 0 | 26 | 5 | 15 | **46** | ✅ | Да |
| 72 | [Marvento Ads MCP](https://github.com/MarventoCapital/marvento-ads-mcp) | PLT | Global | Google | 0 | 26 | 5 | 15 | **46** | ✅ | Да |
| 73 | [desunit/reddit-ads-mcp](https://github.com/desunit/reddit-ads-mcp) | PLT | Global | Reddit | 0 | 22 | 5 | 16 | **48** | ✅ | Да |
| 74 | [askads/mcp-vk-ads](https://github.com/askads/mcp-vk-ads) | CIS | RU | VK Ads | 0 | 24 | 5 | 14 | **48** | ✅ | Да |
| 75 | [ynnickw/adport](https://github.com/ynnickw/adport) | PLT | Global | Apple Search | 0 | 24 | 5 | 14 | **48** | ✅ | Да |
| 76 | [StackAdapt MCP](https://stackadapt.com) | DSP | Global | Programmatic | 0 | 20 | 5 | 18 | **48** | ✅ | Нет |
| 77 | [AdSynthesis Engine](https://github.com/MAhmed004/ad-ops-mcp-hub) | PLT | Global | 5 platforms | 0 | 24 | 5 | 14 | **48** | ✅ | Да |
| 78 | [Adbloop](https://app.adbloop.com) | AGT | Global | Meta bulk | 0 | 26 | 5 | 12 | **48** | ✅ | Нет |
| 79 | [GAM MCP MatiousCorp](https://github.com/MatiousCorp/google-ad-manager-mcp) | SUP | Global | Google Ad Manager | 0 | 28 | 5 | 15 | **48** | ✅ | Да |
| 80 | [Google Display Network](https://getmcpads.com) | DSP | Global | GDN | 0 | 25 | 5 | 18 | **48** | ✅ | Частично |
| 81 | [OlegRadinuk/yandex-direct-mcp](https://github.com/OlegRadinuk/yandex-direct-mcp) | CIS | RU | Yandex dry-run | 0 | 28 | 5 | 15 | **48** | ✅ | Да |
| 82 | [virgoC0der/go-mcp](https://github.com/virgoC0der/go-mcp) | ASIA | CN | Ocean Engine | 0 | 24 | 5 | 15 | **44** | ⚠️ | Да |
| 83 | [kakao-moment-mcp PyPI](https://pypi.org/project/kakao-moment-mcp/) | ASIA | KR | Kakao Moment write | 0 | 24 | 5 | 15 | **44** | ✅ | Да |
| 84 | [PubMatic MCP](https://mcp.pubmatic.com/mcp) | SUP | Global | SSP deals | 0 | 22 | 5 | 17 | **44** | ⚠️ | Spec |
| 85 | [martechery/mcp-google-ads-ts](https://github.com/martechery/mcp-google-ads-ts) | PLT | Global | Google | 0 | 24 | 5 | 15 | **44** | ✅ | Да |
| 86 | [DeviceIngineering/ozon-mcp-server](https://github.com/DeviceIngineering/ozon-mcp-server) | CIS | RU | Ozon Performance 22 ads | 0 | 24 | 5 | 14 | **43** | ✅ | Да |
| 87 | [LeverHQ](https://leverhq.app) | AGG | Global | 2 | 0 | 24 | 5 | 14 | **43** | ✅ | Нет |
| 88 | julioccorderoc/ads-platforms *(removed Oct 2026)* | PLT | Global | Multi | 0 | 24 | 5 | 14 | **43** | ✅ | Да |
| 89 | [Affset MCP](https://github.com/affset/mcp) | SUP | Global | White-label ad server | 0 | 24 | 5 | 14 | **43** | ✅ | Да |
| 90 | [Kadam Publisher](https://pub.kadam.net/mcp) | SUP | RU/Global | Ad network pub | 0 | 26 | 5 | 14 | **45** | ✅ | Да |
| 91 | [Kadam Advertiser](https://github.com/kadam-official/mcp-server) | DSP | RU/Global | Ad network buy | 0 | 28 | 5 | 12 | **45** | ✅ | Да |
| 92 | [hashcott/meta-ads-mcp-server](https://github.com/hashcott/meta-ads-mcp-server) | PLT | Global | Meta | 0 | 26 | 5 | 14 | **45** | ✅ | Да |
| 93 | [sh0tn1k/telegram-ads](https://github.com/sh0tn1k/telegram-ads) | CIS | RU | Telegram Playwright | 5 | 18 | 10 | 12 | **45** | ✅ | Да |
| 94 | [mcp-shopee-seller](https://pypi.org/project/mcp-shopee-seller/) | ASIA | SEA | Shopee Ads | 0 | 22 | 5 | 14 | **41** | ✅ | Да |
| 95 | [flipkart-seller-mcp](https://github.com/ron2111/flipkart-seller-mcp) | ASIA | IN | Flipkart Ads | 0 | 22 | 5 | 14 | **41** | ✅ | Да |
| 96 | [A1-x-Tech/mcp-avito-ads](https://github.com/A1-x-Tech/mcp-avito-ads) | CIS | RU | Avito Реклама | 0 | 22 | 5 | 14 | **41** | ⚠️ | Да |
| 97 | [Adsterra API](https://adsterra.com) | DSP | Global | Popunder CPM | 0 | 22 | 5 | 14 | **41** | ⚠️† | Нет |
| 98 | [FarahTrip/reddit-ads-mcp](https://github.com/FarahTrip/reddit-ads-mcp) | PLT | Global | Reddit | 0 | 18 | 5 | 14 | **42** | ✅ | Да |
| 99 | [askads/mcp-yandex-metrica](https://github.com/askads/mcp-yandex-metrica) | CIS | RU | Yandex Metrika | 0 | 18 | 5 | 16 | **39** | ❌ | Да |
| 100 | [askads hosted RO](https://mcp.askads.ru/mcp) | CIS | RU | Yandex Direct RO | 0 | 18 | 5 | 16 | **39** | ❌ | Частично |
| 101 | [MGID API](https://mgid.com) | DSP | Global | Native CPC | 0 | 20 | 5 | 14 | **39** | ⚠️† | Нет |
| 102 | [AdOps MCP CSV](https://www.npmjs.com/package/adops-mcp-server) | PLT | Global | Google+Meta CSV | 0 | 15 | 5 | 14 | **39** | ⚠️ | Да |
| 103 | [OpenTabs](https://github.com/opentabs-dev/opentabs) | PLT | Global | Multi Playwright | 0 | 15 | 5 | 12 | **37** | ⚠️ | Да |
| 104 | [GAM Seller MCP Node](https://github.com/juan-sibbo/gam-seller-mcp-node) | SUP | Global | GAM discovery | 0 | 12 | 5 | 16 | **38** | ⚠️ | Да |
| 105 | Campaiyn *(defunct Oct 2026)* | AGT | Global | Agent | 0 | 12 | 5 | 16 | **38** | ⚠️ | Нет |
| 106 | [RichAds/ExoClick API](https://richads.com) | DSP | Global | Push/Pop | 0 | 18 | 5 | 12 | **35** | ⚠️† | Нет |
| 107 | [googleads/google-ads-mcp](https://github.com/googleads/google-ads-mcp) | PLT | Global | Google official RO | 0 | 0 | 5 | 18 | **35** | ❌ | Да |
| 108 | [Coupler MCP](https://coupler.io/mcp) | AGG | Global | ETL many | 0 | 10 | 5 | 15 | **35** | ⚠️ | Нет |
| 109 | [STEPhie / stepnetwork.dk](https://stepnetwork.dk) *(MCP endpoint 404 Oct 2026)* | SUP | EU | Publisher CRM | 0 | 14 | 5 | 16 | **35** | ❌ | Нет |
| 110 | [Connector.wtf](https://connector.wtf) | AGG | Global | 5+ RO | 0 | 8 | 5 | 16 | **34** | ❌ | Нет |
| 111 | [Smacient](https://smacient.com) | AGG | Global | 3 RO | 0 | 8 | 5 | 14 | **32** | ❌ | Нет |
| 112 | [RTB House via getmcpads](https://getmcpads.com) | DSP | Global | Retargeting | 0 | 10 | 5 | 16 | **31** | ⚠️ | Нет |
| 113 | [Dappier MCP](https://docs.dappier.com/) | SUP | Global | Content monetization | 0 | 12 | 5 | 14 | **31** | ⚠️ | Нет |
| 114 | [PlatAid/naver-searchad-mcp](https://github.com/PlatAid/naver-searchad-mcp) | ASIA | KR | Naver RO | 0 | 0 | 5 | 17 | **22** | ❌ | Да |
| 115 | [PlatAid/kakao-moment-mcp](https://github.com/PlatAid/kakao-moment-mcp) | ASIA | KR | Kakao RO | 0 | 0 | 5 | 16 | **21** | ❌ | Да |
| 116 | [PlatAid/kakao-keywordad-mcp](https://github.com/PlatAid/kakao-keywordad-mcp) | ASIA | KR | Kakao Keyword RO | 0 | 0 | 5 | 16 | **21** | ❌ | Да |
| 117 | [hhx465453939/mcp-cn-commerce](https://github.com/hhx465453939/mcp-cn-commerce) | ASIA | CN | CN commerce+ads RO | 0 | 8 | 5 | 14 | **27** | ❌ | Да |
| 118 | [KoreanAds](https://koreanads.com/mcp) | ASIA | KR | Media planning | 0 | 0 | 5 | 14 | **19** | ❌ | Нет |
| 119 | [HYPD openai-ads-mcp](https://github.com/HYPD-AI/openai-ads-mcp) | PLT | Global | OpenAI Ads RO | 0 | 0 | 5 | 14 | **19** | ❌ | Да |
| 120 | [kashiflashari/ads-mcp](https://github.com/kashiflashari/ads-mcp) | PLT | Global | G+Meta+TikTok RO | 0 | 0 | 5 | 13 | **18** | ❌ | Да |
| 121 | [supply-ops-agent](https://github.com/mpessis/supply-ops-agent) | SUP | Global | SSP diagnostics RO | 0 | 0 | 5 | 18 | **23** | ❌ | Да |
| 122 | [Flyweel MCP](https://flyweel.co/mcp) | AGG | Global | 3 RO | 0 | 0 | 5 | 17 | **22** | ❌ | Нет |
| 123 | [AdCrunch](https://adcrunch.dev) | AGG | Global | 3 RO | 0 | 0 | 5 | 16 | **21** | ❌ | Нет |
| 124 | [Microsoft Ads pilot](https://about.ads.microsoft.com/en/solutions/technology/mcp-server) | PLT | Global | Bing | 0 | 0 | 5 | 15 | **25** | ❌ | Нет |
| 125 | [wildberries-api-mcp-server](https://github.com/dmitriipolushin/wildberries-api-mcp-server) | CIS | RU | WB ads stats RO | 0 | 8 | 5 | 15 | **28** | ❌ | Да |
| 126 | [EXADS early access](https://exads.com) | SUP | Global | Ad server | 0 | 5 | 5 | 12 | **22** | ⚠️ | Нет |

† Windsor/Catchr — много источников, ads write на subset  
‡ Hyper — 160+ integrations, ad write на subset major  
†† API exists, MCP wrapper needed — B = potential with custom adapter  
**W** = Write capability: ✅ full · ⚠️ partial/gated · ❌ read-only

---

## Лучший MCP по платформе (единая сводка)

| Платформа | Регион | Лучшее решение | Σ | OSS |
|-----------|--------|---------------|---|-----|
| **Amazon** | Global | Official beta | **59** | Нет |
| **Google Ads** | Global | getmcpads / MCP Ads / akelaonline | **54–56** | Да |
| **Meta** | Global | AdManage / ZuckerBot / cedricarlos07 | **49–57** | Да |
| **TikTok** | Global/Asia | Agentic Hub / getmcpads | **55** | Частично |
| **Yandex Direct** | CIS | SvechaPVL / Yurich-ru | **57** | Да |
| **VK Ads** | CIS | lexamarketolog / LidFly | **49–53** | Да |
| **Telegram Ads** | CIS | Free-cat (TON) | **52** | Да |
| **Tencent Ads** | CN | tencent-ad-mcp (358 tools) | **52** | Да |
| **Naver SearchAd** | KR | packative npm | **47** | Да |
| **Kakao Moment** | KR | kakao-moment-mcp PyPI | **44** | Да |
| **Ocean Engine** | CN | virgoC0der/go-mcp | **44** | Да |
| **Shopee Ads** | SEA | mcp-shopee-seller | **41** | Да |
| **Flipkart Ads** | IN | flipkart-seller-mcp | **41** | Да |
| **Ozon Performance** | RU | ozon-mcp-server | **43** | Да |
| **Avito Ads** | RU | LidFly / mcp-avito-ads | **41–45** | Да |
| **Wildberries Ads** | RU | wildberries-api-mcp-server | **28** | Да |
| **Reddit** | Global | AdManage / desunit | **48–57** | Да |
| **LinkedIn** | Global | Synter / Metadata | **52–55** | Частично |
| **Apple Search** | Global | adport | **48** | Да |
| **Taboola/Native** | Global | Taboola Realize | **57** | Да |
| **PropellerAds/CPM** | Global | propeller-mcp | **56** | Да |
| **OpenAI Ads** | Global | PaidSync / HYPD RO | **19–57** | Частично |
| **Kevel (ad server)** | Global | Kevel MCP | **52** | Нет |
| **GAM (pub)** | Global | MatiousCorp GAM MCP | **48** | Да |
| **AdMob (pub)** | Global | admob-manager-mcp | **49** | Да |
| **Multi RU hosted** | CIS | LidFly v3 | **53** | Нет |
| **Agency RU** | CIS | Click.ru MCP | **46** | Нет |

---

## Рейтинг по регионам

### 🌍 Global TOP-10 (media buying)

| # | Сервис | Σ | Cat |
|---|--------|---|-----|
| 1 | Synter | **60** | AGG |
| 2 | Amazon Official | **59** | PLT |
| 3 | getmcpads | **58** | AGG |
| 4 | PaidSync | **57** | AGG |
| 5 | AdManage / Markifact / Blend | **57** | AGG |
| 6 | Taboola Realize | **57** | DSP |
| 7 | PropellerAds | **56** | DSP |
| 8 | TikTok Agentic Hub | **55** | PLT |
| 9 | MCP Ads (3363 actions) | **54** | AGG |
| 10 | Windsor / HilltopAds | **53** | AGG/DSP |

### 🇷🇺 CIS/RU TOP-10

| # | Сервис | Σ | Notes |
|---|--------|---|-------|
| 1 | SvechaPVL / Yurich-ru Yandex | **57** | 132–152 tools OSS |
| 2 | Telegram Free-cat | **52** | TON C=12 |
| 3 | LidFly hosted | **53** | Direct 166 + VK 76 + Avito |
| 4 | lexamarketolog VK | **49** | 55 tools deepest VK OSS |
| 5 | askads VK / Yandex local | **48–50** | npm stack |
| 6 | Click.ru agency | **46** | без VK API approval |
| 7 | RoASr (Yandex audit) | **46** | Meta+Google+Yandex |
| 8 | Ozon Performance | **43** | 22 ad tools |
| 9 | Avito Ads | **41** | media cabinet |
| 10 | Ask Ads hosted RO | **39** | free OAuth audit |

### 🇨🇳🇰🇷🇯🇵 ASIA TOP-10

| # | Сервис | Σ | Country |
|---|--------|---|---------|
| 1 | tencent-ad-mcp | **52** | CN (358 tools) |
| 2 | Tencent official | **49** | CN |
| 3 | TikTok official | **55** | Global/CN |
| 4 | Naver SearchAd write | **47** | KR |
| 5 | Ocean Engine | **44** | CN |
| 6 | Kakao Moment write | **44** | KR |
| 7 | Shopee Ads | **41** | SEA |
| 8 | Flipkart Ads | **41** | IN |
| 9 | Naver/Kakao RO (PlatAid) | **21–22** | KR |
| 10 | KoreanAds planning | **19** | KR |

**Greenfield Asia:** Baidu 推广 · Xiaohongshu 聚光 · Lazada Ads · LY Ads (announced Sep 2026)

### 📡 SUPPLY / Publisher TOP-5

| # | Сервис | Σ | Role |
|---|--------|---|------|
| 1 | Kevel MCP | **52** | Ad server / retail media |
| 2 | IAB Seller Agent | **51** | SSP programmatic deals |
| 3 | admob-manager-mcp | **49** | Mobile app monetization |
| 4 | GAM MatiousCorp | **48** | Google Ad Manager trafficking |
| 5 | Kadam Publisher | **45** | Ad network pub side |

---

## TOP-30 общий рейтинг (strict Σ)

```
 62 ┤ Adgentek (in-app) ●
 61 ┤ Agentic Ads ●
 60 ┤ Synter ●  Pixero (agent) ●
 59 ┤ Amazon Official ●
 58 ┤ getmcpads ●  Pixel/Metadata agent ●
 57 ┤ PaidSync ●  Markifact ●  Blend ●  AdManage ●  Taboola ●  Yandex ●
 56 ┤ Adspirer ●  PropellerAds ●  Hive Ad-Bid ●
 55 ┤ TikTok ●  akelaonline ●  Pipeboard ●  InsightfulPipe ●  axisrow Yandex ●
 54 ┤ MCP Ads ●  AdKit ●  getmcpads G/M ●
 53 ┤ Windsor ●  LidFly ●  HilltopAds ●  mharnett ●  GDN ●
 52 ┤ Hyper ●  Metadata ●  AdLoop ●  Meta official ●  Telegram ●  Tencent community ●  Kevel ●  HireOtto ●  Lexi ●
 51 ┤ IAB Seller ●  AdRoll ●  Opus Growth ●
 50 ┤ Ryze ●  cesteral ●  Catchr ●  askads Yandex ●  Koast ●
 49 ┤ lexamarketolog VK ●  ZuckerBot ●  Tencent official ●  admob pub ●
 48 ┤ Reddit desunit ●  VK askads ●  adport ●  StackAdapt ●  GAM ●  Adbloop ●
 47 ┤ Naver write ●  Outbrain/Synter ●
 46 ┤ Click.ru ●  RoASr ●  TrueClicks ●  Prebid Sales Agent ●
 45 ┤ Kadam pub/adv ●  hashcott Meta ●  sh0tn1k Telegram ●
 44 ┤ Ocean Engine ●  Kakao write ●  PubMatic ●  DV360 ●
 43 ┤ Ozon ●  LeverHQ ●  Affset ●
 41 ┤ Shopee ●  Flipkart ●  Avito ●  Adsterra API ●  TTD ●
 39 ┤ Ask Ads RO ●  MGID API ●  AdOps CSV ●
 28 ┤ Wildberries ads RO ●
 25 ┤ Microsoft pilot ●
 22 ┤ Flyweel ●  Naver/Kakao RO ●  KoreanAds ●
 19 ┤ HYPD OpenAI Ads RO ●
```

---

## Ключевые выводы (единое исследование)

1. **126 записей** в мастер-таблице; **~85 с MCP**, **~41 greenfield** (API only или announced).
2. **Максимум media buying: 60/100** (Synter). In-app monetization до **62** (Adgentek) — другая категория.
3. **Google не единственный нигде:** Tencent 358 tools (CN), Yandex 152 (RU), Naver 47 (KR), PropellerAds 56 (CPM).
4. **СНГ — самый зрелый regional stack:** 3 hosted aggregators (LidFly, Ask Ads, Click.ru) + 10+ Yandex/VK OSS repos.
5. **Азия — community-driven:** PlatAid KR stack, tencent-ad-mcp CN; official MCP только Tencent + TikTok.
6. **Supply-side отстаёт:** Kevel 52 — лучший ad server MCP; большинство SSP/pub — greenfield.
7. **Telegram TON** — единственный C=12 (лучший partial crypto payment).
8. **Amazon** — единственный A=10 (create account tool).
9. **Closed agents** (Pixero 60, Pixel 58) конкурируют с MCP по B, но без протокола/OSS.
10. **Greenfield priority:** OpenAI Ads · Baidu/Xiaohongshu CN · Kaspi KZ · eLama RU · Lazada SEA · LY Ads JP.

---

## Навигация по детальным документам

| Документ | Содержание |
|----------|------------|
| [master-scores.md](./master-scores.md) | Детальный scoring по категориям (hosted, per-platform, display, agents) |
| [master-matrix-oss.md](./master-matrix-oss.md) | OSS × GitHub links |
| [cis-platforms-mcp.md](./cis-platforms-mcp.md) | СНГ/RU deep-dive: LidFly, Click.ru, Yandex, VK, Ozon |
| [asia-platforms-mcp.md](./asia-platforms-mcp.md) | Азия deep-dive: Tencent, Naver, Kakao, Ocean Engine |
| [publisher-supply-mcp.md](./publisher-supply-mcp.md) | Supply-side: Kevel, IAB, AdMob, GAM, Kadam pub |
| [display-banner-platforms.md](./display-banner-platforms.md) | CPM/display/programmatic buy-side |
| [aggregators-catalog.md](./aggregators-catalog.md) | Hosted aggregators detail |
| [new-names-round2.md](./new-names-round2.md) | Round 2 web/Glama findings |
| [reddit-forum-survey.md](./reddit-forum-survey.md) | Round 1 Reddit/forum findings |
| [oss-github-catalog.md](./oss-github-catalog.md) | ~80 GitHub repos catalog |
