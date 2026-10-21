# ADR-0001: Telegram Ads provider module

- **Статус:** accepted / official API read layer + guarded ad writes
- **Дата:** 2026-10-08
- **Область:** Telegram Ads adapter and provider MCP runtime
- **Связанные файлы:** `modules/modules.json`, `modules/modules.example.json`, `src/integrations/telegram-ads.ts`

## Контекст

AdsMCP должен получать данные Telegram Ads и сохранять их в общей локальной
модели: `project -> campaign -> source -> spend/events`. При этом нельзя делать
отдельный Chromium-runtime для каждой площадки, нельзя хранить cookies в SQLite
и нельзя включать provider writes до появления approval, лимитов и аудита.

Были проверены три внешних MCP-проекта:

- [zai-one/telegram-ads-mcp](https://github.com/zai-one/telegram-ads-mcp);
- [reputasyon/telegram-ads-mcp](https://github.com/reputasyon/telegram-ads-mcp);
- [Free-cat/telegram_ads_mcp](https://github.com/Free-cat/telegram_ads_mcp).

Полное сравнение и критерии находятся в
[PROVIDER-MODULES.md](../PROVIDER-MODULES.md).

## Решение

Использовать ZAI как внешний provider MCP и не копировать его код в AdsMCP.
На Windows запускать его одним локальным Streamable HTTP-процессом, а AdsMCP
подключать к `http://127.0.0.1:8766/mcp`.

Дополнительно использовать официальный Telegram Ads API как локальный адаптер
`src/integrations/telegram-ads-api.ts`. Он обращается к
`https://promoteapi.telegram.org` с token из `ADS_TELEGRAM_ADS_API_TOKEN`, не
использует browser cookies и нормализует `getAdsList`/`getAdStats` в тот же
контракт кампаний. Session-layer остаётся fallback и источником сверки.

Внешние tools ограничены allowlist:

```text
check_session
list_accounts
get_account
get_ads
get_ad
get_ad_stats
search_targets
get_targeting_reference
check_ad_post
```

Нормализация выполняется внутри AdsMCP:

- `ads_telegram_ads_report` получает account, ads и stats;
- `ads_telegram_ads_sync` создаёт или обновляет локальные campaigns;
- `source` равен `telegram_ads`;
- `project_id` задаётся при синхронизации;
- spend/impressions/clicks записываются идемпотентно через `dedupe_key`;
- при `stats_period=5min` временные точки последних 24 часов нормализуются в
  `campaign_metric_points` с 5-минутным bucket и обновляются идемпотентно;
- `ads_campaign_timeseries` читает сохранённые точки без повторного обращения к
  провайдеру;
- provider writes остаются вне allowlist.
- official API guarded writes разрешены только для createAd, increaseAdBudget,
  submitAdForReview и editAd pause/resume; для них нужны `confirm=true`,
  idempotency key для денежных операций и provider readback.

## Browser session decision

Вход не автоматизируется и не выполняется из MCP. `scripts/telegram-ads-login.mjs`
поднимает один постоянный Chrome-профиль, пользователь самостоятельно завершает
авторизацию, а скрипт сохраняет только cookies `ads.telegram.org` в
`ADS_MCP_DATA/secrets/telegram-ads-session.env`. После этого provider работает
без запущенного Chromium.

Это выбрано вместо запуска браузера на каждый вызов: меньше ресурсов, одна
сессия на машину и понятная точка повторной авторизации. Cookie values никогда
не выводятся, а provider runtime ограничен `TG_ADS_WRITE_GATE=strict` и
read-only allowlist в `modules/modules.json`.

## Почему не встроенный код

Код провайдера и его внутренняя API-логика должны обновляться независимо от
AdsMCP. Встраивание исходников создаст копию, усложнит обновления и может
нарушить условия лицензии внешнего проекта. AdsMCP владеет только своим
нормализованным контрактом, безопасностью и локальной аналитикой.

## Последствия

Положительные:

- один runtime без Chromium;
- готовые provider-native инструменты остаются доступными через bridge;
- провайдера можно заменить без миграции SQLite;
- результаты Telegram Ads видны рядом с Google/Yandex и разбиваются по проектам.

Отрицательные:

- нужен локальный session cookie flow;
- официальный API token нужно создать и ротировать отдельно от browser-сессии;
- внешний модуль может поменять внутреннюю разметку Telegram Ads;
- статистика зависит от возможностей и стабильности внешнего репозитория;
- временные ряды доступны только в пределах, которые возвращает provider
  (`5min` — последние 24 часа, `day` — дневная история);
- HTTP-процесс нужно запускать и контролировать отдельно до появления общего
  worker/supervisor.

## Условия пересмотра

ADR пересматривается, если:

- официальный API меняет auth/endpoint contract или появляется официальный MCP с
  лучшим read/report покрытием;
- кандидат закрывает текущие ограничения без browser automation;
- текущий модуль перестаёт проходить handshake, auth или stats smoke-тест;
- меняется лицензия или условия использования;
- появляется требование безопасных provider writes с approval/audit.

При пересмотре сначала добавляется новый кандидат в
`docs/PROVIDER-MODULES.md`, затем выполняется read-only параллельное сравнение.
Старый модуль не удаляется до успешной повторной синхронизации и подтверждения
метрик.
