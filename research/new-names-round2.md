# Раунд 2 — новые имена Ads MCP (октябрь 2026)

> Дата: 3 октября 2026  
> Метод: web search + Glama/PulseMCP + GitHub + Reddit + конкурентные страницы (PaidSync vs)  
> Раунд 1: [reddit-forum-survey.md](./reddit-forum-survey.md)

---

## TL;DR

Второй проход выявил **~19 новых имён**, которых не было в [master-scores.md](./master-scores.md) на момент раунда 1. Главные находки:

1. **[PaidSync](https://paidsync.ai)** — 460+ tools, 14 платформ incl. **OpenAI/ChatGPT Ads**, Google Premier Partner, Meta/LinkedIn/TikTok partners → **Σ=57**
2. **[MCP Ads (RoyAzran)](https://mcp-ads.com)** — 3 363 actions, 21 tool families, Google+Meta+GA4+GTM write, MIT OSS → **Σ=54**
3. **[Hyper AI MCP](https://hyperfx.ai/mcp)** — 160+ integrations, marketing skills, deep ad CRUD → **Σ=52**
4. **[Ryze AI](https://get-ryze.ai)** — Google+Meta+GA4+Shopify, 150+ tools, hosted OAuth → **Σ=50**
5. **[ZuckerBot](https://zuckerbot.ai)** — Meta-only 65 tools, creative gen + CAPI, hosted+npx → **Σ=49**
6. **[HYPD openai-ads-mcp](https://github.com/HYPD-AI/openai-ads-mcp)** — **greenfield**: первый OSS MCP для OpenAI Ads API (11 tools RO)

---

## Сводная таблица: новые имена раунда 2

| # | Сервис | A | B | C | D | **Σ** | Write | OSS | Источник |
|---|--------|---|---|---|---|-------|-------|-----|----------|
| 1 | **[PaidSync](https://paidsync.ai)** | 0 | 32 | 5 | 20 | **57** | ✅ gated | Частично | GitHub, Glama, vs-pages |
| 2 | **[MCP Ads](https://mcp-ads.com)** | 0 | 31 | 5 | 18 | **54** | ✅ paused | **Да** | Glama, npm registry |
| 3 | **[Hyper AI MCP](https://hyperfx.ai/mcp)** | 0 | 29 | 5 | 18 | **52** | ✅ per-tool | **Нет** | hyperfx.ai/docs |
| 4 | **[Ryze AI](https://get-ryze.ai)** | 0 | 28 | 5 | 17 | **50** | ✅ gated | Частично | get-ryze.ai, GitHub forks |
| 5 | **[ZuckerBot](https://zuckerbot.ai)** | 0 | 28 | 5 | 16 | **49** | ✅ Meta | **Да** | r/mcp, GitHub |
| 6 | **[cedricarlos07/meta-ads-mcp](https://github.com/cedricarlos07/meta-ads-mcp)** | 0 | 28 | 5 | 16 | **49** | ✅ agency | **Да** | Glama |
| 7 | **[Adrex AI](https://adrex.ai)** | 0 | 26 | 5 | 15 | **46** | ✅ paused | **Да** | adrex.ai, npm |
| 8 | **[RoASr MCP](https://github.com/RoASr-com/roasr-mcp)** | 0 | 8 | 5 | 18 | **46** | ⚠️ Yandex | **Да** | Glama |
| 9 | **[LeverHQ](https://leverhq.app)** | 0 | 24 | 5 | 14 | **43** | ✅ gated | **Нет** | leverhq.app, PaidSync vs |
| 10 | **[v-p3truk/mcp-google-ads](https://github.com/v-p3truk/mcp-google-ads)** | 0 | 26 | 5 | 15 | **46** | ✅ Google | **Да** | GitHub |
| 11 | **[Marvento Ads MCP](https://glama.ai/mcp/servers/MarventoCapital/marvento-ads-mcp)** | 0 | 26 | 5 | 15 | **46** | ✅ Google | **Да** | Glama |
| 12 | **[hashcott/meta-ads-mcp-server](https://github.com/hashcott/meta-ads-mcp-server)** | 0 | 26 | 5 | 14 | **45** | ✅ Meta | **Да** | GitHub |
| 13 | **[Kadam MCP](https://github.com/kadam-official/mcp-server)** | 0 | 28 | 5 | 12 | **45** | ✅ network | **Да** | npm @kadam-net/mcp-server |
| 14 | **[martechery/mcp-google-ads-ts](https://github.com/martechery/mcp-google-ads-ts)** | 0 | 24 | 5 | 15 | **44** | ⚠️ GAQL | **Да** | Glama |
| 15 | **julioccorderoc/ads-platforms** *(repo removed Oct 2026)* | 0 | 24 | 5 | 14 | **43** | ✅ multi | **Да** | PulseMCP |
| 16 | **[AdCrunch](https://adcrunch.dev)** | 0 | 0 | 5 | 16 | **21** | ❌ RO | **Нет** | Glama |
| 17 | **[Flyweel MCP](https://flyweel.co/mcp)** | 0 | 0 | 5 | 17 | **22** | ❌ RO | **Нет** | flyweel.co/docs |
| 18 | **[HYPD openai-ads-mcp](https://github.com/HYPD-AI/openai-ads-mcp)** | 0 | 0 | 5 | 14 | **19** | ❌ RO | **Да** | r/OpenAIAdvertising |
| 19 | **[kashiflashari/ads-mcp](https://github.com/kashiflashari/ads-mcp)** | 0 | 0 | 5 | 13 | **18** | ❌ RO | **Да** | GitHub |

\*Σ = A+B+C+D. Полная таблица: [master-scores.md](./master-scores.md)

---

## Детальный разбор TOP-6

### 1. PaidSync — потенциальный лидер по глубине

| Поле | Значение |
|------|----------|
| URL | https://paidsync.ai |
| MCP endpoint | `https://mcp.paidsync.ai/mcp?key=YOUR_API_KEY` |
| GitHub | [PaidSync/paidsync-mcp](https://github.com/PaidSync/paidsync-mcp) (MIT, thin dispatcher) |
| Платформы | Google, Meta, LinkedIn, TikTok, Snapchat, Reddit, Pinterest, Microsoft, **ChatGPT/OpenAI Ads**, GA4, GTM, GSC, Merchant Center |
| Tools | 460+ |
| Write | Create on Google/Meta/LinkedIn/OpenAI; read+manage+optimize on остальных |
| Safety | Every change drafted → human approval |
| Partners | Google Premier Partner, Meta Business Partner, LinkedIn Marketing Partner, TikTok Marketing Partner |
| Pricing | Free 15 tasks/mo; Pro from $99/mo |

**Уникальность:** единственный MCP с verified partner status на Meta+LinkedIn+TikTok одновременно + OpenAI Ads write + GTM/GA4/Merchant Center в одном endpoint.

**Vs Synter (60):** меньше programmatic/DSP платформ (14 vs 27), но глубже по tracking infra и OpenAI Ads. Strict score: **57** (B=32, D=20).

---

### 2. MCP Ads (RoyAzran) — скрытый гигант по tool count

| Поле | Значение |
|------|----------|
| URL | https://mcp-ads.com |
| MCP endpoint | `https://mcp-ads.com/mcp-slim` |
| GitHub | [RoyAzran/mcp-ads](https://github.com/RoyAzran/mcp-ads) (MIT) |
| Actions | **3 363** registered actions, 21 tool families (dispatcher pattern) |
| Платформы | Google (755), Meta (234), GA4, GSC, GTM (64), TikTok, LinkedIn, Microsoft, Snapchat, WordPress, Sheets |
| Write | Full Google+Meta write; campaigns start **paused** |
| Pricing | $49/mo flat; self-host free |

**Vs getmcpads (58):** сопоставимая глубина Google/Meta, но меньше ad platforms (нет Reddit/Pinterest native). Strict score: **54**.

---

### 3. Hyper AI MCP — marketing execution layer

| Поле | Значение |
|------|----------|
| URL | https://hyperfx.ai/mcp |
| MCP endpoint | `https://backend.hyperfx.ai/mcp/` |
| Integrations | 160+ verified, 56+ app connections |
| Ad platforms | Meta, Google, Amazon, TikTok, LinkedIn, Pinterest — full CRUD |
| Extras | Scrapers (Meta Ad Library, Reddit, TikTok), image/video gen, SEO, skills |
| Safety | Per-action approval rules in dashboard |

**Позиционирование:** не pure ads MCP, а marketing MCP с ad platform integrations. Strict score: **52**.

---

### 4. Ryze AI — Google+Meta+GA4 unified

| Поле | Значение |
|------|----------|
| URL | https://get-ryze.ai |
| MCP endpoint | `https://connector.get-ryze.ai/mcp` |
| GitHub | [irinabuht12-oss/google-meta-ads-ga4-mcp](https://github.com/irinabuht12-oss/google-meta-ads-ga4-mcp) (250+ tools, ⚠️ подозрительно высокие stars) |
| Tools | 150+ (Google 150+, Meta 80+, GA4) |
| Write | Approval-gated mutate tools |
| Pricing | Ads Autopilot $89/mo, 7-day trial |

**Red flag:** GitHub fork с 3391⭐ при дате Oct 2026 — проверить перед production. Strict score: **50**.

---

### 5. ZuckerBot — Meta specialist с creative pipeline

| Поле | Значение |
|------|----------|
| URL | https://zuckerbot.ai |
| MCP endpoint | `https://zuckerbot.ai/api/mcp` (hosted) или `npx zuckerbot-mcp` |
| GitHub | [DatalisHQ/zuckerbot](https://github.com/DatalisHQ/zuckerbot) |
| Tools | 65 (audit, campaign mgmt, creative analysis, CAPI, competitor research) |
| Write | Full Meta read/write when upgraded |
| Pricing | Lifetime deal tiers (Dealify) |

**Reddit:** упоминался в r/mcp (Mar 2026) как альтернатива official Meta MCP при `is_ads_mcp_enabled: false`. Strict score: **49**.

---

### 6. HYPD openai-ads-mcp — greenfield OpenAI Ads

| Поле | Значение |
|------|----------|
| GitHub | [HYPD-AI/openai-ads-mcp](https://github.com/HYPD-AI/openai-ads-mcp) |
| npm | `@hypd-ai/openai-ads-mcp` v0.1.1 |
| Tools | 11 read-only (account, campaigns, ad groups, ads, insights) |
| Platform | OpenAI Ads / ChatGPT Ads (US-only, ads.openai.com) |
| Write | ❌ None |

**Контекст:** OpenAI Ads — новая платформа 2026; PaidSync имеет write, HYPD — первый OSS RO. Strict score: **19** (greenfield RO).

---

## OSS-находки раунда 2

| Repo | ⭐ | Платформы | Tools | R/W | Особенности |
|------|---|-----------|-------|-----|-------------|
| [RoyAzran/mcp-ads](https://github.com/RoyAzran/mcp-ads) | 1 | Google, Meta, GA4, GTM, TikTok+ | 3363† | W | MIT, dispatcher pattern |
| [cedricarlos07/meta-ads-mcp](https://github.com/cedricarlos07/meta-ads-mcp) | new | Meta | 135 | W | Agency multi-tenant, v3 aligned with official Meta MCP |
| [hashcott/meta-ads-mcp-server](https://github.com/hashcott/meta-ads-mcp-server) | 16 | Meta | 54 | W | 35 read + 19 opt-in write, Graph API v22 |
| [v-p3truk/mcp-google-ads](https://github.com/v-p3truk/mcp-google-ads) | new | Google | 16 write + RO | W | Fork cohnen, API v24 |
| [MarventoCapital/marvento-ads-mcp](https://github.com/MarventoCapital/marvento-ads-mcp) | new | Google | many | W | Fork google-ads-mcp + write + VPS deploy |
| [martechery/mcp-google-ads-ts](https://github.com/martechery/mcp-google-ads-ts) | new | Google | 5 core | W/RO | TypeScript, ADC/OAuth, MCC |
| [adrex-ai/adrex-ai](https://github.com/adrex-ai/adrex-ai) | 2 | Google, Meta | 64 | W | Hosted + npx, circuit breaker |
| [RoASr-com/roasr-mcp](https://github.com/RoASr-com/roasr-mcp) | new | Meta, Google, Yandex | ~15 | RO+1W | Audit, Vision, competitor spy |
| [HYPD-AI/openai-ads-mcp](https://github.com/HYPD-AI/openai-ads-mcp) | new | OpenAI Ads | 11 | RO | First OSS for ChatGPT Ads API |
| [kashiflashari/ads-mcp](https://github.com/kashiflashari/ads-mcp) | 0 | Google, Meta, TikTok | 7 | RO | Normalized cross-platform schemas |
| julioccorderoc/ads-platforms *(removed Oct 2026)* | new | Amazon, Google, GA, Meta, TikTok | — | W | Monorepo, Railway deploy |
| [kadam-official/mcp-server](https://github.com/kadam-official/mcp-server) | new | Kadam network | 31 | W | Ad network MCP (adv + pub) |

† 3363 = registered actions in hosted build, exposed via dispatchers

---

## RO-tier находки (audit/analytics)

| Сервис | Платформы | Tools | Особенности |
|--------|-----------|-------|-------------|
| [AdCrunch](https://adcrunch.dev) | Google, Meta, TikTok | 6 query tools | `mcp.adcrunch.dev/mcp`, OAuth, RO default |
| [Flyweel MCP](https://flyweel.co/mcp) | Google, Meta, TikTok | 8 | 222 extended metrics, free unlimited, Pipedrive CRM join |
| [RoASr MCP](https://roasr.com) | Meta, Google, Yandex | ~15 | AI audit findings, Vision creative analysis |
| [kashiflashari/ads-mcp](https://github.com/kashiflashari/ads-mcp) | Google, Meta, TikTok | 7 | Normalized schemas |

---

## Конкурентный ландшафт (из PaidSync /vs/ pages)

Сервисы, упомянутые как конкуренты, но **не найденные** как отдельные MCP в раунде 2:

| Сервис | Статус | Примечание |
|--------|--------|------------|
| [Supermetrics](https://supermetrics.com) | MCP connector | 170+ sources, native Claude connector — **не верифицирован** endpoint |
| [Composio](https://composio.dev) | Developer MCP hub | Google/Meta через actions, не ads-specific |
| [Optmyzr / Madgicx / Revealbot](https://optmyzr.com) | SaaS automation | Не MCP-native |
| [AdCreative.ai](https://adcreative.ai) | Creative gen | Не MCP |

---

## Платформенные анонсы (обновить research-matrix)

| Платформа | Статус Oct 2026 | MCP |
|-----------|-----------------|-----|
| **OpenAI / ChatGPT Ads** | US-only beta | PaidSync write ✅ · HYPD RO OSS ✅ |
| **Pinterest Ads** | Alpha MCP (Markifact blog) | getmcpads, PaidSync |
| **Snapchat Ads** | Announced MCP (June 2026) | getmcpads, PaidSync, Markifact |
| **Meta Official** | Open beta Apr 2026, rules Jul 2026 | `mcp.facebook.com/ads` — rollout `is_ads_mcp_enabled: false` ~90% |

---

## Методология поиска раунда 2

```
1. site:github.com "ads mcp" OR "advertising mcp" 2026
2. site:reddit.com "mcp" ads 2026
3. Glama.ai + PulseMCP catalog search
4. Competitor /vs/ pages (PaidSync, MCP Ads)
5. npm registry: adrex-ai, @hypd-ai/openai-ads-mcp, @kadam-net/mcp-server
6. Cross-reference с oss-github-catalog.md — исключить дубликаты
```

---

## Ключевые выводы

1. **PaidSync (57)** входит в TOP-5 наряду с Markifact/Blend/AdManage; уникален по OpenAI Ads write + tracking stack.
2. **MCP Ads (54)** — недооценённый игрок: 3363 actions, но мало stars на GitHub (1⭐) — возможно новый launch Aug 2026.
3. **OpenAI Ads** — новая ось конкуренции: PaidSync write vs HYPD RO-only OSS.
4. **Meta MCP proliferation:** cedricarlos07 (135 tools), hashcott (54), ZuckerBot (65) — все позиционируются vs official beta rollout pain.
5. **RO analytics tier** растёт: AdCrunch, Flyweel, RoASr — альтернатива TrueClicks с большей глубиной метрик.
6. **Ryze AI GitHub fork** — red flag по stars; использовать hosted endpoint, не слепо доверять fork.

---

## Связанные документы

- [master-scores.md](./master-scores.md) — обновлённые A/B/C/D
- [master-matrix-oss.md](./master-matrix-oss.md) — OSS-статус новых сервисов
- [reddit-forum-survey.md](./reddit-forum-survey.md) — раунд 1 (Reddit/форумы)
- [oss-github-catalog.md](./oss-github-catalog.md) — полный GitHub-каталог
