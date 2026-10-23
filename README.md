# 🎯 AdsMCP

<img src="./branding/cover.png" alt="AdsMCP integrations cover" width="1200">

[Русская версия](./README.ru.md) · [中文版](./README.zh.md)

**Manage ads through an AI agent and keep your data local, for free.**

AdsMCP is a local MCP server that brings advertising campaigns, spend, and
analytics into one interface for your agent. Connect the platforms you need,
compare results, and spend less time on routine work.

Our goal is to make advertising simple: from audience research to launch and
optimization through a familiar chat, with you in control.

> Release `1.1.1`: the local core and modular integrations are available; each
> provider exposes its own capability and safety boundaries.
> The full advertising lifecycle through an agent is on the roadmap.

## What it can do today

- **Collect data:** projects, campaigns, spend, and conversions in local SQLite.
- **Measure results:** CTR, CPC, CPA, ROAS, and each channel's contribution to conversions.
- **Connect platforms:** import from Google Ads, Yandex Direct, Telegram Ads,
  and Microsoft Advertising once the relevant integrations are configured.
- **Work with communities:** Telegram, Discord, and Mastodon connectors
  for context research and conversations within each channel's rules.
- **Automate with control:** start with a trial run (`dry-run`);
  external actions require explicit confirmation.

The MCP server is enough to get started locally. Add integrations as you need
them; advertising accounts and access are configured separately.

## Integrations: available

Status describes project capabilities after accounts and modules are configured.
Changes on external platforms require explicit confirmation.

| Integration | Readiness | Available features and limits |
| --- | --- | --- |
| Google Ads | ✅ Import and selected actions | Reports and metrics in SQLite; changes through API Agent with confirmation. |
| Yandex Direct | ✅ Import and selected actions | Metrics, changes, and campaign creation with serving off; deletion is disabled. |
| Telegram Ads | ✅ Import and ad management | Reports, creation, budgets, review submission, and pausing through the official API. |
| Microsoft Advertising / Bing | ✅ Read-only | Campaigns, reports, and metric imports; campaign changes are disabled. |
| Telegram account | ✅ Search and conversations | Chat search and private/public replies; Premium requirements and rate limits apply. |
| Discord | ✅ Bot connector | Search and posting in permitted channels on authorized servers. |
| Mastodon | ✅ Account and conversations | OAuth, mention reads, replies, and profile updates. |
| CRM / Webhook | ✅ Event ingestion | Import submitted conversion events; CRM management is not implemented. |
| VK Ads via Click.ru | ✅ Integrated · manual step | Read-only broker connected; initial VK account linking is required. |
| Avito Ads | ✅ Integrated · read-only | Official Avito Ads API through a local read-only MCP allowlist. |
| Apple Search Ads | ✅ Integrated · read-only | Local read-only MCP for Apple Ads Platform API v1; 57 read tools, writes disabled. |
| TikTok Ads | ✅ Integrated · read-only | Local read-only MCP for the TikTok Business API; 35 read tools, writes disabled. |
| Reddit Ads | ✅ Integrated · read-only | Local read-only MCP for the official Reddit Ads API v3; write tier is disabled. |
| Email / SMTP + IMAP | ✅ Integrated · read/write | IMAP checks and SMTP sending via a restricted allowlist; destructive mailbox tools stay disabled. |
| Meta Ads | ✅ Integrated · read-only | Local read-only MCP for the official Meta Graph/Marketing API; 41 read tools, writes disabled. |
| OpenAI Ads / ChatGPT | ✅ Integrated · read-only | Official OpenAI Ads Advertiser API through a local MCP bridge; account, campaign, ad, insight, audience and audit reads are enabled. |
| Spotify Ads | ✅ Integrated · read-only | Local Adport MCP connects directly to the official Spotify Ads API; writes stay outside the allowlist. |
| X Ads | ✅ Integrated · read-only | Local read-only MCP connects directly to the official X Ads API; OAuth refresh remains external. |

## Capability matrix

The five capability columns describe what AdsMCP exposes now after the selected
module is configured. `API/MCP potential` records the broader verified provider
surface from the research matrix; it does not open those operations in runtime.
`Campaign create` means creating an advertising campaign, while `Account
create` means creating the advertising account itself. `Payment` means funding
or paying the advertising account, not reading a balance or changing a budget.

