# Display / Banner / CPM / Programmatic Platforms

> **Date:** October 2026  
> Platforms selling **views, banners, popunder, push, native** — scored A–D (0–100)  
> **Source:** [display-banner-platforms.md](../../../display-banner-platforms.md)

Supply-side (publisher/SSP MCP): [PUBLISHER-SUPPLY.md](./PUBLISHER-SUPPLY.md)

---

## Summary Matrix

| Platform | Type | MCP | API | OSS | GitHub | A | B | C | D | **Σ** |
|----------|------|:---:|:---:|:---:|--------|---|---|---|---|-------|
| **Taboola Realize** | Native + Display | ✅ official | ✅ | Yes | [taboola/realize-mcp](https://github.com/taboola/realize-mcp) | 0 | 30 | 5 | 17 | **57** |
| **PropellerAds** | Push/Pop/Telegram | ✅ official | ✅ | Yes | [propellerads/propeller-mcp](https://github.com/propellerads/propeller-mcp) | 0 | 30 | 5 | 16 | **56** |
| **HilltopAds** | Pop/Push/Direct | ✅ official | ✅ | No | — | 0 | 28 | 5 | 15 | **53** |
| **Criteo** | Commerce/retargeting | ✅ official | ✅ | No | — | 0 | 28 | 5 | 17 | **50** |
| **AdRoll** | Retargeting display | ✅ official beta | ✅ | No | — | 0 | 25 | 5 | 16 | **50** |
| **Meta Audience Network** | In-app/display | ⚠️ via Meta MCP | ✅ | Partial | [byadsco/meta-ads-mcp](https://github.com/byadsco/meta-ads-mcp) | 0 | 28 | 5 | 17 | **50** |
| **Google Display Network** | Display via Google Ads | ⚠️ via aggregators | ✅ | Partial | [getmcpads-com/google-ads-mcp-server](https://github.com/getmcpads-com/google-ads-mcp-server) | 0 | 25 | 5 | 18 | **48** |
| **StackAdapt** | Programmatic multi | ✅ official GA | ✅ | No | — | 0 | 20 | 5 | 18 | **43** |
| **Outbrain/Zemanta** | Native programmatic | ⚠️ Synter only | ✅ | No | via Synter | 0 | 22 | 5 | 15 | **42** |
| **Adsterra** | Popunder CPM | ❌ | ✅ REST | No | — | 0 | 22† | 5 | 14 | **41** |
| **The Trade Desk** | Enterprise DSP | ⚠️ Synter/cesteral | ✅ | Yes | [cesteral/mcp-open-advertising](https://github.com/cesteral/mcp-open-advertising) | 0 | 20 | 5 | 16 | **41** |
| **DV360** | Google programmatic | ⚠️ Synter/cesteral | ✅ | Yes | [cesteral/mcp-open-advertising](https://github.com/cesteral/mcp-open-advertising) | 0 | 22 | 5 | 17 | **44** |
| **MGID** | Native CPC | ❌ | ✅ REST | No | — | 0 | 20† | 5 | 14 | **39** |
| **RichAds/ExoClick** | Push/Pop | ❌ | ✅ | No | — | 0 | 18† | 5 | 12 | **35** |
| **RTB House** | Retargeting | ⚠️ getmcpads | ✅ | No | via getmcpads | 0 | 10 | 5 | 16 | **31** |

† REST API exists; no MCP wrapper — custom adapter needed  
\* In-app/agent monetization (Adgentek 62, Agentic Ads 61, Hive Ad-Bid 56) — different category

---

## Tier 1: Official MCP

### PropellerAds — best CPM MCP

| | |
|---|---|
| **MCP** | https://mcp.propellerads.com/mcp |
| **GitHub** | [propellerads/propeller-mcp](https://github.com/propellerads/propeller-mcp) |
| **Formats** | Push, Popunder, Telegram Ads, Interactive, Paid Social |
| **Tools** | create_push/onclick/telegram campaigns, manage rates, targeting, stats, balance |
| **Auth** | API token (local, never sent to AI provider) |
| **Setup** | `.mcpb` bundle for Claude Desktop |
| **Pricing** | CPM, CPA Goal, Smart CPM |

### Taboola Realize — best native/display official MCP

| | |
|---|---|
| **GitHub** | [taboola/realize-mcp](https://github.com/taboola/realize-mcp) |
| **Transport** | Hosted Streamable HTTP + OAuth 2.1 |
| **Write tools** | `create_campaign`, `update_campaign`, `create_native_item`, `create_display_item` |
| **Also via** | Synter (27-platform catalog) |

### HilltopAds — 27 operations

| | |
|---|---|
| **MCP** | https://mcp.hilltopads.com/mcp |
| **Tools** | create/update campaigns, start/stop, set bid, whitelist/blacklist, stats by geo/zone |
| **Auth** | OAuth 2.0 + API key |
| **Safety** | Write requires confirmation; "never moves money" |

### Criteo — production retargeting MCP

| | |
|---|---|
| **Status** | Production (May 2026 — first fully orchestrated MCP campaign with dentsu) |
| **Capabilities** | Campaign creation, audience building, activation, optimization via natural language |
| **Also via** | Synter |

### StackAdapt — programmatic intelligence (read-heavy)

| | |
|---|---|
| **Status** | GA since April 2026 |
| **Channels** | CTV, Display, Native, Audio, DOOH, Programmatic Linear TV |
| **Focus** | Read-heavy: performance, creative audit, pacing (Ivy AI extension) |
| **Write** | Limited at launch |

---

## Tier 2: API Only (MCP adapter opportunity)

| Platform | API | MCP potential | Priority |
|----------|-----|---------------|----------|
| **Adsterra** | REST v3, full CPM CRUD | ~55–60/100 with wrapper | ⭐⭐⭐ |
| **MGID** | REST, full CRUD campaigns + teasers | ~50/100 | ⭐⭐⭐ |
| **RichAds** | REST | ~2 weeks effort | ⭐⭐ |
| **ExoClick** | REST | ~2 weeks effort | ⭐⭐ |

**Indirect:** [affset/mcp](https://github.com/affset/mcp) — bid presets for ExoClick, RichAds, PropellerAds, Adsterra (score **43** — affiliate tracker, not full campaign creation).

---

## Tier 3: Enterprise Programmatic DSP

| Platform | MCP path | Create campaigns | Min spend |
|----------|----------|-----------------|-----------|
| **DV360** | Synter, [cesteral/dv360-mcp](https://github.com/cesteral/mcp-open-advertising) | ✅ | Enterprise |
| **The Trade Desk** | Synter, cesteral/ttd-mcp | ✅ | Enterprise |
| **CM360** | Synter, cesteral | ⚠️ | Enterprise |
| **Amazon DSP** | Synter, cesteral, Amazon official | ✅ | Partners |
| **StackAdapt** | Official + Synter | ⚠️ | $10k+/mo typical |

**cesteral/mcp-open-advertising** — OSS monorepo with 12 programmatic servers (~250 tools, self-host score **55**).

---

## Tier 4: AI-Native Ad Networks (different category)

> These platforms **sell ads inside AI agents**, not website banners.

| Platform | Model | MCP | Crypto pay |
|----------|-------|-----|------------|
| **[Adgentek AdsMCP](https://adsmcp.ai/)** | Contextual in-chat ads | ✅ `mcp.adgentek.ai` | ❌ |
| **[Agentic Ads](https://github.com/nicofains1/agentic-ads)** | AdSense for AI agents | ✅ | USDC Polygon |
| **[Hive Ad-Bid](https://github.com/srotzin/hive-ad-bid)** | Agent CPM auction | ✅ | **USDC on Base** |
| **OpenAI ChatGPT Ads** | In-chat sponsored | ❌ MCP | ❌ |

**Hive Ad-Bid:** second-price Vickrey auction, x402 USDC settlement on Base — closest to "agent pays crypto autonomously."

---

## Recommendations

| Need | Recommendation |
|------|----------------|
| CPM/pop/push MCP out of box | **PropellerAds** → **HilltopAds** → **Taboola Realize** |
| Retargeting display | **AdRoll MCP** (beta) → **Criteo MCP** (production) |
| Programmatic/DSP | **Synter** (hosted) or **cesteral/mcp-open-advertising** (OSS) |
| AI-native (ads in agents) | **Hive Ad-Bid** → **Agentic Ads** → **Adgentek** |
| Greenfield wrapper | **Adsterra**, **MGID** (~1 week each) |

---

## getmcpads vs Display Specialists

| Capability | getmcpads | Synter | PropellerAds | Taboola |
|------------|-----------|--------|--------------|---------|
| Google Display (GDN) | ✅ | ✅ | ❌ | ❌ |
| Native ads | ❌ | ✅ Taboola+Outbrain | ❌ | ✅ |
| Push/Pop CPM | ❌ | ❌ | ✅ | ❌ |
| Retargeting | ⚠️ RTB House (7 tools) | ✅ Criteo | ❌ | ❌ |
| Programmatic DSP | ❌ | ✅ DV360, TTD | ❌ | ❌ |
| CTV/DOOH | ❌ | ✅ StackAdapt | ❌ | ❌ |
| Telegram Ads | ❌ | ❌ | ✅ create_telegram | ❌ |

**Conclusion:** getmcpads excels at search/social/analytics. For **pure views/banners**, combine getmcpads (GDN, Meta AN) + PropellerAds + Taboola, or use **Synter** as all-in-one ($20–500/mo).

*Source: [adsMCP/display-banner-platforms.md](../../../display-banner-platforms.md)*
