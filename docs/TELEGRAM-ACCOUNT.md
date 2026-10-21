# Telegram user account (GramJS)

AdsMCP includes the local Telegram account connection pattern used by Workix.
It is the first transport layer for the **Relationship-first Agentic Lead
Engagement** track and the future **Conversational Lead Proxy**. The account
workflow uses the local GramJS session by default. TDLib remains optional and is
not started when GramJS is available.

This is separate from Telegram Ads. Telegram Ads uses the provider MCP module
and an `ads.telegram.org` session; this integration connects a user's Telegram
account through GramJS for local chat and channel discovery.

## Setup

Install the optional dependencies:

```powershell
npm install
```

Create a Telegram application at [my.telegram.org/apps](https://my.telegram.org/apps)
and put the identifiers in the ignored `.env` file:

```dotenv
TELEGRAM_API_ID=123456
TELEGRAM_API_HASH=your_api_hash
# GramJS is the default backend for the local Alice session.
TELEGRAM_ACCOUNT_BACKEND=gramjs
```

The aliases `TG_APP_API_ID`, `TG_APP_API_HASH`, `TG_API_ID` and `TG_API_HASH`
are also supported for compatibility with Workix.

## Login through the local AdsMCP dashboard

The preferred local flow is:

1. Call `ads_dashbord_start`.
2. Open the returned `http://127.0.0.1:8790/` URL and select **Интеграции**.
3. In **Telegram account / Lead Proxy**, for the GramJS backend click **Войти
   по QR** and scan the local QR code from Telegram mobile: **Settings →
   Devices → Link Desktop Device**. If Telegram requests cloud 2FA, enter the
   password in the panel. TDLib still uses the phone/code flow.
4. Use **Обновить статус** until the account is `ready`.
   The panel also shows the currently connected account name, username and
   Telegram ID, without exposing the phone number.
5. Use `ads_telegram_account_search` for read-only chat discovery. For current
   outreach and public-reply rules, read
   [Telegram outreach policy](./TELEGRAM-OUTREACH-POLICY.ru.md).

The dashboard sends each value only to the local AdsMCP process. It does not
write phone numbers, login codes or 2FA passwords to SQLite, browser storage or
logs. The existing `ads_telegram_account_status` and
`ads_telegram_account_auth` tools remain available for a trusted local MCP
client, but the dashboard is the safer default for interactive login.

Terminal QR login remains available as a fallback:

```powershell
npm run telegram:account:login
```

The script supports `--qr` and `--sms` and keeps the resulting session in the
ignored local data directory.

Only use the auth tool through a trusted local MCP client. Do not paste login
codes or 2FA passwords into a hosted chat or an untrusted log collector.

## Local storage

GramJS keeps the local session under; TDLib directories are only relevant when
TDLib is explicitly selected:

```text
ADS_MCP_DATA/telegram/tdlib-db/
ADS_MCP_DATA/telegram/tdlib-files/
ADS_MCP_DATA/telegram/gramjs.session
```

All paths are children of the single `ADS_MCP_DATA` root. If it is not
configured, the root is `./data`. The entire data root is ignored by Git.
Account sessions, phone numbers, codes, passwords, messages and downloaded
Telegram files must never be committed.

## Premium gate and current scope

- account authentication through local GramJS;
- authentication state and dependency diagnostics;
- read-only history/search for one public or accessible chat, only when the
  connected account has Telegram Premium;
- Premium-gated global public-post search through the GramJS-compatible search
  client, with a free-quota check and no Stars unless explicitly confirmed;
- one manually confirmed plain-text message through `ads_telegram_account_send`,
  also only when the connected account has Telegram Premium;
- one manually confirmed public reply through
  `ads_telegram_public_post_reply`, only for a relevant explicit request and
  only when the linked discussion permits it;
- after joining a new group, a 30-second welcome/CAPTCHA checkpoint must finish
  before any write in that resource; a normal bot CAPTCHA may be completed only
  through the bot's own flow, and failed verification is handed to a human;
- saved client-profile drafts can be sent through the guarded batch tool: at
  most 50 profiles, preflight activity/consent checks, minimum 15 seconds and
  stop on the first error; no autonomous follow-up.

Premium is a local fail-closed prerequisite, not a guarantee against Telegram
rate limits, spam detection, restrictions or bans. The integration still needs
human review, compliant content, sensible pacing and opt-out handling.

See [the full outreach policy](./TELEGRAM-OUTREACH-POLICY.ru.md) and
[the client conversation guide](./CLIENT-CONVERSATION-GUIDE.ru.md) before using
any write tool. Premium is a prerequisite, not permission to send unsolicited
messages.
