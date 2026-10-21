# Исследование внешних advertising MCP-репозиториев

Дата проверки: **2026-10-08**.

Документ объединяет изученные advertising MCP-репозитории. Цель —
отделить полезные архитектурные идеи от готовых runtime-модулей, которые можно
безопасно подключить к AdsMCP. Количество tools, stars и commits может меняться;
решения ниже основаны на README, структуре репозиториев, способе авторизации,
transport и write-safety на дату проверки.

## Короткий вывод

1. **Для Microsoft Ads уже выбран и интегрирован официальный read-only MCP.**
   Community-проекты Microsoft полезны как reference по OAuth, отчётам и защите
   write-операций, но их SOAP SDK не следует брать за основу.
2. **Следующий практический кандидат — `Draivix/aidvertaiser`.** Это MIT,
   self-hosted Python/stdio-сервер, который закрывает пока слабые для AdsMCP
   области: GA4, Search Console, Tag Manager, Matomo, Bing Webmaster и
   PageSpeed. Подключать его следует только через read-only allowlist.
3. **`advertising-hub` — основной внешний архитектурный reference-хаб AdsMCP.**
   Его используем как источник нормализованных моделей, auth, pagination, rate
   limits, error taxonomy и agent-паттернов. В перспективе можно подготовить PR
   с предложением, которое согласуется с контрактом AdsMCP. Это не означает, что
   сам hub становится runtime-зависимостью.
4. **Официальный `googleads/google-ads-mcp` подключён как Google Ads provider
   module.** Используется релиз `v0.0.4`, а не плавающий `main`; в AdsMCP
   разрешены только три read-only tools.
5. **Synter, PaidSync и Adspirer — прежде всего агрегаторы/hosted-продукты.** Они
   полезны как benchmark по ширине покрытия, cross-platform reporting и UX, но
   не являются необходимой заменой локальным provider-модулям AdsMCP.
5. **`wvuhskr/mcp-microsoft-ads` — лучший reference по write-safety**, а не
   текущий runtime: у него сильная модель draft → confirm, лимиты и аудит, но
   реализация основана на legacy Bing Ads SOAP SDK.

## Сводная матрица

