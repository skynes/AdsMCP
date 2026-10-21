# AdsMCP 100% Auto Advancement System

> **Investigación y arquitectura** para operaciones publicitarias totalmente autónomas mediante agentes IA y MCP  
> Octubre 2026 · [Documentación](./docs/) · [Archivo de investigación](./research/)

---

## Concepto

**AdsMCP 100% Auto Advancement System** es un blueprint para cerrar **todo el ciclo publicitario** con un solo agente IA — desde el primer contacto hasta campañas activas e informes — **sin intervención humana** en el happy path.

```
Registro → Verificación de empresa → Pago → Lanzamiento → Monitoreo de resultados
        ↑________________________________________________________________________|
                              ciclo cerrado · agente
```

El cliente **nunca** toca las UIs de plataformas (Meta, Google, Yandex). Interactúa vía **ChatGPT, Cursor, widget o Telegram** mediante **Agency Proxy MCP**.

### Dos capas MCP

| Capa | Qué es | Ejemplo |
|------|--------|---------|
| **Platform MCP** | Herramientas para **tu cuenta** existente | `google-ads-mcp`, `yandex-mcp` |
| **Agency Proxy MCP** | **Tu producto** — onboarding + billing + launch en **cuentas de agencia** | **Tú lo construyes** |

Platform MCP máximo **~60/100**. Agency Proxy objetivo **93–99/100**.

---

## Metodología (A + B + C + D = 100)

| Criterio | Máx | Qué medimos |
|----------|-----|-------------|
| **A. Registro de cuenta** | 25 | Cuenta sin KYC manual |
| **B. Lanzamiento** | 35 | Crear → moderar → live vía API |
| **C. Pago** | 20 | Prepaid, float, sin chargeback |
| **D. Métricas** | 20 | Stats, ROAS, CRM |

**Modelo v2.1:** float fiat · prepaid +30% · AML auto · docs auto · **pre-moderación** · **gov-ID + mandato**.

---

## Puntuación regional (v2.1)

| Región | Σ | Tier | Stack principal |
|--------|---|------|-----------------|
| Rusia | **99** | S | Yandex, VK, Telegram |
| EE.UU. | **97** | S | Meta MCC, Google MCC |
| Europa | **94** | A | Meta, Google, Taboola |
| Canadá | **94** | A | Meta, Google (bilingüe) |
| Ucrania | **91** | A | Google, Meta, Diia + EDR |
| Brasil | **88** | B | Meta, CNPJ |
| LatAm (sin BR) | **86** | B | Meta, WhatsApp Ads |
| Asia (sin CN) | **85** | B | Naver, Kakao, Shopee |
| China | **81** | C | Tencent, Ocean Engine |
| África | **77** | C | Meta mobile-first |

Detalles: [docs/REGIONAL-SCORES.md](./docs/REGIONAL-SCORES.md)

---

## Pipeline ideal

```
Cliente (MCP / chat)
        ▼
Agency Proxy MCP:
  1. URL → crawl del negocio
  2. Tax ID → KYC (DaData / Middesk / EDR)
  3. Gov-ID → ESIA / Diia / eIDAS + mandato firmado
  4. Pago → crypto/fiat → float (+30%)
  5. transfer_to_org → recarga de cuenta
  6. Cumplimiento ORD / DSA
  7. Pre-mod → policy RAG → score ≥ 0.92
  8. launch_campaign → API + polling moderación
  9. get_campaign_stats → Metrika / GA4 + CRM
        ▼
Org del cliente en MCC de agencia
```

Especificación: [docs/IDEAL-PIPELINE.md](./docs/IDEAL-PIPELINE.md)

---

## Mejor enfoque actual

**Agency Proxy MCP** en cuentas de agencia propias.

| Componente | Mejor disponible | Rol |
|------------|------------------|-----|
| Referencia RU | KDirect (77) | Modelo managed-account |
| MCP global | Synter (60) | 27 plataformas |
| Meta sin BM del cliente | Koast + Whop (71) | Crea ad account |
| KYC | Sumsub / DaData / eIDAS | AML + rep autorizado |
| Billing | Stripe / USDC float | Prepaid |

[docs/CURRENT-STATE.md](./docs/CURRENT-STATE.md)

---

## Servicios más cercanos al ideal

| Servicio | Σ | Brecha |
|----------|---|--------|
| Agency Proxy (diseño) | **99** RU | No construido |
| KDirect | 77 | Sin MCP |
| Koast | 71 | Solo Meta |
| Synter | 60 | A=0, C=5 |

**100/100 no existe hoy.** Más cercano live: **KDirect**.

---

## Bloqueadores (resumen)

1. Verificación de plataforma (Meta video)  
2. Licencia sectorial (médico, finanzas)  
3. Atribución offline  
4. Gaps de API  
5. Rechazo post-pre-mod 2–5%  

[docs/BLOCKERS.md](./docs/BLOCKERS.md)

---

## Archivo de investigación

110+ servicios · [docs/RESEARCH-INDEX.md](./docs/RESEARCH-INDEX.md)

---

## Conclusiones

1. Platform MCP max **~60/100**  
2. Agency Proxy → **93–99/100**  
3. MVP: **Rusia (99)**, escala: **EE.UU. (97)**  
4. **90–95%** clientes fully auto  
5. 100 estricto requiere scope B2B estándar

---

*MIT · Octubre 2026*
