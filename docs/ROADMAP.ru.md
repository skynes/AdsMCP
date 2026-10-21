# 🎯AdsMCP Roadmap

Дорожная карта превращения AdsMCP в безопасный агентский слой для автоматизации
рекламы.

[English](./ROADMAP.md) · [中文版](./ROADMAP.zh.md)

Последняя проверка: **2026-10-10**.

## Продуктовое направление

Долгосрочный продукт — клиентский **Agency Proxy MCP**. AI-агент должен получить
URL сайта, данные бизнеса и бюджет, а затем провести клиента через проверку,
создание кабинета, billing, подготовку кампании, модерацию, запуск, отчётность и
оптимизацию через один контролируемый интерфейс.

```text
URL + brief бизнеса + бюджет
        -> KYC / проверка компании
        -> рекламный кабинет или организация
        -> compliance и billing
        -> draft кампании и pre-moderation
        -> явное подтверждение и запуск
        -> метрики, CRM и выручка
        -> контролируемая оптимизация
```

Happy path должен быть в высокой степени автоматизирован, но платежи,
идентификация, регулируемые отрасли, проверки площадок и другие рискованные шаги
должны поддерживать явное подтверждение и human review queue.

### Трек: Relationship-first Agentic Lead Engagement

Параллельно с рекламными операциями AdsMCP будет развивать направление
**Relationship-first Agentic Lead Engagement**, доступное как
**Conversational Lead Proxy**. Это агент, который работает с источником или базой
лидов, исследует каждый контакт, хранит индивидуальное состояние диалога и
понимает, когда нужно подключить человека или коммерческий workflow.

```text
lead discovery -> research -> relationship building -> context memory
               -> intent detection -> human handoff / commercial action
```

Цикл discovery должен начинаться с темы и намерения:

```text
тема продукта или проблемы
        -> разрешённые тематические группы, чаты и публичные обсуждения
        -> явный запрос или поиск продукта/команды
        -> сохранение исходного контекста и источника
        -> релевантный контакт с учётом разрешения
        -> построение отношений и определение намерения
```

Само членство в группе или наличие контакта не являются основанием для outreach.
Первое сообщение должно опираться на собственный вопрос или выраженный интерес
человека и учитывать правила канала, согласие и возможность отписки.

Политика по умолчанию — не начинать с продажного pitch. Агент сначала формирует
контекст и ведёт естественный диалог, а коммерческое действие выполняет только
после явного сигнала, разрешения или настроенного бизнес-правила. Согласие,
отписка, правила канала, rate limits, правдивая персонализация и human escalation
входят в safety contract.

### Возможный фундамент: workspace общения с клиентами на базе Chatwoot

Онлайн-поверхность для общения стоит сначала строить на self-hosted
**Chatwoot Community Edition**, а не создавать новый inbox внутри AdsMCP.
Chatwoot может дать операторский inbox, контакты, conversations, подключения
каналов и базовый интерфейс human handoff. AdsMCP при этом остаётся агентским и
policy-слоем: discovery лидов, research, context memory, intent detection,
consent, drafts ответов и safety gates коммерческих действий.

Планируемая граница интеграции:

```text
событие из inbox / канала Chatwoot
        -> identity лида и context memory AdsMCP
        -> research, intent и состояние отношений
        -> предложение агента или draft ответа
        -> human approval / handoff / guarded action
        -> conversation в Chatwoot
```

Требования к интеграции:

- связывать Chatwoot contacts и conversations со стабильными lead и relationship
  records AdsMCP;
- принимать входящие события через API/webhooks Chatwoot и отправлять одобренные
  ответы через выбранный inbox;
- хранить consent, opt-out, rate limits, audit history и channel policy в
  AdsMCP, а не только в состоянии UI;
- поддерживать drafts агента и human takeover до любого автономного
  коммерческого действия;
- держать Chatwoot adapter заменяемым, чтобы AdsMCP не зависел от одного UI или
  одной модели данных.

На первом этапе нужно оценивать именно upstream Community Edition. В репозитории
она указана как MIT-licensed; enterprise-функции лицензируются отдельно, поэтому
перед распространением изменённой сборки необходимо проверять edition и версию.

