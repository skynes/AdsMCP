# ADR 0015: TikTok Ads через TikTok Business API MCP

- **Статус:** accepted
- **Дата:** 2026-10-23
- **Выбранный runtime:** `@getmcpads/tiktok-ads-mcp-server@2.0.1`
- **Transport:** local stdio через `npx`

## Контекст

TikTok Marketing API предоставляет рекламные campaigns, ad groups, ads,
audiences, creatives и reporting. TikTok также публикует first-party TikTok
for Business MCP Server, но он работает как remote bridge с широкой
campaign-management поверхностью. В AdsMCP нужен локальный Ads-only модуль,
который можно ограничить статическим allowlist и запускать read-only по
умолчанию.

## Рассмотренные варианты

| Кандидат | Сильная сторона | Почему не выбран или выбран |
| --- | --- | --- |
| [getmcpads-com/tiktok-ads-mcp-server](https://github.com/getmcpads-com/tiktok-ads-mcp-server) `v2.0.1` | 35 read-tools, 29 opt-in writes, direct TikTok Business API, native stdio, 277 metrics, Apache-2.0 | **Выбран:** лучший баланс локальности, reporting-покрытия и fail-closed режима |
| [TikTok for Business MCP Server](https://ads.us.tiktok.com/resources/help/article/about-tiktok-for-business-mcp-server?lang=en) | first-party full/progressive remote MCP, примерно 400/40 tools | hosted, широкая write-поверхность и нет локального AdsMCP allowlist |
| [AdsMCP/tiktok-ads-mcp-server](https://github.com/AdsMCP/tiktok-ads-mcp-server) | MIT, local Python/uv, OAuth и read-only tools | нет pinned release/npm distribution, меньше покрытие и отдельный uv checkout |
| [tiktok-mcp на PyPI](https://pypi.org/project/tiktok-mcp/0.2.0/) | keyring и gated writes, несколько TikTok API surfaces | выходит за Ads-only scope, account-change flows и большая операционная поверхность |
| [dhawalshah/tiktok-ads-mcp](https://github.com/dhawalshah/tiktok-ads-mcp) | campaigns/reports/audience на Python stdio | Firestore/Cloud Run remote mode и ручной credential lifecycle |
| [leverageaiapp/tiktok-ads-mcp](https://github.com/leverageaiapp/tiktok-ads-mcp) | reports, CLI и dry-run mutations | узкое покрытие и нет подходящего pinned package path |

## Решение

Подключаем pinned npm release:

```json
{
  "id": "tiktok_ads",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@getmcpads/tiktok-ads-mcp-server@2.0.1"],
  "env": {
    "TIKTOK_ACCESS_TOKEN": "${TIKTOK_ACCESS_TOKEN}",
    "TIKTOK_APP_ID": "${TIKTOK_APP_ID}",
    "TIKTOK_APP_SECRET": "${TIKTOK_APP_SECRET}",
    "TIKTOK_ADVERTISER_ID": "${TIKTOK_ADVERTISER_ID}",
    "TIKTOK_BC_ID": "${TIKTOK_BC_ID}",
    "TIKTOK_ENABLE_WRITES": "0",
    "LOG_LEVEL": "info"
  }
}
```

`TIKTOK_ACCESS_TOKEN` должен быть получен через TikTok for Business OAuth и
иметь доступ к нужным advertiser accounts; `TIKTOK_APP_ID` должен быть тем App
ID, которому принадлежит token. `TIKTOK_APP_SECRET` требуется только для
отдельных app-authenticated endpoints.

Пакет регистрирует 35 read-tools и 29 write-tools только при
`TIKTOK_ENABLE_WRITES=1`. AdsMCP дополнительно исключает все write-tools из
allowlist, поэтому включение этого флага во внешнем окружении не расширяет
доступ через наш bridge. GET-only raw tools остаются разрешёнными только в
пределах package host/path restrictions; все POST/update/delete endpoints
исключены.

Токен не сохраняется в SQLite, MCP arguments или логах AdsMCP. Пакет заявляет,
что сетевые вызовы идут только к TikTok Business API, а токен редактируется в
debug output. Пакет требует Node.js 22.12+; версия и npm ref зафиксированы.

## Первый smoke-тест

После настройки credentials проверяем:

1. `tiktok_health_check` — доступность токена и список advertiser accounts.
2. `tiktok_list_advertisers` — доступные кабинеты и account metadata.
3. `tiktok_get_campaigns` и `tiktok_get_adgroups` — структура.
4. `tiktok_validate_query` и `tiktok_get_insights` — валидность metrics/dimensions
   и spend/impressions/clicks/conversions за заданный период.

Live smoke без TikTok token не выполняется. Writes, budget changes, status
changes, creates и uploads этим ADR не разрешаются.

## Условия замены

Новый вариант должен поддерживать официальный TikTok Business API, локальный
stdio или воспроизводимую self-hosted установку, read-only allowlist,
проверяемую OAuth-модель и стабильный reporting contract. Лучший найденный
пользователем или участником команды вариант оформляется отдельным commit и PR
в `main`.
