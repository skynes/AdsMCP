# Display / Banner / CPM / Views — платформы и MCP

> Платформы, продающие **просмотры, баннеры, popunder, push, native** — с оценкой по нашей методологии (A–D, 0–100)  
> **Supply-side (publisher/SSP MCP):** [publisher-supply-mcp.md](./publisher-supply-mcp.md)  
> Полная таблица баллов: [master-scores.md](./master-scores.md)

---

## Сводная матрица: display & CPM платформы

| Платформа | Тип | MCP | API | OSS | GitHub | A Рег | B Запуск | C Оплата | D Метрики | **Итого** |
|-----------|-----|:---:|:---:|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| **PropellerAds** | Push/Pop/Telegram | ✅ official | ✅ SSP v5 | **Да** | [propellerads/propeller-mcp](https://github.com/propellerads/propeller-mcp) | 0 | 30 | 5 | 16 | **56** |
| **HilltopAds** | Pop/Push/Direct | ✅ official | ✅ | **Нет** | — | 0 | 28 | 5 | 15 | **53** |
| **Taboola Realize** | Native + Display | ✅ official | ✅ | **Да** | [taboola/realize-mcp](https://github.com/taboola/realize-mcp) | 0 | 30 | 5 | 17 | **57** |
| **AdRoll** | Retargeting display | ✅ official beta | ✅ | **Нет** | — | 0 | 25 | 5 | 16 | **50** |
| **StackAdapt** | Programmatic multi | ✅ official GA | ✅ | **Нет** | — | 0 | 20 | 5 | 18 | **43** |
| **Criteo** | Commerce/retargeting | ✅ official | ✅ | **Нет** | — | 0 | 28 | 5 | 17 | **50** |
| **RTB House** | Retargeting | ⚠️ getmcpads | ✅ | **Нет** | via getmcpads hosted | 0 | 10 | 5 | 16 | **31** |
| **Adsterra** | Popunder CPM | ❌ | ✅ REST | **Нет** | — | 0 | 22† | 5 | 14 | **41** |
| **MGID** | Native CPC | ❌ | ✅ REST | **Нет** | — | 0 | 20† | 5 | 14 | **39** |
| **EXADS** | Ad server (white-label) | ⚠️ early access | ✅ | **Нет** | — | 0 | 5 | 5 | 12 | **22** |
| **RichAds** | Push/Pop/PWA | ❌ | ✅ | **Нет** | — | 0 | 18† | 5 | 12 | **35** |
| **ExoClick** | Multi-format adult/mainstream | ❌ | ✅ | **Нет** | — | 0 | 18† | 5 | 12 | **35** |
| **Google Display Network** | Display via Google Ads | ⚠️ via aggregators | ✅ | **Частично** | [getmcpads-com/google-ads-mcp-server](https://github.com/getmcpads-com/google-ads-mcp-server) | 0 | 25 | 5 | 18 | **48** |
| **Meta Audience Network** | In-app/display | ⚠️ via Meta MCP | ✅ | **Частично** | [byadsco/meta-ads-mcp](https://github.com/byadsco/meta-ads-mcp) | 0 | 28 | 5 | 17 | **50** |
| **Outbrain/Zemanta** | Native programmatic | ⚠️ Synter only | ✅ | **Нет** | via Synter hosted | 0 | 22 | 5 | 15 | **42** |
| **The Trade Desk** | Enterprise DSP | ⚠️ Synter/cesteral | ✅ | **Да** | [cesteral/mcp-open-advertising](https://github.com/cesteral/mcp-open-advertising) (ttd-mcp) | 0 | 20 | 5 | 16 | **41** |
| **DV360** | Google programmatic | ⚠️ Synter/cesteral | ✅ | **Да** | [cesteral/mcp-open-advertising](https://github.com/cesteral/mcp-open-advertising) (dv360-mcp) | 0 | 22 | 5 | 17 | **44** |
| **Adgentek AdsMCP** | In-app ad serving | ✅ | ✅ | **Да** | [Adgentek/adsmcp](https://github.com/Adgentek/adsmcp) | 20 | 15 | 15 | 12 | **62*** |
| **Agentic Ads** | AI agent ad network | ✅ | ✅ | **Да** | [nicofains1/agentic-ads](https://github.com/nicofains1/agentic-ads) | 15 | 20 | 12 | 14 | **61*** |
| **Hive Ad-Bid** | Agent CPM auction | ✅ | ✅ | **Да** | [srotzin/hive-ad-bid](https://github.com/srotzin/hive-ad-bid) | 10 | 18 | 18 | 10 | **56*** |

\* In-app/agent monetization — другая категория (продаёте inventory в AI, не покупаете на Taboola)  
† Через REST API можно автоматизировать, но MCP-обёртки нет — нужен свой adapter

---

## Tier 1: Official MCP для display/banner

### PropellerAds — ⭐ лучший CPM MCP

| | |
|---|---|
| **MCP** | https://mcp.propellerads.com/mcp |
| **GitHub** | [propellerads/propeller-mcp](https://github.com/propellerads/propeller-mcp) |
| **Форматы** | Push, Popunder, Telegram Ads, Interactive, Paid Social |
| **Tools** | create_push/onclick/telegram campaigns, manage rates, targeting, stats, balance |
| **Auth** | API token (local, не уходит в AI provider) |
| **Setup** | `.mcpb` bundle для Claude Desktop |
| **Pricing model** | CPM, CPA Goal, Smart CPM |

**Оценка:** A=0 (нужен аккаунт) · B=30 (full campaign CRUD) · C=5 · D=16 → **51/100**

### HilltopAds — official MCP, 27 operations

| | |
|---|---|
| **MCP** | https://mcp.hilltopads.com/mcp |
| **Docs** | https://mcp.hilltopads.com/docs |
| **Tools** | create/update campaigns, start/stop, set bid, whitelist/blacklist, stats by geo/zone |
| **Auth** | OAuth 2.0 + API key на consent page |
| **Safety** | Write требует подтверждения; «never moves money» |
| **Форматы** | Pop, Push, Direct Link |

**Оценка:** **48/100**

### Taboola Realize — native + display MCP

| | |
|---|---|
| **GitHub** | [taboola/realize-mcp](https://github.com/taboola/realize-mcp) |
| **Transport** | Hosted Streamable HTTP + OAuth 2.1 |
| **Write tools** | `create_campaign`, `update_campaign`, `create_native_item`, `create_display_item` |
| **Reporting** | CSV reports, top content, geo/audience search |
| **Also via** | Synter (27-platform catalog) |

**Оценка:** **52/100** — лучший native/display official MCP

### AdRoll — retargeting display MCP (beta)

| | |
|---|---|
| **Status** | Open beta |
| **Capabilities** | Reporting, draft-first campaign creation, ABM intelligence |
| **Clients** | ChatGPT, Claude, Cursor, n8n, Copilot Studio |
| **Write** | Draft-first workflows |

**Оценка:** **50/100**

### StackAdapt — programmatic intelligence MCP

| | |
|---|---|
| **Status** | GA since April 2026 |
| **Channels** | CTV, Display, Native, Audio, DOOH, Programmatic Linear TV |
| **Focus** | Read-heavy: performance, creative audit, pacing (Ivy AI assistant extension) |
| **Write** | Limited at launch; guardrails |
| **Also via** | Synter |

**Оценка:** **43/100** (strong analytics, weaker write)

### Criteo — commerce retargeting MCP

| | |
|---|---|
| **Status** | Production (May 2026 — first fully orchestrated MCP campaign with dentsu) |
| **Capabilities** | Campaign creation, audience building, activation, optimization via natural language |
| **API** | Built on Criteo public API, MCP version segregated |
| **Also via** | Synter |

**Оценка:** **50/100**

---

## Tier 2: API есть, MCP нет (нужен adapter)

### Adsterra — Popunder CPM API

| | |
|---|---|
| **API** | REST v3, X-API-Key auth |
| **Create** | POST — Popunder CPM campaigns with full targeting |
| **Update** | PATCH — bids, budgets, black/whitelist |
| **Stats** | GET — impressions, CPM, CTR, spend |
| **MCP** | ❌ — **opportunity для wrapper** |
| **Self-serve** | ✅ |

**Потенциал с MCP-обёрткой:** **55–60/100**

### MGID — Native CPC API

| | |
|---|---|
| **API** | REST, full CRUD campaigns + teasers |
| **Pricing** | CPC (не CPM), min budget $50 |
| **Formats** | Product, Content, Push, Search Feed native |
| **MCP** | ❌ |
| **Self-serve** | ✅ |

**Потенциал с MCP-обёрткой:** **50/100**

### RichAds / ExoClick / TrafficStars

| | |
|---|---|
| **API** | ✅ REST APIs |
| **MCP direct** | ❌ |
| **Indirect MCP** | [affset/mcp](https://glama.ai/mcp/servers/affset/mcp) — presets для ExoClick, RichAds, PropellerAds, Adsterra; bid management |
| **Focus** | Push, Pop, PWA, adult/mainstream |

**Affset MCP score:** **43/100** (affiliate tracker + network bid control, не full campaign creation). Подробнее: [publisher-supply-mcp.md](./publisher-supply-mcp.md)

### Kadam — dual MCP (advertiser + **publisher**)

| | |
|---|---|
| **Publisher MCP** | `https://pub.kadam.net/mcp` |
| **Advertiser MCP** | `https://partners.kadam.net/mcp` |
| **npm** | `@kadam-net/mcp-server` |
| **Publisher tools** | 9: sites (sources), ad blocks (places), stats, balance |
| **OSS** | [kadam-official/mcp-server](https://github.com/kadam-official/mcp-server) |

**Publisher score:** **45/100** — единственный ad network с отдельным official publisher MCP endpoint

---

## Tier 3: Programmatic DSP (enterprise)

| Platform | MCP path | Create campaigns | Min spend |
|----------|----------|-----------------|-----------|
| **DV360** | Synter, [cesteral/dv360-mcp](https://github.com/caspercrause/dv360-ads-mcp-server) | ✅ cesteral writes | Enterprise |
| **The Trade Desk** | Synter, cesteral/ttd-mcp | ✅ | Enterprise |
| **CM360** | Synter, cesteral | ⚠️ | Enterprise |
| **Amazon DSP** | Synter, cesteral, Amazon official | ✅ | Partners |
| **Yahoo DSP** | ❌ | API only | High |
| **StackAdapt** | Official + Synter | ⚠️ | $10k+/mo typical |

**cesteral/mcp-open-advertising** — OSS monorepo с 12 programmatic servers:

```
gads-mcp, meta-mcp, dv360-mcp, ttd-mcp, linkedin-mcp, tiktok-mcp,
cm360-mcp, sa360-mcp, pinterest-mcp, snapchat-mcp, amazon-dsp-mcp,
msads-mcp, dbm-mcp
```

Self-host score: **55/100** (full control, но нужны credentials каждой платформы)

---

## Tier 4: AI-native ad networks (другая категория)

> Эти платформы **продают рекламу внутри AI-агентов**, а не баннеры на сайтах

| Platform | Model | MCP | Create campaign | CPM/CPC | Crypto pay |
|----------|-------|-----|-----------------|---------|------------|
| **[Adgentek AdsMCP](https://adsmcp.ai/)** | Contextual in-chat ads | ✅ `mcp.adgentek.ai` | ✅ ads.serve | eCPM floor | ❌ |
| **[Agentic Ads](https://github.com/nicofains1/agentic-ads)** | AdSense for AI agents | ✅ | ✅ create_campaign | CPC/CPM/CPA | USDC Polygon |
| **[Hive Ad-Bid](https://github.com/srotzin/hive-ad-bid)** | Agent CPM auction | ✅ | ✅ bid/decide | CPM auction | **USDC on Base** |
| **OpenAI ChatGPT Ads** | In-chat sponsored | ❌ MCP | Beta manager | TBD | ❌ |

**Agentic Ads tools:** `create_campaign`, `create_ad`, `get_campaign_analytics`, `update_campaign` — pricing CPC $0.50, CPM $5/1000, CPA $10.

**Hive Ad-Bid:** second-price Vickrey auction, x402 USDC settlement on Base — **ближе всего к «агент сам платит криптой»**.

---

## Карта: где покупать просмотры/баннеры через MCP

```
                    MCP ready ──────────────────────────►
              low                                    high
         ┌──────────────────────────────────────────────────┐
    high │  DV360/TTD        Taboola Realize               │
    $    │  (Synter)         PropellerAds                  │
    vol  │                   HilltopAds                    │
         │                   Criteo                        │
         ├──────────────────────────────────────────────────┤
    low  │  Adsterra†        AdRoll                        │
    $    │  MGID†            StackAdapt (RO)               │
         │  RichAds†         GDN (via getmcpads)           │
         │  ExoClick†                                      │
         └──────────────────────────────────────────────────┘
              API only, need wrapper              Official MCP

    † = REST API exists, build MCP adapter (~1-2 weeks each)
```

---

## Рекомендации по display/banner automation

### Если нужен MCP «из коробки» для CPM/pop/push:
1. **PropellerAds** — official, free, full CRUD
2. **HilltopAds** — official, OAuth, 27 ops
3. **Taboola Realize** — native + display banners

### Если нужен retargeting display:
1. **AdRoll MCP** (beta)
2. **Criteo MCP** (production)
3. **RTB House** via getmcpads (limited — 7 tools, status only)

### Если нужен programmatic/DSP:
1. **Synter** — единственный hosted с DV360+TTD+Taboola+StackAdapt
2. **cesteral/mcp-open-advertising** — self-host OSS

### Если нужен AI-native (реклама в агентах):
1. **Hive Ad-Bid** — CPM auction + USDC crypto settlement
2. **Agentic Ads** — create_campaign MCP, CPC/CPM
3. **Adgentek AdsMCP** — publisher monetization

### Greenfield (API есть, MCP нет — делать самим):
| Platform | API maturity | Effort | Priority |
|----------|-------------|--------|----------|
| **Adsterra** | High (CPM create+patch) | ~1 week | ⭐⭐⭐ |
| **MGID** | High (full CRUD) | ~1 week | ⭐⭐⭐ |
| **RichAds** | Medium | ~2 weeks | ⭐⭐ |
| **ExoClick** | Medium | ~2 weeks | ⭐⭐ |
| **TrafficStars** | Medium | ~2 weeks | ⭐ |

---

## Сравнение с getmcpads для display

| Capability | getmcpads | Synter | PropellerAds | Taboola |
|------------|-----------|--------|--------------|---------|
| Google Display (GDN) | ✅ via Google Ads tools | ✅ | ❌ | ❌ |
| Native ads | ❌ | ✅ Taboola+Outbrain | ❌ | ✅ |
| Push/Pop CPM | ❌ | ❌ | ✅ | ❌ |
| Retargeting | ⚠️ RTB House (7 tools) | ✅ Criteo | ❌ | ❌ |
| Programmatic DSP | ❌ | ✅ DV360, TTD | ❌ | ❌ |
| CTV/DOOH | ❌ | ✅ StackAdapt | ❌ | ❌ |
| Telegram Ads | ❌ | ❌ | ✅ create_telegram | ❌ |

**Вывод:** getmcpads силён в search/social/analytics. Для **чистых просмотров/баннеров** нужно комбинировать:
- getmcpads (GDN, Meta AN) + PropellerAds MCP + Taboola Realize MCP
- или Synter как all-in-one ($20–500/mo)
