# Схема Agency Proxy 100/100 — MCP onboarding + auto launch

> Дата: 3 октября 2026  
> Цель: клиент даёт **URL + ИНН + бюджет** через MCP/чат → система **верифицирует, создаёт кабинет, маркирует, пополняет, запускает** без доступа клиента к Директу  
> Связано: [full-cycle-agencies.md](./full-cycle-agencies.md) · [cis-platforms-mcp.md](./cis-platforms-mcp.md)

---

## TL;DR

```
Клиент (ChatGPT/Cursor/Widget)
        │
        ▼  MCP tools: submit_inn, submit_brief, pay, status
┌─────────────────── Agency Proxy MCP ───────────────────┐
│  KYC Engine (DaData) → Org Factory (Yandex API)        │
│  → ORD Pipeline → Billing → Campaign Agent → Launch    │
└────────────────────────┬───────────────────────────────┘
                         ▼
              Per-client Yandex org (ИНН клиента)
              Agency MCC / Click.ru / eLama backend
```

**Реалистичный Σ после схемы:** A=23 · B=33 · C=18 · D=19 → **93/100**  
**100/100** — только если считать «human review queue» частью продукта, а не провалом (см. §8).

---

## 1. Два слоя MCP (важно не путать)

| Слой | Кто | Пример |
|------|-----|--------|
| **Platform MCP** | Инструменты к **чужому** кабинету | askads/mcp-yandex-direct, LidFly |
| **Agency Proxy MCP** | **Ваш** продуктовый MCP — клиент onboarding + заказ рекламы | **вы строите** |

Клиент подключает **ваш** MCP (`mcp.yourcompany.ru`), не Yandex MCP.  
Внутри ваш backend держит agency token и создаёт org на каждого клиента.

---

## 2. Клиентский journey (что видит пользователь)

```
1. «Запусти рекламу для https://example.ru»
2. MCP: «Пришлите ИНН организации-рекламодателя (10 или 12 цифр)»
3. Клиент: 1234567890
4. MCP: «ООО Ромашка, ИНН 1234567890, ОКВЭД 47.91 — верно? Бюджет на месяц?»
5. Клиент: Да, 50 000 ₽
6. MCP: «Счёт №123 на 50 000 ₽ (+4% комиссия). Оплатите или дайте ссылку на оплату картой»
7. [webhook: оплата получена]
8. MCP: «Кампания на модерации. ClientID: xxx. Ожидайте ~24ч»
9. MCP: «Запущено. 12 объявлений, 847 ключей. Отчёт: …»
```

Клиент **никогда** не видит Директ, OAuth Яндекса, ОРД.

---

## 3. Архитектура (компоненты)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT-FACING LAYER                           │
│  MCP Server (Streamable HTTP)  │  Web Widget  │  Telegram bot   │
│  Tools: см. §4                 │              │                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    ORCHESTRATOR (state machine)                  │
│  onboarding → kyc → org_create → ord → billing → launch → run   │
│  PostgreSQL: clients, orgs, campaigns, audit_log                │
└─┬──────────┬───────────┬──────────┬──────────┬──────────────────┘
  │          │           │          │          │
  ▼          ▼           ▼          ▼          ▼
