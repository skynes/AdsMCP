# AdsMCP Free Use Rules

**Version: 1.0** · **Effective date: 2026-10-21**

These rules explain the conditions for using the free AdsMCP local core. Read
them before the first operational tool call. The MCP server records acceptance
locally under `ADS_MCP_DATA/consents/free-use.json` and asks again when this
document's version or content changes.

## 1. Free local core

The AdsMCP local core is provided without a subscription or usage fee by the
project maintainer. Its source code is distributed under the MIT license. This
free-use notice does not grant rights to any third-party service or data source.

## 2. Third-party accounts and costs

You are responsible for your advertising accounts, API credentials, platform
terms, quotas, billing, hosting, network traffic and any charges from Google,
Microsoft, Yandex, Telegram, Meta, TikTok, Reddit, Spotify, X or another
connected service. AdsMCP does not promise that a third-party service will stay
free, available or compatible.

## 3. Lawful and respectful use

Use AdsMCP only for lawful activity and in accordance with the rules of each
connected platform. Do not use it for fraud, spam, unauthorized access,
evasion of platform safeguards, harassment, discrimination or unlawful data
collection. You are responsible for obtaining the permissions and consents
required for the data you import or process.

## 4. Review before external actions

Read-only imports and local analytics are separated from external writes.
External changes still require the relevant confirmation flags, but the final
decision and its consequences remain yours. Check the target account, audience,
budget, creative, message and destination before confirming an action.

## 5. Credentials and local data

Keep credentials, sessions, personal data and client information in the local
ignored data directory or environment variables. Do not commit them to a public
repository. You are responsible for access to the computer, MCP client and
connected accounts, including backups and deletion of local data.

## 6. GitHub contributions

GitHub publishing is optional. If you configure a personal fork and token,
AdsMCP may prepare a branch and pull request from reviewed local project
changes. Review the complete changed-file list before confirming publication.
Never place credentials, personal data, account exports or private installation
state in a contribution. You remain responsible for the token, fork, pull
request content and any merge decision.

## 7. Availability and responsibility

AdsMCP is provided on an “as is” and “as available” basis. The maintainer does
not guarantee uninterrupted operation, accuracy of third-party results,
regulatory compliance, campaign performance, or recovery from data loss. Test
changes in a safe scope and keep your own backups where appropriate.

## 8. Acceptance and withdrawal

Before using operational tools, call `ads_free_use_rules` to review this
document and then call `ads_free_use_accept` with `confirm=true` and the current
`rules_version`. Acceptance is local to the configured `ADS_MCP_DATA` directory;
it is not sent to the maintainer. Remove
`ADS_MCP_DATA/consents/free-use.json` to withdraw local acceptance and require
the notice again.

If you do not agree to these rules, do not accept them and do not use the
operational AdsMCP tools.
