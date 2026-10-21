# ADR-0002: VK Ads через Click.ru MCP broker

- **Статус:** accepted / read-only
- **Дата:** 2026-10-08
- **Область:** VK Ads account `123456`, созданный через Click.ru
- **Связанные файлы:** `modules/modules.json`, `modules/modules.example.json`, `src/integrations/mcp-modules.ts`

## Контекст

Click.ru API нашёл кабинет `123456`, но прямой запрос отдельного VK access token
вернул `422 AccountError`: для этого агентского кабинета backend потребовал
`agency_client_name` или `agency_client_id`. Логин и ID пользовательского Click.ru
аккаунта не решили требование.

У Click.ru есть официальный VK MCP broker, который принимает Click.ru API Token,
сам получает доступ к VK и не требует передавать отдельный VK token агенту.

## Решение

Зафиксировать `vk_ads_clickru_broker` как основной provider MCP для VK Ads:

```text
https://vkads-mcp.aihub.click.ru/c/${ADS_CLICKRU_API_TOKEN}/${ADS_CLICKRU_VK_ACCOUNT_ID}
```

`ADS_CLICKRU_API_TOKEN` — логическое имя placeholder. Фактическое значение берётся
из локального `ADS_MCP_DATA/clickru-settings.json` только в момент HTTP-подключения. В
конфигурации, Git, SQLite и сообщениях MCP секрет не записывается.

Пока включён только read-only allowlist:

```text
vk_ads_auth_check
vk_ads_account_info
vk_ads_accounts_list
vk_ads_ad_plans_list
vk_ads_ad_plans_get
vk_ads_campaigns_list
vk_ads_campaigns_get
vk_ads_ad_groups_list
vk_ads_ad_groups_get
```

## Проверка

Broker handshake, `tools/list` и вызов через локальный AdsMCP bridge прошли
успешно. Broker увидел Click.ru account
`123456`, но вернул `ready: false`: у кабинета пока нет VK identity (`vk_user_id`
и `vk_login` пустые), поэтому VK access token не выдаётся.

Чтобы сделать кабинет готовым, пользователь один раз создаёт новый мультиаккаунт
на [ads.vk.com](https://ads.vk.com/) с параметрами «Рекламодатель», Россия,
рубли, физическое лицо, затем в Click.ru в «Управление доступом» добавляет ID
мультиаккаунта с правами администратора. Это соответствует официальной инструкции
[Click.ru по получению доступа VK](https://help.click.ru/4814).

## Последствия

- отдельный VK token не нужно копировать в AdsMCP;
- ручной шаг нужен только для первичной привязки агентского кабинета к VK;
- брокер можно вызывать через общий `ads_module_tools` / `ads_module_call`;
- provider writes остаются заблокированными до отдельного approval и guardrails;
- после привязки повторная проверка выполняется через `vk_ads_auth_check`.
