# Альтернативы Google Ads — новые игроки и MCP-покрытие

> Google Ads official MCP — **read-only**. Альтернативы интересны если: (1) tech-friendly API/MCP, (2) self-serve без developer token, (3) новые каналы (AI search, native, retail media).

---

## Сравнительная таблица альтернатив

| Платформа | Тип | MCP | Self-serve | Мин. бюджет | AI/Agent-ready | Оценка tech | Балл авто-цикла |
|-----------|-----|-----|------------|-------------|----------------|-------------|-----------------|
| **Meta Ads** | Social | ✅ Official R/W | ✅ | ~$1/day | ⭐⭐⭐⭐⭐ | **65** |
| **TikTok Ads** | Social/Video | ✅ Official R/W | ✅ | varies | ⭐⭐⭐⭐⭐ | **52** |
| **Microsoft Advertising** | Search | ⚠️ RO pilot | ✅ | low | ⭐⭐⭐ | **20** |
| **Amazon Ads** | Retail media | ✅ Official R/W | ⚠️ partners | varies | ⭐⭐⭐⭐ | **59** |
| **LinkedIn Ads** | B2B | ❌ community | ✅ | $10/day | ⭐⭐⭐ | **46** |
| **Pinterest Ads** | Visual/search | ⚠️ alpha | ✅ | low | ⭐⭐⭐ | **34** |
| **Snapchat Ads** | Social | ⚠️ announced | ✅ | low | ⭐⭐⭐ | **37** |
| **Reddit Ads** | Community | ❌ community | ✅ | $5/day | ⭐⭐⭐ | **43** |
| **Telegram Ads** | Messaging | 🔧 Playwright | ⚠️ | 0.1 TON CPM | ⭐⭐⭐⭐ | **57** |
| **Yandex Direct** | Search (RU) | ✅ community | ✅ | low | ⭐⭐⭐⭐ | **58** |
| **VK Ads** | Social (RU) | ❌ none | ✅ | low | ⭐ | **0** |
| **Perplexity Ads** | AI search | ❌ | ❌ closed | CPM $50+ | ⭐ | **5** |
| **OpenAI ChatGPT Ads** | AI chat | ❌ no MCP | ⚠️ beta | TBD | ⭐⭐ | **10** |
| **Taboola / Outbrain** | Native content | ❌ | ✅ | $100+ | ⭐⭐ | **15** |
| **StackAdapt** | Programmatic | ❌ | ✅ | $10k+/mo | ⭐⭐⭐ | **20** |
| **The Trade Desk** | DSP | ❌ | ⚠️ enterprise | high | ⭐⭐⭐ | **15** |
| **RTB House** | Retargeting | ✅ getmcpads | ⚠️ | varies | ⭐⭐⭐ | **35** |

---

## AI-native рекламные платформы

### Perplexity Ads — ❌ закрыто
- Запускали sponsored questions, CPM $50+
- **2026: отказались от рекламы**, pivot на subscriptions
- Нет conversion tracking, нет self-serve, **нет MCP**
- Стратегия: SEO/brand mentions вместо paid

### OpenAI Ads (ChatGPT)
- Ads Manager beta, targeting by conversation context
- **Нет official MCP server** (отдельно от ChatGPT как MCP client)
- Markifact имеет connector «OpenAI Ads» — third-party
- Ранний этап, не для production automation

### Google AI Overviews / AI Mode ads
- Расширение Google Ads, не отдельная платформа
- Управляется через Google Ads API → те же MCP ограничения (official RO)

### Microsoft Copilot ads
- Часть Microsoft Advertising ecosystem
- MCP pilot read-only

---

## Native / Programmatic (без MCP, но tech-adjacent)

| DSP/Network | API | MCP | Комментарий |
|-------------|-----|-----|-------------|
| **Taboola** | REST API | ❌ | Self-serve, native placements |
| **Outbrain** | API | ❌ | Zemanta = Outbrain DSP |
| **StackAdapt** | API | ❌ | Native-first, mid-market |
| **Yahoo DSP** | API | ❌ | Includes Gemini native |
| **DV360** | Google Marketing Platform API | ❌ | Enterprise, complex auth |
| **The Trade Desk** | API | ❌ | Omnichannel, enterprise |

**Вывод:** Programmatic DSPs имеют API, но **никто не выпустил MCP**. Opportunity для wrapper.