┌────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌─────────────────────┐
│KYC │  │Org     │  │ORD     │  │Billing │  │Campaign Agent       │
│    │  │Factory │  │Service │  │        │  │(fork yandex-mcp +   │
│DaDa│  │Yandex  │  │Yandex  │  │YooKassa│  │ Rivox rules)        │
│ta  │  │Agency  │  │ADO /   │  │Tinkoff │  │                     │
│    │  │API     │  │Click   │  │invoice │  │ Direct API v5       │
└────┘  └────────┘  └────────┘  └────────┘  └─────────────────────┘
```

---

## 4. MCP Tools (клиентский контракт)

### 4.1 Onboarding / KYC

| Tool | R/W | Описание |
|------|-----|----------|
| `submit_landing_url` | W | URL сайта → crawl, понимание бизнеса, pre-audit |
| `submit_inn` | W | ИНН 10/12 цифр → запуск KYC pipeline |
| `get_inn_suggestions` | R | Autocomplete по названию (proxy DaData suggest) |
| `confirm_advertiser` | W | Клиент подтверждает карточку юрлица |
| `submit_okved` | W | Если несколько ОКВЭД — выбор одного (требование Яндекса) |
| `get_onboarding_status` | R | kyc \| pending_payment \| org_creating \| ord \| launching \| live |

### 4.2 Billing

| Tool | R/W | Описание |
|------|-----|----------|
| `set_monthly_budget` | W | Лимит spend + daily cap |
| `create_payment` | W | Счёт / payment link (YooKassa, Tinkoff Acquiring) |
| `get_balance` | R | Остаток на org клиента |
| `pause_all_campaigns` | W | Стоп-кнопка (confirm=true) |

### 4.3 Campaign (после onboarding)

| Tool | R/W | Описание |
|------|-----|----------|
| `launch_campaign` | W | URL уже есть → semantic + ads + submit moderation |
| `get_campaign_stats` | R | Метрики, заявки, расход |
| `get_audit_report` | R | 102 правила Rivox-style |

**Write tools** с `confirm=true` для финансовых и launch операций (как Free-cat Telegram MCP).

---

## 5. KYC Pipeline — автоматическая верификация ИНН

### Step 1: Validate format
```
INN 10 digits → LEGAL or INDIVIDUAL (ИП)
INN 12 digits → INDIVIDUAL only
```

### Step 2: DaData `findById/party`
```http
POST https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party
Authorization: Token ${DADATA_TOKEN}

{"query": "1234567890", "type": "LEGAL"}
```

### Step 3: Auto-decision rules (без human)

| Check | Source | Pass | Fail → |
|-------|--------|------|--------|
| Статус ACTIVE | DaData `state.status` | ✅ continue | ❌ reject + reason |
| Не банкрот | DaData + bankrupt registry | ✅ | ❌ reject |
| ИНН не в стоп-листе | internal + ФНС mass address flag | ✅ | ⚠️ manual queue |
| OKVED not blocked | your denylist (med, crypto, etc.) | ✅ | ⚠️ manual queue |
| Director not disqualified | DaData | ✅ | ❌ reject |
| Duplicate INN | your DB | new client | link existing org |

### Step 4: Enrich card for client confirm
```json
{
  "inn": "1234567890",
  "name": "ООО «Ромашка»",
  "ogrn": "1234567890123",
  "kpp": "123456789",
  "okved": "47.91",
  "address": "г. Москва, …",
  "director": "Иванов И.И.",
  "status": "ACTIVE",
  "kyc_tier": "auto_approved"
}
```

**MCP tool `confirm_advertiser`** — клиент пишет «да» → фиксируется consent + audit log.

### Step 5: Optional stronger KYC (для 100/100 marketing)

| Tier | Что | Auto? |
|------|-----|-------|
| **T0** | ИНН + DaData ACTIVE | ✅ 100% auto |
| **T1** | + SMS на телефон директора из ЕГРЮЛ | ✅ auto (SMS API) |
| **T2** | + микроплатёж 1₽ на р/с для verify ownership | ⚠️ 1–2 days |
| **T3** | High-risk OKVED | human queue |

Для **95%+ клиентов** достаточно **T0–T1** без human.

---

## 6. Org Factory — создание кабинета на ИНН клиента

### Вариант A: Yandex Direct Agency API (лучший long-term)

**Метод:** `AgencyClients.addPassportOrganization`  
**Docs:** https://yandex.ru/dev/direct/doc/en/agencyclients/addPassportOrganization

```json
{
  "method": "addPassportOrganization",
  "params": {
    "Name": "ООО Ромашка",
    "Currency": "RUB",
    "TinInfo": {
      "TinType": "LEGAL",
      "Tin": "1234567890"
    },
    "Grants": [{"Privilege": "EDIT_CAMPAIGNS", "Value": "YES"}],
    "Notification": {
      "Lang": "RU",
      "Email": "client@example.ru",
      "EmailSubscriptions": [...]
    }
  }
}
```

**Response:** `Login`, `ClientId` — сохраняете в DB, привязываете к `inn`.

**Важно:** доступ к bulk registration — **по заявке** в Яндекс (нужен agency status + обоснование). До одобрения — вариант B.

### Вариант B: Click.ru / eLama API (MVP bootstrap)

- Создание client cabinet через partner API / UI automation
- Click.ru уже даёт MCP + agency infra
- Вы — субагент, org создаётся на **ИНН клиента** через их кабинет
- Минус: зависимость от партнёра; плюс: запуск за недели, не месяцы

### Правило Яндекса (соблюдать обязательно)

> *«Запрещено размещение рекламы разных клиентов под одним login / Yandex ID organization»*

→ **1 org = 1 клиент = 1 ИНН**. Never shared account.

---

## 7. ORD / маркировка — автоматически

После `ClientId` создан:

```
1. AgencyClients.update → Advertiser data:
   - end advertiser: INN, OKVED, legal name (from DaData)
   - agency counterparty: ваше ООО
   - contract: auto-generated from template (номер, дата = today)