## Принципы roadmap

- Важнее milestones по возможностям, а не календарные даты.
- Сначала read и preview; write-операции требуют валидации, подтверждения и audit trail.
- API-реализации провайдеров по возможности остаются во внешних модулях.
- AdsMCP владеет нормализацией, локальной памятью, атрибуцией, orchestration и
  safety gates.
- Наличие модуля в каталоге не означает production-ready интеграцию.
- Каждый sync- и write-путь должен быть retry-safe и наблюдаемым.
- `ADS_MCP_DATA` — единый локальный корень данных; состояние провайдера хранится
  в именованных подпапках, а не в параллельных местах.

## Milestones

| Этап | Статус | Объём | Критерий выхода |
| --- | --- | --- | --- |
| **M0 — Локальный фундамент** | ✅ Сейчас | stdio MCP, SQLite, проекты, кампании, события, расходы, аналитика, атрибуция | Core tools собираются и работают локально; данные остаются локальными, секреты не попадают в SQLite |
| **M1 — Контур чтения провайдеров** | ✅ Сейчас / hardening | Google Ads, Yandex Direct, Telegram Ads, Microsoft Advertising, provider bridge и нормализованный sync | Отчёты и импорт повторяемы, дедуплицированы, ограничены allowlist и наблюдаемы |
| **M2 — Создание кампаний** | 🔜 Следующий | Draft/preview, provider validation, явное подтверждение, создание и audit для Google Ads, Yandex Direct и Telegram Ads | Кампания создаётся из проверенного draft; write остаётся gated и обратимым, если это позволяет провайдер |
| **M3 — Agent onboarding** | 📋 Планируется | URL, brief, research целевой аудитории и мест её обитания, карта источников intent, ИНН/KYC, onboarding state, policy checks и human review queue | Агент сначала понимает аудиторию и среду, где она общается, затем собирает и проверяет минимальный контекст запуска без доступа клиента к UI провайдера |
| **M3.5 — Agentic Lead Engagement** | 📋 Планируется | Topic-first discovery в разрешённых группах/чатах, фиксация выраженного интереса, дедупликация, research, состояние отношений, память диалога, intent detection и human handoff | Агент находит людей с уже сформулированным релевантным вопросом, сохраняет его контекст и ведёт трассируемый диалог без массовых продаж по умолчанию |
| **M3.6 — Синхронизация каталога Telegram-ресурсов** | 📋 Планируется | Центральный API для поиска публичных чатов и каналов, идемпотентная синхронизация с локальным `tg_resources`, публикация собственных ресурсов, группировка по проектам, provenance, дедупликация, policy/moderation и audit; оценка интеграции с `dstore.one` и `userflow_bot` как совместным внешним workflow | Локальный каталог безопасно обновляется из центрального API, подходящие ресурсы можно находить и публиковать свои после проверки; интеграция с `dstore.one`/`userflow_bot` подтверждена или отклонена по результатам проверки API, авторизации, модели данных и правил публикации; конфликты и write-действия трассируются и проходят предусмотренные подтверждения |
| **M3.75 — Workspace общения с клиентами** | 📋 Планируется | Self-hosted Chatwoot Community Edition как inbox оператора/клиента, bridge контактов и conversations, webhooks, drafts агента, sync контекста и human takeover | Оператор работает в общем inbox, а AdsMCP сохраняет единую identity лида, relationship context, consent, intent, audit trail и action gates |
| **M4 — Операции Agency Proxy** | 📋 Планируется | Создание организации/кабинета, compliance, billing, пополнение, модерация, запуск и статус для клиента | Контролируемый agency-account flow переводит одобренного клиента от onboarding к live-кампании |
| **M5 — Optimization loop** | 🌐 Дальняя цель | CRM/webhooks, выручка, multi-touch attribution, рекомендации, бюджетные ограничения и guarded execution | Агент измеряет бизнес-результат и предлагает или применяет ограниченные оптимизации с audit trail |

## Порядок развития провайдеров

