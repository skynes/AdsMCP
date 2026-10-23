# ADR 0017: OpenAI Ads / ChatGPT Advertiser API

- Status: accepted for read-only integration
- Date: 2026-10-23
- Provider: OpenAI Ads / ChatGPT Ads
- Selected runtime: local `openai_ads_official` stdio bridge

## Context

OpenAI publishes an official Ads Advertiser API with a documented OpenAPI
contract. It supports the ad-account hierarchy, campaigns, ad groups, ads,
insights, custom audiences, audit logs, product feeds and conversion setup.
The API also contains mutation endpoints, so an unrestricted generic REST
proxy would expose more power than the current AdsMCP safety boundary allows.

## Decision

Use a small first-party bridge in `src/openai-ads-mcp.ts` backed by the local
client in `src/integrations/openai-ads.ts`. The bridge uses the official base
URL and bearer key, and registers only read tools:

- ad account and accessible ad-account metadata;
- campaigns, ad groups and ads;
- time-granular insights at account, campaign, ad-group and ad level;
- custom audiences, audit logs and product feeds.

The module manifest passes only `OPENAI_ADS_API_KEY` and the optional base URL.
The dashboard therefore knows the module's required credential without storing
the secret in SQLite or sending it as a tool argument.

## Alternatives considered

1. Official Ads Manager UI — useful manual fallback, but it is not an MCP
   transport and cannot provide the local allowlist boundary.
2. Community OpenAI Ads MCP wrappers — potentially faster to install, but not
   the official runtime and not a better security or maintenance baseline than
   a small local adapter over the published API.
3. A generic REST passthrough — rejected because it would make mutation,
   upload, billing and payment endpoints reachable before a guarded workflow
   with confirmation, idempotency and provider readback exists.

## Capability tags

- Runtime: `read`
- Matrix potential: `read + write + campaign_create`
- `account_create` and `payment`: not claimed

The matrix tags describe the documented provider API; they do not override the
read-only module allowlist.

## Consequences

The integration can verify a token, inspect account structure and retrieve
reporting without introducing provider mutations. A future write phase must be
a separate decision with explicit confirmation, idempotency, safe defaults,
provider readback and an updated module allowlist.