2. Yandex ADO API / кабинет ОРД:
   - создать advertiser card (если ещё нет)
   - создать contract agency ↔ client
   - после показов → акт разаллокации (можно batch nightly)

3. ERID/token — Яндекс генерирует при модерации объявлений
```

**Automatable:** 90% полей из DaData + шаблон договора оферты.  
**Human queue:** спорные OKVED, foreign legal entity.

---

## 8. Billing — закрываем C=18–20

```
Client pays YOU (not Yandex directly)
        │
        ▼
YooKassa / Tinkoff / счёт юрлицу
        │
        ▼ webhook payment.succeeded
        │
        ▼
AgencyClients / Finance API → transfer to client org balance
        │
        ▼
Auto-replenish rules (min balance threshold)
```

| Event | Auto action |
|-------|-------------|
| Payment received | Credit client wallet in DB + top-up Direct org |
| Balance < 10% budget | MCP push / Telegram alert + optional auto-invoice |
| Budget cap hit | Pause campaigns via API |
| Chargeback | Freeze org + notify |

**C=18** (не 20): chargeback и ручной возврат — edge case.

---

## 9. Launch Pipeline — закрываем B=33

После `org.status = ready && balance > 0`:

```
submit_landing_url (cached)
        │
        ▼
┌─ Campaign Agent ─────────────────────────────────────┐
│ 1. Crawl site → offer, geo, USP                       │
│ 2. Wordstat API → semantic clusters                   │
│ 3. Generate ad groups + text ads (LLM)                │
│ 4. Metrika: check/create counter + goals              │
│ 5. Direct API: Campaigns.add → AdGroups → Ads.add     │
│ 6. Moderation poll (every 15min until ACCEPTED)       │
│ 7. Campaigns.resume → LIVE                            │
└──────────────────────────────────────────────────────┘
        │
        ▼
Weekly optimizer (cron / agent): bids, negatives, pauses
```

**Fork:** SvechaPVL/yandex-mcp (132 tools) + Rivox audit rules (102) + ваш orchestrator.

**B=33** (не 35): модерация reject → auto-fix loop max 3 attempts → else human queue.

---

## 10. State machine (Orchestrator)

```
                    submit_inn
                        │
                        ▼
                 ┌──────────────┐
                 │ KYC_PENDING  │
                 └──────┬───────┘
                        │ DaData OK
                        ▼
                 ┌──────────────┐
                 │ KYC_APPROVED │◄── confirm_advertiser
                 └──────┬───────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
   ORG_CREATING   PAYMENT_PENDING  (parallel OK)
          │             │
          └──────┬──────┘
                 ▼
          ┌──────────────┐
          │ ORD_SETUP    │
          └──────┬───────┘
                 ▼
          ┌──────────────┐
          │ LAUNCHING    │ → crawl, semantic, ads, moderate
          └──────┬───────┘
                 ▼
          ┌──────────────┐
          │ LIVE         │ → optimizer loop
          └──────┬───────┘
                 │
     ┌───────────┼───────────┐
     ▼           ▼           ▼
  PAUSED    MANUAL_REVIEW  CHURNED
