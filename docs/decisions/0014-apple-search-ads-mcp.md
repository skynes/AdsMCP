# ADR 0014: Apple Search Ads через Apple Ads Platform API v1 MCP

- **Статус:** accepted
- **Дата:** 2026-10-23
- **Выбранный runtime:** `zelentsov-dev/apple-ads-mcp` release `v0.3.7`
- **Transport:** local stdio, `apple-ads-mcp serve --stdio`

## Контекст

Apple Search Ads теперь развивается в Apple Ads Platform API v1. Официальная
документация описывает OAuth 2.0 с ES256 JWT client secret, access token и
account-scoped вызовы. Legacy Campaign Management API v5 остаётся на период
миграции, но его sunset заявлен на 2027-01-26.

AdsMCP нужен безопасный read-only слой для App Store apps, advertising accounts,
campaigns, ad groups, keywords, ads, creatives и performance reports. Модуль
должен работать локально по stdio, оставлять private key на машине и быть
совместимым с Windows.

## Рассмотренные варианты

| Кандидат | Сильная сторона | Почему не выбран или выбран |
| --- | --- | --- |
| [zelentsov-dev/apple-ads-mcp](https://github.com/zelentsov-dev/apple-ads-mcp) `v0.3.7` | Platform API v1, 57 typed reads, local stdio, Windows ZIP, read-only default, preview/receipt safety gates | **Выбран:** лучший баланс актуальности API, покрытия и fail-closed режима |
| [AppVisionOS/apple-search-ads-mcp](https://github.com/AppVisionOS/apple-search-ads-mcp) | 74 tools, широкое v5-покрытие, reports, keywords и creatives | v5 sunset 2027-01-26, raw passthrough и широкая write-поверхность |
| [andrealufino/aapl-ads-mcp](https://github.com/andrealufino/aapl-ads-mcp) | MIT, 9 read-only tools, self-hosted stdio, роль API Account Read Only | v5 only, один org ID и узкое покрытие |
| [appadscli/appadscli](https://github.com/appadscli/appadscli) | v1-native, npm-бинарь для Windows, reports/ASO, dry-run/confirm | слишком широкая CLI/ASO/ROAS-поверхность и writes в MCP-контракте |
| [@trialanderror-ai/asa-mcp](https://www.npmjs.com/package/%40trialanderror-ai/asa-mcp) | npm Code Mode и компактный endpoint spec | `search` + `execute`, hand-built v5 spec и raw execute |
| [ppcprophet/apple-ads-mcp](https://github.com/ppcprophet/apple-ads-mcp) | reports и campaign management | hosted Streamable HTTP, bearer token и writes; нет локального stdio |

Официальный [Apple Node SDK](https://www.npmjs.com/package/%40apple/apple-ads-platform)
зафиксирован как API-contract reference, но не подключается как MCP runtime.

## Решение

Реестр использует установленный локально бинарь:

```json
{
  "id": "apple_search_ads",
  "transport": "stdio",
  "command": "apple-ads-mcp",
  "args": ["serve", "--stdio"],
  "env": {
    "APPLE_ADS_PROFILE": "${APPLE_ADS_PROFILE}",
    "APPLE_ADS_CLIENT_ID": "${APPLE_ADS_CLIENT_ID}",
    "APPLE_ADS_TEAM_ID": "${APPLE_ADS_TEAM_ID}",
    "APPLE_ADS_KEY_ID": "${APPLE_ADS_KEY_ID}",
    "APPLE_ADS_PRIVATE_KEY_PATH": "${APPLE_ADS_PRIVATE_KEY_PATH}",
    "APPLE_ADS_AD_ACCOUNT_ID": "${APPLE_ADS_AD_ACCOUNT_ID}",
    "APPLE_ADS_ALLOW_WRITES": "false",
    "APPLE_ADS_ALLOW_DELETES": "false"
  }
}
```

На Windows release ZIP и checksum нужно получить из upstream Releases. Если
`apple-ads-mcp` не находится в PATH, в игнорируемом `modules/modules.json`
указывается абсолютный путь к `apple-ads-mcp.exe`. В tracked example остаётся
портируемое имя команды, чтобы не фиксировать machine-specific path.

`APPLE_ADS_PRIVATE_KEY_PATH` передаётся как путь к локальному PEM-файлу; его
содержимое не попадает в env example, MCP arguments, SQLite или логи. Для
read-only профиля используется Apple Ads API user с ролью `API Account Read
Only`. `APPLE_ADS_ALLOW_WRITES` и `APPLE_ADS_ALLOW_DELETES` выставлены в
`false`, а все mutation/preview/apply/delete tools исключены из AdsMCP
allowlist. Всего разрешено 57 read-tools.

## Первый smoke-тест

После установки бинаря и настройки ключа проверяем в таком порядке:

1. `server_info` — подтверждает Platform API v1 и read-only режим.
2. `auth_check` — проверяет OAuth client credentials.
3. `ad_accounts_list` и `account_health` — проверяют ACL, currency и readiness.
4. `campaign_report` и `keyword_report` — сверяют spend, impressions, taps,
   installs, CPT/CPI и date range.

Live smoke без пользовательского Apple Ads private key не выполняется. Live
mutation acceptance не входит в CI и не разрешается этим ADR.

## Условия замены

Новый модуль должен поддерживать актуальный Apple Ads API, local stdio,
Windows или воспроизводимую установку, read-only allowlist и безопасную работу
с ES256 private key. Он должен пройти MCP-handshake и сверку reports с Apple.
Найденный пользователем или участником команды лучший вариант оформляется
отдельным commit и PR в `main`.
