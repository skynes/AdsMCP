# AdsMCP — исследование MCP для рекламных платформ

> **Standalone repo draft:** [`auto-advancement-system/`](./auto-advancement-system/README.md) — AdsMCP 100% Auto Advancement System (EN + RU/ES/ZH README)

Ветка: `cursor/ads-mcp-research-f337`

Цель: карта существующих MCP-решений для управления рекламой через AI-агентов, с оценкой полноты автоматизации.

## Документы

| Файл | Содержание |
|------|------------|
| **[master-unified.md](./master-unified.md)** | **⭐ Единая мастер-матрица: 126 сервисов × все регионы × A/B/C/D × Σ** |
| [research-matrix.md](./research-matrix.md) | Основная матрица: платформы × критерии × баллы |
| [master-scores.md](./master-scores.md) | Мастер-баллы по категориям (hosted, per-platform, display, agents) |
| [master-matrix-oss.md](./master-matrix-oss.md) | **Мастер-матрица: все сервисы × OSS × GitHub** |
| [reddit-forum-survey.md](./reddit-forum-survey.md) | **Reddit & форумы: 15 новых имён, треды, инсайты** |
| [new-names-round2.md](./new-names-round2.md) | **Раунд 2: 19 новых имён (PaidSync, MCP Ads, Hyper, OpenAI Ads…)** |
| [solutions-catalog.md](./solutions-catalog.md) | Каталог конкретных MCP-серверов и агрегаторов |
| [alternatives-google-ads.md](./alternatives-google-ads.md) | Альтернативы Google Ads и новые игроки |
| [aggregators-catalog.md](./aggregators-catalog.md) | Аналоги getmcpads — hosted MCP-агрегаторы (12 сервисов) |
| [display-banner-platforms.md](./display-banner-platforms.md) | Display/banner/CPM платформы + MCP-покрытие (buy-side) |
| [publisher-supply-mcp.md](./publisher-supply-mcp.md) | **Publisher/SSP: площадки, сдающие инвентарь + MCP** |
| [asia-platforms-mcp.md](./asia-platforms-mcp.md) | **Азия: Tencent, Naver, Kakao, Ocean Engine, Shopee, Flipkart…** |
| [cis-platforms-mcp.md](./cis-platforms-mcp.md) | **СНГ/RU: LidFly, Yandex, VK, Telegram, Ozon, Avito, Click.ru** |
| [full-cycle-agencies.md](./full-cycle-agencies.md) | **Full-cycle агентства: KDirect, Rivox, Pixero, Koast — запуск сами** |
| [agency-proxy-100-architecture.md](./agency-proxy-100-architecture.md) | **Схема 100/100: MCP onboarding (ИНН) → KYC → org → launch** |
| [agency-proxy-regional-scores.md](./agency-proxy-regional-scores.md) | **10 регионов v2.1: RU 99, USA 97, EU 94, UA 91, CN 81, Africa 77…** |
| [agency-proxy-blockers.md](./agency-proxy-blockers.md) | **Каталог блокеров: общие → частные → экзотические** |
| [producthunt-survey.md](./producthunt-survey.md) | Обзор Product Hunt: MCP и AI ads launches |
| [oss-github-catalog.md](./oss-github-catalog.md) | Open Source MCP на GitHub — полный каталог (~80 repos) |
| [repositories/ADVERTISING-MCP-REPOSITORIES.md](./repositories/ADVERTISING-MCP-REPOSITORIES.md) | Разбор advertising MCP-репозиториев и решения по подключению в AdsMCP |
| [auto-advancement-system/](./auto-advancement-system/README.md) | Multilingual blueprint замкнутого рекламного цикла (EN/RU/ES/ZH) |

## Методология оценки (0–100)

