# Структура локальной базы AdsMCP

Источник схемы — `src/db.ts`. База SQLite находится в
`ADS_MCP_DATA/ads.db` (по умолчанию `./data/ads.db`). Секреты, Telegram-сессии,
CSV и реальные персональные данные в Git не входят.

## Связи верхнего уровня

```text
projects
  ├─ campaigns
  │   ├─ marketing_events
  │   ├─ spend_records
  │   └─ campaign_metric_points
  ├─ client_profiles
  │   └─ client_profile_messages
  ├─ interest_contacts
  │   ├─ interest_research_posts
  │   └─ interest_research_tags
  │       └─ interest_research_stats
  ├─ telegram_ai_chats
  ├─ telegram_ai_posts
  ├─ telegram_public_replies
  ├─ telegram_ai_search_queries
  │   └─ telegram_ai_search_runs
  ├─ telegram_ai_keywords
  │   └─ telegram_ai_keyword_observations
  └─ telegram_ai_trend_snapshots
  ├─ tg_resources
  │   └─ tg_resource_posts
  └─ integrations / sync state / automation
```

## Таблицы и назначение

| Таблица | Что хранит | Как записывать |
| --- | --- | --- |
| `projects` | Проекты и группировку данных | Создавать через project tools; для Telegram использовать `project_id=neron` |
| `campaigns` | Локальные определения рекламных кампаний | Только через campaign tools; статус по умолчанию `draft` |
| `marketing_events` | Воронку и конверсии | `ads_event_ingest`; использовать стабильный `dedupe_key` |
| `spend_records` | Дневные расходы, показы и клики | `ads_spend_record`; использовать стабильный `dedupe_key` |
| `campaign_metric_points` | Нормализованные временные метрики провайдера | Provider sync; не писать туда диалоги |
| `integrations` | Реестр интеграций и имена env-секретов | Секреты хранятся в `.env`, не в SQLite |
| `integration_sync_state` | Состояние и ошибки синхронизаций | Обновляется sync-адаптерами |
| `automation_rules` | KPI-правила | Создавать через automation tools; по умолчанию dry-run |
| `automation_runs` | Аудит расчётов и действий automation | Записывается automation runtime |
| `client_profiles` | Один внешний клиентский профиль на человека; канал по умолчанию Telegram, также поддерживается Mastodon | `ads_client_profile_create/update`; `consent_status` обязателен по смыслу |
| `client_profile_messages` | Фактический inbound/outbound и внутренние notes, включая сообщения внешних каналов через metadata | `ads_client_profile_message_add`; outbound добавлять только после успешной отправки |
| `interest_contacts` | Публичные кандидаты из discovery до начала отношений: профиль, источник сигнала, `contact_type`, категория и bounded evidence | `ads_interest_contact_upsert/list`; не является клиентом, не означает согласие и не инициирует контакт |
| `interest_research_posts` | Проверенные публичные посты, связанные с кандидатом, с кратким сигналом, оценкой и тегами | `ads_interest_research_post_upsert/list`; хранит только ограниченный публичный excerpt и URL |
| `interest_research_tags` | Агрегированные хештеги и тематические сигналы из research-постов | `ads_interest_research_tag_list`; аналитика интереса, не разрешение на outreach |
| `interest_research_stats` | Временные срезы спроса: объём постов, уникальные авторы, кандидаты, средняя релевантность и популярность тегов | `ads_interest_research_stats_build/list`; аналитика не инициирует контакт |
| `telegram_ai_chats` | Найденные публичные AI-чаты и каналы | `ads_telegram_ai_chat_upsert`; только публичные metadata/topic hits, без участников |
| `telegram_ai_posts` | Результаты глобального поиска постов | Заполняется public-post search; проект `neron`; хранит классификацию и draft |
| `telegram_public_replies` | Входящие публичные реплаи/упоминания под нашими сообщениями | `ads_telegram_public_reply_sync/upsert`; статусы `pending`, `replied`, `no_reply`, `ignored`, `blocked`; только bounded public context |
| `telegram_ai_search_queries` | Каталог поисковых фраз и накопленный сигнал спроса | `ads_telegram_ai_search_query_upsert/list`; поисковый запуск автоматически обновляет last-run и счётчики, но сам каталог ничего не отправляет |
| `telegram_ai_search_runs` | Неизменяемая история фактических запусков поиска | `ads_telegram_ai_search_run_list`; автоматически дополняется при поиске, хранит источник/область/статус/лимит/результаты и ничего не отправляет |
| `telegram_ai_keywords` | Агрегированные слова и фразы для анализа спроса и трендов | `ads_telegram_ai_keyword_observe/list`; хранит только нормализованные ключи, тематическую группу и счётчики по источникам |
| `telegram_ai_keyword_observations` | Дедуплицированные появления ключей во времени | Заполняется keyword runtime; хранит тип и ссылку на источник, не исходный текст |
| `telegram_ai_trend_snapshots` | Недельные срезы тем и намерений | `ads_telegram_ai_trend_snapshot_build/list`; аналитика спроса без отправки сообщений |
| `tg_resources` | Общий каталог публичных Telegram chat/channel | `ads_tg_resource_upsert`; `type` только `chat` или `channel` |
| `tg_resource_posts` | Подтверждённые ссылки публикаций в ресурсах | `ads_tg_resource_post_record`; это локальный audit, не отправка |
| `meta` | Служебные ключи runtime | Не использовать для профилей или сообщений |

