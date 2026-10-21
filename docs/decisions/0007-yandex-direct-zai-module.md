# ADR-0007: Yandex Direct provider module (ZAI.ONE yandex-mcp)

- **Статус:** accepted / guarded Direct writes
- **Дата:** 2026-10-08
- **Область:** Yandex Direct, Metrika и Webmaster через provider MCP
- **Связанные файлы:** `modules/modules.example.json`, `modules/modules.json`,
  `scripts/yandex-direct-mcp.py`, `src/integrations/yandex-direct.ts`, `src/integrations/registry.ts`

## Контекст

Telegram Ads подключён через модуль разработчика ZAI.ONE
([ADR-0001](./0001-telegram-ads-module.md)). Для Yandex Direct нужен модуль того же
уровня: внешний код без копирования в AdsMCP, изолированный runtime, credentials
только в локальных ignored-файлах, а provider writes — только через явный guarded
workflow с idempotency и readback.

У ZAI.ONE ([github.com/zai-one](https://github.com/zai-one)) нет отдельного
Direct-only репозитория. Yandex Direct входит в
[zai-one/yandex-mcp](https://github.com/zai-one/yandex-mcp) (v0.3.0, commit
`a71907de69c9d8301dc2b9b91e7ee1bc743653e4`), который также покрывает Metrika,
Search/Wordstat и Webmaster. Этот репозиторий уже был склонирован локально как кандидат
и является актуальным `main` upstream.

## Решение

- Использовать `zai-one/yandex-mcp` как основной Yandex-модуль `yandex_mcp_zai`.
- Checkout хранить в ignored `modules/yandex-direct` (переименован из прежнего
  локального checkout кандидата).
- Зависимости ставить в `modules/yandex-direct-deps` через `pip install --target`:
  upstream закрепляет FastMCP 3.4.4 и MCP SDK 1.30, а глобальный Python содержит
  FastMCP 3.4.2 и MCP 1.26; `uv` на машине не установлен.
- Запускать по **stdio** через `scripts/yandex-direct-mcp.py`, который AdsMCP bridge
  стартует сам. HTTP-режим модуля всегда требует RS256 JWT (issuer, audience, scopes) —
  для локального моста это лишняя инфраструктура, а stdio доверяет локальному оператору.
  В отличие от Telegram, фоновый процесс и порт не нужны: Telegram держит
  cookie-сессию, а Yandex работает с OAuth-токенами из файлов.
- Launcher читает `ADS_YANDEX_*` из ignored `.env`, передаёт модулю только пути к
  token-файлам, отбрасывает унаследованные `YANDEX_*` и переводит
  `ADS_YANDEX_DIRECT_WRITE_ENABLED` в `YANDEX_DIRECT_WRITE_ENABLED`; Metrika,
  Webmaster и paid Wordstat остаются выключенными. SQLite-журнал модуля хранится
  в `ADS_MCP_DATA/yandex-direct/`.
- Allowlist: read-инструменты Direct, Metrika и Webmaster плюс `direct_write` для
  внутреннего guarded пути. Сырой вызов через `ads_module_call` блокируется;
  `ads_yandex_direct_write` требует `confirm=true`, idempotency key и открывает
  обновление/статусы существующих кампаний с provider readback. Отдельный
  `ads_yandex_direct_create_campaign` создаёт только текстовую кампанию с
  выключенными показами; удаление исключено.
- `ads_yandex_direct_sync` с `module_id: "yandex_mcp_zai"` по умолчанию вызывает
  `direct_get_statistics`.

## Альтернативы

- Community `mcp-yandex-direct` через `npx` (`yandex_direct`) — остаётся запасным
  вариантом, но покрывает только Direct и не даёт серверного write-gate и журнала.
- HTTP-процесс по образцу Telegram — отклонён из-за обязательной JWT-аутентификации.
- Установка через `uv` по upstream-инструкции — возможна позже; сейчас `uv` не
  установлен, а `pip --target` повторяет изолированный подход Telegram.

## Последствия

- Для live-вызовов пользователь должен выпустить OAuth-токен Direct в своём
  OAuth-приложении Yandex (`yandex-mcp-oauth --client-id ...` из модуля помогает
  собрать URL), сохранить его в приватный файл под `data/` и указать путь в
  `ADS_YANDEX_DIRECT_TOKEN_FILE`. Локальная панель использует фиксированный
  Redirect URI `https://oauth.yandex.ru/verification_code`: после авторизации
  токен копируется из URL и сохраняется через панель.
- Обновление модуля: `git -C modules/yandex-direct pull --ff-only`, затем сверить
  версии FastMCP/MCP в `uv.lock` с `modules/yandex-direct-deps`.
- Публичная лицензия upstream пока не назначена (`LicenseRef-ZAI-ONE`), поэтому код
  модуля не копируется в AdsMCP и не распространяется вместе с ним.
