# ADR-0008: Google Ads API Agent как guarded MCP adapter

Дата решения: **2026-10-08**.

## Контекст

Репозиторий
[`itallstartedwithaidea/google-ads-api-agent`](https://github.com/itallstartedwithaidea/google-ads-api-agent)
содержит более широкий action-layer Google Ads, чем официальный
`googleads/google-ads-mcp`: 28 доменных actions для аккаунтов, кампаний,
ключевых слов, отчётности, аудиторий и оптимизации. При этом upstream Agent —
это Python-пакет с Anthropic orchestrator и FastAPI, а не MCP-сервер.

Нельзя подключать его REST/Anthropic runtime напрямую к основному AdsMCP:
это дублировало бы orchestration layer, расширяло бы сетевую поверхность и
сразу открывало бы provider write-actions.

## Решение

Подключить checkout upstream на commit `ae56150` через локальный stdio-адаптер
`scripts/google-ads-api-agent-mcp.py`.

Адаптер:

- переиспользует upstream `ToolExecutor` и action files;
- не запускает Anthropic orchestrator и FastAPI;
- публикует два MCP tools: `google_ads_agent_catalog` и
  `google_ads_agent_call`;
- скрывает traceback из ответа наружу;
- для read-only actions подтверждение не требуется;
- для provider mutations требует `confirm=true` в MCP-вызове после явного
  одобрения пользователя;
- вызывается из AdsMCP через module bridge как `google_ads_api_agent`.

Официальный `google_ads_official` и локальные `ads_google_ads_report` /
`ads_google_ads_sync` сохраняются: они остаются стабильными read-only и
нормализованным SQLite fallback-путём соответственно.

## Credentials

Agent actions используют OAuth refresh-token configuration:

```text
ADS_GOOGLE_ADS_DEVELOPER_TOKEN
ADS_GOOGLE_ADS_CLIENT_ID
ADS_GOOGLE_ADS_CLIENT_SECRET
ADS_GOOGLE_ADS_REFRESH_TOKEN
ADS_GOOGLE_ADS_LOGIN_CUSTOMER_ID
```

Манифест передаёт их дочернему процессу как `GOOGLE_ADS_*`. Service-account
переменные `ADS_GOOGLE_ADS_JSON_KEY_FILE_PATH` используются официальным MCP и
локальным GAQL adapter, но не заменяют OAuth credentials Agent actions.

## Установка

Checkout и Python runtime находятся в ignored paths:

```powershell
git clone --depth 1 https://github.com/itallstartedwithaidea/google-ads-api-agent.git modules/google-ads-api-agent
python -m venv .venv-google-ads-api-agent
& .venv-google-ads-api-agent/Scripts/python.exe -m pip install -r modules/google-ads-api-agent/requirements.txt
```

MCP transport реализован в адаптере на стандартной библиотеке Python, поэтому
дополнительный MCP/async runtime для этого модуля не требуется.

В `modules/modules.json` укажите этот Python в поле `command` для
`google_ads_api_agent`. Шаблон записи находится в
`modules/modules.example.json`.

## Security review и ограничения

- В стандартном allowlist нет отдельного write-tool: внешний MCP видит только
  `google_ads_agent_call`, а сам адаптер проверяет action и флаг writes.
- `package_installer`, `cloudinary_creative_tools`, `session_state_manager` и
  `api_gateway` не входят в read-only policy.
- `google_ads_agent_call` — низкоуровневый action surface; перед каждым write
  нужны review конкретного action и explicit confirmation пользователя. Audit
  trail и rollback пока не являются частью этого адаптера.
- Upstream checkout и его Python dependencies не коммитятся в репозиторий.
- Вызов не выполняет Google Ads API без OAuth credentials и developer token.

## Проверка

Минимальная локальная проверка без provider API call:

```powershell
npm run build:mcp
node dist/index.js
```

Затем через `ads_module_tools` для `google_ads_api_agent` должен пройти MCP
handshake и вернуться каталог. Для live action нужен настроенный OAuth аккаунт.
