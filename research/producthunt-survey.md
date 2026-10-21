# Product Hunt — обзор по теме Ads MCP

> Дата: 3 октября 2026  
> Метод: поиск `site:producthunt.com` + просмотр страниц продуктов

---

## TL;DR

На Product Hunt **мало чистых MCP-запусков для рекламы** — всего 2–3 заметных. Большинство «AI ads» продуктов — **закрытые агенты/SaaS без MCP** (Pixero, Pixel, Muze). **getmcpads, AdKit, Adspirer, Markifact, Pipeboard на PH не найдены** — они растут через SEO, MCP Registry и dev-комьюнити, не через PH.

---

## Категория A: Прямые MCP для рекламы

| Продукт | PH Rank | A | B | C | D | **Σ** | MCP? | Write | OSS |
|---------|---------|---|---|---|---|-------|------|-------|-----|
| **[Connector.wtf](https://connector.wtf)** | #25 Day | 0 | 8 | 5 | 16 | **34** | ✅ | ❌ RO | Нет |
| **[HireOtto](https://hireotto.com)** | #9 Day | 0 | 28 | 5 | 14 | **52** | ✅ | ✅ | Да |
| **[Synter](https://syntermedia.ai)** | forum | 0 | 32 | 5 | 18 | **60** | ✅ | ✅ | Да |
| **[MCP Playground](https://www.producthunt.com/products/mcp-playground)** | — | — | — | — | — | N/A | dev tool | — | Нет |

\* Meta connector перезапущен — ждут app review Meta; official FB MCP rollout медленный (AU, EU)

### Connector.wtf — ближайший бесплатный аналог getmcpads на PH

- **Free forever**, read-only
- Live: Google Ads, Search Console, WooCommerce, HubSpot CRM
- Soon: GA4
- Кросс-платформенные вопросы: «CPA Meta vs LinkedIn», «SEO cannibalization GAds vs GSC»
- Философия: write только с human approve + hard limits (обсуждают в комментариях)
- **Gap vs getmcpads:** нет write, меньше платформ, нет TikTok/Reddit/Bing

### HireOtto Google Ads MCP — #9 Day Rank

- Hosted MCP, **no Google Cloud / dev token**
- Create campaign одним промптом: `"Create campaign XYZ targeting NAMER at $50/day"`
- Full search campaign из одного prompt (Claude chains tool calls)
- Bids, negatives, reports — но **не autopilot**, co-pilot model
- **Gap:** только Google, нет multi-platform

### Synter — MCP анонс в forum, не full PH launch

Forum post (6mo ago): 140+ tools, 7+ platforms, npm `@synterai/mcp-server`, free 1000 credits, MCP Registry listed. Продуктовая страница: «AI Media Agents for Growth», 281 followers.

---

## Категория B: AI Ad Agents (без MCP, но конкурируют)

| Продукт | PH Rank | A | B | C | D | **Σ** | MCP? | Платформы |
|---------|---------|---|---|---|---|-------|------|-----------|
| **[Pixero AI](https://pixero.ai)** | #3 Day | 0 | 32 | 5 | 18 | **60** | ❌ | Meta (+soon) |
| **[Pixel (Metadata)](https://metadata.io)** | — | 0 | 30 | 5 | 18 | **58** | ❌ | 7 platforms |
| **[Muze AI](https://muzecmo.com)** | — | 0 | 28 | 5 | 17 | **55** | ❌ | Meta + Google |
| **[Lexi AI](https://lexilexi.ai)** | — | 0 | 28 | 5 | 14 | **52** | ❌ | Meta |
| **[Koast.ai](https://koast.ai)** | 165↑ | 0 | 26 | 5 | 14 | **50** | ❌ | Meta |
| **[NYX](https://www.producthunt.com/products/nyx)** | — | 0 | 26 | 5 | 14 | **50** | ❌ | Google, Meta, LinkedIn |
| **[Sami](https://www.producthunt.com/products/sami-automate-pace-scale-your-ads)** | — | 0 | 22 | 5 | 14 | **46** | ❌ | 4 platforms |

**Pixero** — самый близкий к «100/100» на PH: drop URL → strategy → creative → deploy → weekly optimization. 10k users in 3 months. Но: Meta-only, closed SaaS, не MCP, human-like pacing чтобы не забанили.

**Pixel** — Metadata.io tech ($1B+ managed spend), one prompt across 7 platforms. API «on roadmap». Не MCP — closed agent UI.

---

## Категория C: In-app / Publisher monetization (agentic ads)

| Продукт | PH | Что делает | MCP? |
|---------|-----|-----------|------|
| **[Dappier](https://www.producthunt.com/products/dappier)** | 4.8★, 677 followers | AI search on your site + conversational agentic ads | ❌ |
| **Adgentek AdsMCP** | ❌ not on PH | ads.serve in AI chats | ✅ |

Dappier — monetization для publishers (как Adgentek), не media buying.

---

## Категория D: Ad spy / research (не MCP, adjacent)

| Продукт | PH | Полезность для adsMCP |
|---------|-----|----------------------|
| [ChatGPT Ad Library](https://www.producthunt.com/products/chatgpt-ad-library) | #20 Day, 1mo ago | Spy OpenAI ads, 11k advertisers |
| [Magic Mango](https://www.producthunt.com/products/magic-mango) | — | Meta ad library tracking + AI analysis |
| [Pipiads](https://www.producthunt.com/products/pipiads) | — | TikTok + Meta ad spy |
| [Rankfender forum post](https://www.producthunt.com/p/rankfender) | — | Claude Code workflows for ads (audits, anomaly detection) |

---

## Чего НЕТ на Product Hunt

| Сервис | Статус |
|--------|--------|
| getmcpads.com | ❌ не найден |
| AdKit | ❌ |
| Adspirer | ❌ |
| Markifact | ❌ |
| Pipeboard | ❌ |
| Opus Growth | ❌ |
| InsightfulPipe | ❌ |
| Metadata MCP server | ❌ (есть Pixel, не MCP) |
| PropellerAds MCP | ❌ |
| Taboola Realize MCP | ❌ |
| HilltopAds MCP | ❌ |

**Вывод:** лидеры MCP-агрегации **не используют PH как канал**. PH — площадка для indie/solo launches (Connector.wtf, HireOtto) и consumer-facing agents (Pixero).

---

## Карта PH vs наша матрица

```
                    MCP-native ──────────────────────►
              low                                    high
         ┌──────────────────────────────────────────────────┐
    high │  Pixero          Pixel/Muze                      │
    auto │  (closed agent)  (closed agent)                  │
    cycle│                                                  │
         │  Connector.wtf   HireOtto    Synter (forum)      │
         ├──────────────────────────────────────────────────┤
    low  │  Sami/NYX        Ad spy tools                    │
         │  (API not MCP)   (Pipiads, Magic Mango)          │
         └──────────────────────────────────────────────────┘
              closed SaaS                         open MCP protocol

    getmcpads / Adspirer / Synter(full) — off-PH, stronger than PH launches
```

---

## Инсайты с PH для собственного adsMCP

1. **Free read-only wins trust** — Connector.wtf #25, обсуждение guardrails в комментариях
2. **«No dev token» — killer feature** — HireOtto #9, главный pitch
3. **Meta MCP rollout broken** — Connector перезапускает свой connector; opportunity для third-party Meta MCP
4. **Agents beat MCP on PH** — Pixero #3 vs MCP servers lower engagement; users хотят результат, не протокол
5. **Cross-data correlation sells** — GAds + GSC + WooCommerce + HubSpot в одном чате
6. **Human-like pacing matters** — Pixero explicitly slows API calls to avoid Meta bans

---

## Рекомендации: что смотреть/пробовать с PH

| Цель | С Product Hunt | Лучше off-PH |
|------|---------------|--------------|
| Free MCP read | Connector.wtf | getmcpads free tier |
| Google write MCP | HireOtto | getmcpads / mharnett OSS |
| Full auto Meta | Pixero | — |
| Multi-platform agent | Pixel (Metadata) | Synter / getmcpads |
| MCP dev/testing | MCP Playground | — |
| Ad spy | ChatGPT Ad Library, Magic Mango | AdKit library |

---

## Ссылки

- [Connector.wtf](https://www.producthunt.com/products/connector-wtf)
- [Google Ads MCP Server (HireOtto)](https://www.producthunt.com/products/google-ads-mcp-server)
- [Pixero AI](https://www.producthunt.com/products/pixero-ai-2)
- [Pixel by Metadata](https://www.producthunt.com/products/pixel-10)
- [Synter forum](https://www.producthunt.com/p/synter-media-ai)
- [MCP Playground](https://www.producthunt.com/products/mcp-playground)