| Репозиторий | Тип и покрытие | Runtime/auth | Writes и безопасность | Лицензия | Решение для AdsMCP |
| --- | --- | --- | --- | --- | --- |
| [advertising-hub](https://github.com/itallstartedwithaidea/advertising-hub) | OSS-каталог: 14 платформ, 25+ агентов, MCP-шаблоны | Python-пакеты и отдельные integrations | Идеи нормализации и agent orchestration; не единый production endpoint | MIT | Основной архитектурный reference и PR-кандидат; не runtime |
| [Synter MCP](https://github.com/Synter-Media-AI/mcp-server) | 19 платформ в reporting, 14 с campaign creation, 140+ tools | TypeScript; stdio/npm и hosted HTTP; API key | Write tools помечены `destructive`, но write-поверхность широкая | MIT | Optional aggregator/reference, не core runtime |
| [PaidSync MCP](https://github.com/PaidSync/paidsync-mcp) | 610+ tools, 14 платформ, включая GA4/GTM/GSC/Merchant Center | Hosted Streamable HTTP; sign-in через сервис | Может менять campaign settings; Search Console read-only | MIT для repo; runtime hosted | UX/dispatcher reference, optional hosted connector |
| [bit-of-a-shambles/microsoft-ads-mcp-server](https://github.com/bit-of-a-shambles/microsoft-ads-mcp-server) | Microsoft Ads: accounts, campaigns, groups, keywords, RSA, reports | Python FastMCP/stdio, OAuth, `bingads` SDK | Raw write-tools без достаточного общего gate | MIT | Не подключать |
| [wvuhskr/mcp-microsoft-ads](https://github.com/wvuhskr/mcp-microsoft-ads) | 47 Microsoft Ads tools, reporting и keyword research | Python, `bingads` SOAP SDK | Writes off by default, draft → confirm, budget/CPC ceilings, audit log | MIT | Safety reference; не runtime |
| [amekala/ads-mcp](https://github.com/amekala/ads-mcp) / Adspirer | Hosted cross-platform MCP, 400+ tools, 6 рекламных платформ | Streamable HTTP, OAuth 2.1 + PKCE, dynamic client registration | MCP safety annotations; campaign writes доступны | Proprietary | Не встраивать; benchmark hosted UX |
| [Draivix/aidvertaiser](https://github.com/Draivix/aidvertaiser) | 232 tools, 8 платформ: Google, Meta, GA4, GSC, GTM, Matomo, Bing Webmaster, PageSpeed | Python/`uv`, локальный stdio, browser OAuth + API keys | Read и write смешаны; нужна строгая allowlist-политика AdsMCP | MIT | Лучший следующий self-hosted кандидат в read-only режиме |
| [googleads/google-ads-mcp](https://github.com/googleads/google-ads-mcp) | Официальный read-only MCP: search, customers и resource metadata | Python/FastMCP, stdio или Streamable HTTP; ADC + developer token | В исходнике нет mutate-инструментов; AdsMCP дополнительно ограничивает allowlist тремя tools | Apache-2.0 | Подключён как `google_ads_official`, v0.0.4 |

## Разбор проектов

### 1. Advertising Hub

[Репозиторий](https://github.com/itallstartedwithaidea/advertising-hub)

Это не один provider MCP, а open-source hub с каталогом рекламных API, MCP
серверов, агентских инструкций и cross-platform patterns. В README заявлены 14
платформ и 25+ специализированных агентов. Важная часть структуры:

- `core/auth/` — общие OAuth/API-key patterns;
- `core/models/` — модели campaign, ad group, ad, audience и metrics;
- `core/rate_limiting/` — адаптивные rate limits;
- `core/errors/` — единая taxonomy ошибок;
- `core/utils/` — currency, dates, pagination и normalization;
- `platforms/` — отдельные provider-контексты;
- `agents/` — platform-specific, paid-media, cross-platform и orchestrator
  агенты;
- `mcp-servers/` — registry и templates.

В таблице платформ Google Ads указан как live MCP, а Microsoft Ads — как
`Spec Ready`. Это означает, что Microsoft-раздел полезен для проектирования,
но не заменяет готовый runtime.

Что взять в AdsMCP:

- нормализованные поля кампании и метрик как внешний контракт адаптера;
- единый слой pagination/date/currency/error mapping;
- разделение provider-специфичного кода и cross-platform orchestration;
- идеи для будущих агентов: budget allocator, search query analyst, tracking
  specialist, reporting unifier.

Что не брать напрямую:

- весь hub как монолитную зависимость;
- неподтверждённые provider-реализации только потому, что они присутствуют в
  каталоге;
- write-агентов без нашего allowlist и approval policy.

**Решение:** назначить Advertising Hub основным внешним reference-хабом AdsMCP
по архитектуре, контрактам и агентским паттернам. Следить за его изменениями и
при наличии полезного общего улучшения готовить отдельное PR-предложение.

При этом hub не добавляется в `modules/modules.json`, provider allowlist или runtime
зависимости: внешний MCP остаётся отдельным процессом, локальный адаптер
нормализует данные, а SQLite хранит только нашу модель. Текущий Microsoft Ads
runtime продолжает использовать официальный read-only MCP.

Подробное решение и критерии будущего PR зафиксированы в
[ADR-0005](../../docs/decisions/0005-advertising-hub-as-reference.md).

### 1.1 Официальный Google Ads MCP

[Репозиторий](https://github.com/googleads/google-ads-mcp)

Это официальный Python/FastMCP-сервер Google для read-only доступа к Google Ads
API. В релизе `v0.0.4` доступны:

- `customers_list_accessible_customers`;
- `search_search` для GAQL-поиска;
- `metadata_get_resource_metadata`.

AdsMCP подключает его как `google_ads_official` через stdio из локального
checkout `modules/google-ads-official`. Credentials передаются только через
`GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_ADS_DEVELOPER_TOKEN`,
`GOOGLE_PROJECT_ID` и `GOOGLE_ADS_LOGIN_CUSTOMER_ID`. OAuth HTTP variables не
передаются, поэтому локальный модуль не поднимает сетевой listener.

Статический security review зафиксирован в
[ADR-0006](../../docs/decisions/0006-google-ads-hub-mcp.md). Нормализованный
`ads_google_ads_report`/`ads_google_ads_sync` остаётся на существующем локальном
GAQL-адаптере, а provider-native tools доступны через `ads_module_tools` и
`ads_module_call`.

Нормализованный `ads_google_ads_report`/`ads_google_ads_sync` пока оставлен на
существующем локальном GAQL-адаптере: provider-native tools доступны через
`ads_module_tools` и `ads_module_call`, а схема импорта в SQLite остаётся
стабильной и не зависит от формата ответа нового сервера.

### 2. Synter MCP

[Репозиторий](https://github.com/Synter-Media-AI/mcp-server)

Synter — TypeScript MCP-сервер с широким cross-platform покрытием. README
заявляет reporting по 19 рекламным платформам и создание кампаний на 14 из них;
через `run_tool` доступно 140+ tools. В покрытие входят Google, Meta, LinkedIn,
Microsoft, Reddit, TikTok, X, Amazon, Snapchat, Pinterest, Spotify, Walmart,
Instacart, Target Roundel, Criteo, The Trade Desk, DV360 и OpenAI Ads.

Подключение предлагается в двух вариантах:

- stdio/npm-пакет `@synterai/mcp-server` с `SYNTER_API_KEY`;
- hosted Streamable HTTP endpoint с `X-Synter-Key`.

Write tools отмечены как destructive, чтобы MCP-клиент запрашивал подтверждение.
Это лучше, чем полностью неразмеченная write-поверхность, но не заменяет
политику AdsMCP: в текущем bridge по умолчанию разрешаются только tools из
allowlist, а provider writes должны быть исключены.

Полезные идеи:

- единый слой для большого набора платформ;
- отдельные annotations для destructive operations;
- готовые cross-platform сценарии: reporting, audience sync, creative
  generation, campaign review;
- возможность оставить платформенную специфику внутри provider tools.

Ограничения для прямого подключения:

- hosted-вариант требует доверия к backend Synter;
- HTTP auth использует отдельный `X-Synter-Key`, тогда как текущая конфигурация
  внешних HTTP-модулей AdsMCP рассчитана на Bearer token;
- 140+ tools создают большую context/tool surface и требуют dispatcher или
  selective discovery;
- Microsoft-сценарий уже покрыт официальным read-only MCP с более ясным
  контрактом.

**Решение:** не подключать в основной runtime. Использовать как benchmark для
cross-platform reporting, annotations и будущего tool discovery. Если появится
конкретная потребность в платформе, которой нет локально, сначала вынести её в
отдельный allowlisted модуль.

### 3. PaidSync MCP

[Репозиторий](https://github.com/PaidSync/paidsync-mcp)

PaidSync — hosted MCP-сервис. README заявляет 610+ executable tools на 14
платформах. Он строит новые кампании в Google Ads, Meta, LinkedIn и ChatGPT Ads;
управляет уже существующими кампаниями в TikTok, Microsoft, Snapchat, Reddit,
Pinterest и X. Кроме рекламы есть GA4, GTM, Search Console и Merchant Center.

Архитектурно важен его thin dispatcher. Вместо загрузки схем всех 610 tools в
контекст используются три meta-tools:

- `paidsync_context` — карта подключённых аккаунтов и возможностей;
- `paidsync_tool_detail` — схема конкретного инструмента по требованию;
- `paidsync_exec` — выполнение выбранного инструмента.

Это хороший ответ на проблему context window: крупный каталог не должен целиком
попадать в модель при каждом подключении.

Сервис меняет настройки кампаний, но не перемещает деньги и не обрабатывает
платежи. При этом это всё равно hosted write-capability, поэтому для нашего
ядра нужны отдельные доверие, audit и approval controls.

Что взять:

- on-demand tool discovery;
- cross-channel report как отдельный слой над provider adapters;
- честное описание capability: «создаём кампанию» отдельно от «управляем уже
  созданной кампанией».

Что не брать:

- hosted backend как внутренний источник истины AdsMCP;
- 610 tools без domain-specific allowlist;
- прямую запись в рекламные кабинеты без локального proposal/confirm workflow.

**Решение:** не использовать как self-hosted core. Рассматривать как optional
внешний коннектор только при явной необходимости и отдельной проверке условий
сервиса. Dispatcher-подход можно реализовать локально позже.

### 4. bit-of-a-shambles Microsoft Ads MCP Server

[Репозиторий](https://github.com/bit-of-a-shambles/microsoft-ads-mcp-server)

Это небольшой Python-сервер на FastMCP с Microsoft/Bing Ads Python SDK. Он
работает через stdio и предлагает ручной OAuth-flow:

1. `get_auth_url()` возвращает ссылку;
2. пользователь авторизуется в браузере;
3. redirect URL передаётся в `complete_auth()`;
4. токены сохраняются в `~/.config/microsoft-ads/tokens.json`.

Основные группы tools: поиск аккаунтов, кампании, ad groups, keywords, ads,
responsive search ads и async reports. Campaign creation в README указывает
paused-by-default, что снижает риск случайного запуска, но остальные raw write
операции не образуют полноценного общего safety gate.

Технические проблемы:

- используется legacy `bingads` SOAP SDK;
- README содержит clone URL с другим GitHub owner, чем URL самого репозитория;
- маленькая история проекта и недостаточно подтверждённая поддерживаемость;
- нет нашей модели allowlist, proposal, dedupe и audit.

Полезно посмотреть на компактность OAuth и раскладку provider tools. Код в
AdsMCP не копируется.

**Решение:** не подключать. Для Microsoft использовать официальный MCP и
написанный поверх него read-only адаптер.

### 5. wvuhskr/mcp-microsoft-ads

[Репозиторий](https://github.com/wvuhskr/mcp-microsoft-ads)

Это наиболее полезный safety reference среди присланных Microsoft-проектов.
README описывает 47 tools для campaign, ad group, keyword, negative keyword,
geo-targeting, ad schedule, extensions, media, audiences, conversion goals,
performance reporting и Ad Insight keyword research.

Модель защиты выглядит так:

1. writes выключены без `MS_ADS_ENABLE_WRITES=true`;
2. мутация сначала создаёт draft и возвращает `draft_id`;
3. реальное изменение требует отдельного `confirm_and_apply(draft_id)`;
4. бюджет и CPC ограничиваются env-лимитами;
5. неизвестные или автоматические bidding strategies блокируются fail-closed;
6. операции пишутся в JSONL audit log.

Это почти ровно тот уровень защиты, который нужен будущим write-модулям
AdsMCP. Но сервер всё ещё построен на `bingads` SOAP SDK. В README указано, что
Microsoft объявила SOAP end-of-life на **2027-01-31**, а новые API-возможности
переходят на REST раньше. Поэтому копировать его provider-код как долгосрочную
основу не следует.

Что уже перенесено концептуально:

- fail-closed по умолчанию;
- provider writes вне текущего allowlist;
- отдельное разделение чтения и локальной синхронизации;
- явное различие aggregate report и дневного ряда.

Что оставить на будущее для AdsMCP:

- proposal/draft сущность;
- `confirm` с повторной проверкой лимитов непосредственно перед write;
- бюджетные и bid ceilings в currency аккаунта;
- JSONL/SQLite audit trail с actor, reason, diff и provider response.

**Решение:** не использовать как runtime; использовать как reference для ADR по
будущим безопасным write-операциям.

### 6. amekala/ads-mcp — Adspirer

[Репозиторий](https://github.com/amekala/ads-mcp)

Adspirer — hosted remote MCP и одновременно plugin/agent ecosystem. README
указывает 400+ tools на шести рекламных платформах: Google, Amazon, Meta,
LinkedIn, TikTok и ChatGPT Ads. Кроме базового управления он предлагает
performance analysis, keyword research, wasted spend, anomaly detection,
creative fatigue, audience insights, multi-account workflows и scheduled
briefs/monitors/reports. Тот же tool surface доступен через REST API.

Transport и auth:

- Streamable HTTP;
- endpoint `https://mcp.adspirer.com/mcp`;
- OAuth 2.1 с PKCE;
- dynamic client registration;
- MCP annotations `readOnlyHint` и `destructiveHint`;
- encrypted token storage и заявленное отсутствие conversation logging.

Это хороший benchmark пользовательского опыта: один remote connector, browser
OAuth, tool annotations, account linking, strategy-aware workflow и готовые
команды для performance review.

Но для AdsMCP есть два жёстких ограничения:

- README указывает proprietary license, поэтому код и внутренние реализации не
  следует встраивать в AdsMCP;
- текущий bridge AdsMCP подключает Streamable HTTP-модули с Bearer/env token и
  не реализует полноценную OAuth 2.1 dynamic registration для такого hosted
  endpoint.

**Решение:** не интегрировать в core и не копировать код. Сохранить как
benchmark для UX, multi-account, annotations, anomaly detection и scheduled
reporting. Подключение как отдельного внешнего сервиса возможно только после
отдельного решения о hosted trust и OAuth.

### 7. Draivix/aidvertaiser

[Репозиторий](https://github.com/Draivix/aidvertaiser)

Aidvertaiser — self-hosted Python MCP-сервер на `uv` и stdio. README указывает
232 tools на восьми платформах:

| Платформа | Prefix | Tools | Авторизация |
| --- | --- | ---: | --- |
| Google Ads | `google_` | 81 | OAuth в браузере |
| Meta Ads | `meta_` | 40 | OAuth в браузере |
| GA4 | `ga4_` | 31 | OAuth в браузере |
| Search Console | `gsc_` | 18 | OAuth в браузере |
| Google Tag Manager | `gtm_` | 14 | OAuth в браузере |
| Matomo | `matomo_` | 24 | API token |
| Bing Webmaster | `bing_` | 21 | API key |
| PageSpeed Insights | `pagespeed_` | 3 | API key, optional |

Запуск из исходников:

```bash
git clone https://github.com/Draivix/aidvertaiser.git
cd aidvertaiser
uv sync
uv run unified-ads-mcp
```

OAuth tokens кэшируются в `~/.unified-ads-mcp/`. Это удобно для локальной
разработки, но при подключении к AdsMCP нужно заранее определить, где именно
живут credentials и как provider process запускается на Windows. Браузерный
OAuth должен выполняться как отдельный onboarding-шаг, а не во время обычного
MCP-запроса.

Главная ценность для AdsMCP — не дублировать Google/Meta Ads adapters, а закрыть
аналитику и SEO/measurement слой:

- GA4 — account/property discovery, reports и realtime reports;
- Search Console — sites, search analytics, URL inspection;
- GTM — accounts, containers, workspaces, tags/triggers/variables в read-only;
- Matomo — sites и reporting;
- Bing Webmaster — sites, sitemaps, query/page/crawl statistics;
- PageSpeed — analyze, compare и Core Web Vitals.

В README read и write tools представлены в одном сервере. Поэтому для первого
подключения AdsMCP нужно разрешить только чтение. В частности, не включать
создание/удаление сайтов Search Console, submit URL, изменение GTM, изменение
Matomo и операции добавления/верификации/удаления Bing Webmaster.

Рекомендуемый первый allowlist-контур:

```text
ga4_list_accounts
ga4_list_account_summaries
ga4_list_properties
ga4_get_property
ga4_run_report
ga4_run_realtime_report

gsc_list_sites
gsc_get_site
gsc_search_analytics
gsc_search_analytics_by_query
gsc_search_analytics_by_page
gsc_inspect_url

gtm_list_accounts
gtm_list_containers
gtm_list_workspaces
gtm_list_tags
gtm_list_triggers
gtm_list_variables

matomo_list_sites
matomo_get_site
matomo_get_site_urls

bing_list_sites
bing_get_url_submission_quota
bing_list_sitemaps
bing_get_rank_and_traffic_stats
bing_get_query_stats
bing_get_page_stats
bing_get_crawl_stats
bing_get_crawl_issues
bing_get_crawl_settings
bing_get_keyword
bing_get_related_keywords
bing_get_link_counts
bing_get_url_links

pagespeed_analyze
pagespeed_compare
pagespeed_core_web_vitals
```

На первом этапе лучше использовать общий `ads_module_call` и сохранять raw
ответы только в telemetry/debug-контексте. После проверки стабильности схемы
можно добавить специализированные адаптеры `ga4-report` и `gsc-report`, которые
будут писать нормализованные измерения в SQLite. Google Ads и Meta Ads не нужно
дублировать до тех пор, пока Aidvertaiser не даст уникальные данные, которых не
хватает текущим адаптерам.

**Решение:** это лучший следующий кандидат для optional self-hosted
`aidvertaiser_readonly` module. В текущем изменении документа код и конфигурация
модуля не добавляются: сначала нужен отдельный handshake, проверка OAuth и
подтверждение конкретных read-only tool names.

## Что именно переносим в AdsMCP

| Идея | Источник | Как применяется |
| --- | --- | --- |
| Нормализованные модели и единые ошибки | Advertising Hub | Общий adapter contract и SQLite-модель |
| Tool annotations и классификация destructive | Synter, Adspirer | Metadata/allowlist; annotations не заменяют server-side gate |
| On-demand discovery при большом каталоге | PaidSync | Будущий dispatcher для десятков provider tools |
| Минимальный OAuth stdio provider | bit-of-a-shambles | Только как пример простого onboarding, не кодовая база |
| Draft → confirm, ceilings, audit | wvuhskr | Основа будущего безопасного write workflow |
| Cross-platform anomaly/brief/report UX | Adspirer, Synter, PaidSync | Будущие локальные analytics tools |
| GA4/GSC/GTM/Matomo/Bing/PageSpeed coverage | Aidvertaiser | Следующий optional read-only module |

## План интеграции

### Уже сделано

- официальный Microsoft Advertising MCP подключён как `microsoft_ads_official`;
- provider allowlist оставляет только read tools;
- добавлены `ads_microsoft_ads_report` и `ads_microsoft_ads_sync`;
- результаты нормализуются и дедуплицируются в SQLite;
- решение и ограничение aggregate date presets описаны в
  [ADR-0003](../../docs/decisions/0003-microsoft-ads-read-only-mcp.md).

### Следующий безопасный шаг

Подключить Aidvertaiser как отдельный локальный module profile в read-only
режиме:

1. зафиксировать исходный commit/версию и установить через `uv`;
2. решить, как локально запускается stdio-процесс и где лежит его credential
   directory;
3. добавить только перечисленный allowlist без write tools;
4. пройти `initialize`/`tools/list` и по одному проверить GA4/GSC/Bing/PageSpeed;
5. только после этого решить, нужны ли нормализаторы и запись в SQLite;
6. сохранить provider write-tools вне allowlist даже если upstream разрешает их.

### Пока не делать

- не копировать proprietary Adspirer code;
- не заменять официальный Microsoft MCP community SOAP-серверами;
- не подключать Synter/PaidSync только из-за большего числа tools;
- не включать Aidvertaiser writes до появления proposal/confirm, budget limits,
  audit и отдельного approval;
- не считать hosted aggregator источником истины для локальной attribution и
  dedupe-модели.

## Связанные документы

- [Provider MCP modules](../../docs/PROVIDER-MODULES.md) — текущие runtime-модули и
  критерии выбора.
- [ADR-0003: Microsoft Advertising read-only MCP](../../docs/decisions/0003-microsoft-ads-read-only-mcp.md)
  — принятое решение по Microsoft Ads.
- [Architecture](../../docs/ARCHITECTURE.md) — общая модель AdsMCP.
