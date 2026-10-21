# AdsMCP architecture

[← README](../README.ru.md) · [Вся документация](./README.ru.md)

## Boundaries

`src/db.ts` отвечает только за подключение и схему SQLite. `src/store.ts` —
идемпотентное чтение/запись доменных данных. `src/attribution.ts` считает
атрибуцию по локальным touchpoint-событиям. `src/integrations/` — контракт
внешних систем. MCP tool files только валидируют вход и вызывают доменные
функции.

Основная иерархия данных: `project -> campaign -> source -> spend/events/metric_points`.
Проект —
локальная рабочая область продукта или клиента; кампанию можно создать сразу
в проекте, перенести между проектами или оставить без проекта. `source` хранит
рекламную сеть/канал кампании (`google_ads`, `yandex_direct`, `telegram_ads` и
т.п.), чтобы в одном проекте видеть распределение по сетям. Архивирование
проекта не удаляет его кампании и историю. Проектная аналитика агрегирует KPI и
одновременно возвращает разбивку по кампаниям.

Решения по внешним provider MCP не принимаются неявно: критерии и текущие
сравнения фиксируются в [PROVIDER-MODULES.md](./PROVIDER-MODULES.md), а значимые
архитектурные выборы оформляются в [ADR](./decisions/0001-telegram-ads-module.md).
Это позволяет заменить внешний модуль без изменения локальной модели данных.
До подключения модулей пользователь получает onboarding по аудитории и сценарию
через [`ads_platform_guide`](./PLATFORM-GUIDE.md), а затем проверяет готовность
секретов и модуля через `ads_integration_plan`.

## Data flow

```text
ad platforms / CRM / site
          |
          v
   provider MCP modules -----> provider-native tools
          |                          |
   normalizers / sync ----------> events + spend (SQLite)
          |                         ^
          | read-only provider pulls |
                                  |
                         UTM / click-id context
                                      |
                                      v
                             analytics / attribution
                                      |
                                      v
                         automation rules + audit runs
                                      |
                                      v
                         controlled platform actions
```

## Safety defaults

- секреты находятся в переменных окружения или игнорируемых локальных файлах,
  но не в SQLite; расположение файлов описано в [руководстве пользователя](./USAGE.ru.md);
- provider API logic stays in installed MCP modules; AdsMCP only bridges,
  normalizes and records the result locally;
- импорт читает данные площадок и записывает результат только в локальное хранилище;
- автоматизация по умолчанию выполняет пробный запуск (`dry-run`),
  для исполнения нужен `execute=true`;
- запись событий идемпотентна по `dedupe_key`;
- все автоматические запуски пишутся в `automation_runs`;
- `pause_campaign` — встроенное действие автоматизации; другие изменения
  выполняются отдельными инструментами интеграций с собственными проверками
  и подтверждениями (см. [возможности площадок](./INTEGRATIONS.ru.md));
- передача данных в Ads Network Relay включается явно и ограничивается
  непрозрачными идентификаторами и агрегатами, без исходных персональных данных
  и учётных данных доступа.