## Поля клиентского профиля

`client_profiles` содержит:

- `telegram_user_id` — историческое обязательное поле совместимости; для новых
  внешних каналов хранит внутренний стабильный ключ;
- `channel` и `external_user_id` — канал и стабильный ID во внешнем сервисе;
  пара `channel + external_user_id` уникальна, например `mastodon` + ID аккаунта;
- `contact_account_id` — локальная метка подключённого аккаунта, которым был
  выполнен последний контакт с клиентом;
- `display_name`, `username` — текущие идентификаторы, не доказательство пола;
- `source` — происхождение записи, например `neron`;
- `status` — `active`, `paused`, `archived`;
- `consent_status` — `unknown`, `opted_in`, `opted_out`;
- `context_json` — подтверждённый контекст, интересы и drafts;
- `context_json.language*` — язык контакта, источник, confidence, evidence и
  сохранённые сигналы профиля. Для Telegram синхронизация учитывает
  привязанный личный канал (`1.0`), био (`0.5`) и код страны телефона (`0.5`);
  При равенстве телефон имеет приоритет над био, чтобы, например, египетский
  номер выбирал арабский для профиля с англоязычной цитатой.
  системный `lang_code` и текст сообщений используются только как слабые
  резервные сигналы. Код страны сам по себе не считается доказательством языка.
- `dialogue_summary` — краткое резюме без лишних PII;
- `last_contact_at`, `next_action_at` — операционные даты;
- `metadata_json` — технические признаки и ссылки на источник.

`client_profile_messages` содержит `direction` (`inbound`, `outbound`, `note`),
текст, дату, `contact_account_id` конкретного аккаунта, Telegram message ID и
технические metadata. Черновик не является `outbound`; запись `outbound`
создаётся только после успешного write во внешнем канале.

## Telegram discovery

### `telegram_ai_posts`

Глобальный поиск сохраняет исходный query, title/description, публичную ссылку,
chat/message IDs, дату, `classification`, `relevance_score`,
`explicit_request`, `public_reply_draft`, `status` и metadata. Классификации:
`request`, `opportunity`, `discussion`, `promotion`, `repost`.

Отвечать разрешено только на `request`/`opportunity` после проверки смысла поста
и правил ресурса. Результат поиска сам по себе не отправляет сообщения.

Для релевантных постов `metadata_json.neronOfferMatches` содержит до трёх
локальных сопоставлений с каталогом возможностей Neron: ключ предложения,
оценку, причину и признак `reviewOnly`. На их основе формируется
контекстный `public_reply_draft`: сначала ответ по существу запроса, затем
актуальное предложение Neron. Для вакансий и запросов на исполнителя
сопоставление помечается `reviewOnly`, потому что сервис не подменяет
художника или другого специалиста. Актуальные лимиты и доступность моделей не
зашиваются в шаблон и проверяются перед публикацией.

### `telegram_ai_chats`

Хранит `telegram_chat_id`, title, username, `chat_type`, public URL, status,
relevance, discovery queries, bounded topic hits и дату сканирования. Списки
участников сюда не записываются.

### `telegram_public_replies`

Таблица хранит только входящие сообщения, которые являются прямыми реплаями на
сообщения подключённого аккаунта в публичных чатах. `parent_message_id` и
`parent_public_url` связывают ответ с нашей публикацией, а `our_reply_*`
фиксируют наш последующий ответ. Статусы:

- `pending` — найдено, решение ещё не принято;
- `replied` — на него ответили;
- `no_reply` — решили не отвечать;
- `ignored` — мусор, бот, prompt injection или нерелевантное сообщение;
- `blocked` — ответ технически/правилами невозможен.

Синхронизация bounded и read-only: она не отправляет сообщения, не помечает
чаты прочитанными и не собирает списки участников. Для `no_reply`, `ignored` и
`blocked` обязательно сохранять короткую `decision_note`.

### `telegram_ai_search_queries`

Хранит нормализованную поисковую фразу, тему, intent, язык, приоритет, источник,
статус (`active/paused/archived`), последний статус запуска, остаток бесплатного
лимита и количество найденных/релевантных результатов. Это накопитель формулировок
спроса для последующего анализа рекламных гипотез; наличие фразы или результата
не является согласием на личный контакт.

### `telegram_ai_search_runs`