```

Каждый переход → MCP tool `get_onboarding_status` + webhook optional.

---

## 11. Scoring: как получить 93 и что нужно для «100»

| Критерий | Балл | Как достичь |
|----------|------|-------------|
| **A. Регистрация** | **23/25** | MCP `submit_inn` + DaData + `addPassportOrganization` — клиент не трогает Директ. −2: нужен email клиента для уведомлений Яндекса |
| **B. Запуск** | **33/35** | Full API launch + auto moderation retry. −2: reject на high-risk niches |
| **C. Оплата** | **18/20** | Invoice/card → auto top-up. −2: chargeback manual |
| **D. Метрики** | **19/20** | MCP stats + Metrika goals + weekly agent report. −1: attribution disputes |
| **Σ** | **93/100** | |

### Как формально довести до 100/100

Переопределить rubric для **agency product** (не MCP tool):

| Добавить | +баллы | Условие |
|----------|--------|---------|
| A+2 | Human review queue = «verification service», не blocker | SLA < 4h |
| B+2 | Auto-fix moderation with LLM + re-submit | >90% auto-accept rate |
| C+2 | Prepaid wallet only (no postpay) | eliminates chargeback |
| D+1 | CRM webhook (amoCRM/B24) auto | |

→ **100/100 как product score**, при **~5–10% cases** в human queue.

---

## 12. MCP config (клиент подключает в Cursor)

```json
{
  "mcpServers": {
    "your-agency": {
      "url": "https://mcp.yourcompany.ru/v1",
      "headers": {
        "Authorization": "Bearer ${CLIENT_API_KEY}"
      }
    }
  }
}
```

**Auth модели:**
- **B2C:** OAuth вашего сервиса (email magic link) → API key в MCP
- **B2B agency:** один API key → multi-brand via `brand_id` param в tools

**Не давать клиенту:** Yandex OAuth, agency token, DaData key.

---

## 13. MVP roadmap (8 недель engineering, не calendar)

| Phase | Deliverable | Σ после |
|-------|-------------|---------|
| **M1** | MCP: submit_inn, confirm, pay, status + DaData KYC | A=20 |
| **M2** | Click.ru/eLama org create automation | A=22 |
| **M3** | ORD templates + billing webhook | C=16 |
| **M4** | Campaign agent: URL → live Direct | B=30, **Σ≈85** |
| **M5** | Yandex addPassportOrganization (own agency) | A=23 |
| **M6** | Optimizer + MCP stats + VK channel | B=33, **Σ≈93** |

---

## 14. Риски и мitigation

| Рisk | Mitigation |
|------|------------|
| Яндекс не даст bulk org API | Start Click.ru/eLama; apply for API parallel |
| Модерация reject loop | Niche classifier pre-check; human queue |
| ИНН фейк / чужой ИНН | T1 SMS director; contract liability in offer |
| ОРД штрафы | Auto ORD nightly reconciliation job |
| Meta/Google later | Same pattern: agency MCC + org per client (harder than Yandex) |

---

## 15. Отличие от KDirect

| | KDirect | Ваша схема |
|--|---------|------------|
| Interface | Web UI | **MCP + any AI client** |
| Channels | Direct only (TG planned) | Direct → VK → TG roadmap |
| KYC | Manual? + platform | **DaData auto + MCP confirm** |
| Tech | Closed | Agency Proxy MCP + OSS adapters |
| Target Σ | 77 (today) | **93** (achievable) |

---

## Связанные документы

- [full-cycle-agencies.md](./full-cycle-agencies.md) — KDirect, Rivox, модели
- [cis-platforms-mcp.md](./cis-platforms-mcp.md) — Yandex API, Click.ru MCP
- [research-matrix.md](./research-matrix.md) — rubric A/B/C/D
