# Provider MCP modules

Этот документ фиксирует, какие внешние MCP-модули мы подключаем, по каким
критериям их сравниваем и почему конкретный модуль выбран. Он нужен не только
для текущей реализации: позже можно заменить модуль на более сильный, не
меняя локальную модель проектов, кампаний, расходов и конверсий.

Связанный каталог проектов ZAI.ONE, включая модули для аналитики, research,
коммуникаций и разработки, находится в [ZAI-ONE-CATALOG.md](./ZAI-ONE-CATALOG.md).

Полный разбор всех присланных advertising MCP-репозиториев находится в
[ADVERTISING-MCP-REPOSITORIES.md](../research/repositories/ADVERTISING-MCP-REPOSITORIES.md).

## Основной внешний reference-хаб

[Advertising Hub](https://github.com/itallstartedwithaidea/advertising-hub)
назначен основным внешним reference-хабом AdsMCP. Он используется для изучения
общих моделей рекламных сущностей, auth/error/rate-limit паттернов, MCP-контрактов
и агентских сценариев. Это каталог, спецификации и набор заготовок, а не единый
production runtime.

Если в hub появится общий контракт или архитектурное улучшение, полезное для
нескольких платформ, сначала адаптируем его к TypeScript/SQLite-модели AdsMCP,
проверяем безопасность и только затем готовим отдельное PR-предложение. Нельзя
считать наличие платформы в каталоге доказательством готового provider runtime.
Решение подробно описано в [ADR-0005](./decisions/0005-advertising-hub-as-reference.md).

## Единый корень локальных данных

Все AdsMCP-owned модули используют один корень `ADS_MCP_DATA` (по умолчанию
`./data`). Внутри него хранятся общая SQLite-база, provider settings, account
sessions, browser profiles, журналы, token-файлы и состояние Relay. Модуль не
должен создавать вторую папку состояния рядом со своим checkout или внутри
`server/`.

```text
ADS_MCP_DATA/
  ads.db
  telegram/
  browser-profiles/telegram-ads/
  yandex-direct/
  network/
  secrets/
```

Корневой `.env` остаётся игнорируемым слоем конфигурации и может содержать
credentials, которые внешний модуль принимает только через environment. Сами
сессии, cookies, OAuth/private-key файлы и локальные журналы должны жить в
`ADS_MCP_DATA`.

## Принцип

AdsMCP не копирует API провайдера внутрь себя. Провайдерский MCP остаётся
отдельным локальным или удалённым процессом, а AdsMCP отвечает за:

- allowlist доступных tools и read-only режим по умолчанию;
- нормализацию ответа в общий контракт кампаний и метрик;
- запись результатов в SQLite;
- привязку к `project_id` и `source`;
- дедупликацию, аналитику, атрибуцию и дальнейшую автоматизацию.

Поэтому хороший внешний модуль — это не обязательно самый большой проект. Важнее,
чтобы его данные можно было безопасно и стабильно получить, проверить и повторно
синхронизировать.

## Google Ads: официальный MCP и API Agent

Подключён официальный [Google Ads MCP от Google](https://github.com/googleads/google-ads-mcp)
как локальный stdio-модуль `google_ads_official`. Используется зафиксированный
релиз `v0.0.4`, а не плавающий `main`.

Внешний сервер предоставляет только три read-only группы инструментов:
`customers_list_accessible_customers`, `search_search` и
`metadata_get_resource_metadata`. Write-инструментов в этом репозитории нет.
Allowlist AdsMCP повторяет этот минимальный набор.

Для более широкого action-layer зафиксирован отдельный checkout
[`itallstartedwithaidea/google-ads-api-agent`](https://github.com/itallstartedwithaidea/google-ads-api-agent)
на commit `ae56150`. Это не самостоятельный MCP, поэтому AdsMCP запускает его
через `scripts/google-ads-api-agent-mcp.py`, который переиспользует upstream
`ToolExecutor` и публикует `google_ads_agent_catalog` /
`google_ads_agent_call` через stdio. По умолчанию адаптер оставляет только
read-only actions; provider writes требуют `confirm=true` в том же MCP-вызове
после явного одобрения пользователя.

Этот action-layer использует OAuth refresh-token credentials и дополняет, а не
заменяет, официальный read-only MCP. Причины и установка описаны в
[`ADR-0008`](./decisions/0008-google-ads-api-agent.md).

Провайдер запускается из ignored checkout `modules/google-ads-official` через
отдельный Python runtime `.venv-google-ads-mcp-official`. Для авторизации
передаются только `GOOGLE_APPLICATION_CREDENTIALS`,
`GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_PROJECT_ID` и
`GOOGLE_ADS_LOGIN_CUSTOMER_ID`. OAuth HTTP-переменные официального сервера
намеренно не передаются: локальная интеграция остаётся stdio и не слушает сеть.

Локальные `ads_google_ads_report` и `ads_google_ads_sync` остаются
fallback-нормализатором для SQLite, а provider-native tools доступны через
`ads_module_tools` и `ads_module_call`.

Полный список инструментов, установка и safety-решение описаны в
[ADR-0006](./decisions/0006-google-ads-hub-mcp.md).

## Критерии оценки

Оценка проводится на дату проверки по шкале 0–2:

| Критерий | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Данные и метрики | нет нужных данных | частичный набор | аккаунты, кампании и отчёты |
| Авторизация | секреты в коде/неясно | ручная или хрупкая | локальная env/OAuth-сессия |
| Runtime | обязательная автоматизация браузера | ограниченная | API/HTTP без браузера |
| Безопасность записи | raw write без защиты | частичные ограничения | allowlist/gate/read-only |
| MCP transport | нестабилен | работает с оговорками | подтверждённый stdio/HTTP |
| Поддерживаемость | заброшен/неясно | небольшой проект | документация, тесты, понятный контракт |
| Лицензия и границы | нельзя использовать | требуется отдельная проверка | можно запускать как внешний модуль |

Сумма — вспомогательный сигнал, а не автоматическое решение. Нельзя выбирать
модуль только по количеству stars или количеству tools.

## Текущий выбор: Telegram Ads

Дата проверки: **2026-10-08**.

Выбран внешний [ZAI Telegram Ads MCP](https://github.com/zai-one/telegram-ads-mcp)
как fallback-слой для уже сохранённой сессии кабинета. Дополнительно подключён
официальный [Telegram Ads API](https://ads.telegram.org/docs/api), который
работает через `https://promoteapi.telegram.org` и использует отдельный API token.
Официальный слой даёт точные date-bounded отчёты, бюджеты, placements,
audiences, pixels и transactions; текущий ZAI HTTP-сеанс сохраняется для
совместимости и проверки расхождений в кабинете.

| Кандидат | Данные | Runtime | Безопасность | Transport | Решение |
| --- | ---: | ---: | ---: | ---: | --- |
| [ZAI](https://github.com/zai-one/telegram-ads-mcp) | 2 | 2 | 2 | 2 | выбран |
| [reputasyon](https://github.com/reputasyon/telegram-ads-mcp) | 1 | 2 | 0 | 2 | запасной кандидат |
| [Free-cat](https://github.com/Free-cat/telegram_ads_mcp) | 2 | 0 | 1 | 1 | не выбран для runtime |

### Почему выбран ZAI

- Есть отдельные read-инструменты для кабинета, объявлений и статистики.
- Нет необходимости держать Playwright/Chromium для каждого провайдера.
- Есть собственный write-gate; в AdsMCP дополнительно используется allowlist,
  в котором provider write-tools отсутствуют.
- Стабильные имена `get_account`, `get_ads`, `get_ad_stats` позволяют сделать
  нормализатор `src/integrations/telegram-ads.ts`, не связывая SQLite со
  внутренними полями Telegram Ads.
- Провайдерский код не копируется в AdsMCP. Мы запускаем внешний модуль и
  принимаем на себя только интеграционный контракт и локальное хранение.

### Стандартный browser-session workflow

Для входа используется один локальный постоянный Chrome-профиль, а не отдельный
браузер на каждый вызов или пользователя:

1. `npm run telegram:login` запускает управляемое окно Chrome;
2. человек сам вводит логин, пароль и 2FA только в этом окне;
3. скрипт через CDP ждёт `stel_token` и `stel_ssid` домена `ads.telegram.org`;
4. cookies сохраняются в `ADS_MCP_DATA/secrets/telegram-ads-session.env`, без
   вывода значений; launcher загружает этот файл перед запуском provider;
5. Chrome закрывается, а provider MCP продолжает работать по локальной HTTP-сессии.

Такой подход повторяет проверенный локальный session pattern Workix и сохраняет
главное требование безопасности: секреты не попадают в MCP arguments, SQLite,
логи или чат. При истечении сессии запускается та же команда capture заново.

Для нескольких кабинетов добавлен отдельный multi-account flow. `list_accounts`
показывает доступные кабинеты, а `ads_telegram_accounts_report` с
`all=true, confirm=true` временно переключает контекст, читает каждый кабинет и
возвращает исходный. `select_account` не доступен как произвольная операция
обычного bridge-вызова в пользовательском сценарии: его использует только этот
специализированный workflow с явным подтверждением. Синхронизация сохраняет
`accountId` в metadata локальной кампании.

### Почему не reputasyon

Это компактный API-модуль без браузера, но в нём меньше специализированных
операций по статистике и присутствует универсальный `raw_api`. Для первой версии
рекламной сети это слишком широкая поверхность записи без достаточного уровня
защитных ограничений.

### Почему не Free-cat

У него есть полезные операции кабинета и отчёты, но архитектура основана на
Playwright, `auth_state.json` и отдельном браузерном runtime. Это увеличивает
стоимость поддержки, усложняет параллельное подключение площадок и противоречит
нашему требованию иметь единый runtime без отдельного Chromium для каждого
провайдера.

### Ограничения текущего выбора

- Официальный API token нужно один раз создать в настройках Telegram Ads и
  хранить в `ADS_TELEGRAM_ADS_API_TOKEN`; сам token не попадает в SQLite,
  MCP-arguments или отчёты.
- Cookies хранятся только локально в `ADS_MCP_DATA/secrets/telegram-ads-session.env`;
  в SQLite, MCP arguments и переписку они не попадают.
- Официальные write-методы разделены: в AdsMCP включены только guarded-операции
  создания объявления, пополнения бюджета объявления, отправки на модерацию и
  pause/resume. Все они требуют `confirm=true`, а пополнение бюджета защищено
  idempotency key и readback; удаление, операции с фондами и прочие writes остаются
  закрыты.
- Лицензия и условия внешнего репозитория требуют отдельной проверки перед
  публичной дистрибуцией или встраиванием его кода. В текущем решении код не
  копируется и не модифицируется.

### Официальный API-слой

Добавлены read-инструменты и отдельные guarded write-инструменты:

- `ads_telegram_ads_api_status` — конфигурация и безопасный `getCurrentAccount`
  probe без вывода token;
- `ads_telegram_ads_api_report` — `getAdsList` + `getAdStats` с периодом `day`
  или `5min` и явными датами;
- `ads_telegram_ads_api_sync` — идемпотентная запись в ту же SQLite-модель,
  что и session-layer, с `sourceLayer=official_api` в metadata.
- `ads_telegram_ads_api_create_ad` — создание объявления с обязательным
  `confirm=true`, по умолчанию на удержании и с нулевым бюджетом;
- `ads_telegram_ads_api_increase_ad_budget` — пополнение бюджета объявления;
- `ads_telegram_ads_api_submit_ad_for_review` — отправка на модерацию;
- `ads_telegram_ads_api_set_ad_paused` — pause/resume объявления.

Такое разделение позволяет сравнивать официальный API и session fallback по
одному `account_id/ad_id`, не создавая дубликаты локальных кампаний. Для
официального API статистика по ad берётся из `getAdStats`, а не из графика
кабинета; это устраняет часть ошибок парсинга старой HTML-сессии.

## Telegram user account: локальный TDLib

Это отдельный контур от Telegram Ads. Для будущего **Relationship-first Agentic
Lead Engagement** AdsMCP переносит из локального Workix MCP паттерн TDLib:
`getAuthorizationState`, локальные `tdlib-db`/`tdlib-files`, вход по телефону,
коду и 2FA, а также read-only поиск истории одного чата.

- credentials: `TELEGRAM_API_ID` и `TELEGRAM_API_HASH` в игнорируемом `.env`;
- состояние: `ADS_MCP_DATA/telegram/`, которое исключено из Git;
- MCP tools: `ads_telegram_account_status`,
  `ads_telegram_account_auth`, `ads_telegram_account_search`;
- отправка сообщений, массовый outreach и autonomous follow-up пока отключены.

Auth tool следует вызывать только через доверенный локальный MCP-клиент: коды
Telegram и 2FA-пароли не должны попадать в hosted chat или внешний логгер. Полная
инструкция находится в [`docs/TELEGRAM-ACCOUNT.md`](./TELEGRAM-ACCOUNT.md).

## Yandex Direct: выбран ZAI.ONE yandex-mcp

Дата проверки: **2026-10-08**. Для Yandex Direct выбран модуль того же разработчика,
что и для Telegram Ads, — [zai-one/yandex-mcp](https://github.com/zai-one/yandex-mcp)
v0.3.0. У ZAI.ONE нет отдельного Direct-only репозитория: этот модуль объединяет
Direct, Metrika, Search/Wordstat и Webmaster. Решение и альтернативы описаны в
[ADR-0007](./decisions/0007-yandex-direct-zai-module.md).

- checkout: ignored `modules/yandex-direct`; зависимости: `modules/yandex-direct-deps`
  (FastMCP 3.4.4, как в upstream `uv.lock`), глобальный Python не меняется;
- запуск: AdsMCP bridge стартует `python scripts/yandex-direct-mcp.py` по stdio
  (module id `yandex_mcp_zai`); HTTP-режим модуля требует RS256 JWT и для локального
  моста избыточен;
- credentials: только пути к приватным token-файлам из `.env`
  (`ADS_YANDEX_DIRECT_TOKEN_FILE`, `ADS_YANDEX_DIRECT_CLIENT_LOGIN`,
  `ADS_YANDEX_METRIKA_TOKEN_FILE`, `ADS_YANDEX_WEBMASTER_TOKEN_FILE`);
- guarded writes: launcher принимает только `ADS_YANDEX_DIRECT_WRITE_ENABLED` и
  переводит его в `YANDEX_DIRECT_WRITE_ENABLED`; Metrika, Webmaster и платный
  Wordstat остаются выключенными. Allowlist содержит read-инструменты и
  `direct_write`, но сырой write вызов закрыт bridge-слоем и доступен только через
  `ads_yandex_direct_write` с `confirm=true`, idempotency key и provider readback;
  `ads_yandex_direct_create_campaign` создаёт только текстовую кампанию с
  выключенными показами, без объявлений и бюджета; удаление кампаний закрыто;
- состояние модуля (журнал, лимиты) хранится в
  `ADS_MCP_DATA/yandex-direct/yandex.sqlite`.

Адаптер AdsMCP передаёт в модуль `direct_get_statistics` и нормализует его TSV/structured
rows в общую модель кампаний: `ads_yandex_direct_sync` с `module_id: "yandex_mcp_zai"`.
Handshake и список инструментов (48, из них 31 разрешён) проверены локально; live-вызовы
и импорт можно считать проверенными только после появления OAuth-токена Direct.
Community-модуль `mcp-yandex-direct` (`yandex_direct`) остаётся запасным вариантом.
## VK Ads: выбран Click.ru broker MCP

Дата проверки: **2026-10-08**. Для созданного в Click.ru кабинета VK Ads выбран
официальный удалённый [Click.ru VK MCP broker](https://help.click.ru/7938),
модуль `vk_ads_clickru_broker`.

Брокер принимает Click.ru API Token в URL и сам получает/обновляет доступ к VK;
отдельный VK access token в локальных настройках не хранится. В AdsMCP URL содержит
только placeholder `${ADS_CLICKRU_API_TOKEN}`: при подключении он разрешается из
локального `ADS_MCP_DATA/clickru-settings.json`, а в `modules/modules.json`, логи и MCP-ответы
значение секрета не попадает.

Read-only smoke-test пройден:

- MCP `initialize` — HTTP 200;
- `tools/list` — HTTP 200;
- локальный AdsMCP bridge через `ads_module_call` — успешно;
- `vk_ads_accounts_list` видит кабинет `123456`;
- `vk_ads_auth_check` корректно сообщил, что кабинет ещё не заведён на стороне VK.

В allowlist оставлены только проверка доступа, кабинеты, кампании и чтение групп.
Инструменты создания, обновления, удаления и запуска не разрешены. Для подключения
в production сначала требуется один ручной шаг в Click.ru/VK: создать новый VK
мультиаккаунт физлица и выдать ему права администратора на кабинет Click.ru.
Подробная процедура зафиксирована в [ADR-0002](./decisions/0002-vk-ads-clickru-broker.md).

## LidFly: не выбран как provider runtime

Дата решения: **2026-10-08**.

LidFly остаётся полезным исследовательским примером hosted MCP-агрегатора, но не
подходит для рабочего runtime AdsMCP:

- после авторизации собственные кабинеты нужно подключать внутри сайта LidFly;
- AdsMCP не получает прямой self-hosted доступ к рекламным платформам;
- доступ к MCP требует платной подписки около **900 ₽/месяц**;
- модель добавляет внешнюю зависимость и посредника в контур рекламных кабинетов.

Поэтому LidFly не добавляется в `modules/modules.json`, provider allowlist или локальный
реестр адаптеров. Для быстрого старта без SaaS-посредника рассматриваются прямые
платформы с собственным кабинетом и минимальной локальной credential-настройкой,
в первую очередь HilltopAds. Полное решение зафиксировано в
[ADR-0004](./decisions/0004-lidfly-not-selected.md).

## Microsoft Advertising: официальный read-only MCP и проверенные кандидаты

Дата проверки: **2026-10-08**.

Из пяти изученных репозиториев только [Synter MCP](https://github.com/Synter-Media-AI/mcp-server)
и [PaidSync MCP](https://github.com/PaidSync/paidsync-mcp) дают готовый
мультиплатформенный слой, но оба требуют доверия к hosted/backend-сервису и не
нужны для базового Microsoft-сценария. [Advertising Hub](https://github.com/itallstartedwithaidea/advertising-hub)
полезен как каталог, набор агентов и нормализованных контрактов, но его раздел
Microsoft Ads пока является архитектурной спецификацией, а не готовым runtime.

Для AdsMCP оставлен официальный Microsoft Advertising MCP:

| Кандидат | Что полезно | Ограничение | Решение |
| --- | --- | --- | --- |
| [Microsoft official MCP](https://learn.microsoft.com/en-us/advertising/guides/mcp-tools?view=bingads-13) | единая read-only модель `get_accounts`/`get_campaigns`/`get_ad_groups`/`get_ads`/`get_keywords`, фильтры, pagination и performance metrics | hosted beta/open endpoint, только предопределённые date presets | выбран для runtime |
| [wvuhskr/mcp-microsoft-ads](https://github.com/wvuhskr/mcp-microsoft-ads) | 47 tools, writes disabled by default, draft → confirm, лимиты бюджета/CPC, JSONL audit log, 380+ offline tests | legacy `bingads` SOAP SDK; Microsoft планирует полное SOAP EOL 2027-01-31 | safety reference, не runtime |
| [bit-of-a-shambles/microsoft-ads-mcp-server](https://github.com/bit-of-a-shambles/microsoft-ads-mcp-server) | компактный OAuth flow, кампании, группы, keywords, RSA и async reports | всего 2 commits, raw write-tools, SOAP SDK; URL клонирования в README расходится с URL репозитория | не подключать |
| [Synter-Media-AI/mcp-server](https://github.com/Synter-Media-AI/mcp-server) | TypeScript, 19 платформ в reporting, 14 с campaign creation, destructive tools помечены, 140+ tools | API key и backend Synter; большая write-поверхность; Microsoft уже закрывается официальным модулем | optional research/aggregator |
| [PaidSync/paidsync-mcp](https://github.com/PaidSync/paidsync-mcp) | 610+ hosted tools, Microsoft плюс GA4/GTM/Search Console/Merchant Center | hosted backend, только 17 commits и небольшой OSS-репозиторий; не подходит как self-hosted ядро | optional hosted connector |

В AdsMCP добавлены `ads_microsoft_ads_report` и `ads_microsoft_ads_sync`.
Они вызывают только allowlisted `get_accounts`/`get_campaigns` официального
модуля, создают локальный стабильный ID кампании, дедуплицируют расходы и
конверсии и не содержат ни одного provider write-tool. Официальный MCP отдаёт
агрегат за preset, а не дневной ряд, поэтому при sync сумма сохраняется на
`report.to` с metadata `aggregation=range`; это намеренно прозрачно для
аналитики и не маскируется под дневные данные.

Из `wvuhskr/mcp-microsoft-ads` в общую политику перенесены идеи fail-closed:
provider writes остаются вне allowlist, а подключение начинается только с
read-only handshake и нормализации ответа. Их SOAP-реализацию копировать не
следует: Microsoft рекомендует переходить на REST, а полная SOAP-депрекация
запланирована на 2027-01-31.

## Avito Ads: выбран A1-x-tech mcp-avito-ads

Дата проверки: **2026-10-23**. Для отдельного рекламного кабинета Avito Ads
выбран [`A1-x-tech/mcp-avito-ads`](https://github.com/A1-x-Tech/mcp-avito-ads)
v1.1.0. Это локальный stdio MCP поверх официального Avito Ads API; он не
использует браузерную автоматизацию и не отправляет credentials через hosted
посредника. Полное сравнение четырёх присланных Avito-репозиториев и выбранного
кандидата находится в [ADR-0009](./decisions/0009-avito-ads-mcp.md).

В manifest используется фиксированный `mcp-avito-ads@1.1.0`, env-секреты
передаются только дочернему процессу, а `ASKADS_TELEMETRY=0` отключает
необязательную телеметрию кандидата. AdsMCP allowlist разрешает только account,
balance, campaign/group/creative lists и statistics. Изменение бюджета/ставки,
управление пользователями, переводы денег и `raw_request` намеренно закрыты.

Это именно **Avito Ads**, а не API продавца Avito. Для объявлений, чатов и
заказов есть отдельный кандидат [`elchin92/avito-mcp`](https://github.com/elchin92/avito-mcp),
но он не заменяет рекламный модуль и пока не добавляется в runtime.

## Reddit Ads: выбран camlowe/mcp-server-reddit-ads

Дата проверки: **2026-10-23**.

Для Reddit Ads выбран [camlowe/mcp-server-reddit-ads](https://github.com/camlowe/mcp-server-reddit-ads)
v0.5.5. Это локальный TypeScript/Node stdio-модуль, опубликованный в npm и MCP
Registry, который обращается к официальному [Reddit Ads API v3](https://ads-api.reddit.com/docs/v3/).
На дату проверки v3 — стабильная production-версия; v4 находится в Preview, поэтому
не используется как runtime baseline.

| Кандидат | Что полезно | Ограничение | Решение |
| --- | --- | --- | --- |
| [camlowe/mcp-server-reddit-ads](https://github.com/camlowe/mcp-server-reddit-ads) v0.5.5 | npm + MCP Registry, Node 20+, OAuth helper, v3, 18 read-tools, тесты, `read/safe/spend` tiers, retry/pagination и работа с micros | небольшой community-проект; writes всё равно присутствуют в пакете | выбран; AdsMCP фиксирует `read` и свой allowlist |
| [desunit/reddit-ads-mcp](https://github.com/desunit/reddit-ads-mcp) v0.1.0 | TypeScript, stdio, полная иерархия, подробные API notes, read-paths проверены по live v3 | management writes зарегистрированы рядом с reads, нет такого готового write-tier, установка из checkout | сильная запасная альтернатива |
| [mkerchenski/RedditAdsMcp](https://github.com/mkerchenski/RedditAdsMcp) v1.1.1 | C# MCP на официальном SDK, шесть read-only инструментов, NuGet | требует .NET 10, меньше сущностей и отчётных сценариев, отдельный runtime | резерв для .NET-среды, не основной модуль |
| [filippofinke/reddit-ads-mcp](https://github.com/filippofinke/reddit-ads-mcp) | npm/TypeScript, OAuth login и широкий Ads API surface | широкая write-поверхность и локальное token-хранилище; для первой интеграции избыточен | не выбран |
| [adkit/ads-mcp](https://github.com/adkit/ads-mcp) | мультиплатформенный Reddit Ads в едином MCP, много функций | hosted backend `mcp.adkit.so`, внешний SaaS-контур и не self-hosted модуль | только optional research, не runtime |
| [openpromo/reddit](https://www.npmjs.com/package/%40openpromo/reddit) | типизированный SDK для Reddit Ads API v3 | это SDK, а не MCP; поверх него пришлось бы писать и сопровождать свой server | не готовый модуль |

В manifest закреплены пакет `mcp-server-reddit-ads@0.5.5`,
`REDDIT_ADS_WRITE_TIER=read` и allowlist только диагностических, account/entity,
creative-read, targeting-read и reporting tools. В него не входят `create_*`,
`pause_items`, `enable_items`, `update_name`, `update_budget`, `update_bid`,
`update_targeting`, `update_ad_url`, `copy_ads` и прочие изменения.

Для первичной авторизации пользователь один раз запускает официальный OAuth helper
модуля (`npx mcp-server-reddit-ads@0.5.5 auth`) и сохраняет refresh token только в
локальном `.env`; AdsMCP не пишет credentials в SQLite или MCP arguments. API access
зависит от прав Reddit Business/Ad Account и scope `adsread`.

Полное решение, включая критерии, ограничения и таблицу альтернатив, зафиксировано
в [ADR-0010](./decisions/0010-reddit-ads-mcp.md).

## Adspirer и Aidvertaiser: дополнительные кандидаты

Дата проверки: **2026-10-08**. Полное сравнение и список tools находятся в
[каталоге research](../research/repositories/ADVERTISING-MCP-REPOSITORIES.md); здесь фиксируется
только runtime-решение.

| Кандидат | Что полезно | Ограничение | Решение |
| --- | --- | --- | --- |
| [amekala/ads-mcp — Adspirer](https://github.com/amekala/ads-mcp) | hosted cross-platform MCP, OAuth 2.1 + PKCE, annotations, performance/anomaly/report UX | proprietary, hosted backend, dynamic OAuth не поддержан текущим простым Bearer bridge | benchmark, не встраивать |
| [Draivix/aidvertaiser](https://github.com/Draivix/aidvertaiser) | MIT, self-hosted Python/stdio, 232 tools на 8 платформах; закрывает GA4, GSC, GTM, Matomo, Bing Webmaster, PageSpeed | read/write tools смешаны, browser OAuth и отдельное credential-хранилище | следующий optional read-only module |

Aidvertaiser не должен заменять существующий Meta Ads MCP или Google Ads
adapters без конкретной причины. Его ценность для AdsMCP — measurement/SEO слой. Начальный
allowlist должен включать только account/property discovery и чтение отчётов;
создание/удаление сайтов, submit URL, GTM publish/update, Matomo mutations и
Bing Webmaster write-tools остаются выключенными. До live-handshake и проверки
OAuth его нельзя считать включённым production-модулем.

## X Ads: официальный API, remote MCP и локальный модуль

Дата проверки: **2026-10-23**.

У X есть официальный [X Ads API](https://docs.x.com/x-ads-api/introduction) и
официальный [remote MCP](https://docs.x.com/x-ads-api/mcp) на
`https://ads-api.x.com/mcp`. Remote MCP лучше всего соответствует API: он
использует OAuth2, даёт 74 инструмента и поддерживает кампании, line items,
аудитории, креативы, таргетинг и отчётность. Для read-only доступа X рекомендует
`ads.read` и `offline.access`; `ads.write` в текущую конфигурацию не добавляется.

Для текущего AdsMCP выбран локальный
[@getmcpads/x-ads-mcp-server](https://github.com/get-mcp-ads/x-ads-mcp-server)
`v1.0.1`: он запускается через stdio, ходит напрямую в официальный X Ads API,
имеет 25 read-инструментов и 19 write-инструментов, при этом writes выключены
по умолчанию и дополнительно исключены нашим allowlist. Ограничение — модуль не
ведёт OAuth-flow и не обновляет rotating refresh token, поэтому
`X_ADS_ACCESS_TOKEN` нужно получать и обновлять внешним безопасным процессом.

| Кандидат | Что полезно | Ограничение | Решение |
| --- | --- | --- | --- |
| [Official X Ads remote MCP](https://docs.x.com/x-ads-api/mcp) | 74 официальных инструмента, OAuth2/PKCE, account-scoped access, read-only scopes, нативные Ads API endpoints | текущий bridge умеет только static Bearer и не умеет OAuth callback/refresh; access token короткоживущий и refresh token ротируется | официальный reference и будущий preferred runtime после OAuth-поддержки |
| [get-mcp-ads/x-ads-mcp-server](https://github.com/get-mcp-ads/x-ads-mcp-server) `v1.0.1` | локальный stdio, прямой официальный API, 25 read tools, writes выключены по env, фиксированные endpoints и bounded responses, Apache-2.0 | небольшой новый проект; нет OAuth и token refresh; нужен user OAuth2 token и явные account IDs | выбранный runtime |
| [xdevplatform/xurl](https://github.com/xdevplatform/xurl) | официальный OAuth2/PKCE bridge и кэширование токенов для X API MCP | документация покрывает `api.x.com/mcp` для обычного X API, а не Ads endpoint/scopes; не заменяет Ads API runtime | использовать как reference для будущего auth-слоя |
| [twominutereports/twitter-ads-mcp](https://github.com/twominutereports/twitter-ads-mcp) | hosted Streamable HTTP MCP для X Ads reporting и campaign analytics | внешний SaaS endpoint, нет локального контроля credentials и исполнения | не подключать как core |
| [adkit/ads-mcp](https://github.com/adkit/ads-mcp) | hosted unified MCP с X Ads и другими сетями, OAuth onboarding | backend `mcp.adkit.so`, мультиплатформенная SaaS-зависимость, не self-hosted | optional hosted connector |
| [PaidSync X Ads](https://paidsync.ai/integrations/x-ads) | готовый hosted reporting/management workflow без самостоятельного developer app | внешний сервис и ограниченный контроль над API-поверхностью | не подключать как core |

В manifest включены только read-инструменты: аккаунты, кампании, line items,
promoted posts, таргетинг, creative/media metadata, web event tags и stats/reach.
Создание, активация, изменение бюджета/ставок, targeting mutations и upload
инструменты не включены. Live-handshake требует кабинета с Ads Project access и
валидного user OAuth2 token, поэтому до выдачи credentials проверяется только
конфигурация модуля и offline MCP-контракт.

Полное решение и критерии замены зафиксированы в
[ADR-0011](./decisions/0011-x-ads-mcp.md).

## Spotify Ads: официальный API и готовые MCP-варианты

Дата проверки: **2026-10-23**.

Spotify поддерживает полноценный [Ads API v3](https://developer.spotify.com/documentation/ads-api):
businesses и ad accounts, campaigns, ad sets, ads, creatives/assets, audiences,
targeting и aggregate/insight/CSV reports. Авторизация — OAuth 2.0; Spotify
также предоставляет тестовые аккаунты для проверки campaign-management без
реального показа и списаний, но reporting на тестовых аккаунтах пустой.

У Spotify есть официальный
[Spotify Ads Agentic Tools](https://github.com/spotify/ads-agentic-tools) plugin
для Codex/Claude Code/Antigravity. Это лучший прямой reference: он использует
официальный API, PKCE, автоматическое обновление токенов и draft-first workflow.
Но это plugin/skills-пакет, а не локальный stdio MCP-модуль AdsMCP. Официальный
Spotify MCP сервер пока находится в closed beta, поэтому его нельзя надёжно
подключить в общий manifest.

Для текущего AdsMCP выбран
[Adport](https://github.com/ynnickw/adport) `v0.6.1` / npm
[`adport@0.6.1`](https://www.npmjs.com/package/%40adport%2Fmcp): локальный
Apache-2.0 CLI и stdio MCP с отдельным Spotify provider. Он подключается через
BYO Spotify Developer app, ходит напрямую в API провайдера, хранит credentials
локально и имеет общий preview/approval safety-контракт для writes. В AdsMCP
включены только `accounts_list`, `report` и `recommendations_list`; provider
mutations не allowlist-ятся.

| Кандидат | Что полезно | Ограничение | Решение |
| --- | --- | --- | --- |
| [Spotify Ads Agentic Tools](https://github.com/spotify/ads-agentic-tools) | официальный repo Spotify, Ads API v3, OAuth2 PKCE, automatic refresh, 19 skills, draft-first campaign workflow | plugin/skills, не stdio MCP; требует Codex/Claude Code/Antigravity и Python/Git Bash для auth helper | лучший прямой API reference, не runtime AdsMCP |
| [Adport](https://github.com/ynnickw/adport) `v0.6.1` | local-first stdio MCP, Apache-2.0, direct BYO provider connections, Spotify provider, normalized reports, preview-before-write policy | свежий проект; Spotify provider имеет contract tests, но live account validation ещё нужна; module registry общий для нескольких providers | выбранный runtime |
| [Spotify official MCP](https://developer.spotify.com/documentation/ads-api/agents) | native Spotify MCP, команда указывает reporting/campaign workflows и MCP clients | closed beta; доступ выдаётся через Spotify contact, public endpoint/installation для нашей bridge-конфигурации не опубликованы | следить как будущая замена |
| [Synter MCP](https://github.com/Synter-Media-AI/mcp-server) | готовый cross-platform MCP, Spotify Ads read и limited write coverage, local stdio package | API-key package работает через Synter backend; hosted dependency, не direct Spotify connection; generic tools cross-platform | не подключать как core |
| [Synter Spotify starter](https://github.com/Synter-Media-AI/spotify-ads-agent) | быстрый готовый example для Spotify Ads | это starter kit вокруг Synter, а не самостоятельный Spotify API client | reference only |

Практический setup выбранного модуля:

```powershell
npx -y adport@0.6.1 connect spotify
npx -y adport@0.6.1 accounts
npx -y adport@0.6.1 doctor
```

Adport сохраняет credentials в `${ADPORT_HOME:-~/.config/adport}/credentials.json`
с локальными правами файла. Для production не использовать demo mode. В
AdsMCP `ADPORT_HOME` можно задать отдельно, чтобы credentials не смешивались с
другими локальными профилями.

Важные ограничения Spotify API: тестовые аккаунты не дают reporting, reporting
использует continuation tokens, а `SPEND` может отличаться от UI budget-spent
из-за overdelivery semantics. Эти различия должны сохраняться в normalized
report metadata, а не скрываться конвертацией.

Полное решение и критерии замены зафиксированы в
[ADR-0012](./decisions/0012-spotify-ads-mcp.md).

## Meta Ads: официальный Graph API и готовые MCP-кандидаты

Дата проверки: **2026-10-23**. Для Meta выбран локальный stdio-модуль, который
ходит напрямую в официальный [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis/)
через Graph API. Это покрывает discovery рекламных аккаунтов, campaigns,
ad sets, ads, creatives, audiences, targeting, pages, catalog и Insights без
добавления hosted-посредника.

| Кандидат | Что полезно | Ограничение | Решение |
| --- | --- | --- | --- |
| [get-mcp-ads/meta-ads-mcp-server](https://github.com/get-mcp-ads/meta-ads-mcp-server) `v2.0.1` | 41 read-tools, 23 opt-in write-tools, прямой `graph.facebook.com`, Apache-2.0, Graph API `v26.0`, CI для Node 22/24 | молодой проект с небольшой историей; access token и OAuth lifecycle остаются ответственностью AdsMCP | выбранный runtime |
| [hashcott/meta-ads-mcp-server](https://github.com/hashcott/meta-ads-mcp-server) | TypeScript, stdio/HTTP, 35 read-tools и 19 opt-in writes, writes выключены по умолчанию | Graph API `v22.0`, меньше покрытие и более старый API baseline | не выбран; хороший safety reference |
| [anhnguyen0905/meta-ads-mcp](https://github.com/anhnguyen0905/meta-ads-mcp) | простой read-only Python MCP с browser OAuth | только 5 узких инструментов; Graph API `v23.0`; нет creative/targeting breadth | не выбран; fallback для минимального read-only |
| [byadsco/meta-ads-mcp](https://github.com/byadsco/meta-ads-mcp) | 142 tools, multi-tenant OAuth, stdio/HTTP, Firestore token encryption | требует Firestore/GCP, имеет широкую write/video/Gemini-поверхность и избыточен для текущего ядра | не выбран как core |
| [brijr/meta-mcp](https://github.com/brijr/meta-mcp) | self-hosted Cloudflare Worker и browser OAuth | HTTP/Worker runtime, не локальный stdio-модуль | optional adapter |
| [Synter MCP](https://github.com/Synter-Media-AI/mcp-server) | мультиплатформенный reporting и campaign слой | hosted backend/API key, не прямое подключение AdsMCP к Meta | optional aggregator |

Решение зафиксировано в [ADR 0013](decisions/0013-meta-ads-mcp.md). В
`modules/modules.example.json` и локальном runtime реестре зафиксирован
`@getmcpads/meta-ads-mcp-server@2.0.1` с командой
`npx -y @getmcpads/meta-ads-mcp-server@2.0.1`. Переменные:

- `META_ACCESS_TOKEN` — Meta user/system-user token с permission `ads_read`;
- `META_API_VERSION=v26.0` — версия Graph API;
- `META_ENABLE_WRITES=0` — обязательный fail-closed default.

В allowlist входят только 41 read-tool. Все 23 provider write-tool исключены,
а `ads_management` не запрашивается. Первый smoke-путь: `meta_health_check`,
`meta_list_ad_accounts`, `meta_get_campaigns`, `meta_get_insights`; до выдачи
`META_ACCESS_TOKEN` live-handshake намеренно не выполняется. Токен не передаётся
в MCP arguments, не сохраняется в SQLite и не включается в логи.

## Apple Search Ads: Platform API v1 и готовые MCP-кандидаты

Дата проверки: **2026-10-23**. Официальный [Apple Ads Platform API](https://developer.apple.com/documentation/apple-ads-platform-api)
теперь является целевым API для App Store advertising; Apple документирует
OAuth 2.0, ES256 JWT client secret и Bearer access token для вызовов API.
Campaign Management API v5 ещё нужен для миграции, но его sunset заявлен на
26 января 2027, поэтому новый runtime строится сразу на Platform API v1.

| Кандидат | Что полезно | Ограничение | Решение |
| --- | --- | --- | --- |
| [zelentsov-dev/apple-ads-mcp](https://github.com/zelentsov-dev/apple-ads-mcp) `v0.3.7` | Platform API v1, local stdio, Windows/macOS/Linux releases, read-only default, 57 typed read-tools, preview + single-use receipt gates | небольшой молодой проект; Windows требует скачать и checksum-проверить ZIP; v5 и Apple Maps не покрывает | выбранный runtime |
| [AppVisionOS/apple-search-ads-mcp](https://github.com/AppVisionOS/apple-search-ads-mcp) `v1.0.0` | 74 typed tools и почти полное покрытие Campaign Management API v5, reports/keywords/creatives | legacy v5 с sunset 2027-01-26, raw passthrough и большая write-поверхность; миграция на v1 не готова | не выбран; reference для v5 |
| [andrealufino/aapl-ads-mcp](https://github.com/andrealufino/aapl-ads-mcp) | MIT, self-hosted stdio, 9 read-only tools, API Account Read Only, reports по campaign/ad group/keyword/search terms | только v5, один org ID, мало покрытия apps/eligibility/creative; маленькая история | безопасный узкий fallback |
| [appadscli/appadscli](https://github.com/appadscli/appadscli) | v1-native, npm-бинарь для Windows/macOS/Linux, 32 MCP tools, reports + ASO + dry-run/confirm | широкая CLI/ASO/ROAS-поверхность, writes представлены MCP tools, молодой проект | не выбран как core; optional research |
| [@trialanderror-ai/asa-mcp](https://www.npmjs.com/package/%40trialanderror-ai/asa-mcp) | npm, Campaign Management API, компактный Code Mode | всего `search` + `execute`; hand-built spec и raw execute дают слишком широкую поверхность, v5 | не выбран |
| [ppcprophet/apple-ads-mcp](https://github.com/ppcprophet/apple-ads-mcp) | reports и campaign management через MCP | Streamable HTTP hosted service, bearer token и writes; нет локального stdio-контроля | не выбран |

Официальный [Apple Node SDK](https://www.npmjs.com/package/%40apple/apple-ads-platform)
используется как reference-контракт, но сам по себе не является MCP-сервером.

Решение зафиксировано в [ADR 0014](decisions/0014-apple-search-ads-mcp.md).
В runtime используется `apple-ads-mcp serve --stdio` из release `v0.3.7`.
На Windows нужно скачать соответствующий ZIP и `checksums.txt` из GitHub
Releases; если бинарь не находится в `PATH`, абсолютный `command` сохраняется
в игнорируемом `modules/modules.json`.

В allowlist входят все 57 read-tools: identity/ACL, ad accounts, apps и
eligibility, campaigns/ad groups/keywords/ads/creatives, product pages,
suggestions, reports, recommendations, change history и audits. Mutation,
preview, apply, delete и optimizer-write tools не добавляются. Переменные
`APPLE_ADS_ALLOW_WRITES=false` и `APPLE_ADS_ALLOW_DELETES=false` передаются
явно; для API user рекомендуется роль `API Account Read Only`.

Первый smoke-путь: `server_info`, `auth_check`, `ad_accounts_list`,
`account_health`, затем `campaign_report` и `keyword_report`. Приватный ключ
остаётся локальным файлом и не передаётся в MCP arguments или SQLite.

## TikTok Ads: официальный Business API и готовые MCP-кандидаты

Дата проверки: **2026-10-23**. TikTok документирует [Marketing API v2.0](https://business-api.tiktok.com/portal/docs/marketing-api/v2.0)
для чтения рекламных сущностей, reporting и управления Ads Manager. У TikTok
уже есть официальный [TikTok for Business MCP Server](https://ads.us.tiktok.com/resources/help/article/about-tiktok-for-business-mcp-server?lang=en)
с двумя remote URL: full disclosure примерно на 400 tools и progressive
disclosure примерно на 40 tools. Для AdsMCP он не выбран как core, потому что
это hosted endpoint с широкой campaign-management write-поверхностью и без
локального allowlist-контроля.

| Кандидат | Что полезно | Ограничение | Решение |
| --- | --- | --- | --- |
| [getmcpads-com/tiktok-ads-mcp-server](https://github.com/getmcpads-com/tiktok-ads-mcp-server) `v2.0.1` | локальный stdio, прямой TikTok Business API, 35 read-tools, 29 writes выключены по умолчанию, 277 metrics, Apache-2.0, Node 22/24 CI | молодой runtime; требует Node 22.12+ и TikTok access token + App ID | выбранный runtime |
| [TikTok for Business MCP Server](https://ads.us.tiktok.com/resources/help/article/about-tiktok-for-business-mcp-server?lang=en) | first-party bridge, zero-code подключение, полный и progressive режимы, campaign/report/audience/creative workflows | remote, около 400/40 tools, writes доступны по модели TikTok, нет нашего локального allowlist | official optional connector |
| [AdsMCP/tiktok-ads-mcp-server](https://github.com/AdsMCP/tiktok-ads-mcp-server) | MIT, local Python/uv stdio, OAuth tools, read-only campaigns/reports/audiences/pixels, 54 stars | 11 commits, no pinned release package, уже более узкое покрытие и отдельный uv checkout | не выбран; read-only fallback |
| [tiktok-mcp на PyPI](https://pypi.org/project/tiktok-mcp/0.2.0/) | local `uvx`, keyring, Marketing API плюс Display/Organic/Content Posting, writes gated | слишком широкий multi-surface runtime и account-change flows для AdsMCP Ads-only модуля | не выбран как core |
| [dhawalshah/tiktok-ads-mcp](https://github.com/dhawalshah/tiktok-ads-mcp) | Python stdio, campaigns/video/audience/benchmarks, optional Cloud Run OAuth | Firestore/Cloud Run для remote mode, ручной install, молодой проект и токеновый контур сложнее | не выбран |
| [leverageaiapp/tiktok-ads-mcp](https://github.com/leverageaiapp/tiktok-ads-mcp) | локальный CLI/MCP, reports и dry-run mutation mode | write tools присутствуют, узкое покрытие, нет стабильного pinned distribution path | не выбран |

Решение зафиксировано в [ADR 0015](decisions/0015-tiktok-ads-mcp.md). В
runtime используется `npx -y @getmcpads/tiktok-ads-mcp-server@2.0.1`, а
`TIKTOK_ENABLE_WRITES=0` передаётся явно. В allowlist входят только 35 read
tools: advertisers, campaigns, ad groups, ads, targeting, audiences, pixels,
events, creatives, reports, delivery diagnostics, asset metadata и GET-only
raw reads. Все 29 write tools исключены и не регистрируются в AdsMCP.

Для авторизации нужны `TIKTOK_ACCESS_TOKEN` и принадлежащий ему
`TIKTOK_APP_ID`; `TIKTOK_APP_SECRET` остаётся optional для endpoints, которым
нужна app authentication. Первая проверка: `tiktok_health_check`, затем
`tiktok_list_advertisers`, `tiktok_get_campaigns` и `tiktok_get_insights`.
Токен не сохраняется в SQLite, MCP arguments или логах AdsMCP.

## Email: выбран `@codefuturist/email-mcp`

Дата проверки: **2026-10-23**. Для почты выбран
[`codefuturist/email-mcp`](https://github.com/codefuturist/email-mcp), закреплённый
как `@codefuturist/email-mcp@0.6.0`. Он работает по stdio, использует IMAP для
чтения/поиска и SMTP для отправки, а текущий README пакета требует Node.js >=24.

| Кандидат | Что полезно | Ограничение | Решение |
| --- | --- | --- | --- |
| [codefuturist/email-mcp](https://github.com/codefuturist/email-mcp) | IMAP + SMTP, multi-account, read/send/draft, stdio/HTTP, TLS/STARTTLS, rate limit | широкий набор дополнительных tools; текущий пакет требует Node.js >=24 | выбранный runtime, 18 tools в allowlist |
| [diskd-ai/email-mcp](https://github.com/diskd-ai/email-mcp) | Форк с тем же базовым IMAP/SMTP направлением и расширенной автоматизацией | более широкий surface и fork-зависимость для базового сценария | альтернатива, не core |
| [boutquin/mcp-server-email](https://github.com/boutquin/mcp-server-email) | Go, MIT, multi-account, pooling, OAuth2, 22 tools | отдельный Go 1.24+ runtime и отдельный бинарный lifecycle | не выбран |
| [sandraschi/email-mcp](https://github.com/sandraschi/email-mcp) | IMAP/SMTP, transactional API, stdio/HTTP, dashboard | Python/uv и dashboard избыточны для проверки и отправки почты | не выбран |

В AdsMCP разрешены только account/mailbox/message reads, search, attachments,
health, `send_email`, `reply_email`, `forward_email` и `save_draft`. Delete,
bulk, move, mailbox/label mutation, scheduler, watcher/notifications,
clipboard и calendar tools закрыты. `MCP_EMAIL_READ_ONLY=true` дополнительно
отключает mailbox writes внутри внешнего пакета. Полное решение и настройка — в
[ADR 0016](./decisions/0016-email-smtp-imap-mcp.md).

## Как заменить модуль позже

Новый кандидат не должен требовать переписывания всей системы. Нужно проверить:

1. Есть ли read-only инструменты аккаунта, кампаний и статистики.
2. Есть ли нормальный OAuth/API/session flow без browser automation.
3. Какой transport реально работает на Windows: stdio и/или Streamable HTTP.
4. Есть ли безопасное разделение read/write и возможность отключить writes.
5. Как представлены spend, impressions, clicks, conversions, currency и dates.
6. Можно ли хранить credentials только вне SQLite и вне MCP arguments.
7. Какова лицензия, активность проекта, тесты и способ обновления.
8. Совпадает ли результат с нашим нормализованным контрактом или нужен отдельный
   адаптер.

После этого кандидат добавляется в таблицу с датой, ссылкой на репозиторий,
версиями, результатом handshake и известными ограничениями. Решение меняется
только после read-only smoke-теста и повторной проверки безопасности.

## Что считается улучшением

Более новый модуль заменит ZAI, если он одновременно:

- даёт не меньший набор account/campaign/report данных;
- не требует отдельного браузера на пользователя или провайдера;
- имеет более надёжную авторизацию и понятную лицензию;
- не расширяет write-поверхность без явного approval;
- проходит MCP-handshake и повторную синхронизацию с dedupe;
- снижает операционные расходы или заметно улучшает полноту метрик.

До выполнения этих условий текущий модуль остаётся рабочим baseline, а новые
кандидаты — экспериментальными и не включаются в production allowlist.