| Критерий | Вес | Что проверяем |
|----------|-----|---------------|
| **A. Создание аккаунта** | 25 | Регистрация рекламного кабинета без ручного прохождения KYC/верификации человеком |
| **B. Настройка и запуск кампании** | 35 | Создание кампании, групп, объявлений, таргетинга, модерация, включение (go live) |
| **C. Оплата** | 20 | Агент может оплатить сам (крипто/автосписание) или от человека нужен только платёж |
| **D. Метрики и аналитика** | 20 | Чтение статистики, отчётов, ROAS, аудит, алерты |

**100/100** — полный цикл: регистрация → запуск → оплата (минимум участия человека) → мониторинг.

**Штрафы:**
- Требуется уже существующий аккаунт: −10…−25 к итогу (потолок ~75/100)
- Только read-only: −35 к критерию B
- Playwright/браузерная автоматизация вместо API: −5 (хрупкость)
- Beta/pilot/ограниченный доступ: −5…−10

## Важное уточнение про «AdsMCP»

Существуют **два разных продукта** с похожими названиями:

1. **[AdsMCP / Adgentek](https://adsmcp.ai/)** — MCP-сервер для **монетизации AI-приложений** (показ рекламы *внутри* чатботов). Это **не** инструмент для покупки рекламы на Google/Meta/TikTok.
2. **[AdsMCP GitHub org](https://github.com/AdsMCP)** — сообщество вокруг TikTok Ads MCP и awesome-list; тоже про **управление рекламными аккаунтами**, не про in-app ads.

В матрице ниже рассматриваем **управление рекламными кампаниями** (media buying), а не in-app monetization.

## TL;DR (октябрь 2026)

**Ни одно решение не набирает 100/100.** При готовом аккаунте максимум **~60/100** (Synter). Полная таблица: [master-scores.md](./master-scores.md).

**TOP-6 агрегаторов (A+B+C+D):**
| # | Сервис | A | B | C | D | **Σ** |
|---|--------|---|---|---|---|-------|
| 1 | [Synter](https://syntermedia.ai) | 0 | 32 | 5 | 18 | **60** |
| 2 | [getmcpads.com](https://getmcpads.com) | 0 | 30 | 5 | 18 | **58** |
| 3 | [PaidSync](https://paidsync.ai) | 0 | 32 | 5 | 20 | **57** |
| 4 | [Markifact](https://markifact.com) | 0 | 29 | 5 | 18 | **57** |
| 5 | [Blend MCP](https://blend-ai.com/mcp) | 0 | 30 | 5 | 17 | **57** |
| 6 | [AdManage.ai](https://admanage.ai/mcp) | 0 | 32 | 5 | 15 | **57** |

**Новые находки раунда 2:** [MCP Ads](https://mcp-ads.com) (54, 3363 actions), [Hyper AI MCP](https://hyperfx.ai/mcp) (52), [Ryze AI](https://get-ryze.ai) (50), [ZuckerBot](https://zuckerbot.ai) (49 Meta), [HYPD openai-ads-mcp](https://github.com/HYPD-AI/openai-ads-mcp) (greenfield OpenAI Ads RO).

**СНГ/RU (см. [cis-platforms-mcp.md](./cis-platforms-mcp.md)):**
- **LidFly** — hosted all-in-one: Direct 166 + VK 76 + Avito (Σ=53)
- **Yandex Direct** — SvechaPVL/Yurich-ru community (**57**), Ask Ads hosted RO free
- **VK Ads** — lexamarketolog 55 tools OSS; myTarget → merged into VK
- **Telegram Ads** — Free-cat Playwright+TON (**52**, C=12)
- **Click.ru** — agency MCP: VK + Telegram + Direct без API approval

**TOP per-platform (при готовом аккаунте):**
- Amazon Official MCP — **59** (A=10, единственный create-account tool)
- Yandex / Taboola / PropellerAds — **56–57**
- Meta / TikTok / Google write — **52–56**
- Telegram (TON) — **52** (C=12, Playwright −5)

**Read-only tier:**
- Google official MCP — **35** · Microsoft pilot — **25** · Connector.wtf — **34**
