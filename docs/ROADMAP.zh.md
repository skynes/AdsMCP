# 🎯AdsMCP Roadmap

将 AdsMCP 发展为安全的 agent-facing 广告自动化层的产品路线图。

[English](./ROADMAP.md) · [Русская версия](./ROADMAP.ru.md)

最后检查：**2026-10-10**。

## 产品方向

长期产品是面向客户的 **Agency Proxy MCP**。AI agent 应能够接收网站 URL、
企业信息和预算，然后通过一个受控接口完成验证、账户设置、billing、活动
准备、审核、启动、报告和优化。

```text
URL + 业务 brief + 预算
        -> KYC / 企业验证
        -> 广告账户或组织
        -> 合规与 billing
        -> 活动 draft 与预审核
        -> 显式确认并启动
        -> 指标、CRM 与收入反馈
        -> 受控优化
```

Happy path 应该高度自动化，但付款、身份验证、受监管行业、平台审核以及其他
高风险步骤必须支持显式确认和 human review queue。

### Track：Relationship-first Agentic Lead Engagement

除了广告活动操作之外，AdsMCP 还将发展
**Relationship-first Agentic Lead Engagement** 方向，并以
**Conversational Lead Proxy** 的形式提供。该 Agent 可以处理 lead 来源或
数据库，研究每位联系人，维护独立的对话状态，并判断何时需要人工或商业
workflow 介入。

```text
lead discovery -> research -> relationship building -> context memory
               -> intent detection -> human handoff / commercial action
```

Discovery 循环应当以主题和意图为先：

```text
产品或问题主题
        -> 获准访问的主题群组、聊天和公开讨论
        -> 明确的问题或对产品/团队的寻找
        -> 保存原始上下文和来源
        -> 基于相关性并尊重许可进行联系
        -> 建立关系并判断意图
```

仅仅因为某人属于一个群组或出现在联系人名单中，不足以开始 outreach。第一
条消息必须建立在对方自己提出的问题或表达的兴趣上，同时遵守渠道规则、用户
同意和退订要求。

默认策略不是立即推销。Agent 应先建立上下文并进行自然交流，只有在出现明确
信号、获得许可或满足配置的业务规则后才采取商业行动。用户同意、退订、渠道
条款、rate limits、真实的个性化和人工升级都属于安全契约。

### 可能的基础：基于 Chatwoot 的客户沟通 workspace

在线沟通界面后续可以先采用 self-hosted 的 **Chatwoot Community Edition**，
而不是在 AdsMCP 内重新实现一个 inbox。Chatwoot 可以提供运营人员使用的
inbox、联系人、conversations、渠道连接和基础 human handoff 界面。AdsMCP
仍然负责 agent-facing orchestration 与 policy：lead discovery、research、
context memory、intent detection、consent、回复 draft 和商业动作安全门。

计划中的集成边界：

```text
Chatwoot inbox / channel event
        -> AdsMCP lead identity 与 context memory
        -> research、intent 和关系状态
        -> agent 建议或回复 draft
        -> human approval / handoff / guarded action
        -> Chatwoot conversation
```

集成要求：

- 将 Chatwoot contacts 和 conversations 映射到稳定的 AdsMCP lead 与
  relationship records；
- 通过 Chatwoot API/webhooks 接收消息事件，并通过选定 inbox 发送已批准的回复；
- 将 consent、opt-out、rate limits、audit history 和 channel policy 保留在
  AdsMCP，而不是只保存在 UI 状态中；
- 在任何自主商业行动之前支持 agent draft 和人工接管；
- 保持 Chatwoot adapter 可替换，避免 AdsMCP 绑定单一沟通 UI 或数据模型。

第一阶段只评估 upstream Community Edition。仓库将该版本描述为 MIT license；
enterprise 功能单独授权，因此在重新分发修改后的构建之前必须确认具体 edition
和版本。

## Roadmap 原则

- 能力 milestone 比日历日期更重要。
- 先做读取和 preview；写操作必须经过验证、确认和 audit trail。
- Provider API 实现尽可能留在外部模块中。
- AdsMCP 负责标准化、本地记忆、归因、编排和安全门。
- 模块出现在目录中不代表已经是 production-ready 集成。
- 每条同步和写入路径都必须支持安全重试并且可观测。
- `ADS_MCP_DATA` 是唯一的本地数据根目录；provider 状态使用命名子目录，
  不创建并行存储位置。

## Milestones

