# ADR-0011: X Ads через локальный read-only MCP

- Статус: accepted
- Дата: 2026-10-23
- Решение: подключить `@getmcpads/x-ads-mcp-server@1.0.1` через stdio
- Провайдер: X Ads API

## Контекст

Нужны account/campaign/reporting-инструменты X Ads в общем реестре AdsMCP с
жёстким read-only default. У X есть официальный Ads API и официальный remote MCP
на `https://ads-api.x.com/mcp`. Он требует OAuth2/PKCE, scopes `ads.read`
и `offline.access` для чтения и поддерживает больше инструментов, чем текущая
локальная конфигурация.

Текущий AdsMCP bridge умеет запускать stdio-модули и Streamable HTTP с заранее
переданным Bearer token, но не реализует OAuth callback, хранение rotating
refresh token и автоматическое обновление access token. Поэтому подключение
официального remote MCP со static token было бы хрупким operationally, даже если
сам endpoint является каноничным.

## Решение

Используем локальный
[`get-mcp-ads/x-ads-mcp-server`](https://github.com/get-mcp-ads/x-ads-mcp-server)
`v1.0.1`:

- stdio и Node >=22.12 совместимы с текущим runtime;
- запросы идут напрямую к официальному X Ads API;
- 25 read-инструментов покрывают accounts, campaigns, line items, ads,
  targeting, creatives/media metadata и reports;
- 19 write-инструментов существуют в пакете, но не передаются в AdsMCP
  allowlist;
- дополнительно устанавливаем `X_ADS_ENABLE_WRITES=false` и
  `X_ADS_SCOPES=ads.read`;
- версия pinned, чтобы обновление провайдера не меняло поверхность инструментов
  незаметно.

Обязательные настройки:

```text
X_ADS_ACCESS_TOKEN=<user OAuth2 access token>
X_ADS_ACCOUNT_IDS=<comma-separated account ids>
X_ADS_SCOPES=ads.read
X_ADS_ENABLE_WRITES=false
```

`X_ADS_ACCESS_TOKEN` должен быть пользовательским Ads OAuth2 token; app-only
Bearer для этого сценария недостаточен. Получение и обновление токенов остаётся
вне npm-модуля и не должно попадать в SQLite, MCP arguments или логи.

## Рассмотренные альтернативы

| Вариант | Плюсы | Минусы | Итог |
| --- | --- | --- | --- |
| [Official X Ads remote MCP](https://docs.x.com/x-ads-api/mcp) | 74 официальных tools, OAuth2/PKCE, native Ads API, account-scoped access | нет OAuth/refresh в текущем bridge; static access token быстро устаревает; нужен Ads Project access | официальный reference и будущая замена |
| [get-mcp-ads/x-ads-mcp-server](https://github.com/get-mcp-ads/x-ads-mcp-server) | local stdio, direct API, read-only default, Apache-2.0, bounded responses | нет встроенного OAuth/token refresh; небольшой новый проект | выбран |
| [xdevplatform/xurl](https://github.com/xdevplatform/xurl) | официальный OAuth2/PKCE auth bridge для X API MCP | ориентирован на `api.x.com/mcp`, не документирует Ads MCP endpoint/scopes | auth reference, не runtime |
| [twominutereports/twitter-ads-mcp](https://github.com/twominutereports/twitter-ads-mcp) | готовый hosted reporting MCP | внешний SaaS и непрозрачный credential/runtime boundary | не подключать |
| [adkit/ads-mcp](https://github.com/adkit/ads-mcp) | единый hosted слой для нескольких рекламных сетей | hosted backend, нет self-hosted контроля | optional hosted |
| [PaidSync X Ads](https://paidsync.ai/integrations/x-ads) | быстрый hosted workflow | внешняя зависимость и меньшая контролируемость API | не подключать |

## Безопасность и границы

- Установлен только read allowlist из `modules/modules.json` и
  `modules/modules.example.json`.
- Выключены campaign/line-item activation, budget/bid changes, targeting
  mutations, creative/media writes, web-event-tag writes и upload.
- `X_ADS_ACCOUNT_IDS` задаёт явный scope кабинетов; не полагаемся на случайный
  default account.
- До live-handshake не считаем модуль production-ready: требуется проверить
  Ads Project access, eligibility кабинета и реальные scopes токена.
- При истечении access token модуль нужно перезапустить с новым токеном; нельзя
  автоматически ретраить provider writes или сохранять секрет в логах.

## Проверка

После выдачи credentials выполнить read-only smoke-test:

1. `x_ads_list_ads_accounts` — проверить доступные кабинеты и выбранные IDs.
2. `x_ads_list_campaigns` — проверить список кампаний.
3. `x_ads_get_account_stats` — проверить метрики и денежные поля.
4. Сверить pagination, currency и даты с нормализованным reporting-контрактом.

Если bridge получит полноценный OAuth2/PKCE flow с безопасным хранением и
refresh token rotation, официальный remote MCP следует повторно оценить как
основной runtime. Любой новый кандидат проходит тот же read-only smoke-test,
после чего меняются pinned version, manifest и этот ADR отдельным коммитом/PR.
