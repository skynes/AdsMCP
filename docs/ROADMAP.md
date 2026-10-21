# 🎯AdsMCP Roadmap

Product roadmap for turning AdsMCP into a safe, agent-facing advertising
automation layer.

[Русская версия](./ROADMAP.ru.md) · [中文版](./ROADMAP.zh.md)

Last reviewed: **2026-10-10**.

## Product direction

The long-term product is a client-facing **Agency Proxy MCP**. An AI agent
should be able to take a landing URL, business details, and a budget, then guide
the customer through verification, account setup, billing, campaign creation,
moderation, launch, reporting, and optimization through one controlled
interface.

```text
URL + business brief + budget
        -> KYC / business verification
        -> advertiser account or organization
        -> compliance and billing
        -> campaign draft and pre-moderation
        -> explicit approval and launch
        -> metrics, CRM, and revenue feedback
        -> guarded optimization
```

The happy path should be highly automated, but payments, identity, regulated
industries, platform verification, and other high-risk steps must support
explicit approval and a human review queue.

### Track: Relationship-first Agentic Lead Engagement

Alongside campaign operations, AdsMCP will develop a **Relationship-first
Agentic Lead Engagement** track, exposed as a **Conversational Lead Proxy**.
This is an agent that can work through a lead source or database, research each
contact, maintain an individual conversation state, and decide when to involve a
human or a commercial workflow.

```text
lead discovery -> research -> relationship building -> context memory
               -> intent detection -> human handoff / commercial action
```

The discovery loop is topic-first and intent-led:

```text
product / problem topic
        -> permitted thematic groups, chats, and public discussions
        -> expressed query or search for the product/team
        -> original context and source capture
        -> relevant permission-aware contact
        -> relationship building and intent detection
```

An unrelated group membership or a generic lead list is not enough to start an
outreach message. The first contact should be grounded in the person's own
question or expressed interest, subject to channel rules, consent, and opt-out
requirements.

The default policy is not to push a sales pitch immediately. The agent should
build context, respond naturally, and take commercial action only after an
explicit signal, permission, or configured business rule. Consent, opt-out,
channel terms, rate limits, truthful personalization, and human escalation are
part of the safety contract.

### Possible foundation: Chatwoot-backed client conversation workspace

The online conversation surface should likely start from a self-hosted
**Chatwoot Community Edition** workspace instead of a new inbox UI inside
AdsMCP. Chatwoot can provide the operator-facing inbox, contacts,
conversations, channel connections, and the basic human handoff surface. AdsMCP
would remain the agent-facing orchestration and policy layer: lead discovery,
research, context memory, intent detection, consent, response drafts, and
commercial action gates.

The planned boundary is:

```text
Chatwoot inbox / channel event
        -> AdsMCP lead identity and context memory
        -> research, intent and relationship state
        -> agent suggestion or response draft
        -> human approval / handoff / guarded action
        -> Chatwoot conversation
```

Integration requirements:

- map Chatwoot contacts and conversations to stable AdsMCP lead and relationship
  records;
- ingest inbound events through the Chatwoot API/webhooks and send approved
  replies back through the selected inbox;
- keep consent, opt-out, rate limits, audit history, and channel policy in
  AdsMCP rather than hiding them in UI-only state;
- support agent drafts and human takeover before any autonomous commercial
  action;
- keep the Chatwoot adapter replaceable so AdsMCP does not depend on one
  conversation UI or data model.

The initial evaluation should use the upstream Community Edition only. The
repository describes that edition as MIT-licensed; enterprise functionality is
separately licensed, so the exact edition and version must be checked before
redistributing a modified build.

## Roadmap principles

- Capability milestones are more important than calendar dates.
- Read and preview first; write operations require validation, confirmation, and
  an audit trail.
- Provider API implementations stay in external modules where possible.
- AdsMCP owns normalization, local memory, attribution, orchestration, and
  safety gates.
- A provider is not considered production-ready just because a module exists in
  a catalog.
- Every sync and write path must be retry-safe and observable.
- `ADS_MCP_DATA` is the one local data root; provider-specific state uses named
  subdirectories instead of parallel storage locations.

## Milestones

