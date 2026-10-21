# ADR-0003: Microsoft Advertising через официальный read-only MCP

Дата: 2026-10-08

## Контекст

Варианты включали два community Microsoft Ads MCP, мультиплатформенные Synter и
PaidSync и каталог Advertising Hub. AdsMCP уже имеет локальный PKCE OAuth-профиль,
MCP bridge с allowlist и общую SQLite-модель кампаний/расходов/конверсий.

Community Microsoft-серверы полезны как reference, но используют legacy SOAP SDK
и дают write-поверхность разного уровня безопасности. Microsoft официально
предлагает hosted MCP с единым read-only контрактом entity tools и performance
metrics. Microsoft также переводит API с SOAP на REST.

## Решение

Использовать `microsoft_ads_official` как внешний Streamable HTTP-модуль:

- `get_accounts` используется для безопасного выбора account/customer context;
- `get_campaigns` вызывается с `PerformanceDateRange` и pagination;
- `get_ad_groups`, `get_ads`, `get_keywords`, `get_asset_groups` и
  `get_audience_associations` остаются доступны через общий `ads_module_call`, но
  не нужны нормализатору отчёта;
- `ads_microsoft_ads_report` возвращает нормализованный aggregate report;
- `ads_microsoft_ads_sync` сохраняет кампании, aggregate spend и conversions с
  dedupe keys в SQLite;
- provider writes не добавляются в allowlist.

## Ограничение данных

Official MCP поддерживает preset ranges (`Today`, `Yesterday`, `LastSevenDays`,
`LastFourteenDays`, `LastThirtyDays`, `ThisMonth`, `LastMonth`), а не произвольный
custom daily report в используемом entity API. Поэтому sync сохраняет aggregate
на дату `to` и добавляет `aggregation=range`. Это не заменяет полноценную
дневную отчётность; при необходимости её следует добавить отдельным REST report
adapter после проверки текущего Microsoft API.

## Безопасность

Credentials остаются в локальном профиле и передаются только bridge-транспорту.
Секреты не записываются в SQLite, metadata или MCP arguments. Внешний модуль
остаётся read-only по `modules/modules.json`; локальная синхронизация меняет только
нашу SQLite и не запускает/не редактирует рекламу.

## Отмена решения

Заменить модуль можно после read-only smoke-test кандидата, если он даёт тот же
набор account/campaign/report данных, поддерживает REST, pagination и безопасный
write gate без ухудшения OAuth и dedupe-поведения.
