# Full-cycle агентства и автономные AI-операторы

> Дата: 3 октября 2026  
> Фокус: сервисы, которые **сами запускают и ведут рекламу** — не MCP-инструменты для вашего кабинета  
> Связано: [master-unified.md](./master-unified.md) · [cis-platforms-mcp.md](./cis-platforms-mcp.md)

---

## TL;DR — три модели

| Модель | Суть | Кто платит площадке | Примеры |
|--------|------|---------------------|---------|
| **A. Managed account** | Кабинет создаёт/ведёт провайдер; клиенту не нужен доступ к Директу/Meta | Через агентство/партнёра | **KDirect**, **Koast/Whop** |
| **B. Autopilot на вашем аккаунте** | AI + менеджеры работают в **вашем** OAuth-кабинете | Клиент напрямую | Pixero, Rivox, AdBot, Hawky, Aells |
| **C. Agency infrastructure** | Единый кабинет для **вашего** агентства; кампании ведут **ваши** люди | Клиент → агентство → площадка | eLama, Click.ru, LidFly |

**Ключевой вывод:** настоящий «полный цикл без кабинета» — редкость. **KDirect (RU)** и **Koast (Meta)** — ближе всех к гипотезе «запускают сами на своих аккаунтах». Большинство AI-агентов — модель B: нужен ваш аккаунт, но работу делают они.

---

## Сводная таблица