| Phase | Status | Scope | Exit criteria |
| --- | --- | --- | --- |
| **M0 — Local foundation** | ✅ Current | stdio MCP, SQLite memory, projects, campaigns, events, spend, analytics, attribution | Core tools build and run locally; data stays local and secrets stay outside SQLite |
| **M1 — Provider read layer** | ✅ Current / hardening | Google Ads, Yandex Direct, Telegram Ads, Microsoft Advertising, provider bridge, normalized sync | Read reports and imports are repeatable, deduplicated, allowlisted, and auditable |
| **M2 — Campaign creation** | 🔜 Next | Draft/preview, provider validation, explicit confirmation, creation, and audit for Google Ads, Yandex Direct, and Telegram Ads | A campaign can be safely created from a reviewed draft; writes remain gated and reversible where the provider allows it |
| **M3 — Agent onboarding** | 📋 Planned | Landing URL, business brief, target-audience and habitat research, intent-source map, tax ID/KYC, onboarding state, policy checks, and human review queue | An agent can understand the audience and its habitats before choosing a provider, then collect and validate the minimum launch context without exposing provider UIs |
| **M3.5 — Agentic Lead Engagement** | 📋 Planned | Topic-first discovery in permitted thematic groups/chats, expressed-interest capture, deduplication, research, relationship state, conversation memory, intent detection, and human handoff | The agent can find people who have already raised a relevant question, preserve its context, and maintain a traceable conversation without defaulting to mass sales messaging |
| **M3.6 — Telegram resource catalog synchronization** | 📋 Planned | Central API for discovering public chats and channels, idempotent sync with local `tg_resources`, publishing owned resources, project grouping, provenance, deduplication, policy/moderation, and audit; evaluate `dstore.one` and `userflow_bot` as a joint external workflow | The local catalog can be safely refreshed from the central API, relevant resources can be discovered, and owned resources can be published after review; the `dstore.one`/`userflow_bot` integration is accepted or rejected after reviewing API, auth, data model, and publication rules; conflicts and write actions are traceable and pass the configured approval gates |
| **M3.75 — Client conversation workspace** | 📋 Planned | Self-hosted Chatwoot Community Edition as an operator/client inbox, contact and conversation bridge, webhooks, agent drafts, context sync, and human takeover | An operator can work in a shared inbox while AdsMCP keeps the lead identity, relationship context, consent, intent, audit trail, and action gates consistent |
| **M4 — Agency Proxy operations** | 📋 Planned | Organization/account creation, compliance, billing, funding, moderation, launch, and client-facing status | A controlled agency-account flow can move an approved client from onboarding to live campaign |
| **M5 — Optimization loop** | 🌐 Vision | CRM/webhooks, revenue feedback, multi-touch attribution, recommendations, budget controls, and guarded execution | The agent can measure business outcomes and propose or apply bounded optimizations with auditability |

## Provider delivery order

The next write milestone is deliberately limited to three providers. The current
read-only paths remain the safety baseline while creation workflows are built.

| Provider | Current state | Next capability |
| --- | --- | --- |
| Google Ads | Official MCP and local normalization path | Create reviewed campaign drafts and submit them only after explicit confirmation |
| Yandex Direct | ZAI.ONE module and normalized statistics path | Create and validate campaigns through a guarded provider workflow |
| Telegram Ads | ZAI.ONE HTTP-session module and account/statistics sync | Create or update campaigns only after session, policy, budget, and confirmation gates |
| Microsoft Advertising | Official read-only MCP and aggregate sync | Evaluate write support after the first three providers and OAuth safety review |
| VK Ads via Click.ru | Read-only broker path; manual VK binding remains | Resolve account onboarding blocker before considering writes |
| Apple, TikTok, Reddit | Module-ready read paths | Add normalized sync and provider-specific creation only after stable module validation |
| Meta Ads | Planned adapter path | Define a safe Graph API/MCP runtime and account onboarding model |
| OpenAI Ads / ChatGPT | Planned candidate | Verify the product surface, account model, API access, targeting and policy boundary before designing an adapter |
| Spotify Ads | Planned candidate | Verify regional availability, campaign API, audio/video creative workflow and reporting model |
| X Ads | Planned candidate | Verify current ads API access, account eligibility, targeting and guarded campaign-management permissions |

## M2: campaign creation safety contract

Every provider write workflow should follow the same high-level contract:

1. Read account capabilities and required fields.
2. Generate a local draft without sending it to the provider.
3. Validate budget, dates, targeting, creative, tracking, and policy constraints.
4. Show a preview and require explicit confirmation.
5. Create the smallest safe provider object set.
6. Poll moderation or provider status without assuming success.
7. Record request, response summary, external IDs, and audit events locally.
8. Expose pause/rollback or a manual review path when the provider supports it.

No provider write tool should be added to the default allowlist without this
contract, a credential boundary review, and an offline smoke test.

## M3–M4: Agency Proxy flow

The client-facing flow described by the research documents is:

```text
submit landing URL
  -> understand business and audience
  -> collect tax ID / company details
  -> verify organization and representative
  -> create or select advertiser organization
  -> set budget and payment status
  -> prepare compliance and pre-moderation
  -> generate campaign draft
  -> approve and launch
  -> monitor metrics, CRM, and revenue
```

The client should not need to manage platform OAuth, agency tokens, or provider
UIs directly. Platform limitations, missing documents, regulated categories, and
moderation failures go to an explicit review queue instead of being hidden from
the agent or silently retried.

## Out of scope for the next milestone

- Unbounded autonomous spending.
- Storing provider credentials or raw cookies in SQLite.
- Enabling every provider's write tools at once.
- Treating a catalog entry or reference implementation as a production adapter.
- Hiding payment, KYC, platform verification, or regulatory decisions from the
  user.

## Source documents

- [Agency Proxy architecture](../research/agency-proxy-100-architecture.md)
- [Auto Advancement blueprint](../research/auto-advancement-system/README.md)
- [Ideal end-to-end pipeline](../research/auto-advancement-system/docs/IDEAL-PIPELINE.md)
- [Provider selection and decisions](./PROVIDER-MODULES.md)
- [Current architecture](./ARCHITECTURE.md)
- [Chatwoot Community Edition repository](https://github.com/chatwoot/chatwoot)
- [Chatwoot developer documentation](https://developers.chatwoot.com/)
