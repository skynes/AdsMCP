# ADR-0009: Avito Ads через локальный read-only MCP

- **Статус:** accepted
- **Дата:** 2026-10-23
- **Область:** provider MCP / Avito Ads

## Решение

Подключить [`A1-x-tech/mcp-avito-ads`](https://github.com/A1-x-Tech/mcp-avito-ads)
v1.1.0 как локальный stdio-модуль `avito_ads`. Он вызывает официальный
Avito Ads API напрямую с OAuth2 `client_credentials`; AdsMCP передаёт секреты
только через дочерний процесс и не пишет их в SQLite, manifest или MCP arguments.

В allowlist оставлены:

- `auth_status`, `get_account`, `get_balance`;
- списки дочерних аккаунтов, рекламодателей, договоров, кампаний, групп,
  креативов и пользователей;
- `campaign_stats`, `group_stats`, `creative_stats`.

Из allowlist исключены изменение бюджета/ставки, создание сущностей, выдача и
отзыв доступов, переводы денег, sandbox-аккаунты и `raw_request`. Это оставляет
первый runtime read-only; отдельный guarded write-layer потребует подтверждения,
идемпотентности и provider readback.

## Рассмотренные альтернативы

| Репозиторий | Что делает | Почему не выбран для `avito_ads` |
| --- | --- | --- |
| [`elchin92/avito-mcp`](https://github.com/elchin92/avito-mcp) | 148 tools для основного Avito API: объявления, чаты, заказы, статистика; локальный stdio, read-only mode и confirmation flow | Сильный общий Avito-модуль, но не покрывает отдельный кабинет Авито Рекламы и его `ads/v1` API. Оставлен кандидатом для будущего `avito_marketplace` |
| [`AlexButiev/avito-personal-mcp`](https://github.com/AlexButiev/avito-personal-mcp) | Чтение личного аккаунта через пользовательскую Chrome-сессию/CDP, guarded отправка сообщений | Не официальный API, нужен Chromium/CDP и ручная browser-сессия; это личный marketplace workflow, не рекламный кабинет |
| [`Ascard/mcp-avito`](https://github.com/Ascard/mcp-avito) | Playwright scraper: поиск и детали публичных объявлений, прокси, anti-detection и captcha fallback | HTML scraping вместо API, browser/proxy runtime, нет рекламных кампаний, статистики и безопасного аккаунтного контракта |
| [`evgenygurin/avito-mcp-plugin`](https://github.com/evgenygurin/avito-mcp-plugin) | Python plugin с gateway/scraper/db/notify, мониторингом, историей цен и прокси | Парсер публичного каталога с anti-bot/proxy и Supabase; не официальный Ads API, лишняя stateful-инфраструктура и юридические риски scraping |
| [`A1-x-tech/mcp-avito-ads`](https://github.com/A1-x-Tech/mcp-avito-ads) | 25 tools для Авито Рекламы: кампании, группы, креативы, статистика, балансы, договоры; stdio; ограниченные writes | **Выбран:** точное совпадение с задачей, прямой API, фиксируемый npm-релиз, MIT, read/write разделение и rate-limit/API-point observability |

Официального MCP-сервера Avito в проверенном каталоге не найдено. Поэтому
выбранный runtime — community MCP, но сетевой вызов идёт напрямую в официальный
Avito Ads API; проект не используется как hosted proxy.

## Ограничения

- Для работы нужны `AVITO_ADS_CLIENT_ID`, `AVITO_ADS_CLIENT_SECRET` и
  `AVITO_ADS_ACCOUNT_ID`; ключи создаются администратором рекламного аккаунта.
- Статистика ограничена периодом API до 100 дней, а вызовы расходуют недельный
  `Api-Point-Balance` Avito.
- До отдельного решения writes остаются недоступны через AdsMCP bridge.
