# ADR-0006: официальный Google Ads MCP

Дата решения: **2026-10-08**.

## Контекст

Ранее в AdsMCP был подготовлен community-сервер
`itallstartedwithaidea/google-ads-mcp`. При дальнейшей проверке найден
официальный репозиторий Google:

<https://github.com/googleads/google-ads-mcp>

Он является read-only MCP-сервером для Google Ads API. Старый репозиторий
community-автора не используется в runtime.

## Решение

Использовать модуль `google_ads_official`:

- локальный checkout: `modules/google-ads-official`;
- зафиксированный upstream-релиз: `v0.0.4`
  (`d7f5e8ff2aa726a6f32f626c985673d61b64fb9c`);
- транспорт: локальный stdio;
- отдельный runtime: `.venv-google-ads-mcp-official`;
- запуск: `python -m ads_mcp.server`;
- write-инструменты отсутствуют в самом официальном сервере;
- `ads_google_ads_report` и `ads_google_ads_sync` остаются локальным
  SQLite-нормализатором.

## Разрешённые инструменты

```text
customers_list_accessible_customers
search_search
metadata_get_resource_metadata
```

## Credentials и сетевые ограничения

В дочерний процесс передаются только:

```text
GOOGLE_APPLICATION_CREDENTIALS
GOOGLE_ADS_DEVELOPER_TOKEN
GOOGLE_PROJECT_ID
GOOGLE_ADS_LOGIN_CUSTOMER_ID
```

`GOOGLE_ADS_MCP_OAUTH_CLIENT_ID`,
`GOOGLE_ADS_MCP_OAUTH_CLIENT_SECRET` и прочие OAuth-HTTP переменные не
передаются. Это сохраняет stdio-режим и не позволяет серверу автоматически
переключиться на HTTP listener.

## Security review

На зафиксированном релизе проведён статический review исходников:

- Google Ads вызовы ограничены `search_stream`, metadata-запросами и
  `list_accessible_customers`;
- произвольной отправки credentials или данных на сторонние endpoints не
  найдено;
- справочные resources обращаются только к официальным Google URL;
- локальная запись используется для служебного GAQL-файла и опционального
  OAuth storage, если его явно включить конфигурацией;
- subprocess-обёртка относится к `google.auth.default()` и предотвращает
  наследование stdio на Windows, а не выполняет пользовательские shell-команды;
- в AdsMCP allowlist оставлены только три read-only tools.

Ограничения review: это не гарантия безопасности зависимостей. В runtime
используется точный upstream-релиз, а не `main`; зависимости должны оставаться
зафиксированными в локальном окружении и обновляться после повторной проверки.

## Установка и smoke-test

```powershell
git clone --depth 1 --branch v0.0.4 https://github.com/googleads/google-ads-mcp.git modules\google-ads-official
$runtime = "C:\path\to\bundled\python.exe"
& $runtime -m venv .venv-google-ads-mcp-official
& $runtime -m pip install --target .venv-google-ads-mcp-official\Lib\site-packages `
  "google-ads-mcp==0.0.4"
```

После установки `ads_module_tools` должен пройти MCP handshake и вернуть только
три инструмента из allowlist. Реальный provider call требует Google Ads ADC,
developer token и, для MCC, login customer ID.

Проверка на этой машине **2026-10-08**:

- `npm run build:mcp` — PASS;
- bridge `listModuleTools("google_ads_official")` — PASS, получены ровно три
  инструмента;
- вызов неизвестного `mutating_tool` — заблокирован allowlist до запуска
  дочернего процесса;
- handshake выполнен без Google credentials и без provider API call;
- runtime-пакеты: `google-ads-mcp 0.0.4`, `google-ads 33.0.0`, `mcp 2.0.0`,
  `fastmcp 4.0.3`.

## Ограничения

Модуль не создаёт и не изменяет кампании. `search_search` принимает поля,
ресурс и условия GAQL от вызывающей стороны, поэтому результаты могут содержать
все данные, доступные указанным Google credentials, и передаются подключённому
MCP-клиенту. Это ожидаемое поведение read-only reporting-инструмента.