| # | Сервис | Модель | Регион | Платформы | Свой аккаунт? | Менеджер | Auto launch | Auto pay | Σ† |
|---|--------|--------|--------|-----------|---------------|----------|-------------|----------|-----|
| 1 | **[KDirect](https://kdirect.ru/)** | A | RU | Yandex Direct | ✅ agency MCC | ✅ 30+ штат | ✅ URL→live | ✅ счёт/4% | **77** |
| 2 | **[Koast](https://docs.koast.ai/)** | A | Global | Meta (via Whop) | ✅ Koast creates | ⚠️ AI+Whop | ✅ | ✅ card | **71** |
| 3 | **[Rivox AI](https://rivox.io/)** | B | RU | Direct+VK+Google | ❌ ваш OAuth | ⚠️ autopilot opt | ✅ 45 actions | ❌ | **68** |
| 4 | **[Baker](https://withbaker.com/)** | B | Global | Paid media | ❌ ваш | ✅ engineers | ✅ agents | ❌ | **65** |
| 5 | **[Pixero AI](https://pixero.ai/)** | B | Global | Meta | ❌ ваш Meta | ⚠️ managed tier | ✅ URL→9min | ❌ | **62** |
| 6 | **[Hawky](https://hawky.ai/)** | B | Global | Meta+Google+YT+TT | ❌ OAuth | ⚠️ agent 24/7 | ✅ KPI-driven | ❌ | **60** |
| 7 | **[AdBot](https://adbot.ai/)** | B | Global | Google+Meta | ❌ ваш | ❌ pure AI | ✅ 24–48h | ❌ | **58** |
| 8 | **[Sprites](https://www.sprites.ai/)** | B | Global | 6+ channels | ❌ partner API | ❌ AI | ✅ staged | ❌ | **57** |
| 9 | **[RunAds.ai](https://www.runads.ai/)** | B | Global | Google | ❌ (helps create) | ❌ Caleb AI | ✅ | ❌ | **55** |
| 10 | **[Aells](https://aells.com/)** | B | Global | Meta | ❌ OAuth | ❌ daily agent | ✅ | ❌ | **54** |
| 11 | **[Indivision AI](https://indivisionai.com/)** | B | Enterprise | G+Meta+LI+Amazon | ❌ | ⚠️ enterprise | ✅ 24/7 | ❌ | **53** |
| 12 | **[ADS UP](https://adsup.pro/)** | B | Global | G+Meta+TT+LI | ❌ OAuth | ❌ AI chat | ✅ beta | ❌ | **52** |
| 13 | **[AskAds.ai](https://askads.ai/)** | B | Global | Meta (→multi) | ❌ | ❌ AI agent | ⚠️ drafts | ❌ | **48** |
| 14 | **[Roger](https://heyroger.ai/agency/)** | B− | Global | Google+Meta | ❌ MCC | ❌ AI audit | ❌ recs only | ❌ | **42** |
| 15 | **[eLama](https://elama.ru/)** | C | RU/CIS | 30+ systems | ⚠️ creates for client | ✅ partner AM | ❌ вы сами | ✅ единый счёт | **45** |
| 16 | **[Click.ru](https://click.ru/)** | C | RU/CIS | 32+ systems | ⚠️ creates/transfers | ✅ personal AM | ❌ вы сами | ✅ до 22% cashback | **43** |
| 17 | **[LidFly](https://lidfly.ru/agencies/)** | C | RU | Direct+VK+Avito | ❌ agency token | ❌ tool for staff | ⚠️ via MCP/AI | ❌ | **40** |
| 18 | **[Ask Ads](https://askads.ru/)** | — | RU | Direct+VK | ❌ | ❌ | ❌ RO only | ❌ | **25** |

† Оценка full-cycle agency (не MCP): A=регистрация/кабинет · B=launch+optimize · C=оплата через сервис · D=отчётность+алерты

---

## Модель A — «Не нужен кабинет, мы всё сделаем»

### 1. KDirect — ⭐ лучший match для RU гипотезы

| Поле | Значение |
|------|----------|
| Компания | ООО «Купи Слова» — сертифицированное агентство Яндекса, 20 лет, 30+ специалистов |
| URL | https://kdirect.ru/ |
| Как работает | Клиент вводит URL сайта → платформа собирает семантику, объявления, кампанию → запуск за 1 рабочий день |
| Аккаунт | **Агентский аккаунт Яндекса**; кабинет оформлен на **реквизиты клиента** (закон о маркировке) |
| Доступ клиента | **Не нужен** — «разбираться в Директе не нужно» |
| Оплата | Счёт на юрлицо → 4% комиссия внутри бюджета (не % от spend как классическое агентство) |
| Ведение | Платформа + живые эксперты; еженедельная оптимизация |
| Планы | Telegram Ads, товарные кампании, сквозная аналитика |

**Оценка:** A=20 · B=28 · C=15 · D=14 → **Σ=77**

> Единственный найденный RU-сервис, который прямо говорит: «кампании ведёт агентство на своих аккаунтах — вам не нужен свой кабинет».

---

### 2. Koast — managed Meta без Facebook-профиля

| Поле | Значение |
|------|----------|
| URL | https://docs.koast.ai/get-started/create-koast-ad-account/ |
| Как работает | «I DON'T HAVE A PROFILE» → Koast создаёт ad account через партнёра **Whop** |
| Аккаунт | **Koast/Whop ad account** — не ваш Meta Business Manager |
| Оплата | Карта клиента на ad spend; подпись Whop Advertising Terms |
| Лимит | До 10 ad accounts на Growth plan |
| Ограничения | Нет carousel, lead forms; большинство launch settings работают |

**Оценка:** A=22 · B=25 · C=12 · D=12 → **Σ=71**

---

## Модель B — «Autopilot на вашем аккаунте» (замена агентства)

### TOP Global

| Сервис | Drop URL → Live | Platforms | Pricing | Human manager |
|--------|-----------------|-----------|---------|---------------|
| **[Pixero](https://pixero.ai/)** | ✅ ~9 min Meta | Meta (+ managed team tier) | SaaS + enterprise managed | Optional dedicated team |
| **[AdBot](https://adbot.ai/)** | ✅ 24–48h | Google+Meta | $497–$1,497/mo flat | Slack on Scale |
| **[Hawky](https://hawky.ai/)** | ⚠️ KPI setup | Meta, Google, YT, TikTok | Per business count | Can run for you |
| **[Sprites](https://www.sprites.ai/)** | ✅ | Google, Meta, MSFT, LI, TT, Reddit | From $66/mo | ❌ approval gates |
| **[Baker](https://withbaker.com/)** | ⚠️ onboarding | Paid media | Agency partnership | ✅ engineers supervise agents |
| **[RunAds.ai](https://www.runads.ai/)** | ✅ 3 min setup | Google | Credits model | ❌ Caleb AI unlimited |

**Pixero** — closest global to «100/100 agent»: strategy + creative (Veo3/Sora2) + deploy + optimize. 10k users in 3 months. Human-like API pacing to avoid Meta bans. **Closed SaaS, not MCP.**

**Baker** — explicitly «first marketing agency run entirely by engineers and agents»; two modes: Baker runs it OR train your team on platform.

---

### TOP RU/CIS

| Сервис | Autopilot | Platforms | Account model | Replace agency? |
|--------|-----------|-----------|---------------|-----------------|
| **[Rivox](https://rivox.io/)** | ✅ full or confirm | Direct, VK, Google | **Ваш** OAuth | «Может заменить полностью» |
| **[BotB2B](https://botb2b.ru/)** | ⚠️ AI-директолог | Direct, Avito | **Ваш** + MCP | Scheduled reports, not full auto |
| **[Synapsea](https://ads.synapsea.agency/)** | ⚠️ MCP tools | Direct, VK, Google, Metrika | **Ваш** API key | Pay-per-call, not managed |

**Rivox** — ближе всего к «AI-агентство» в RU:
- 45 типов действий через API Директа
- Аудит по 102 правилам
- Режим автопилота: создаёт кампании, A/B, правит ставки **сам**
- CRM: amoCRM, Bitrix24, Calltouch, Roistat
- Для **агентств**: [rivox.io/agencies](https://rivox.io/agencies/) — white-label процессы, изоляция клиентов

**Оценка Rivox:** A=5 · B=30 · C=5 · D=18 → **Σ=68** (выше MCP-инструментов за счёт autopilot + CRM)

---

## Модель C — «Инфраструктура для агентств» (НЕ full-cycle для клиента)

> Важно не путать с автономными агентствами. Эти сервисы **создают кабинеты и дают менеджеров**, но **кампании ведут ваши специалисты** (или ваш AI через их MCP).

### eLama

| | |
|---|---|
| Роль | Маркетинговая платформа: 30+ систем в одном окне |
| Аккаунты | Создаёт Direct, VK, Telegram, Avito, Ozon, WB… для клиентов |
| Менеджеры | Партнёрская программа, вознаграждение до 25% оборота |
| Автоматизация | Бид-менеджер, автоправила, автопополнение, маркировка |
| Full-cycle? | **❌** — вы (агентство) ведёте кампании; eLama = ops layer |
| AI/MCP | Нет native AI agent; можно подключить LidFly/Ask Ads MCP к кабинетам |

### Click.ru

| | |
|---|---|
| Роль | «Рекламная экосистема» с 2010 года |
| Явно | **«Мы не оказываем агентских услуги и не конкурируем с вами»** |
| Даёт | Создание кабинетов, перенос статистики, до 22% вознаграждения, персональный AM |
| MCP | ✅ Official MCP для VK+TG+Direct (мы уже catalogued) |
| Full-cycle? | **❌** — resellers + tools для вашего агентства |

### LidFly for Agencies

| | |
|---|---|
| Роль | MCP/AI layer поверх **ваших** agency tokens |
| Даёт | Один OAuth → все клиенты Direct+VK+Avito; workspaces; Glas voice |
| Full-cycle? | **❌** — инструмент для ваших media buyers, не замена им |

---

## White-label fulfillment (agency → agency)

Для **рекламных агентств**, которые хотят масштабировать delivery без найма:

| Сервис | Invisible fulfillment | Channels | Human AM |
|--------|----------------------|----------|----------|
| [AdBot White Label](https://adbot.ai/white-label-ppc) | ✅ | Google+Meta | ⚠️ AI-first |
| [Roger Agency](https://heyroger.ai/agency/) | ✅ reports | Google+Meta | ❌ AI audit |
| [Lumo AI](https://lumoaiagency.com/) | ✅ | SEO+paid+content+web | ✅ |
| [Solutionever](https://solutionever.com/white-label/) | ✅ | SEO+paid+AI+CRM | ✅ dedicated AM |

**AdBot WL:** campaigns in **client's accounts** (not hostage), Scale $1,497/mo, API access.  
**Roger:** portfolio audit + white-label reports; **не запускает** — рекомендации.

---

## Сравнение с MCP-инструментами

| | MCP (Synter, LidFly) | Full-cycle agency (KDirect, Pixero) |
|--|---------------------|-------------------------------------|
| **Кто работает** | Вы + AI в **вашем** чате | **Они** работают за вас |
| **Нужен кабинет** | ✅ всегда | ⚠️ KDirect/Koast — нет |
| **Нужен media buyer** | ✅ да, вы оператор | ❌ нет |
| **Оплата** | SaaS/MCP fee | % budget или flat + spend |
| **Потолок Σ (MCP)** | ~60 | ~77 (KDirect — за счёт A+C) |
| **OSS/протокол** | ✅ MCP | ❌ closed |

**Insight:** full-cycle agencies **обходят MCP-ограничения** через:
1. Свой/agency ad account (KDirect, Koast)
2. Человеческие менеджеры + AI (KDirect, Baker)
3. Partner API credentials (Sprites, Hawky)
4. Autopilot без «confirm each tool call» (Rivox, Pixero)

---

## Карта: кто закрывает A+B+C+D

```
FULL-CYCLE COVERAGE MAP

A (Account)          B (Launch)           C (Payment)          D (Metrics)
─────────────────────────────────────────────────────────────────────────
KDirect ████████     KDirect ████████     KDirect ██████       Rivox ████████
Koast ███████        Pixero ████████      Koast ██████         KDirect ██████
RunAds ████          Rivox ████████       eLama ██████         Hawky ██████
                     AdBot ███████        (единый счёт)
                     Hawky ████████
                     Sprites ███████

MCP tools max:       A=10 (Amazon)        C=12 (Telegram)      D=20 (PaidSync)
                     B=32 (Synter)        C=5 (most)           D=18 (Synter)
                     Σ≈60                 Σ≈60
```

---

## Рекомендации по сценарию

### «Мне не нужен Директ, просто запустите рекламу» (RU)
→ **KDirect** — URL + оплата, 4%, кабинет на ваши реквизиты

### «Нет Facebook, хочу Meta Ads» (Global)
→ **Koast** — создаёт ad account без FB profile (Whop)

### «Есть кабинет, хочу заменить агентство AI» (RU)
→ **Rivox** autopilot — Direct+VK+Google, CRM, 45 API actions

### «Drop URL → Meta live за минуты» (Global)
→ **Pixero** — strategy+creative+deploy; или **Aells** daily autopilot

### «Google+Meta без retainer» (Global)
→ **AdBot** flat fee $497–1,497; live in 24–48h

### «Я агентство, хочу масштабировать delivery»
→ **eLama/Click.ru** infra + **AdBot/Roger** white-label + **LidFly** MCP для команды

### «Хочу MCP + full-cycle в одном» (greenfield)
→ **Не существует** как единый продукт. Ближайшее: Rivox (autopilot) + Click.ru MCP для agency ops

---

## Greenfield / gaps

| Gap | Opportunity |
|-----|-------------|
| **Full-cycle MCP-native agency** | Autopilot + MCP export (нет ни у кого) |
| **VK/TG без своего кабинета** | KDirect только Direct; TG «в планах» |
| **Global «KDirect for Meta+Google»** | Koast = Meta only; AdBot needs your accounts |
| **CIS multi-channel managed** | Rivox близко, но нужен OAuth клиента |
| **Payment orchestration** | KDirect/eLama partial; crypto only Telegram MCP |

---

## Связанные документы

- [producthunt-survey.md](./producthunt-survey.md) — Pixero, closed agents
- [master-unified.md](./master-unified.md) — MCP scoring
- [aggregators-catalog.md](./aggregators-catalog.md) — hosted MCP (не agencies)
- [cis-platforms-mcp.md](./cis-platforms-mcp.md) — LidFly, Click.ru, Ask Ads
