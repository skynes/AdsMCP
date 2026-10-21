# AdsMCP 100% Auto Advancement System

> **研究与架构**：通过 AI 智能体与 MCP 实现全自主广告运营  
> 2026年10月 · [文档](./docs/) · [研究档案](./research/)

---

## 概念

**AdsMCP 100% Auto Advancement System** 是一套蓝图，旨在用单一 AI 智能体闭环**完整广告生命周期**——从首次接触到活动上线与效果监控——在理想路径上**无需人工干预**。

```
注册 → 企业验证 → 付款 → 活动启动 → 效果监控
        ↑___________________________________|
                    闭环 · 智能体驱动
```

客户**无需**接触广告平台 UI（Yandex Direct、Meta Ads Manager、Google Ads）。通过 **ChatGPT、Cursor、网页组件或 Telegram** 使用 **Agency Proxy MCP**。

### 两层 MCP（勿混淆）

| 层级 | 含义 | 示例 |
|------|------|------|
| **Platform MCP** | 操作**已有**广告账户 | `google-ads-mcp`、`yandex-mcp` |
| **Agency Proxy MCP** | **您的产品** — 在**代理账户**上完成入驻、计费、投放 | **需自建** |

Platform MCP 上限约 **60/100**。Agency Proxy 目标 **93–99/100**。

---

## 评分方法（A + B + C + D = 100）

| 维度 | 满分 | 衡量内容 |
|------|------|----------|
| **A. 账户注册** | 25 | 无需人工 KYC 创建广告账户 |
| **B. 活动启动** | 35 | API 创建、审核、上线 |
| **C. 支付** | 20 | 预付、资金池、无拒付 |
| **D. 指标分析** | 20 | 统计、ROAS、CRM |

**增强模型 v2.1**：法币资金池 · 预付+30%缓冲 · 自动 AML · 自动单据 · **预审核** · **政务 ID + 授权书**。

---

## 区域评分（v2.1）

| 区域 | Σ | 等级 | 主要平台 |
|------|---|------|----------|
| 俄罗斯 | **99** | S | Yandex、VK、Telegram |
| 美国 | **97** | S | Meta MCC、Google MCC |
| 欧洲 | **94** | A | Meta、Google、Taboola |
| 加拿大 | **94** | A | Meta、Google（双语） |
| 乌克兰 | **91** | A | Google、Meta、Diia + EDR |
| 巴西 | **88** | B | Meta、CNPJ |
| 拉美（不含巴西） | **86** | B | Meta、WhatsApp |
| 亚洲（不含中国） | **85** | B | Naver、Kakao、Shopee |
| 中国 | **81** | C | 腾讯广告、巨量引擎 |
| 非洲 | **77** | C | Meta 移动优先 |

详情：[docs/REGIONAL-SCORES.md](./docs/REGIONAL-SCORES.md)

---

## 理想 Pipeline

```
客户（MCP / 对话）
        ▼
Agency Proxy MCP：
  1. 落地页 URL → 爬取与业务理解
  2. 税号 → KYC（DaData / Middesk / EDR）
  3. 政务 ID → ESIA / Diia / eIDAS + 签署授权书
  4. 付款 → 加密货币/法币 → 代理资金池（+30%）
  5. transfer_to_org → 平台账户充值
  6. 合规（俄 ERIR / 欧 DSA）
  7. 预审核 → 政策 RAG → 得分 ≥ 0.92
  8. launch_campaign → API + 审核轮询
  9. get_campaign_stats → Metrika / GA4 + CRM
        ▼
客户 org 挂在代理 MCC 下（客户不见平台）
```

规格：[docs/IDEAL-PIPELINE.md](./docs/IDEAL-PIPELINE.md)

---

## 当前最佳方案

**Agency Proxy MCP** + **自有代理账户**。

| 组件 | 当前最优 | 作用 |
|------|----------|------|
| 俄参考案例 | KDirect（77） | 托管账户模式 |
| 全球 MCP | Synter（60） | 27 平台 |
| 无需客户 BM 的 Meta | Koast + Whop（71） | 代建广告账户 |
| KYC | Sumsub / DaData / eIDAS | AML + 授权代表 |
| 计费 | Stripe / USDC 资金池 | 预付 |

[docs/CURRENT-STATE.md](./docs/CURRENT-STATE.md)

---

## 最接近理想的服务

| 服务 | Σ | 差距 |
|------|---|------|
| Agency Proxy（设计） | **99** 俄 | 尚未实现 |
| KDirect | 77 | 无 MCP |
| Koast | 71 | 仅 Meta |
| Synter | 60 | A=0、C=5 |

**目前不存在 100/100**。最接近的全周期：**KDirect**。

---

## 剩余阻塞项（摘要）

1. 平台企业验证（Meta 视频等）  
2. 行业许可证（医疗、金融）  
3. 线下转化归因  
4. API 覆盖缺口  
5. 预审核后仍被拒 2–5%  

[docs/BLOCKERS.md](./docs/BLOCKERS.md)

---

## 研究档案

110+ 服务 · [docs/RESEARCH-INDEX.md](./docs/RESEARCH-INDEX.md)  
俄语原始材料：[`../`](../)

---

## 核心结论

1. Platform MCP 上限约 **60/100**  
2. Agency Proxy 可达 **93–99/100**  
3. MVP：**俄罗斯（99）**；扩展：**美国（97）**  
4. **90–95%** 客户可全自动  
5. 严格 100 需限定：标准 B2B、高风险行业黑名单  

---

*MIT · 2026年10月*