| Integration | Read now | Write now | Campaign create now | Account create now | Payment now | API/MCP potential |
| --- | --- | --- | --- | --- | --- | --- |
| Google Ads | ✅ | ✅ | — | — | — | read + write + campaign_create |
| Yandex Direct | ✅ | ✅ | ✅ | — | — | read + write + campaign_create |
| Telegram Ads | ✅ | ✅ | ✅ | — | — | read + write + campaign_create + account_create + payment* |
| Microsoft Advertising / Bing | ✅ | — | — | — | — | read |
| VK Ads via Click.ru | ✅ | — | — | — | — | read + write + campaign_create |
| Avito Ads | ✅ | — | — | — | — | read + write + campaign_create |
| Apple Search Ads | ✅ | — | — | — | — | read + write + campaign_create |
| TikTok Ads | ✅ | — | — | — | — | read + write + campaign_create |
| Reddit Ads | ✅ | — | — | — | — | read + write + campaign_create |
| Meta Ads | ✅ | — | — | — | — | read + write + campaign_create |
| OpenAI Ads / ChatGPT | ✅ | — | — | — | — | read + write + campaign_create |
| Spotify Ads | ✅ | — | — | — | — | read |
| X Ads | ✅ | — | — | — | — | read + write + campaign_create |
| Email / SMTP + IMAP | ✅ | ✅ | — | — | — | read + write |

\* Telegram payment remains partial: funding/KYC still require an external
step. A green integration status means the selected read/write surface is
implemented; it does not mean every provider capability is enabled.

See the [integration guide (Russian)](./docs/INTEGRATIONS.ru.md) for details
and the [roadmap](./docs/ROADMAP.md) for next steps.

## Quick start

You need **Node.js 22.5+** and an MCP client with stdio support, such as Cursor
or Claude Desktop. From the downloaded repository directory, run:

```sh
npm install
npm run build:mcp
```

Add the server to your MCP client configuration, replacing the path with your own:

```json
{
  "mcpServers": {
    "ads-mcp": {
      "command": "node",
      "args": ["C:/path/to/AdsMCP/dist/index.js"]
    }
  }
}
```

The client starts the server automatically. Ask your agent to check whether
everything is ready to get started. Data is stored in the repository's `data/`
directory by default.

Before using operational tools, review the [Free Use Rules](./docs/FREE-USE-RULES.md)
through `ads_free_use_rules` and accept the current version with
`ads_free_use_accept` using `confirm=true`. Acceptance is stored only in the
local `ADS_MCP_DATA` directory.

### GitHub updates

At startup AdsMCP checks GitHub at most once every 24 hours. It detects the
repository from the local `origin` remote, or you can set
`ADSMCP_UPDATE_REPOSITORY=owner/repository` in `.env`. A newer release or tag is
downloaded to `ADS_MCP_DATA/updates/`; the running installation and credentials
are never overwritten. Set `ADSMCP_UPDATE_ENABLED=false` to disable the check.

Once a week, AdsMCP checks the local Git working tree for changes made by the
user or a module. It never publishes credentials, local data, generated output
or ignored installation state. Recommendation-only changes can be submitted as
a PR automatically when the GitHub contribution setup is ready. Code, module,
documentation or configuration changes are shown by
`ads_github_contribution_status` and require an explicit
`ads_github_contribution_create_pr` call with `confirm=true`.

For contributions, configure `ADSMCP_UPSTREAM_REPOSITORY`, a personal
`ADSMCP_FORK_REPOSITORY` and a fine-grained `ADSMCP_GITHUB_TOKEN`, then call
`ads_github_contribution_setup`. The fork is not required for local use; it is
required only before publishing a PR. Set `ADSMCP_WEEKLY_PR_ENABLED=false` to
disable the weekly check.

## Documentation

| What you need | Where to go |
| --- | --- |
| Configure storage, modules, and the local dashboard | [User guide (Russian)](./docs/USAGE.ru.md) |
| Connect a platform and check its capabilities | [Integrations (Russian)](./docs/INTEGRATIONS.ru.md) |
| Understand the vision and development direction | [Product vision (Russian)](./docs/PRODUCT-VISION.ru.md) · [Roadmap](./docs/ROADMAP.md) |
| Explore the architecture and find detailed instructions | [Documentation index (Russian)](./docs/README.ru.md) |

## Build it with us

Join in: connect new platforms, improve modules and documentation, and share
your solutions. Together we can make advertising simpler, clearer, and more
accessible. Start with the [developer guide (Russian)](./docs/DEVELOPMENT.ru.md).

License: [MIT](./LICENSE).
