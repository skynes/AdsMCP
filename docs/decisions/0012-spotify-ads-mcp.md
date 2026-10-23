# ADR-0012: Spotify Ads через локальный Adport MCP

- Статус: accepted
- Дата: 2026-10-23
- Решение: подключить `adport@0.6.1` через stdio
- Провайдер: Spotify Ads API v3

## Контекст

Spotify Ads API v3 покрывает рекламную и reporting-модель, которая нужна
AdsMCP: businesses, ad accounts, campaigns, ad sets, ads, assets, audiences,
targets и reports. Spotify использует OAuth2 и требует Ads Manager account и
ads-enabled Developer app.

Варианты отличаются transport и границей доверия:

- официальный `spotify/ads-agentic-tools` напрямую работает с официальным API,
  но поставляется как plugin/skills workflow, не как локальный stdio MCP;
- официальный Spotify MCP существует, но находится в closed beta;
- Synter даёт готовый MCP, но локальный package является gateway-клиентом к
  Synter backend;
- Adport даёт локальный stdio MCP и BYO credentials с прямым provider path.

## Решение

Подключаем [`adport@0.6.1`](https://github.com/ynnickw/adport) командой:

```text
npx -y adport@0.6.1 mcp
```

Причины выбора:

- local-first stdio transport совместим с AdsMCP module bridge;
- отдельный `@adport/provider-spotify@0.6.1` реализует Spotify Ads API provider;
- credentials создаются командой `connect spotify`, принадлежат пользователю и
  хранятся локально в `ADPORT_HOME/credentials.json`;
- проект Apache-2.0 и имеет общий typed tool registry, CLI и MCP поверх одной
  policy engine;
- writes проходят preview → approval контракт, но в AdsMCP на первом этапе они
  дополнительно исключены из allowlist;
- версия pinned, чтобы обновление provider surface не происходило незаметно.

Обязательные шаги перед первым live-handshake:

1. Создать Spotify Developer app с Ads API и принять Ads API terms.
2. Выполнить `npx -y adport@0.6.1 connect spotify`.
3. Проверить `accounts`, `doctor` и доступный Spotify ad account.
4. Выполнить read-only MCP handshake и сравнить accounts/report с Ads Manager.

## Allowlist

Пока разрешены только:

- `accounts_list` — discovery доступных рекламных кабинетов;
- `report` — normalized read-only performance report;
- `recommendations_list` — чтение локальных audit recommendations.

Не разрешены campaign/ad-set/ad writes, budget/status changes, asset uploads,
audience mutations, measurement setup и provider-specific raw calls. Разрешение
write-инструментов требует отдельного ADR и проверки реального Spotify account.

## Рассмотренные альтернативы

| Вариант | Плюсы | Минусы | Итог |
| --- | --- | --- | --- |
| [Spotify Ads Agentic Tools](https://github.com/spotify/ads-agentic-tools) | официальный Spotify source, direct Ads API, PKCE, automatic refresh, draft-first | не MCP server; plugin runtime и skills нельзя подставить в текущий module bridge | direct API reference, не runtime |
| [Adport](https://github.com/ynnickw/adport) `0.6.1` | local stdio, direct BYO API connections, Spotify provider, Apache-2.0, policy-guarded writes | нужен отдельный local credential setup; live Spotify validation ещё не выполнена | выбран |
| [Spotify official MCP](https://developer.spotify.com/documentation/ads-api/agents) | native API/MCP и централизованный team workflow | closed beta; нет публичного onboarding для нашего bridge | будущий preferred runtime при открытии доступа |
| [Synter MCP](https://github.com/Synter-Media-AI/mcp-server) | Spotify read и limited write, готовый stdio/HTTP MCP, cross-platform | hosted Synter backend, API key/OAuth workspace и generic cross-platform tools | не подключать как core |
| [Synter Spotify starter](https://github.com/Synter-Media-AI/spotify-ads-agent) | готовые prompts и setup | не самостоятельный API/MCP runtime, зависит от Synter | reference only |

## Безопасность и границы

- `modules/modules.example.json` и локальный `modules/modules.json` разрешают
  только три read-инструмента.
- Не передаём Spotify access/refresh token в MCP arguments или SQLite.
- `ADPORT_HOME` можно направить в защищённую папку вне репозитория.
- Не включаем `--demo` в production configuration.
- Не считаем интеграцию production-ready до проверки OAuth, account discovery,
  pagination, UTC date boundaries, currency и report fields на реальном кабинете.
- Test accounts подходят для campaign lifecycle, но Spotify прямо указывает,
  что их reporting пустой; reporting smoke-test требует production account.

## Проверка и замена

После выдачи credentials выполнить `accounts_list` и `report` с коротким
read-only периодом, затем сравнить spend, impressions, reach, clicks и
completion-rate с Spotify Ads Manager.

Официальный Spotify MCP следует переоценить, когда closed beta откроется и
появится стабильный public onboarding для OAuth/transport. Adport следует
обновлять только отдельным pinned-version коммитом после contract tests и
read-only live-handshake. Улучшение, найденное пользователем, оформляется
отдельным commit и PR в `main`.
