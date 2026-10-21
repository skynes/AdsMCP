# ZAI.ONE MCP catalog

Снимок каталога: **2026-10-08**.

Источник: [профиль ZAI.ONE на GitHub](https://github.com/zai-one) и описания
репозиториев. Этот список сохраняет потенциально полезные проекты, но сам факт
наличия в каталоге не означает, что репозиторий разрешено запускать в AdsMCP.
Каждый кандидат проходит отдельную проверку по правилам из
[PROVIDER-MODULES.md](./PROVIDER-MODULES.md).

## Приоритет для AdsMCP

| Репозиторий | Назначение | Связь с AdsMCP | Приоритет | Статус |
| --- | --- | --- | --- | --- |
| [yandex-mcp](https://github.com/zai-one/yandex-mcp) | Direct, Metrika, Search API, Wordstat, Webmaster | Провайдер рекламы + аналитика + спрос | высокий | подключён как `yandex_mcp_zai` с guarded Direct writes ([ADR-0007](./decisions/0007-yandex-direct-zai-module.md)); live-проверка после токена |
| [telegram-ads-mcp](https://github.com/zai-one/telegram-ads-mcp) | Telegram Ads: кабинеты, объявления, targeting, stats | Рекламный провайдер | высокий | выбранный read-only baseline |
| [roistat-mcp](https://github.com/zai-one/roistat-mcp) | Marketing analytics, CRM, attribution, reports | Источник конверсий/выручки и cross-channel аналитики | высокий | кандидат на отдельный analytics adapter |
| [telegram-mcp](https://github.com/zai-one/telegram-mcp) | Telegram conversations, files, voice, polling | Уведомления, networking и лиды | средний | отдельный коммуникационный модуль |
| [keysso-mcp](https://github.com/zai-one/keysso-mcp) | SEO visibility, keywords, competitors | Исследование спроса и конкурентов | средний | research module |
| [topvisor-mcp](https://github.com/zai-one/topvisor-mcp) | Position checks by keyword and URL | SEO-контроль лендингов и площадок | средний | research module |
| [arsenkin-mcp](https://github.com/zai-one/arsenkin-mcp) | SEO jobs, SERP, clustering | Поиск площадок и анализ поисковой выдачи | средний | research module |
| [passbolt-mcp](https://github.com/zai-one/passbolt-mcp) | Vault entries and credential handlers | Секреты интеграций | осторожно | не подключать к AdsMCP без отдельного security review |
| [codex-mcp](https://github.com/zai-one/codex-mcp) | Codex app-server workflows | Разработка и обслуживание проекта | низкий для runtime | не provider module |
| [grok-build-mcp](https://github.com/zai-one/grok-build-mcp) | Coding delegation in Git worktrees | Вспомогательный dev workflow | низкий для runtime | не provider module |

## Что исследовать первым

### 1. `yandex-mcp`

Это самый важный следующий кандидат. По описанию репозитория он объединяет
Yandex Direct, Metrika, Search API, Wordstat и Webmaster, а не только чтение
кампаний. Потенциально он может закрыть сразу три пробела AdsMCP:

- более полный Direct adapter;
- получение фактических конверсий и целей через Metrika;
- исследование спроса и новых рекламных площадок через Search/Wordstat.

Но сначала нужно сравнить его с текущим `mcp-yandex-direct` по transport,
OAuth, статистике, стоимости Search API и write-gates. Включать его в
`modules/modules.json` автоматически не следует.

### 2. `roistat-mcp`

Roistat потенциально полезнее как отдельный источник аналитики, а не как
рекламная площадка. Его нужно проверять на соответствие нашей модели:

```text
provider reports -> conversions/revenue -> attribution -> project analytics
```

Особенно важны project allowlist, masking PII, периодические отчёты,
атрибуция и различие между «нет данных» и числовым нулём.

### 3. `telegram-mcp`

Можно использовать позже для уведомлений: ошибки синхронизации, изменения CPA,
новые предложения площадок, заявки от рекламодателей и networking. Его не нужно
смешивать с `telegram-ads-mcp`: первый отвечает за коммуникации, второй — за
рекламный кабинет.

### 4. SEO/search modules

`keysso-mcp`, `topvisor-mcp` и `arsenkin-mcp` не являются ad-platform adapters,
но могут стать контуром поиска спроса, конкурентов, новых площадок и проверки
лендингов. Их правильнее подключать через отдельную группу `research`, не
помещая их данные напрямую в таблицу рекламных кампаний.

## Что не включаем автоматически

- `passbolt-mcp` не получает доступ к AdsMCP без отдельного security review;
- `codex-mcp` и `grok-build-mcp` не являются частью production advertising runtime;
- исследовательские MCP не получают права менять рекламные кампании;
- новые write-tools не попадают в allowlist до approval, audit и dry-run;
- секреты внешних модулей не сохраняются в SQLite и не передаются через чат.

## Процесс добавления нового кандидата

1. Добавить ссылку и назначение сюда.
2. Указать, к какому контуру относится модуль: `provider`, `analytics`,
   `research`, `communications` или `dev`.
3. Проверить README, license, auth, transport, tools и тесты в отдельной
   игнорируемой папке.
4. Выполнить handshake без реальных write-операций.
5. Сопоставить данные с локальным контрактом и добавить нормализатор только если
   это действительно нужно.
6. Зафиксировать результат в `PROVIDER-MODULES.md` или отдельном ADR.
7. Только после этого добавлять модуль в production `modules/modules.json`.