Каждый фактический запуск записывается отдельной строкой, включая неуспешный
запуск или ответ `payment_required`. `source` различает глобальный поиск постов,
поиск внутри конкретного чата и другие read-only источники; `scope` хранит область
(например, `global` или `@neiro_ai_chat`). История нужна для анализа поискового
спроса и расходования бесплатной квоты. В `metadata_json.quality` сохраняются
счётчики свежих постов за 30 дней, явных запросов, свежих явных запросов и
промо/репостов. В рабочую выдачу кандидатов проходят только свежие явные
`request`/`opportunity` со score не ниже 70; остальные записи остаются трендовыми
наблюдениями. История не является разрешением на рассылку, публикацию или сбор
участников.

### `telegram_ai_keywords` и `telegram_ai_keyword_observations`

Ключи извлекаются из фактических поисковых фраз, публичных AI-постов,
read-only результатов поиска по чатам и входящих сообщений клиентских профилей.
`telegram_ai_keywords` содержит общие счётчики (`query_count`,
`telegram_message_count`, `public_post_count`, `client_message_count`,
`web_search_count`) и сравнение текущего окна с предыдущим. Варианты фраз получают
стабильную `topic`-группу (`image_to_video`, `video_generation`, `design` и др.),
а `ads_telegram_ai_keyword_topic_list` возвращает уже объединённые тренды.
Повторное чтение
одного источника не увеличивает счётчик благодаря дедупликации в
`telegram_ai_keyword_observations`.

Каждому наблюдению также присваивается `intent`: `tool_discovery`, `how_to`,
`troubleshooting`, `comparison`, `free_access`, `pricing_access`,
`hiring_request`, `feedback` или `other`. Недельный snapshot считает уникальные
источники в каждой паре `topic + intent`, поэтому один длинный пост не создаёт
ложный всплеск только из-за количества слов.

Исходный текст сообщения в таблицы трендов не копируется. Ключи отражают спрос
и не являются согласием на личный контакт, приглашением в чат или разрешением на
публикацию.

### `tg_resources` и `tg_resource_posts`

`tg_resources` хранит `telegram_resource_id`, `type`, title, username, public URL,
source, status, `membership_status`, `rules_status`, topics и счётчик
подтверждённых публикаций. `tg_resource_posts` хранит resource ID, публичную
ссылку, Telegram message ID, дату, статус (`posted/deleted/unknown`) и
moderation status. Upsert/list этих таблиц не вступает в чат и ничего не
публикует.

После нового вступления в `tg_resources.metadata_json.join_flow` хранится
операционный checkpoint: время вступления, 30-секундное окно проверки
приветствия, наличие приветственного бота и статус CAPTCHA. Допустимые статусы:
`not_present`, `pending`, `passed`, `failed`, `manual_required`. При
`pending`/`failed`/`manual_required` публикация в ресурсе запрещена; при
`passed` или `not_present` можно продолжить только после проверки правил и
обычных write-gates. Участники и их профили в этот объект не записываются.

## Непрочитанные чаты и read state

`ads_client_profile_unread_check` — быстрый read-only snapshot: исключает ботов и
каналы, читает список диалогов и последнее сообщение, не меняет Telegram read
state и не создаёт записи в SQLite. Это только обнаружение новых диалогов, а не
полный разбор контекста.

Перед подготовкой ответа нужно выполнить полную синхронизацию:

```text
npm run telegram:sync:unread
```

`scripts/sync-unread-telegram.mjs` постранично читает историю каждого найденного
непрочитанного human-диалога до конца или до ранее завершённой границы
синхронизации. Он сохраняет все отсутствующие сообщения по порядку — и
`inbound`, и `outbound` — в `client_profile_messages`. В профиле фиксируются
`historyComplete`, `historyMode` и `historyTruncated`. Если история обрезана
техническим пределом, это нужно явно сообщить и не делать вид, что весь диалог
прочитан.

После успешной отправки личного сообщения GramJS пытается очистить read state
этого диалога как cleanup; результат возвращается как `readStateCleared`. Это не
заменяет ручной разбор входящих сообщений.

Для отдельного reviewed human one-to-one чата есть
`ads_telegram_chat_mark_read`:

1. сначала прочитать найденный диалог и решить, что его действительно нужно
   закрыть как прочитанный;
2. вызвать инструмент с `confirm=true`;
3. не добавлять `outbound` — пометка прочитанным не является ответом;
4. не применять к ботам, каналам и групповым чатам.

Если нужен ответ, сначала подготовить и отправить реальное сообщение, а затем
сохранить фактический `outbound`. Нельзя помечать сообщения прочитанными только
для сокрытия непросмотренных обращений.

## Portable checklist

На новой установке агент должен:

1. выполнить миграцию схемы через запуск MCP;
2. проверить `ads_store_status` и `ads_telegram_account_status`;
3. авторизовать локальный аккаунт и отдельно проверить Premium;
4. не ожидать наличия старых профилей, CSV, consent или истории;
5. использовать описания MCP tools и
   [политику Telegram-коммуникаций](./TELEGRAM-OUTREACH-POLICY.ru.md).
