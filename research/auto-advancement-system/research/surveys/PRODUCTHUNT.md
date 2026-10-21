# Product Hunt Survey — Ads MCP

> **Date:** October 2026  
> **Method:** `site:producthunt.com` search + product page review  
> **Source:** [producthunt-survey.md](../../../producthunt-survey.md)

---

## TL;DR

Product Hunt has **few pure MCP launches for advertising** — only 2–3 notable ones. Most "AI ads" products are **closed agents/SaaS without MCP** (Pixero, Pixel, Muze). **getmcpads, AdKit, Adspirer, Markifact, Pipeboard were not found on PH** — they grow via SEO, MCP Registry, and dev community, not PH.

---

## Category A: Direct MCP for Advertising

| Product | PH Rank | A | B | C | D | **Σ** | MCP? | Write | OSS |
|---------|---------|---|---|---|---|-------|------|-------|-----|
| **[Connector.wtf](https://connector.wtf)** | #25 Day | 0 | 8 | 5 | 16 | **34** | ✅ | ❌ RO | No |
| **[HireOtto](https://hireotto.com)** | #9 Day | 0 | 28 | 5 | 14 | **52** | ✅ | ✅ | Yes |
| **[Synter](https://syntermedia.ai)** | forum | 0 | 32 | 5 | 18 | **60** | ✅ | ✅ | Yes |

### Connector.wtf — closest free getmcpads analog on PH

- **Free forever**, read-only
- Live: Google Ads, Search Console, WooCommerce, HubSpot CRM
- Soon: GA4
- Cross-platform questions: "CPA Meta vs LinkedIn", "SEO cannibalization GAds vs GSC"
- Philosophy: write only with human approve + hard limits
- **Gap vs getmcpads:** no write, fewer platforms, no TikTok/Reddit/Bing

### HireOtto Google Ads MCP — #9 Day Rank

- Hosted MCP, **no Google Cloud / dev token**
- Create campaign in one prompt: `"Create campaign XYZ targeting NAMER at $50/day"`
- Full search campaign from single prompt (Claude chains tool calls)
- Bids, negatives, reports — but **not autopilot**, co-pilot model
- **Gap:** Google only, no multi-platform

### Synter — forum announcement, not full PH launch

Forum post (6mo ago): 140+ tools, 7+ platforms, npm `@synterai/mcp-server`, free 1000 credits, MCP Registry listed.

---

## Category B: AI Ad Agents (no MCP, but compete)

| Product | PH Rank | A | B | C | D | **Σ** | MCP? | Platforms |
|---------|---------|---|---|---|---|-------|------|-----------|
| **[Pixero AI](https://pixero.ai)** | #3 Day | 0 | 32 | 5 | 18 | **60** | ❌ | Meta (+soon) |
| **[Pixel (Metadata)](https://metadata.io)** | — | 0 | 30 | 5 | 18 | **58** | ❌ | 7 platforms |
| **[Muze AI](https://muzecmo.com)** | — | 0 | 28 | 5 | 17 | **55** | ❌ | Meta + Google |
| **[Lexi AI](https://lexilexi.ai)** | — | 0 | 28 | 5 | 14 | **52** | ❌ | Meta |
| **[Koast.ai](https://koast.ai)** | 165↑ | 0 | 26 | 5 | 14 | **50** | ❌ | Meta |
| **[NYX](https://www.producthunt.com/products/nyx)** | — | 0 | 26 | 5 | 14 | **50** | ❌ | Google, Meta, LinkedIn |
| **[Sami](https://www.producthunt.com/products/sami-automate-pace-scale-your-ads)** | — | 0 | 22 | 5 | 14 | **46** | ❌ | 4 platforms |

**Pixero** — closest to "100/100" on PH: drop URL → strategy → creative → deploy → weekly optimization. 10k users in 3 months. Meta-only, closed SaaS, not MCP, human-like pacing to avoid Meta bans.

**Pixel** — Metadata.io tech ($1B+ managed spend), one prompt across 7 platforms. API "on roadmap". Not MCP — closed agent UI.

---

## Category C: In-app / Publisher Monetization

| Product | PH | What it does | MCP? |
|---------|-----|-------------|------|
| **[Dappier](https://www.producthunt.com/products/dappier)** | 4.8★, 677 followers | AI search on your site + conversational agentic ads | ❌ |
| **Adgentek AdsMCP** | ❌ not on PH | ads.serve in AI chats | ✅ |

Dappier — publisher monetization (like Adgentek), not media buying.

---

## Category D: Ad Spy / Research (adjacent)

| Product | PH | Usefulness for adsMCP |
|---------|-----|----------------------|
| [ChatGPT Ad Library](https://www.producthunt.com/products/chatgpt-ad-library) | #20 Day | Spy OpenAI ads, 11k advertisers |
| [Magic Mango](https://www.producthunt.com/products/magic-mango) | — | Meta ad library tracking + AI analysis |
| [Pipiads](https://www.producthunt.com/products/pipiads) | — | TikTok + Meta ad spy |

---

## NOT on Product Hunt

| Service | Status |
|--------|--------|
| getmcpads.com | ❌ not found |
| AdKit, Adspirer, Markifact, Pipeboard | ❌ |
| Opus Growth, InsightfulPipe | ❌ |
| PropellerAds MCP, Taboola Realize MCP | ❌ |

**Conclusion:** MCP aggregation leaders **do not use PH as a channel**. PH is for indie/solo launches (Connector.wtf, HireOtto) and consumer-facing agents (Pixero).

---

## PH vs Matrix Map

```
                    MCP-native ──────────────────────►
              low                                    high
         ┌──────────────────────────────────────────────────┐
    high │  Pixero          Pixel/Muze                      │
    auto │  (closed agent)  (closed agent)                  │
         │  Connector.wtf   HireOtto    Synter (forum)      │
         ├──────────────────────────────────────────────────┤
    low  │  Sami/NYX        Ad spy tools                    │
         └──────────────────────────────────────────────────┘
              closed SaaS                         open MCP protocol

    getmcpads / Adspirer / Synter(full) — off-PH, stronger than PH launches
```

---

## Insights for adsMCP Development

1. **Free read-only wins trust** — Connector.wtf #25, guardrails discussion in comments
2. **"No dev token" is a killer feature** — HireOtto #9, main pitch
3. **Meta MCP rollout broken** — Connector relaunching connector; opportunity for third-party Meta MCP
4. **Agents beat MCP on PH** — Pixero #3 vs lower MCP server engagement; users want results, not protocol
5. **Cross-data correlation sells** — GAds + GSC + WooCommerce + HubSpot in one chat
6. **Human-like pacing matters** — Pixero explicitly slows API calls to avoid Meta bans

---

## Recommendations

| Goal | From Product Hunt | Better off-PH |
|------|-------------------|---------------|
| Free MCP read | Connector.wtf | getmcpads free tier |
| Google write MCP | HireOtto | getmcpads / mharnett OSS |
| Full auto Meta | Pixero | — |
| Multi-platform agent | Pixel (Metadata) | Synter / getmcpads |
| Ad spy | ChatGPT Ad Library, Magic Mango | AdKit library |

---

## Links

- [Connector.wtf](https://www.producthunt.com/products/connector-wtf)
- [Google Ads MCP Server (HireOtto)](https://www.producthunt.com/products/google-ads-mcp-server)
- [Pixero AI](https://www.producthunt.com/products/pixero-ai-2)
- [Pixel by Metadata](https://www.producthunt.com/products/pixel-10)
- [Synter forum](https://www.producthunt.com/p/synter-media-ai)

*Source: [adsMCP/producthunt-survey.md](../../../producthunt-survey.md)*
