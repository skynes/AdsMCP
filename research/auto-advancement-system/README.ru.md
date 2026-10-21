# AdsMCP 100% Auto Advancement System

> **Исследование и архитектура** полностью автономного рекламного цикла через AI-агентов и MCP  
> Октябрь 2026 · [Документация](./docs/) · [Архив исследований](./research/)

---

## Концепция

**AdsMCP 100% Auto Advancement System** — blueprint для закрытия **всего рекламного цикла** одним AI-агентом: от первого контакта до live-кампаний и отчётов — **без вмешательства человека** на happy path.

```
Регистрация → Верификация компании → Оплата → Запуск кампании → Мониторинг результатов
        ↑___________________________________________________________________|
                              замкнутый цикл · агент
```

Клиент **никогда** не видит UI площадок (Директ, Meta, Google). Взаимодействие — через **ChatGPT, Cursor, виджет или Telegram** via **Agency Proxy MCP**.

### Два слоя MCP

| Слой | Что это | Пример |
|------|---------|--------|
| **Platform MCP** | Инструменты к **вашему** кабинету | `yandex-mcp`, `google-ads-mcp` |
| **Agency Proxy MCP** | **Ваш продукт** — onboarding + billing + launch на **агентских аккаунтах** | **Вы строите** |

Platform MCP потолок **~60/100**. Agency Proxy цель **93–99/100**.

---

## Методология (A + B + C + D = 100)

| Критерий | Макс | Суть |
|----------|------|------|
| **A. Регистрация** | 25 | Кабинет без ручного KYC |
| **B. Запуск** | 35 | Create → moderate → live via API |
| **C. Оплата** | 20 | Prepaid, float, без chargeback |
| **D. Метрики** | 20 | Stats, ROAS, CRM |

**Модель v2.1:** fiat float · prepaid +30% · auto AML · auto docs · **pre-mod** · **gov-ID + mandate**.

---

## Региональные баллы (v2.1)

| Регион | Σ | Tier | Стек |
|--------|---|------|------|
| Россия | **99** | S | Yandex, VK, Telegram |
| США | **97** | S | Meta MCC, Google MCC |
| Европа | **94** | A | Meta, Google, Taboola |
| Канада | **94** | A | Meta, Google (FR+EN) |
| Украина | **91** | A | Google, Meta, Diia + ЄДР |
| Бразилия | **88** | B | Meta, CNPJ |
| LatAm (без BR) | **86** | B | Meta, WhatsApp |
| Азия (без CN) | **85** | B | Naver, Kakao, Shopee |
| Китай | **81** | C | Tencent, Ocean Engine |
| Африка | **77** | C | Meta mobile |

Подробнее: [docs/REGIONAL-SCORES.md](./docs/REGIONAL-SCORES.md)

---

## Идеальный pipeline

```
Клиент (MCP / чат)
        ▼
Agency Proxy MCP:
  1. URL → crawl
  2. ИНН/EIN → KYC (DaData / Middesk / ЄДР)
  3. Gov-ID → ESIA / Diia / eIDAS + mandate
  4. Оплата → crypto/fiat → float (+30%)
  5. transfer_to_org → top-up кабинета
  6. ОРД / DSA compliance
  7. Pre-mod → policy RAG → score ≥ 0.92
  8. launch_campaign → API + moderation poll
  9. get_campaign_stats → Metrika / GA4 + CRM
        ▼
Org клиента на agency MCC (клиент не видит площадку)
```

Спецификация: [docs/IDEAL-PIPELINE.md](./docs/IDEAL-PIPELINE.md)

---

## Лучший текущий подход

**Agency Proxy MCP** на **своих** agency-аккаунтах.

| Компонент | Лучшее сейчас | Роль |
|-----------|---------------|------|
| RU reference | KDirect (77) | Managed-account модель |
| RU MCP | SvechaPVL/yandex-mcp | 132 tools |
| Global MCP | Synter (60) | 27 платформ |
| Meta без BM клиента | Koast + Whop (71) | Создаёт ad account |
| KYC RU | DaData + ESIA | ИНН + rep |
| KYC UA | ЄДР + Diia | EDRPOU + mandate |
| Billing | YooKassa / Stripe / USDC | Prepaid float |

[docs/CURRENT-STATE.md](./docs/CURRENT-STATE.md)

---

## Ближайшие к идеалу сервисы

| Сервис | Σ | Gap |
|--------|---|-----|
| Agency Proxy (design) | **99** RU | Не построен |
| KDirect | 77 | Нет MCP |
| Koast | 71 | Meta only |
| Synter | 60 | A=0, C=5 |

**100/100 не существует.** Ближайший live full-cycle: **KDirect**.

---

## Блокеры (кратко)

1. Platform verify (Meta)  
2. Industry license (мед/фин)  
3. Offline attribution  
4. API gaps  
5. Post-pre-mod reject 2–5%  

[docs/BLOCKERS.md](./docs/BLOCKERS.md)

---

## Архив исследований

110+ сервисов · [docs/RESEARCH-INDEX.md](./docs/RESEARCH-INDEX.md)  
Русские оригиналы: [`../`](../)

---

## Выводы

1. Platform MCP max **~60/100**  
2. Agency Proxy → **93–99/100**  
3. MVP: **Россия (99)**, scale: **USA (97)**  
4. **90–95%** клиентов — fully auto  
5. Strict 100 — scope: standard B2B, denylist OKVED

---

*MIT · Октябрь 2026*