| 阶段 | 状态 | 范围 | 完成标准 |
| --- | --- | --- | --- |
| **M0 — 本地基础** | ✅ 当前 | stdio MCP、SQLite、项目、活动、事件、支出、分析和归因 | Core tools 可以本地构建运行；数据留在本地，密钥不进入 SQLite |
| **M1 — Provider 读取层** | ✅ 当前 / hardening | Google Ads、Yandex Direct、Telegram Ads、Microsoft Advertising、provider bridge 和标准化同步 | 报告与导入可重复、去重、受 allowlist 限制并且可审计 |
| **M2 — 创建广告活动** | 🔜 下一步 | 为 Google Ads、Yandex Direct 和 Telegram Ads 提供 draft/preview、验证、显式确认、创建和审计 | 可以从已审核的 draft 安全创建活动；写入仍受 gate 控制，并在平台允许时可回退 |
| **M3 — Agent onboarding** | 📋 计划中 | 网站 URL、业务 brief、目标受众与活动场景 research、意图来源地图、税号/KYC、onboarding 状态、policy checks 和人工审核队列 | Agent 先理解受众及其活动场景，再收集并验证启动所需的最小上下文，不让客户直接操作 provider UI |
| **M3.5 — Agentic Lead Engagement** | 📋 计划中 | 主题优先的群组/聊天 discovery、已表达兴趣的记录、去重、research、关系状态、对话记忆、intent detection 和人工交接 | Agent 能找到已经提出相关问题的人，保留其上下文并维护可追踪的对话，而不是默认发送群发式销售消息 |
| **M3.6 — Telegram 资源目录同步** | 📋 计划中 | 通过中央 API 搜索公开群组和频道，与本地 `tg_resources` 进行幂等同步，发布自有资源，按项目归类，保存来源信息，去重并进行 policy/moderation 和审计；评估将 `dstore.one` 与 `userflow_bot` 作为协同外部 workflow 接入 | 本地目录可以安全地从中央 API 更新，可以发现相关资源，并在审核后发布自有资源；根据 API、授权、数据模型和发布规则的检查结果决定接受或拒绝 `dstore.one`/`userflow_bot` 集成；冲突和写入操作可追踪并经过配置的确认门 |
| **M3.75 — 客户沟通 workspace** | 📋 计划中 | Self-hosted Chatwoot Community Edition 作为运营/客户 inbox、联系人与 conversations bridge、webhooks、agent drafts、上下文同步和人工接管 | 运营人员可以在共享 inbox 中工作，同时由 AdsMCP 统一维护 lead identity、relationship context、consent、intent、audit trail 和 action gates |
| **M4 — Agency Proxy 操作** | 📋 计划中 | 创建组织/账户、合规、billing、充值、审核、启动以及客户端状态 | 受控 agency-account flow 可以把已批准客户从 onboarding 带到 live 活动 |
| **M5 — Optimization loop** | 🌐 愿景 | CRM/webhooks、收入反馈、多触点归因、建议、预算控制和受控执行 | Agent 可以衡量业务结果，并以审计方式提出或执行有边界的优化 |

## Provider 交付顺序

下一步的写入 milestone 有意限制在三个 provider。创建流程开发期间，现有的
只读路径继续作为安全基线。

| Provider | 当前状态 | 下一项能力 |
| --- | --- | --- |
| Google Ads | 官方 MCP 和本地标准化路径 | 创建已审核的 campaign draft，并在显式确认后提交 |
| Yandex Direct | ZAI.ONE 模块和标准化统计路径 | 通过受控 workflow 创建并验证活动 |
| Telegram Ads | ZAI.ONE HTTP-session 模块以及账户/统计同步 | 通过 session、policy、budget 和确认门后创建或更新活动 |
| Microsoft Advertising | 官方只读 MCP 和 aggregate sync | 在前三个 provider 之后，再进行写入和 OAuth 安全评估 |
| VK Ads through Click.ru | 只读 broker 路径；VK 绑定仍需手动操作 | 先解决 account onboarding blocker，再考虑写入 |
| Apple、TikTok、Reddit | Module-ready 读取路径 | 模块稳定后增加标准化同步和平台创建能力 |
| Meta Ads | 计划中的 adapter 路径 | 定义安全的 Graph API/MCP runtime 和账户 onboarding 模型 |
| OpenAI Ads / ChatGPT | 只读模块路径已就绪 | 已实现官方 Advertiser API bridge；guarded writes 需在确认、幂等和 provider readback 方案完成后单独决定 |
| Spotify Ads | 计划中的候选 | 确认区域可用性、campaign API、音频/视频 creative workflow 和 reporting model |
| X Ads | 计划中的候选 | 确认当前 Ads API、账户资格、targeting 和受控 campaign-management 权限 |

## M2：活动创建的统一安全契约

每个 provider write workflow 都应遵循同一套高层契约：

1. 读取账户能力和必填字段。
2. 生成本地 draft，不向 provider 发送。
3. 验证预算、日期、targeting、creative、tracking 和 policy 约束。
4. 展示 preview 并要求显式确认。
5. 创建最小安全的 provider 对象集合。
6. 轮询审核或 provider 状态，不预设一定成功。
7. 在本地记录请求/响应摘要、external IDs 和 audit events。
8. 如果 provider 支持，提供 pause/rollback 或人工审核路径。

在完成该契约、credentials 边界审查和 offline smoke test 之前，provider
write tool 不会加入默认 allowlist。

## M3–M4：Agency Proxy flow

research 文档中的客户端流程：

```text
提交 landing URL
  -> 理解业务和受众
  -> 收集税号与企业信息
  -> 验证组织和代表人
  -> 创建或选择广告组织
  -> 设置预算和付款状态
  -> 准备合规与预审核
  -> 生成 campaign draft
  -> 确认并启动
  -> 监控指标、CRM 和收入
```

客户不应直接管理 platform OAuth、agency token 或 provider UI。平台限制、
缺失文件、受监管类别和审核失败都应进入明确的 review queue，而不是对 agent
隐藏或无限重试。

## 下一个 milestone 不包含

- 不受限制的自主预算支出。
- 将 provider credentials 或 raw cookies 保存到 SQLite。
- 一次性开启所有 provider 的写入工具。
- 把目录条目或 reference implementation 视为 production adapter。
- 对用户隐藏付款、KYC、平台审核或监管决策。

## 参考文档

- [Agency Proxy 架构](../research/agency-proxy-100-architecture.md)
- [Auto Advancement blueprint](../research/auto-advancement-system/README.zh-CN.md)
- [理想端到端 pipeline](../research/auto-advancement-system/docs/IDEAL-PIPELINE.md)
- [Provider 选择与决策](./PROVIDER-MODULES.md)
- [当前架构](./ARCHITECTURE.md)
- [Chatwoot Community Edition 仓库](https://github.com/chatwoot/chatwoot)
- [Chatwoot 开发者文档](https://developers.chatwoot.com/)
