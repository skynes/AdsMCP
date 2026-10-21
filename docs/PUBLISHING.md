# Publishing source

The public repository contains the local MCP core, reusable scripts, documentation,
research (including its bundled MIT license), provider manifest examples, and the
static landing page in `landing/` (legacy site sources remain in `build/`).
The root MIT license applies to AdsMCP sources.
External provider checkouts and the separately maintained Relay are not bundled.

The new landing page is tracked source, not generated output. Preview it with
`npm run preview:landing`; see [landing/README.md](../landing/README.md) for later
deployment to `ads.skynes.net`. It needs no build step and has not been published.

The following stay local through `.gitignore`:

- `.env`, credentials, OAuth tokens, Telegram sessions, browser cookies, and secrets.
- `data/`, databases and journals, account state, contacts, conversations, and logs.
- `projects/`, client creative assets, and dated `docs/ADS-EFFICIENCY-*.md` reports.
- The explicitly listed one-off scripts with real recipients or account-specific
  drafts. Put new private operations in `scripts/local/`.
- Provider installs, virtual environments, dependencies, generated MCP output,
  packaged site archives, and the separate `server/` checkout.

Keep custom `ADS_MCP_DATA` directories outside the source checkout, or explicitly
ignore them before use. A custom path is not automatically private to Git.

## Verification

From a full source checkout with Node.js 22.5 or newer:

```sh
npm ci
npm run check:publication
npm run typecheck
npm run smoke
npm audit
git diff --check
git status --short
```

These commands build and test the local core without provider credentials or the
Relay. `npm run smoke:network`, `build:all`, and `typecheck:all` require the separate
Relay checkout. CI runs the core checks on Node.js 22 and 24.

`check:publication` reads tracked and untracked publishable files, staged blobs,
and every blob reachable from `HEAD`. It flags tracked ignored paths,
common credential formats, compact credential literals, and matches to secret
values in the local `.env`. It prints only locations and categories. It requires
full history; fetch missing history before running it on a shallow clone.

Publish the reviewed `main` branch only. Local application checkpoint refs or
other non-main refs may contain private working files. Do not publish those refs
with `git push --all` or `--mirror`. To audit an intentional all-refs export,
run `node scripts/check-publication.mjs --history --all-refs` and resolve its
findings first. A normal branch push does not include unrelated refs.

The check is a guardrail, not an exhaustive secret detector. Review the staged
diff for private client data, provider IDs, and personal information as well.
`.gitignore` does not remove files already tracked or purge old commits. If a
credential has entered history, revoke it and clean the history before publishing.

## Runtime update check

The MCP process performs a non-blocking GitHub check at startup, at most once
per 24 hours. It uses `ADSMCP_UPDATE_REPOSITORY=owner/repository` when set, or
parses a GitHub `origin` remote. New release or tag archives are downloaded to
`ADS_MCP_DATA/updates/`; the current installation is not replaced automatically.
Set `ADSMCP_UPDATE_ENABLED=false` to disable the check. The check state and
downloaded archives stay under the ignored `data/` directory by default.

## Free-use acceptance

Operational MCP tools remain gated until the local user reviews
[FREE-USE-RULES.md](./FREE-USE-RULES.md) through `ads_free_use_rules` and calls
`ads_free_use_accept` with `confirm=true`. The acceptance record is local to
`ADS_MCP_DATA/consents/free-use.json`, is not sent to the project maintainer,
and becomes invalid when the rules version or document content changes.

## GitHub contribution workflow

Once per week, the MCP checks the local Git working tree for changes made by the
user or an installed module. It excludes ignored installation state, local data,
credentials and generated output. Recommendation-only changes can be submitted
automatically after setup. Any code, module, documentation or configuration
change is reported for review and requires the explicit
`ads_github_contribution_create_pr` tool call with `confirm=true`.

Provider checkouts and virtual environments under ignored installation paths
such as `modules/` are deliberately not collected. To publish a reusable module,
keep its source in a tracked project path or publish it from its own repository;
the contribution tool will then include its tracked changes.

Local use does not require a GitHub account or fork. Before publishing, set a
fine-grained `ADSMCP_GITHUB_TOKEN` with Contents and Pull requests write access,
set `ADSMCP_UPSTREAM_REPOSITORY`, and call `ads_github_contribution_setup`.
The setup tool can create and remember the personal fork after confirmation, or
you can set `ADSMCP_FORK_REPOSITORY` yourself. The PR is created from a branch
in the fork against the upstream repository; no local branch switching is
required.

Use `ads_github_contribution_status` to review the exact changed file list. The
publication check runs again before a confirmed PR is created. Set
`ADSMCP_WEEKLY_PR_ENABLED=false` to disable the weekly check.
