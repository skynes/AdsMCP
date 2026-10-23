# Интеграции AdsMCP

[← README](../README.ru.md) · [Вся документация](./README.ru.md)

Начните с одной-двух площадок под свою задачу. Выбрать их поможет
[руководство по аудитории и каналам](./PLATFORM-GUIDE.md), а настроить внешний
MCP-модуль — [руководство пользователя](./USAGE.ru.md#внешние-mcp-модули).

## Статусы провайдеров

Сводка описывает готовность интеграций в репозитории. Для работы на вашей машине
могут потребоваться рекламный кабинет, авторизация OAuth, токены и установка
внешнего модуля.

Последняя проверка: **2026-10-23**.

| Провайдер | Статус | Текущий путь интеграции | Запись |
| --- | --- | --- | --- |
| Google Ads | ✅ Интегрирован · guarded Agent layer | Официальный Google Ads MCP, `google-ads-api-agent` через локальный stdio-адаптер и fallback-нормализатор | Read-only по умолчанию; write actions требуют явного подтверждения пользователя |
| Yandex Direct | ✅ Интегрирован · guarded Direct writes | ZAI.ONE `yandex-mcp` по stdio; для live-импорта нужен token | Изменения требуют `confirm=true` и idempotency key; отдельный create-tool создаёт только кампанию с выключенными показами; удаление закрыто |
| Telegram Ads | ✅ Интегрирован · официальный API + session fallback | Official `promoteapi.telegram.org` для отчётов, guarded writes и ZAI.ONE HTTP-session для сверки | API read/report/sync + guarded create/budget/review/pause writes с `confirm=true`; session writes закрыты |
| Telegram user account / GramJS (TDLib optional) | ✅ Guarded local account layer | GramJS по умолчанию; credentials в `.env`, состояние в игнорируемом `ADS_MCP_DATA/telegram/` | Premium-gated discovery, guarded personal/public replies, consent/activity/rate-limit gates |
| Mastodon / fediverse account | ✅ Guarded local account layer | OAuth 2 + PKCE для выбранного инстанса; локальное состояние в `ADS_MCP_DATA/mastodon-accounts.json` | Mention reads, единичные ответы и профиль после `confirm=true` |
| Microsoft Advertising / Bing | ✅ Интегрирован | Официальный remote MCP и локальный normalization adapter | Только чтение |
| Avito Ads | ✅ Интегрирован · read-only | `A1-x-tech/mcp-avito-ads` v1.1.0 через локальный stdio; официальный Avito Ads API | Только чтение; writes, money transfer и raw API закрыты allowlist |
| VK Ads через Click.ru | ✅ Интегрирован · нужен ручной шаг | Click.ru broker работает read-only; привязка VK требует ручного шага | Только чтение |
| Apple Search Ads | ✅ Интегрирован · read-only | Локальный MCP для Apple Ads Platform API v1; 57 read tools, writes выключены | Только чтение |
| TikTok Ads | ✅ Интегрирован · read-only | Есть MCP manifest и OAuth-путь настройки | Только чтение |
| Reddit Ads | ✅ Интегрирован · read-only | `camlowe/mcp-server-reddit-ads` v0.5.5 через локальный stdio; официальный Reddit Ads API v3 | Только чтение; write tier и provider write-tools закрыты |
| Meta Ads | ✅ Интегрирован · read-only | Локальный MCP напрямую подключает Meta Graph/Marketing API; 41 read tool, writes выключены | Только чтение |
| Email / SMTP + IMAP | ✅ Интегрирован · чтение и запись | `@codefuturist/email-mcp@0.6.0` через stdio; IMAP для чтения и SMTP для отправки | Чтение + отправка/ответ/пересылка/черновики; destructive и bulk tools закрыты |
| OpenAI Ads / ChatGPT | ✅ Интегрирован · read-only | Локальный MCP bridge поверх официального OpenAI Ads Advertiser API; кабинет, кампании, объявления, insights, audiences и audit logs | Только чтение; writes, uploads, billing и payment закрыты |
| X Ads | ✅ Интегрирован · read-only | Локальный read-only MCP поверх официального X Ads API; официальный remote MCP требует OAuth2/PKCE, которого пока нет в текущем bridge | Только чтение |
| Spotify Ads | ✅ Интегрирован · read-only | Локальный Adport MCP напрямую подключает официальный Spotify Ads API; writes остаются за allowlist | Только чтение |
| CRM / Webhook | ✅ Источник конверсий | Локальный ingest конверсий и generic server-side events | Только ingest |

## Теги capability и связь с матрицей оценки

Теги разделены на два слоя. **Runtime tag** показывает, что реально открыто в
AdsMCP сейчас, включая локальный `allow_tools`. **Matrix tag** показывает
потенциал лучшего проверенного API/MCP-кандидата из исследовательской матрицы.
Поэтому, например, TikTok имеет `read` в runtime, но `read + write +
campaign_create` в matrix: выбранный локальный модуль намеренно работает
read-only.

Под `campaign_create` понимается создание рекламной кампании. Создание самого
рекламного кабинета вынесено в отдельный `account_create`; `payment` означает
платёжный capability матрицы, а не просто чтение баланса или изменение
бюджета. Для Telegram оплата отмечена как partial: TON/KYC требуют внешнего
шага и не считаются полностью автоматизированными в AdsMCP.

| Провайдер | Runtime tag | Matrix tag | A/B/C/D/Σ | Почему отличается |
| --- | --- | --- | ---: | --- |
| Google Ads | `read + write` | `read + write + campaign_create` | `0/28/5/18/56` | Agent writes guarded; создание кампании не входит в открытый local surface |
| Yandex Direct | `read + write + campaign_create` | `read + write + campaign_create` | `0/30/5/17/57` | Есть отдельный create-tool с показами off |
| Telegram Ads | `read + write + campaign_create` | `read + write + campaign_create + account_create + payment` | `5/22/12/13/52` | Создание и budget writes guarded; payment в матрице только partial |
| VK Ads через Click.ru | `read` | `read + write + campaign_create` | `0/24/5/14/48` | Выбранный broker read-only; score относится к прямому MCP-кандидату |
| Avito Ads | `read` | `read + write + campaign_create` | `0/22/5/14/41` | Create, bid, budget и money-transfer tools закрыты allowlist |
| Microsoft Advertising / Bing | `read` | `read` | `0/0/5/15/25` | Official pilot подключён как read-only |
| Meta Ads | `read` | `read + write + campaign_create` | `0/28/5/15/52` | Graph runtime ещё не включён; модульный путь read-only |
| X Ads | `read` | `read + write + campaign_create` | `0/20/5/14/39` | Локальный модуль пишет только после отдельного write-решения |
| Spotify Ads | `read` | `read` | `—` | Проверенного campaign-write API в текущей матрице нет |
| Apple Search Ads | `read` | `read + write + campaign_create` | `0/24/5/14/48` | Provider candidates имеют preview/approve writes, наш allowlist read-only |
| TikTok Ads | `read` | `read + write + campaign_create` | `0/30/5/15/55` | Пакет запускается с `TIKTOK_ENABLE_WRITES=0`, writes не allowlisted |
| Reddit Ads | `read` | `read + write + campaign_create` | `0/22/5/16/48` | Community CRUD-кандидаты не открыты в выбранном модуле |
| Email / SMTP + IMAP | `read + write` | `read + write` | `—` | SMTP отправка и IMAP чтение нужны по задаче; удаление, bulk и mailbox management не открыты |
| OpenAI Ads / ChatGPT | `read` | `read + write + campaign_create` | `—` | Официальный Advertiser API имеет mutation endpoints; выбранный bridge оставляет только GET/read |

Уровень `read + write + campaign_create + payment` сейчас не является
полностью подтверждённым runtime-уровнем ни для одной подключённой сети.
Telegram — ближайший кандидат по матрице, но его payment capability остаётся
частичным. Исходные баллы A/B/C/D сохранены в
[research/research-matrix.md](../research/research-matrix.md).

Причины выбора модулей и альтернативы описаны в [обзоре провайдеров](./PROVIDER-MODULES.md),
а ограничения VK через брокера — в [статусе Click.ru](./CLICK-RU-STATUS.md).

## Telegram Ads

Для резервного подключения через браузерную сессию внешнего модуля выполните:

```powershell
npm run telegram:login
```

Пользователь вводит логин и 2FA в локальном окне браузера. Значения сессии
записываются в `ADS_MCP_DATA/secrets/telegram-ads-session.env`, не выводятся в
терминал и не сохраняются в SQLite. После истечения сессии команду нужно
выполнить снова.

Старые записи `ADS_TELEGRAM_STEL_*` в корневом `.env` скрипт запуска игнорирует; после
успешного повторного входа их можно удалить локально.

Для официального API создайте токен в настройках Telegram Ads и добавьте его в
игнорируемый `.env` как `ADS_TELEGRAM_ADS_API_TOKEN`. Проверка выполняется через
`ads_telegram_ads_api_status` с `probe=true`, отчёт — через
`ads_telegram_ads_api_report`, синхронизация — через
`ads_telegram_ads_api_sync`. Официальный слой читает точные периоды через
`getAdStats`. Отдельные инструменты поддерживают создание объявления, увеличение
бюджета, отправку на модерацию и паузу/возобновление; каждый требует `confirm=true`.
Новое объявление по умолчанию создаётся на паузе с нулевым начальным бюджетом.
Изменения через резервную браузерную сессию закрыты.

## Яндекс Директ через локальную панель

Для подключения Яндекс Директа вызовите `ads_dashbord_start` и откройте локальную
страницу. В разделе интеграций можно сохранить OAuth Client ID, открыть ссылку
авторизации Яндекса, вставить выданный токен и проверить доступ к кабинету.
Токен записывается только в `ADS_MCP_DATA/secrets/yandex-direct.token`, а путь и
Client-Login сохраняются в локальной конфигурации; токен не попадает в чат или
SQLite. Локальная панель отвечает за подключение, а изменения отправляются через
MCP-инструмент `ads_yandex_direct_write` с явным подтверждением.

## Аккаунт Telegram

Личный аккаунт Telegram подключается через GramJS; TDLib доступен как
дополнительный вариант. Это отдельная интеграция для поиска контекста в чатах
и общения с потенциальными клиентами.

Вызовите `ads_dashbord_start`, откройте локальную страницу и используйте панель
Telegram account для входа по QR-коду или телефону, коду и 2FA. После подключения
показываются имя, username и Telegram ID без номера телефона.

Поиск и действия записи учитывают наличие Premium, согласие, активность
и лимиты частоты; отправка требует явного подтверждения.
См. [инструкцию по аккаунту Telegram](./TELEGRAM-ACCOUNT.md)
и [правила общения](./TELEGRAM-OUTREACH-POLICY.ru.md). Структура SQLite и
правила записи описаны в [карте базы](./DATA-MODEL.ru.md).

## Discord

Официальный bot-коннектор работает на серверах, куда установлен бот, и в каналах,
доступных ему по разрешениям. Он поддерживает список каналов, поиск сообщений
и участников, а также единичную публикацию после явного подтверждения.
Обычные пользовательские аккаунты и массовые личные сообщения не автоматизируются.
Настройка и ограничения — в [инструкции Discord](./DISCORD-CONNECTOR.ru.md).

## Mastodon

Аккаунт подключается к выбранному серверу через OAuth 2 + PKCE. Коннектор
поддерживает чтение упоминаний, ответы на статусы и изменение профиля;
действия записи требуют `confirm=true`.
Настройка и поддерживаемые сценарии — в [инструкции Mastodon](./MASTODON-CONNECTOR.ru.md).

## Email / SMTP + IMAP

Для проверки входящих писем нужен IMAP, а для отправки — SMTP. Подключён
`@codefuturist/email-mcp@0.6.0`; выбранный allowlist разрешает чтение и поиск
писем, работу с вложениями, `send_email`, `reply_email`, `forward_email` и
`save_draft`. Удаление, массовые операции, переносы, labels, планировщик,
уведомления и календарь не подключены.

Минимальная настройка в игнорируемом `.env`:

```dotenv
MCP_EMAIL_ADDRESS=you@example.com
MCP_EMAIL_PASSWORD=app-password
MCP_EMAIL_IMAP_HOST=imap.example.com
MCP_EMAIL_SMTP_HOST=smtp.example.com
```

Порты и TLS по умолчанию: IMAP `993`, SMTP `465`; для SMTP STARTTLS можно
включить `MCP_EMAIL_SMTP_STARTTLS=true` и отключить `MCP_EMAIL_SMTP_TLS`.
Текущий пакет требует Node.js 24 или новее; `MCP_EMAIL_READ_ONLY=true`
дополнительно отключает его почтовые write-tools.
Для нескольких аккаунтов используется `EMAIL_ACCOUNTS` по формату выбранного
пакета. Полное решение, альтернативы и ограничения — в
[ADR 0016](./decisions/0016-email-smtp-imap-mcp.md).
