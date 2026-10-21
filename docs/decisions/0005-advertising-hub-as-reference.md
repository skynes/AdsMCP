# ADR-0005: Advertising Hub как основной внешний reference-хаб

Дата решения: **2026-10-08**.

## Контекст

[Advertising Hub](https://github.com/itallstartedwithaidea/advertising-hub) объединяет
описания рекламных платформ, MCP-спецификации, общие модели, auth/error/rate-limit
паттерны и инструкции для AI-агентов. Однако это не единый hosted-сервис и не
готовый runtime для всех заявленных платформ: значительная часть MCP-серверов
помечена как planned/spec ready.

## Решение

Считать Advertising Hub основным внешним reference-хабом AdsMCP для:

- нормализованных моделей кампаний, групп, объявлений, аудиторий и метрик;
- общих контрактов pagination, dates, currency, authentication и ошибок;
- архитектуры provider adapters и cross-platform orchestration;
- агентских сценариев для reporting, budget analysis и search-query analysis;
- подготовки будущих предложений и PR в upstream-репозиторий.

## Ограничения

Advertising Hub не подключается как provider runtime, не добавляется в
`modules/modules.json` и не получает доступ к рекламным кабинетам AdsMCP. Наличие
платформы в его каталоге не считается подтверждением готовой интеграции.
Рабочие runtime-модули по-прежнему проходят отдельную проверку transport,
авторизации, allowlist и write-safety.

## Правило для будущего PR

PR в Advertising Hub готовится только если изменение:

1. является обобщаемым для нескольких платформ;
2. не привязывает hub к внутреннему коду или SQLite AdsMCP;
3. содержит документацию, тесты или воспроизводимый пример;
4. не расширяет destructive/write-поверхность без явного safety-gate;
5. сохраняет совместимость с существующими provider-контрактами.

До отправки PR предложение сначала проверяется локально на AdsMCP и фиксируется
отдельным решением или issue-ссылкой.