---

## Региональные альтернативы (RU/CIS)

| Платформа | API | MCP | Потенциал |
|-----------|-----|-----|-----------|
| **Yandex Direct** | ✅ v5 | ✅ community (5+ repos) | **Готов к использованию** |
| **VK Ads** | ✅ Marketing API | ✅ 6+ community MCP | **lexamarketolog 55 tools**, LidFly, Click.ru |
| **myTarget (Mail.ru)** | ✅ | ❌ | Greenfield |
| **Telegram Ads** | ❌ | 🔧 Playwright | TON, уникальный канал |

### VK Ads — зрелый community MCP (2026 update)

> Полный обзор: [cis-platforms-mcp.md](./cis-platforms-mcp.md)

| MCP | Tools | Write | Notes |
|-----|-------|-------|-------|
| [lexamarketolog/vk-ads-mcp](https://github.com/lexamarketolog/vk-ads-mcp) | 55 | ✅ | Deepest OSS |
| [LidFly](https://lidfly.ru/mcp/v3) | 76 | ✅ gated | Hosted |
| [askads/mcp-vk-ads](https://github.com/askads/mcp-vk-ads) | 18 | ✅ | npm |
| [Click.ru MCP](https://help.click.ru/7886) | many | ✅ | Agency proxy |

myTarget API → merged into VK Ads (`ads.vk.com/api/v2`).

### VK Ads — историческая заметка (greenfield → solved)
- API документирован: [ads.vk.com/api](https://ads.vk.com/help)
- OAuth 2.0, campaigns/ad_groups/banners/statistics
- **Нет ни одного MCP на GitHub** (на окт 2026)
- Для RU-аудитории — приоритет #1 для собственной разработки

---

## Retail Media (растущий сегмент)

| Platform | MCP | Notes |
|----------|-----|-------|
| Amazon Ads | ✅ Official beta | Sponsored Products workflow |
| Walmart Connect | ❌ | API for partners |
| Instacart Ads | ❌ | API limited |
| Ozon Performance | ❌ | RU market, no MCP |

---

## Рекомендации по выбору альтернативы Google

### Если нужен MCP + write сегодня:
1. **Meta** — official, hosted, zero infra
2. **TikTok** — official Agentic Hub
3. **Yandex Direct** — если RU-трафик, community MCP зрелый

### Если нужен search (замена Google Search Ads):
1. **Microsoft Advertising** — MCP pilot RO, write через getmcpads
2. **Yandex Direct** — для RU
3. **Amazon Ads** — если e-commerce

### Если нужен новый канал + tech edge:
1. **Telegram Ads** — TON, Playwright MCP уже есть
2. **VK Ads** — build MCP from scratch
3. **Reddit** — community MCP, растущая аудитория

### Если нужен cross-platform один endpoint:
1. **getmcpads.com** — 14 sources, 600 tools
2. **markifact.com** — 11 platforms + analytics adjacent
3. **adkit.so** — draft-first, 7 platforms

---

## Trend watch (2026 H2)

| Trend | Платформы | MCP impact |
|-------|-----------|------------|
| Official MCP wave | Google RO, Meta R/W, TikTok R/W, Amazon R/W, MSFT RO | Стандартизация растёт |
| Agentic Hub model | TikTok, possibly Meta | Zero-code from ad manager UI |
| Read-first release | Google, MSFT, GA | Safety before writes |
| Cross-platform aggregators | getmcpads, markifact, pipeboard | Fill official gaps |
| AI search ads uncertainty | Perplexity out, OpenAI beta | Wait and see |
| Crypto payments | Telegram TON | Unique automation angle |

---

## Матрица «новый игрок vs Google» для tech-команды

```
                    MCP maturity →
         low                    high
    ┌─────────────────────────────────┐
  h │  VK Ads    Taboola             │  Meta Official
  i │  myTarget  OpenAI Ads          │  TikTok Hub
  g │  Perplexity                    │  getmcpads
  h │                                │  Yandex MCP
    ├─────────────────────────────────┤
  l │  DV360     TTD                 │  Google Official
  o │  StackAdapt                      │  (read-only!)
  w │                                │  Amazon MCP
    └─────────────────────────────────┘
         niche/new                  mainstream
```

**Sweet spot для собственного MCP:** VK Ads, myTarget (нет конкурентов), Telegram (TON + Playwright).
