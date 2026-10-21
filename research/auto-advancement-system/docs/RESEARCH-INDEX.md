# Research Index

> Complete survey archive · October 2026  
> 110+ services · 11 regions · A+B+C+D scoring

---

## Core documentation (this repo)

| Document | Description |
|----------|-------------|
| [README.md](../README.md) | Main concept (EN) + links to RU/ES/ZH |
| [IDEAL-PIPELINE.md](./IDEAL-PIPELINE.md) | End-to-end agent flow |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Agency Proxy MCP components |
| [CURRENT-STATE.md](./CURRENT-STATE.md) | Best approaches, closest services |
| [BLOCKERS.md](./BLOCKERS.md) | Blocker catalog |
| [LINKS.md](./LINKS.md) | Verified links registry |
| [REGIONAL-SCORES.md](./REGIONAL-SCORES.md) | 10-region v2.1 scores |

---

## Research archive (English)

### Matrices & scores

| File | Content | Services |
|------|---------|----------|
| [research/MASTER-MATRIX-SUMMARY.md](../research/MASTER-MATRIX-SUMMARY.md) | Top scores, methodology, ecosystem map | 110+ |
| [research/matrices/RESEARCH-MATRIX.md](../research/matrices/RESEARCH-MATRIX.md) | Original scoring matrix notes | — |

### Regions

| File | Content |
|------|---------|
| [research/regions/CIS-PLATFORMS.md](../research/regions/CIS-PLATFORMS.md) | LidFly, Yandex, VK, Telegram, Ozon, Click.ru |
| [research/regions/ASIA-PLATFORMS.md](../research/regions/ASIA-PLATFORMS.md) | Tencent, Naver, Kakao, Ocean Engine, Shopee |

### Agencies & full-cycle

| File | Content |
|------|---------|
| [research/agencies/FULL-CYCLE-AGENCIES.md](../research/agencies/FULL-CYCLE-AGENCIES.md) | KDirect, Koast, Rivox, Pixero, eLama |

### Catalogs

| File | Content |
|------|---------|
| [research/catalogs/AGGREGATORS.md](../research/catalogs/AGGREGATORS.md) | Synter, getmcpads, PaidSync, Markifact… |
| [research/catalogs/OSS-GITHUB.md](../research/catalogs/OSS-GITHUB.md) | ~80 GitHub MCP repos |
| [research/catalogs/SOLUTIONS.md](../research/catalogs/SOLUTIONS.md) | Per-platform MCP servers |
| [research/catalogs/DISPLAY-BANNER.md](../research/catalogs/DISPLAY-BANNER.md) | Taboola, PropellerAds, Criteo, Kevel |
| [research/catalogs/PUBLISHER-SUPPLY.md](../research/catalogs/PUBLISHER-SUPPLY.md) | SSP, ad servers, supply-side MCP |
| [research/catalogs/ALTERNATIVES-GOOGLE.md](../research/catalogs/ALTERNATIVES-GOOGLE.md) | Non-Google ad platforms |

### Surveys

| File | Content |
|------|---------|
| [research/surveys/REDDIT-FORUM.md](../research/surveys/REDDIT-FORUM.md) | Reddit & forum discoveries |
| [research/surveys/PRODUCTHUNT.md](../research/surveys/PRODUCTHUNT.md) | Product Hunt AI ads launches |
| [research/surveys/NEW-NAMES-ROUND2.md](../research/surveys/NEW-NAMES-ROUND2.md) | Round 2: PaidSync, MCP Ads, Hyper… |

---

## Source materials (Russian originals)

Full raw research with extended tables lives in parent monorepo:

```
../adsMCP/
├── master-unified.md          # 126 services master matrix
├── master-scores.md
├── agency-proxy-100-architecture.md
├── agency-proxy-regional-scores.md
├── agency-proxy-blockers.md
├── cis-platforms-mcp.md
├── asia-platforms-mcp.md
├── full-cycle-agencies.md
├── oss-github-catalog.md
├── aggregators-catalog.md
├── reddit-forum-survey.md
└── … (20 files total)
```

---

## Methodology reference

| Criterion | Max | Notes |
|-----------|-----|-------|
| A Registration | 25 | 0 = needs existing account |
| B Launch | 35 | −35 if read-only |
| C Payment | 20 | 5 = UI billing only |
| D Metrics | 20 | 12–14 basic, 18–20 full |

**Penalties:** Playwright −5 · beta −3…−5 · existing account −10…−25

---

## Key research conclusions

1. **No MCP tool exceeds 60/100** for media buying with existing-account context
2. **Agency Proxy design reaches 99/100** (Russia v2.1)
3. **CIS is most MCP-mature region** after global aggregators
4. **China has deepest API (358 tools)** but worst onboarding gate
5. **KDirect is only live RU full-cycle** without client cabinet
6. **Synter is best global MCP aggregator** (27 platforms)
7. **Telegram TON is best partial crypto payment** (C=12 in platform MCP context)
8. **Two "AdsMCP" products** — Adgentek (in-app) vs media buying MCP community

---

## Survey timeline

| Phase | Focus | Output |
|-------|-------|--------|
| Round 1 | Google alternatives, OSS GitHub | solutions-catalog, oss-github-catalog |
| Round 2 | Reddit, PH, new names | reddit-forum-survey, new-names-round2 |
| Round 3 | Asia, CIS regional | asia-platforms-mcp, cis-platforms-mcp |
| Round 4 | Supply-side, display | publisher-supply-mcp, display-banner-platforms |
| Round 5 | Full-cycle agencies | full-cycle-agencies |
| Round 6 | Agency Proxy 100 architecture | agency-proxy-100-architecture |
| Round 7 | Regional scores + blockers | agency-proxy-regional-scores, agency-proxy-blockers |
| Round 8 | Standalone repo | **this repository** |

---

*Last updated: October 2026*
