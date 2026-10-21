# Reddit & Forum Survey — Ads MCP Alternatives

> **Date:** October 2026  
> **Method:** `site:reddit.com` + Indie Hackers + r/PPC, r/mcp, r/MCPservers, r/FacebookAds, r/digital_marketing, r/adops  
> **Source:** [reddit-forum-survey.md](../../../reddit-forum-survey.md)

---

## TL;DR

Reddit and marketing forums surfaced **~15 new names** not in the original matrix. Top findings:

1. **[Blend MCP](https://blend-ai.com/mcp)** — most frequently mentioned hosted aggregator (8 platforms, write, official partner)
2. **[AdLoop](https://getadloop.com)** — 276⭐ OSS + hosted, Google+Reddit+GA4, safety guardrails
3. **[AdManage.ai](https://admanage.ai/mcp)** — bulk launch 100+ ads, Meta/TikTok/Snap/Pinterest/Taboola MCP
4. **[Windsor.ai MCP](https://mcp.windsor.ai/)** — 350+ sources, read+write on major ad platforms
5. **[Catchr.io MCP](https://api.catchr.io/mcp)** — 100+ platforms, Ads+GSC+Trends in one MCP
6. **[Adplane](https://mcp.adplane.ai)** — Google+Meta write, campaigns start paused
7. **[TrueClicks](https://data.trueclicks.com/mcp)** — free RO Google+Meta+Microsoft
8. **[Draivix/aidvertaiser](https://github.com/Draivix/aidvertaiser)** — 232 tools OSS, 8 platforms

---

## New Names from Reddit/Forums

| # | Service | A | B | C | D | **Σ** | Write | OSS | Source |
|---|---------|---|---|---|---|-------|-------|-----|--------|
| 1 | **[Blend MCP](https://blend-ai.com/mcp)** | 0 | 30 | 5 | 17 | **57** | ✅ gated | No | r/PPC, r/mcp |
| 2 | **[AdManage.ai](https://admanage.ai/mcp)** | 0 | 32 | 5 | 15 | **57** | ✅ bulk | No | r/FacebookAds |
| 3 | **[Windsor.ai MCP](https://mcp.windsor.ai/)** | 0 | 26 | 5 | 17 | **53** | ✅ select | No | r/PPC, r/mcp |
| 4 | **[AdLoop](https://getadloop.com)** | 0 | 28 | 5 | 14 | **52** | ✅ caps | Yes | r/PPC, r/MCPservers |
| 5 | **[Adplane](https://mcp.adplane.ai)** | 0 | 28 | 5 | 14 | **52** | ✅ paused | No | r/mcp |
| 6 | **[Draivix/aidvertaiser](https://github.com/Draivix/aidvertaiser)** | 0 | 26 | 5 | 16 | **52** | ✅ | Yes | GitHub |
| 7 | **[armavita-meta-ads-mcp](https://github.com/EfrainTorres/armavita-meta-ads-mcp)** | 0 | 28 | 5 | 14 | **52** | ✅ | Yes | r/MCPservers |
| 8 | **[Catchr.io MCP](https://api.catchr.io/mcp)** | 0 | 22 | 5 | 18 | **50** | ⚠️ mixed | No | r/PPC, r/MCPservers |
| 9 | **[AdSynthesis Engine](https://github.com/MAhmed004/ad-ops-mcp-hub)** | 0 | 24 | 5 | 14 | **48** | ✅ HITL | Yes | GitHub |
| 10 | **[Adport](https://github.com/ynnickw/adport)** | 0 | 24 | 5 | 14 | **48** | ✅ preview | Yes | r/MCPservers |
| 11 | **[TrueClicks](https://data.trueclicks.com/mcp)** | 0 | 18 | 5 | 18 | **46** | ❌ RO | Partial | r/PPC |
| 12 | **[AdOps MCP](https://www.npmjs.com/package/adops-mcp-server)** | 0 | 15 | 5 | 14 | **39** | ⚠️ CSV | Yes | r/mcp |
| 13 | **[OpenTabs](https://github.com/opentabs-dev/opentabs)** | 0 | 15 | 5 | 12 | **37** | ⚠️ browser | Yes | r/mcp |
| 14 | **[Smacient](https://smacient.com)** | 0 | 8 | 5 | 14 | **32** | ❌ RO | No | Indie Hackers |
| 15 | **[Coupler MCP](https://coupler.io/mcp)** | 0 | 10 | 5 | 15 | **35** | ⚠️ ETL | No | r/ClaudeCode |

---

## Findings by Subreddit

### r/PPC — primary PPC + MCP thread

| Thread | Key findings |
|--------|-------------|
| [MCP Server + Google Ads + Meta](https://www.reddit.com/r/PPC/comments/1r30hsz/) | cohnen/mcp-google-ads, TrueClicks free MCP, Windsor.ai, Blend |
| [Keyword research MCP](https://www.reddit.com/r/PPC/comments/1trc6l0/) | AdLoop, Catchr.io, official Google MCP |
| [Claude Code managing ads](https://www.reddit.com/r/PPC/comments/1sy40pq/) | Custom skills + API stack; Blend MCP mentioned |

**r/PPC insight:** Community recommends three patterns:
1. **Hosted zero-setup** — Blend, TrueClicks, Windsor, AdLoop Cloud
2. **Self-host OSS** — cohnen/mcp-google-ads, mharnett, AdLoop self-host
3. **Custom stack** — Google Ads API + Claude Code skills + Mutation Safety layer

### r/FacebookAds — Meta MCP rollout pain

| Thread | Key findings |
|--------|-------------|
| [Meta released Ads MCP](https://www.reddit.com/r/FacebookAds/comments/1szn2mx/) | Official beta; `is_ads_mcp_enabled: false` for ~90% of accounts |
| [MCP connection greyed out](https://www.reddit.com/r/FacebookAds/comments/1vcdafd/) | Progressive rollout; third-party MCP as workaround |
| [AdManage tool launch](https://www.reddit.com/r/FacebookAds/comments/1no0es9/) | AdManage.ai — 100+ ads/min bulk launch |

**Quote:** *"I am using AdManage's MCP which is a fine alternative"* — r/FacebookAds when official Meta MCP unavailable.

**Quote:** *"pipeboard or the GitHub ones with normal Marketing API tokens"* — workaround for Meta MCP beta.

### r/mcp — cross-platform and agency use cases

| Thread | Key findings |
|--------|-------------|
| [Cross-platform ad management](https://www.reddit.com/r/mcp/comments/1sgnk3v/) | AdOps MCP (14 tools, Google+Meta); Blend competitor comment |
| [MCPs for marketing agencies](https://www.reddit.com/r/mcp/comments/1t70x15/) | Windsor MCP, OpenTabs browser-session MCP |
| [Non-coding MCP uses](https://www.reddit.com/r/mcp/comments/1uoox8c/) | Windsor, Supermetrics, Adplane.ai |

### r/MCPservers — OSS discovery

| Thread | Key findings |
|--------|-------------|
| [Google Ads + GSC + GA4 + Shopify](https://www.reddit.com/r/MCPservers/comments/1vsln3a/) | No single MCP for all 5; Blend for ads write |
| [Meta Ads MCP OSS](https://www.reddit.com/r/MCPservers/comments/1ri5i8b/) | armavita-meta-ads-mcp — 78 tools, AGPLv3 |
| [Which MCPs essential](https://www.reddit.com/r/MCPservers/comments/1vngf56/) | AdLoop + MetaAds MCPs; AdKit "safest/most efficient" |
| [Apple Ads MCP](https://www.reddit.com/r/MCPservers/comments/1vpbrad/) | adport — Apple Search Ads, preview+approve writes |

---

## Reddit Finds vs Original Matrix

| Service | Was in matrix? | New? |
|---------|---------------|------|
| getmcpads, Synter, AdKit, Pipeboard, Adspirer | ✅ | — |
| **Blend MCP** | ❌ | **#1 Reddit mention**, 8 platforms |
| **AdLoop** | ❌ | 276⭐ OSS, Reddit Ads support |
| **AdManage.ai** | ❌ | Bulk launch king, 9 platforms |
| **Windsor.ai MCP** | ❌ | 350+ sources, ETL+MCP |
| **Catchr.io MCP** | ❌ | Ads+GSC+Trends |
| **Adplane** | ❌ | Google+Meta, paused-by-default |
| **TrueClicks** | ❌ | Free RO, audit-focused |
| **armavita-meta-ads-mcp** | ❌ | 78 Meta tools OSS |
| **AdOps MCP (CSV)** | ❌ | CSV-first analytics |
| **OpenTabs** | ❌ | Browser-session MCP |

---

## Use Case Recommendations (Reddit consensus)

| Task | Reddit consensus | Matrix alternative |
|------|-----------------|-------------------|
| Zero-setup Google write | Blend, AdLoop Cloud, Adplane | getmcpads, HireOtto |
| Meta when official unavailable | AdManage, pipeboard OSS, armavita | byadsco/meta-ads-mcp |
| Cross-platform ROAS in one chat | Blend, Windsor, getmcpads | Synter |
| Bulk launch 100+ creatives | AdManage.ai | — (unique) |
| Ads + SEO + Trends research | Catchr.io | InsightfulPipe |
| Agency 350+ sources ETL+MCP | Windsor.ai | InsightfulPipe |
| Free RO audit | TrueClicks, Smacient | getmcpads free |
| Self-host max control | AdLoop, aidvertaiser, armavita | cesteral OSS |
| No API approval (browser) | OpenTabs | Free-cat (Telegram) |
| Apple Search Ads | adport | getmcpads (limited) |

---

## Safety Patterns (repeated on Reddit)

1. **Read-only first week** — universal advice across r/PPC, r/mcp
2. **Campaigns created PAUSED** — Adplane, Blend, adport, AdKit pattern
3. **Mutation Safety / dry-run / staging** — custom Claude Code skills
4. **Confirm-before-write** — Blend, Windsor, getmcpads, AdKit
5. **Change log + audit trail** — top concern for Meta official MCP
6. **Rate limit batching** — Meta throttles past ~12 ad set updates (Blend comment)

---

## Links

- [Blend MCP](https://blend-ai.com/mcp)
- [AdLoop](https://getadloop.com) · [GitHub](https://github.com/kLOsk/adloop)
- [AdManage MCP](https://admanage.ai/mcp)
- [Windsor MCP docs](https://windsor.ai/documentation/windsor-mcp/)
- [Catchr MCP](https://www.catchr.io/mcp)
- [Adplane](https://mcp.adplane.ai)
- [TrueClicks MCP](https://data.trueclicks.com/mcp)
- [armavita-meta-ads-mcp](https://github.com/EfrainTorres/armavita-meta-ads-mcp)
- [Draivix/aidvertaiser](https://github.com/Draivix/aidvertaiser)

*Source: [adsMCP/reddit-forum-survey.md](../../../reddit-forum-survey.md)*
