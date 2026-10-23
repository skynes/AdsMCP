# ADR 0013: Meta Ads через официальный Graph/Marketing API MCP

- **Статус:** accepted
- **Дата:** 2026-10-23
- **Выбранный runtime:** `@getmcpads/meta-ads-mcp-server@2.0.1`
- **Transport:** local stdio через `npx`

## Контекст

Нужно добавить Meta Ads к модульному слою AdsMCP: рекламные аккаунты Facebook и
Instagram, campaigns, ad sets, ads, creatives, audiences, targeting и Insights.
В текущем bridge уже есть статический env и allowlist MCP-модулей, поэтому
предпочтителен локальный адаптер, который напрямую вызывает официальный Meta
Graph/Marketing API и не вводит hosted backend.

## Рассмотренные варианты

| Кандидат | Сильная сторона | Почему не выбран или выбран |
| --- | --- | --- |
| [get-mcp-ads/meta-ads-mcp-server](https://github.com/get-mcp-ads/meta-ads-mcp-server) `v2.0.1` | 41 read-tools, 23 opt-in writes, direct Graph API, writes off by default, Node 22/24 | **Выбран:** лучший баланс покрытия, локальности и fail-closed режима |
| [hashcott/meta-ads-mcp-server](https://github.com/hashcott/meta-ads-mcp-server) | TypeScript, stdio/HTTP, 35 reads, 19 guarded writes | Graph API `v22.0` и более узкое покрытие; safety reference |
| [anhnguyen0905/meta-ads-mcp](https://github.com/anhnguyen0905/meta-ads-mcp) | минимальный read-only Python MCP и browser OAuth | только 5 read-tools, недостаточно для общего Meta-модуля |
| [byadsco/meta-ads-mcp](https://github.com/byadsco/meta-ads-mcp) | большой multi-tenant слой и 142 tools | Firestore/GCP и слишком широкая write-поверхность; избыточно для ядра |
| [brijr/meta-mcp](https://github.com/brijr/meta-mcp) | self-hosted Cloudflare/HTTP OAuth | не соответствует локальному stdio-профилю |
| [Synter MCP](https://github.com/Synter-Media-AI/mcp-server) | мультиплатформенный слой | hosted gateway и не прямой Meta connector |

## Решение

Подключаем модуль следующим способом:

```json
{
  "id": "meta_ads",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@getmcpads/meta-ads-mcp-server@2.0.1"],
  "env": {
    "META_ACCESS_TOKEN": "${META_ACCESS_TOKEN}",
    "META_ENABLE_WRITES": "0",
    "META_API_VERSION": "v26.0"
  }
}
```

`META_ACCESS_TOKEN` должен быть выдан пользователю или system user с
`ads_read`. Permission `ads_management` не требуется для текущего режима. Все
41 read-tool добавлены в allowlist; все 23 write-tool не добавляются. Даже если
пользователь позже включит `META_ENABLE_WRITES` у внешнего процесса, AdsMCP не
получит эти tools через свой реестр.

Креденшелы остаются вне SQLite, MCP arguments и логов. Рекомендуемый первый
порядок проверки: `meta_health_check` → `meta_list_ad_accounts` →
`meta_get_campaigns` → `meta_get_insights`. Для нормализации проверяем account
ID, currency, date range, spend, impressions, reach, clicks и conversions.

## Последствия

- Получаем широкий read-only охват Meta без собственного OAuth-кода и без
  hosted посредника.
- Нужен внешний процесс выдачи и обновления Meta access token; AdsMCP его не
  сохраняет и не ротирует.
- Версия пакета и Graph API зафиксированы, поэтому upgrade проходит отдельным
  обзором и повторным read-only smoke-тестом.
- Write-инструменты остаются вне production allowlist до отдельного ADR,
  approval-flow и provider readback/idempotency тестов.

## Условия замены

Модуль можно заменить, если новый кандидат одновременно даёт не меньше
account/campaign/report данных, сохраняет локальный transport, имеет явное
разделение read/write, безопасный credential flow, проходит MCP-handshake и
сверку нормализованных метрик с Meta. Найденный пользователем или участником
команды лучший вариант оформляется отдельным commit и PR в `main`.
