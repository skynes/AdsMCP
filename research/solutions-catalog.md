# Каталог MCP-решений для рекламы

> Ссылки проверены на октябрь 2026. Stars — ориентир, не метрика качества.

---

## Google Ads

| Решение | GitHub / URL | Stars | R/W | OSS | Особенности |
|---------|-------------|-------|-----|-----|-------------|
| **Official** | [googleads/google-ads-mcp](https://github.com/googleads/google-ads-mcp) | ~1000 | RO | **Да** | 3 tools: search, list_customers, get_metadata. Python, stdio |
| **Deprecated exp.** | [googleads/google-ads-mcp](https://github.com/googleads/google-ads-mcp) *(replaces archived google-marketing-solutions/google_ads_mcp)* | ~230 | R/W | **Да** | Archived → use official |
| **mharnett** | [mharnett/mcp-google-ads](https://github.com/mharnett/mcp-google-ads) | ~1 | R/W | **Да** | 36 tools, MCC, Demand Gen E2E, Node.js, approval gate |
| **akelaonline** | [akelaonline/MCP-Google-Ads](https://github.com/akelaonline/MCP-Google-Ads) | — | R/W | **Да** | ~40 tools, propose/confirm, SQLite audit, API v20 |
| **Adsap hosted** | [adsap.ai](https://adsap.ai/google-ads-mcp) | — | R/W | **Нет** | No dev token, hosted OAuth, preview writes |
| **getmcpads** | [getmcpads.com/google-ads](https://www.getmcpads.com/tools) | — | R/W | **Частично** | [getmcpads-com/google-ads-mcp-server](https://github.com/getmcpads-com/google-ads-mcp-server); gateway закрыт |

**Setup official:**
```json
{
  "mcpServers": {
    "google-ads-mcp": {
      "command": "pipx",
      "args": ["run", "--spec", "git+https://github.com/googleads/google-ads-mcp.git", "google-ads-mcp"],
      "env": {
        "GOOGLE_PROJECT_ID": "YOUR_PROJECT_ID",
        "GOOGLE_ADS_DEVELOPER_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
```

---

## Meta Ads (Facebook / Instagram)

| Решение | URL | R/W | OSS | Особенности |
|---------|-----|-----|-----|-------------|
| **Official** | `https://mcp.facebook.com/ads` | R/W | **Нет** | Meta-hosted, OAuth, 7 категорий tools, beta |
| **byadsco** | [byadsco/meta-ads-mcp](https://github.com/byadsco/meta-ads-mcp) | R/W | **Да** | 124 tools, multi-tenant, agency, self-hosted |
| **pipeboard** | [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp) | R/W | **Частично** | Hosted remote MCP, Meta Business Partner, 5 platforms |
| **getmcpads** | mcp.getmcpads.com/meta-ads/mcp | R/W | **Частично** | [getmcpads-com/meta-ads-mcp-server](https://github.com/getmcpads-com/meta-ads-mcp-server) |

**Setup official (Claude Code):**
```bash
claude mcp add --transport http --client-id <META_APP_ID> meta-ads https://mcp.facebook.com/ads
```

---

## Telegram Ads

| Решение | GitHub | R/W | Особенности |
|---------|--------|-----|-------------|
| **Free-cat** | [Free-cat/telegram_ads_mcp](https://github.com/Free-cat/telegram_ads_mcp) | R/W | Playwright, create_ad, set_cpm, increase_budget (TON), confirm gate |
| **sh0tn1k** | [sh0tn1k/telegram-ads](https://github.com/sh0tn1k/telegram-ads) | R/W | Hermes plugin, read-only watcher, Playwright login |

**Нет публичного API.** Все решения — browser automation.

**Setup Free-cat:**
```bash
pip install "git+https://github.com/Free-cat/telegram_ads_mcp.git"
playwright install chromium
telegram-ads-auth  # ручной логин в браузере
```

**Tools Free-cat:** list_accounts, list_ads, create_ad, update_ad, set_cpm, set_budget, increase_budget, set_status, get_ad_stats_csv

---

## Yandex Direct

| Решение | GitHub | Tools | R/W | Особенности |
|---------|--------|-------|-----|-------------|
| **SvechaPVL** | [SvechaPVL/yandex-mcp](https://github.com/SvechaPVL/yandex-mcp) | 132 | R/W | Direct + Metrika + Wordstat + Webmaster |
| **gmen1057** | [gmen1057/yandex-direct-mcp](https://github.com/gmen1057/yandex-direct-mcp) | ~80 | R/W | direct_launch_pack, max-conv, autotargeting |
| **askads** | [askads/mcp-yandex-direct](https://github.com/askads/mcp-yandex-direct) | many | R/W | Hosted RO at mcp.askads.ru, local full write |
| **OlegRadinuk** | [OlegRadinuk/yandex-direct-mcp](https://github.com/OlegRadinuk/yandex-direct-mcp) | 20 | R/W | dry-run по умолчанию |
| **axisrow plugin** | [axisrow/yandex-direct-mcp-plugin](https://github.com/axisrow/yandex-direct-mcp-plugin) | 149 | R/W | OAuth elicitation, tool_help |

**Setup askads (npm):**
```json
{
  "mcpServers": {
    "yandex-direct": {
      "command": "npx",
      "args": ["-y", "mcp-yandex-direct"],
      "env": { "YANDEX_DIRECT_TOKEN": "your_token" }
    }
  }
}
```

---

## TikTok Ads

| Решение | URL | R/W | Особенности |
|---------|-----|-----|-------------|
| **Official Agentic Hub** | TikTok for Business | R/W | Hosted, zero-code from Ads Manager, Jun 2026 |
| **getmcpads OSS** | [getmcpads-com/tiktok-ads-mcp-server](https://github.com/getmcpads-com/tiktok-ads-mcp-server) | R/W | 32 tools, 277 metrics, preview writes, Apache-2.0 |
| **AdsMCP org** | [AdsMCP/tiktok-ads-mcp-server](https://github.com/AdsMCP/tiktok-ads-mcp-server) | R/W | Fork/community variant |
| **getmcpads hosted** | mcp.getmcpads.com/tiktok-ads/mcp | R/W | 64 tools |

**Official endpoint:** `business-api.tiktok.com/open_mcp/`

---

## Reddit Ads

| Решение | GitHub | R/W | Особенности |
|---------|--------|-----|-------------|
| **desunit** | [desunit/reddit-ads-mcp](https://github.com/desunit/reddit-ads-mcp) | R/W | Ads API v3, Node.js, full hierarchy CRUD |
| **FarahTrip** | [FarahTrip/reddit-ads-mcp](https://github.com/FarahTrip/reddit-ads-mcp) | R/W opt-in | Python, REDDIT_ADS_WRITE_ENABLED flag |
| **getmcpads** | mcp.getmcpads.com/reddit-ads/mcp | R/W | 50 tools, 416 metrics |

**Нет official MCP от Reddit.**

---

## Microsoft Advertising (Bing)

| Решение | URL | R/W | Особенности |
|---------|-----|-----|-------------|
| **Official pilot** | `partner.api.bingads.microsoft.com/ext/mcp/vnext?toolSetNames=OpenBeta` | RO | Open pilot Jun 2026, AAD OAuth |
| **getmcpads** | mcp.getmcpads.com/bing-ads/mcp | R/W | 39 tools, 20 write (paid plan) |
| **Opus Growth** | [opus-growth.com/microsoft-ads-mcp](https://opus-growth.com/microsoft-ads-mcp/) | R/W* | Hosted OAuth через Google, endpoint `https://mcp.opus-growth.com/mcp`, preview/approval; 75 бесплатных действий без карты |
| **Pipeboard** | [pipeboard.co/guides/microsoft-ads-mcp](https://pipeboard.co/guides/microsoft-ads-mcp) | RO/R/W* | Hosted OAuth через `Sign in with Google`, endpoint `https://microsoft-ads.mcp.pipeboard.co/`; free 30 действий/неделю, writes заявлены для Pro |

**Docs:** [Microsoft Learn MCP Setup](https://learn.microsoft.com/en-us/advertising/guides/mcp-setup)

`*` Возможности записи указаны самими сервисами и требуют live-проверки. У
Pipeboard документация одновременно заявляет write-tools и описывает текущий
Microsoft Ads MCP как read-focused, поэтому перед оплатой write-режим нельзя
считать подтверждённым.

---

## Amazon Ads

| Решение | URL | R/W | Особенности |
|---------|-----|-----|-------------|
| **Official beta** | `advertising-ai.amazon.com/mcp` | R/W | Partners + API credentials, create account tool, SP workflow |
| **PyPI community** | [amazon-ads-mcp](https://pypi.org/project/amazon-ads-mcp/) | R/W | v0.3.x, multiple API surfaces |

---

## Кросс-платформенные

| Решение | URL | Платформы | MCP endpoint | OSS | GitHub |
|---------|-----|-----------|--------------|-----|--------|
| **getmcpads** | getmcpads.com | 14 | `https://mcp.getmcpads.com/mcp` | **Частично** | [getmcpads-com](https://github.com/getmcpads-com) |
| **AdKit** | adkit.so | 7+ | `https://mcp.adkit.so` | **Частично** | [adkit/ads-mcp](https://github.com/adkit/ads-mcp) |
| **Metadata** | metadata.io | 8 B2B | `https://mcp-server.metadata.io/mcp` | **Нет** | — |
| **Markifact** | markifact.com | 11+ | hosted | **Частично** | [markifact/markifact-mcp](https://github.com/markifact/markifact-mcp) |
| **Pipeboard** | pipeboard.co | 5 | per-platform URLs | **Частично** | [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp) |
| **Adsap** | adsap.ai | Google+Meta | `https://mcp.adsap.ai/mcp` | **Нет** | — |
| **Synter** | syntermedia.ai | 27 | `https://mcp.syntermedia.ai` | **Да** | [Synter-Media-AI/mcp-server](https://github.com/Synter-Media-AI/mcp-server) |
| **Adspirer** | adspirer.com | 6+ | `https://mcp.adspirer.com/mcp` | **Частично** | [amekala/ads-mcp](https://github.com/amekala/ads-mcp) |
| **Opus Growth** | opus-growth.com | 4+ | hosted | **Да** | [opusgrowth/Opus-Growth-The-MCP-Connector-for-Ad-Platforms](https://github.com/opusgrowth/Opus-Growth-The-MCP-Connector-for-Ad-Platforms) |
| **cesteral** | self-host | 12 programmatic | local | **Да** | [cesteral/mcp-open-advertising](https://github.com/cesteral/mcp-open-advertising) |

---

## Awesome lists

| Repo | URL | Содержание |
|------|-----|------------|
| AdsMCP/awesome-ads-mcp-servers | [github.com/AdsMCP/awesome-ads-mcp-servers](https://github.com/AdsMCP/awesome-ads-mcp-servers) | Почти пустой (1 star) |
| Markifact blog | [state-of-advertising-mcps](https://www.markifact.com/blog/state-of-advertising-mcps) | Лучший обзор official status Jul 2026 |
| AdMakeAI matrix | [admakeai.com/connect](https://admakeai.com/connect) | Таблица connect Jul 2026 |

---

## Обзорные статьи

- [Google Ads MCP Developer Guide](https://developers.google.com/google-ads/api/docs/developer-toolkit/mcp-server) — official read-only
- [Meta Ads MCP Overview](https://developers.facebook.com/documentation/ads-commerce/ads-ai-connectors/ads-mcp-server/ads-mcp-server-overview) — official beta
- [Amazon Ads MCP announcement](https://advertising.amazon.com/library/news/amazon-ads-mcp-server-open-beta) — Feb 2026
- [Microsoft Advertising MCP](https://about.ads.microsoft.com/en/solutions/technology/mcp-server) — pilot RO
