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

## Adspirer и Aidvertaiser: дополнительные кандидаты

Дата проверки: **2026-10-08**. Полное сравнение и список tools находятся в
[каталоге research](../research/repositories/ADVERTISING-MCP-REPOSITORIES.md); здесь фиксируется
только runtime-решение.

| Кандидат | Что полезно | Ограничение | Решение |
| --- | --- | --- | --- |
| [amekala/ads-mcp — Adspirer](https://github.com/amekala/ads-mcp) | hosted cross-platform MCP, OAuth 2.1 + PKCE, annotations, performance/anomaly/report UX | proprietary, hosted backend, dynamic OAuth не поддержан текущим простым Bearer bridge | benchmark, не встраивать |
| [Draivix/aidvertaiser](https://github.com/Draivix/aidvertaiser) | MIT, self-hosted Python/stdio, 232 tools на 8 платформах; закрывает GA4, GSC, GTM, Matomo, Bing Webmaster, PageSpeed | read/write tools смешаны, browser OAuth и отдельное credential-хранилище | следующий optional read-only module |

Aidvertaiser не должен заменять существующие Google Ads/Meta adapters без
конкретной причины. Его ценность для AdsMCP — measurement/SEO слой. Начальный
allowlist должен включать только account/property discovery и чтение отчётов;
создание/удаление сайтов, submit URL, GTM publish/update, Matomo mutations и
Bing Webmaster write-tools остаются выключенными. До live-handshake и проверки
OAuth его нельзя считать включённым production-модулем.

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
