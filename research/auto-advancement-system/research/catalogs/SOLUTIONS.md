# Advertising MCP Solutions Catalog

> **Date:** October 2026 · Links verified October 2026  
> **Source:** [solutions-catalog.md](../../../solutions-catalog.md)

Per-platform MCP servers and setup references.

---

## Google Ads

| Solution | GitHub / URL | Stars | R/W | OSS | Notes |
|----------|-------------|-------|-----|-----|-------|
| **Official** | [googleads/google-ads-mcp](https://github.com/googleads/google-ads-mcp) | ~1000 | RO | Yes | 3 tools: search, list_customers, get_metadata. Python, stdio |
| **Deprecated** | [googleads/google-ads-mcp](https://github.com/googleads/google-ads-mcp) *(replaces archived google-marketing-solutions/google_ads_mcp)* | ~230 | R/W | Yes | Archived → use official |
| **mharnett** | [mharnett/mcp-google-ads](https://github.com/mharnett/mcp-google-ads) | ~1 | R/W | Yes | 36 tools, MCC, Demand Gen E2E, Node.js, approval gate |
| **akelaonline** | [akelaonline/MCP-Google-Ads](https://github.com/akelaonline/MCP-Google-Ads) | — | R/W | Yes | ~40 tools, propose/confirm, SQLite audit, API v20 |
| **Adsap hosted** | [adsap.ai](https://adsap.ai/google-ads-mcp) | — | R/W | No | No dev token, hosted OAuth, preview writes |
| **getmcpads** | [getmcpads.com/google-ads](https://www.getmcpads.com/tools) | — | R/W | Partial | [getmcpads-com/google-ads-mcp-server](https://github.com/getmcpads-com/google-ads-mcp-server) |

**Official setup:**
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

| Solution | URL | R/W | OSS | Notes |
|----------|-----|-----|-----|-------|
| **Official** | `https://mcp.facebook.com/ads` | R/W | No | Meta-hosted, OAuth, 7 tool categories, beta |
| **byadsco** | [byadsco/meta-ads-mcp](https://github.com/byadsco/meta-ads-mcp) | R/W | Yes | 124 tools, multi-tenant, agency, self-hosted |
| **pipeboard** | [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp) | R/W | Partial | Hosted remote MCP, Meta Business Partner, 5 platforms |
| **getmcpads** | mcp.getmcpads.com/meta-ads/mcp | R/W | Partial | [getmcpads-com/meta-ads-mcp-server](https://github.com/getmcpads-com/meta-ads-mcp-server) |

**Official setup (Claude Code):**
```bash
claude mcp add --transport http --client-id <META_APP_ID> meta-ads https://mcp.facebook.com/ads
```

---

## Telegram Ads

| Solution | GitHub | R/W | Notes |
|----------|--------|-----|-------|
| **Free-cat** | [Free-cat/telegram_ads_mcp](https://github.com/Free-cat/telegram_ads_mcp) | R/W | Playwright, create_ad, set_cpm, increase_budget (TON), confirm gate |
| **sh0tn1k** | [sh0tn1k/telegram-ads](https://github.com/sh0tn1k/telegram-ads) | R/W | Hermes plugin, read-only watcher, Playwright login |

**No public API.** All solutions use browser automation.

**Tools (Free-cat):** list_accounts, list_ads, create_ad, update_ad, set_cpm, set_budget, increase_budget, set_status, get_ad_stats_csv

---

## Yandex Direct

| Solution | GitHub | Tools | R/W | Notes |
|----------|--------|-------|-----|-------|
| **SvechaPVL** | [SvechaPVL/yandex-mcp](https://github.com/SvechaPVL/yandex-mcp) | 132 | R/W | Direct + Metrika + Wordstat + Webmaster |
| **gmen1057** | [gmen1057/yandex-direct-mcp](https://github.com/gmen1057/yandex-direct-mcp) | ~80 | R/W | direct_launch_pack, max-conv, autotargeting |
| **askads** | [askads/mcp-yandex-direct](https://github.com/askads/mcp-yandex-direct) | many | R/W | Hosted RO at mcp.askads.ru, local full write |
| **OlegRadinuk** | [OlegRadinuk/yandex-direct-mcp](https://github.com/OlegRadinuk/yandex-direct-mcp) | 20 | R/W | dry-run by default |
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

| Solution | URL | R/W | Notes |
|----------|-----|-----|-------|
| **Official Agentic Hub** | TikTok for Business | R/W | Hosted, zero-code from Ads Manager, Jun 2026 |
| **getmcpads OSS** | [getmcpads-com/tiktok-ads-mcp-server](https://github.com/getmcpads-com/tiktok-ads-mcp-server) | R/W | 32 tools, 277 metrics, preview writes, Apache-2.0 |
| **AdsMCP org** | [AdsMCP/tiktok-ads-mcp-server](https://github.com/AdsMCP/tiktok-ads-mcp-server) | R/W | Fork/community variant |
| **getmcpads hosted** | mcp.getmcpads.com/tiktok-ads/mcp | R/W | 64 tools |

**Official endpoint:** `business-api.tiktok.com/open_mcp/`

---

## Reddit Ads

| Solution | GitHub | R/W | Notes |
|----------|--------|-----|-------|
| **desunit** | [desunit/reddit-ads-mcp](https://github.com/desunit/reddit-ads-mcp) | R/W | Ads API v3, Node.js, full hierarchy CRUD |
| **FarahTrip** | [FarahTrip/reddit-ads-mcp](https://github.com/FarahTrip/reddit-ads-mcp) | W opt-in | Python, REDDIT_ADS_WRITE_ENABLED flag |
| **getmcpads** | mcp.getmcpads.com/reddit-ads/mcp | R/W | 50 tools, 416 metrics |

**No official MCP from Reddit.**

---

## Microsoft Advertising (Bing)

| Solution | URL | R/W | Notes |
|----------|-----|-----|-------|
| **Official pilot** | `partner.api.bingads.microsoft.com/ext/mcp/vnext?toolSetNames=OpenBeta` | RO | Open pilot Jun 2026, AAD OAuth |
| **getmcpads** | mcp.getmcpads.com/bing-ads/mcp | R/W | 39 tools, 20 write (paid plan) |

**Docs:** [Microsoft Learn MCP Setup](https://learn.microsoft.com/en-us/advertising/guides/mcp-setup)

---

## Amazon Ads

| Solution | URL | R/W | Notes |
|----------|-----|-----|-------|
| **Official beta** | `advertising-ai.amazon.com/mcp` | R/W | Partners + API credentials, create account tool, SP workflow |
| **PyPI community** | [amazon-ads-mcp](https://pypi.org/project/amazon-ads-mcp/) | R/W | v0.3.x, multiple API surfaces |

---

## Cross-Platform Aggregators

| Solution | URL | Platforms | MCP endpoint | OSS | GitHub |
|----------|-----|-----------|--------------|-----|--------|
| **getmcpads** | getmcpads.com | 14 | `https://mcp.getmcpads.com/mcp` | Partial | [getmcpads-com](https://github.com/getmcpads-com) |
| **Synter** | syntermedia.ai | 27 | `https://mcp.syntermedia.ai` | Yes | [Synter-Media-AI/mcp-server](https://github.com/Synter-Media-AI/mcp-server) |
| **PaidSync** | paidsync.ai | 14 | `https://mcp.paidsync.ai/mcp` | Partial | [PaidSync/paidsync-mcp](https://github.com/PaidSync/paidsync-mcp) |
| **AdKit** | adkit.so | 7+ | `https://mcp.adkit.so` | Partial | [adkit/ads-mcp](https://github.com/adkit/ads-mcp) |
| **Metadata** | metadata.io | 8 B2B | `https://mcp-server.metadata.io/mcp` | No | — |
| **Markifact** | markifact.com | 11+ | hosted | Partial | [markifact/markifact-mcp](https://github.com/markifact/markifact-mcp) |
| **Pipeboard** | pipeboard.co | 5 | per-platform URLs | Partial | [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp) |
| **Adspirer** | adspirer.com | 6+ | `https://mcp.adspirer.com/mcp` | Partial | [amekala/ads-mcp](https://github.com/amekala/ads-mcp) |
| **cesteral** | self-host | 12 programmatic | local | Yes | [cesteral/mcp-open-advertising](https://github.com/cesteral/mcp-open-advertising) |

---

## Awesome Lists & Reviews

| Resource | URL | Content |
|----------|-----|---------|
| AdsMCP/awesome-ads-mcp-servers | [github.com/AdsMCP/awesome-ads-mcp-servers](https://github.com/AdsMCP/awesome-ads-mcp-servers) | Nearly empty (1 star) |
| Markifact blog | [state-of-advertising-mcps](https://www.markifact.com/blog/state-of-advertising-mcps) | Best official status overview Jul 2026 |
| AdMakeAI matrix | [admakeai.com/connect](https://admakeai.com/connect) | Connect table Jul 2026 |

---

## Official Documentation Links

- [Google Ads MCP Developer Guide](https://developers.google.com/google-ads/api/docs/developer-toolkit/mcp-server) — official read-only
- [Meta Ads MCP Overview](https://developers.facebook.com/documentation/ads-commerce/ads-ai-connectors/ads-mcp-server/ads-mcp-server-overview) — official beta
- [Amazon Ads MCP announcement](https://advertising.amazon.com/library/news/amazon-ads-mcp-server-open-beta) — Feb 2026
- [Microsoft Advertising MCP](https://about.ads.microsoft.com/en/solutions/technology/mcp-server) — pilot RO

*Source: [adsMCP/solutions-catalog.md](../../../solutions-catalog.md)*
