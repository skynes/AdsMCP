# ADR-0010: Reddit Ads MCP на официальном Ads API v3

- Статус: принято
- Дата: 2026-10-23
- Провайдер: Reddit Ads
- Выбранный модуль: [camlowe/mcp-server-reddit-ads](https://github.com/camlowe/mcp-server-reddit-ads)
  v0.5.5

## Решение

Подключить `mcp-server-reddit-ads@0.5.5` через локальный stdio bridge. Модуль
использует официальный [Reddit Ads API](https://ads-api.reddit.com/docs/v3/) и
OAuth refresh-token flow. В AdsMCP включён только read-only контур:

- `REDDIT_ADS_WRITE_TIER=read` передаётся явно;
- allowlist ограничен account/entity/reporting/read-targeting tools;
- create, pause/resume, rename, budget, bid, targeting, URL, copy и прочие
  provider writes не передаются в AdsMCP bridge;
- refresh token остаётся в локальном игнорируемом `.env` и не попадает в SQLite,
  логи или MCP arguments.

Reddit Ads API v3 выбран вместо v2: документация Reddit указывает, что v2
endpoints (кроме CAPI) sunset, а v3 — стабильная версия. v4 на дату решения
находится в Preview и не подходит как production baseline.

## Почему этот модуль

`camlowe/mcp-server-reddit-ads` лучше подходит текущей архитектуре AdsMCP:

- Node.js 20+ и stdio совпадают с локальным runtime и Windows workflow проекта;
- пакет опубликован в npm и MCP Registry, поэтому можно зафиксировать версию без
  локального checkout и без hosted-посредника;
- модуль покрывает кабинеты, кампании, группы, ads, creative reads, targeting
  lookups и отчёты, включая сравнение периодов и ads;
- встроенные `read/safe/spend` tiers скрывают недоступные write-tools, а AdsMCP
  добавляет второй fail-closed слой через собственный allowlist;
- README/changelog описывают retry, pagination, микровалюту и live-проверенные
  особенности Reddit API; проект содержит тесты и release history.

Наличие writes в upstream не является причиной включать их автоматически. В
рабочем AdsMCP разрешён только read-путь, а расширение до writes требует отдельного
ADR и guarded-инструментов с явным подтверждением.

## Альтернативы

| Кандидат | Сильная сторона | Почему не выбран сейчас |
| --- | --- | --- |
| [desunit/reddit-ads-mcp](https://github.com/desunit/reddit-ads-mcp) v0.1.0 | TypeScript stdio, полная иерархия, подробная карта v3 endpoints и проверенные read-вызовы | source-first установка, writes соседствуют с reads, нет такого централизованного tier-gate |
| [mkerchenski/RedditAdsMcp](https://github.com/mkerchenski/RedditAdsMcp) v1.1.1 | настоящий read-only C# server на официальном MCP SDK, шесть компактных tools | нужен .NET 10, меньше покрытие и ещё один runtime для проекта на Node |
| [filippofinke/reddit-ads-mcp](https://github.com/filippofinke/reddit-ads-mcp) | npm/TypeScript и OAuth login | более широкая write-поверхность и отдельное token-хранилище; нет преимущества для нашего read-only baseline |
| [adkit/ads-mcp](https://github.com/adkit/ads-mcp) | единый мультиплатформенный слой и Reddit Ads support | hosted SaaS/backend, не self-hosted provider module; credentials и данные проходят через дополнительный контур |
| [@openpromo/reddit](https://www.npmjs.com/package/%40openpromo/reddit) | хороший типизированный SDK v3 | SDK не является MCP-сервером, поэтому потребуется собственная реализация и сопровождение bridge |
| `reddit-ads-mcp` без namespace/version | короткая существующая запись в старом manifest | имя неоднозначно: есть несколько одноимённых проектов; версия не фиксировалась, а API/tools не совпадали |

## Ограничения и проверка

- Официальный Reddit MCP от Reddit не найден; выбран community wrapper над
  официальным Ads API.
- Нужны Reddit Ads account, developer application, `adsread` scope и refresh
  token. Доступ к отдельным Business/Ad Accounts определяется правами пользователя.
- Нельзя считать наличие `read` в конфигурации доказательством live-доступа: после
  добавления credentials нужно выполнить `get_server_status`, `get_accounts` и
  один отчётный read-call.
- Live-handshake из этого окружения не выполнялся: запуск `npx` требует загрузки
  внешнего пакета и credentials. Локально проверены манифест, allowlist, типы и
  сборка AdsMCP; provider smoke-test остаётся post-setup шагом.
- API versioning нужно пересматривать перед окончанием поддержки v3 в Q3 2027 и
  при переходе v4 из Preview в Stable.

## Критерий замены

Замена допустима, если кандидат сохраняет официальный API path, локальный stdio,
OAuth без browser automation на каждый запрос, read-only fail-closed режим,
пагинацию/отчёты и проходит повторный handshake. Улучшение оформляется отдельной
веткой, коммитом и PR в `main` по правилам AdsMCP.