Следующий write-милestone намеренно ограничен тремя провайдерами. Текущие
read-only пути остаются safety baseline, пока строятся workflow создания.

| Провайдер | Текущее состояние | Следующая возможность |
| --- | --- | --- |
| Google Ads | Официальный MCP и локальный путь нормализации | Создание проверенного campaign draft и отправка только после явного подтверждения |
| Yandex Direct | ZAI.ONE-модуль и нормализованная статистика | Создание и валидация кампаний через guarded workflow |
| Telegram Ads | ZAI.ONE HTTP-session и sync кабинетов/статистики | Создание или обновление после session, policy, budget и confirmation gates |
| Microsoft Advertising | Официальный read-only MCP и aggregate sync | Оценить write после первых трёх провайдеров и OAuth security review |
| VK Ads через Click.ru | Read-only broker; ручная привязка VK ещё блокирует | Закрыть account onboarding blocker до рассмотрения write |
| Apple, TikTok, Reddit | Module-ready read paths | Добавить нормализованный sync и создание после проверки стабильности модулей |
| Meta Ads | Планируемый adapter path | Определить безопасный Graph API/MCP runtime и модель onboarding кабинета |
| OpenAI Ads / ChatGPT | Планируемый кандидат | Проверить продуктовую поверхность, модель кабинета, API, targeting и policy boundary до проектирования адаптера |
| Spotify Ads | Планируемый кандидат | Проверить региональную доступность, campaign API, audio/video creative workflow и reporting model |
| X Ads | Планируемый кандидат | Проверить текущий Ads API, eligibility кабинета, targeting и права guarded campaign management |

## M2: единый safety contract для создания кампаний

Каждый write-workflow провайдера должен следовать общему контракту:

1. Прочитать возможности кабинета и обязательные поля.
2. Создать локальный draft без отправки провайдеру.
3. Проверить бюджет, даты, targeting, creative, tracking и policy constraints.
4. Показать preview и потребовать явное подтверждение.
5. Создать минимальный безопасный набор объектов провайдера.
6. Дождаться статуса модерации или провайдера, не предполагая успех заранее.
7. Сохранить локально summary запроса/ответа, external IDs и audit events.
8. Показать pause/rollback или manual review, если провайдер это поддерживает.

Ни один provider write tool не добавляется в default allowlist без этого
контракта, проверки границ credentials и offline smoke-теста.

## M3–M4: Agency Proxy flow

Клиентский flow из research-документов:

```text
submit landing URL
  -> понять бизнес и аудиторию
  -> собрать ИНН и данные компании
  -> проверить организацию и представителя
  -> создать или выбрать рекламную организацию
  -> задать бюджет и статус оплаты
  -> подготовить compliance и pre-moderation
  -> сгенерировать campaign draft
  -> подтвердить и запустить
  -> следить за метриками, CRM и выручкой
```

Клиент не должен управлять platform OAuth, agency tokens или UI провайдера.
Ограничения платформы, недостающие документы, регулируемые категории и ошибки
модерации уходят в явную review queue, а не скрываются от агента и не
перезапускаются бесконечно.

## Не входит в следующий milestone

- Неограниченное автономное расходование бюджета.
- Хранение credentials или raw cookies в SQLite.
- Одновременное включение write-tools всех провайдеров.
- Признание catalog entry или reference implementation production adapter'ом.
- Сокрытие от пользователя решений по оплате, KYC, проверке площадки или регулированию.

## Исходные документы

- [Архитектура Agency Proxy](../research/agency-proxy-100-architecture.md)
- [Blueprint Auto Advancement](../research/auto-advancement-system/README.ru.md)
- [Идеальный end-to-end pipeline](../research/auto-advancement-system/docs/IDEAL-PIPELINE.md)
- [Выбор провайдеров и решения](./PROVIDER-MODULES.md)
- [Текущая архитектура](./ARCHITECTURE.md)
- [Репозиторий Chatwoot Community Edition](https://github.com/chatwoot/chatwoot)
- [Документация Chatwoot для разработчиков](https://developers.chatwoot.com/)
