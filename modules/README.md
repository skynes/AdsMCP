# modules — provider MCP-модули

Здесь лежит всё, что относится к внешним MCP-провайдерам, которых AdsMCP
вызывает через module bridge.

- `modules.example.json` — шаблон манифеста, хранится в Git.
- `modules.json` — локальный манифест (копия шаблона под эту машину),
  игнорируется Git. Путь можно переопределить через `ADS_MCP_MODULES_FILE`.
- `*/` — локальные checkout'ы модулей (`google-ads-official/`, `google-ads-api-agent/`, `google-ads/`, `telegram-ads/`,
  `telegram-ads-deps/`, `yandex-direct/`, `yandex-direct-deps/` и т.д.), игнорируются Git.

Относительный `cwd` модуля в манифесте считается от корня проекта, например
`"cwd": "modules/google-ads-official"`.

```powershell
Copy-Item modules\modules.example.json modules\modules.json
```

Выбор модулей и причины описаны в [docs/PROVIDER-MODULES.md](../docs/PROVIDER-MODULES.md).
