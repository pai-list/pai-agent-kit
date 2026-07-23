<!-- ═══════════ PAI-AGENT-KIT · Zero-Cost Agent Runtime ═══════════ -->
<!-- Stack: TypeScript, Cloudflare DO, Vectorize, R2        -->
<!-- Updated: 23 July 2026                                  -->
<!-- ═══════════════════════════════════════════════════════ -->

<div align="center">
  <img src="https://img.shields.io/badge/status-alpha-FF6B6B?style=flat-square&labelColor=0D1117" />
  <img src="https://img.shields.io/github/license/pai-list/pai-agent-kit?style=flat-square&color=00A36C&labelColor=0D1117" />
  <img src="https://img.shields.io/github/stars/pai-list/pai-agent-kit?style=flat-square&logo=github&color=FFD700&labelColor=0D1117" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&labelColor=0D1117" />
</div>

# ۞ PAI Agent Kit

**Zero-cost serverless agent runtime — Vectorize memory, Durable Objects state, Token Delta Engine, and Al-Mizan model routing.**

The PAI Agent Kit is the runtime layer that powers every agent in the PAI ecosystem. It provides the core execution environment, memory management (via Cloudflare Vectorize + R2), state persistence (Durable Objects), and intelligent model routing across US, China, and MENA regions.

---

## ❯ Core Modules

| Module | File | Purpose |
|:-------|:-----|:--------|
| Al-Mizan Router | `src/al-mizan-router.ts` | Tri-regional model arbitrage (US/CN/MENA) |
| Framework Core | `src/framework-core.ts` | Agent lifecycle & execution engine |
| PAI Alpha Agent | `src/pai-alpha-agent.ts` | Reference agent implementation |
| 7-Layer Storage | `src/seven-layer-storage.ts` | KV → D1 → Ghost → Vectorize → Gists → Here → Vault |
| Token Calculator | `src/token-calculator.ts` | Cost estimation per model/provider |

---

## ❯ Quick Start

```bash
npm install
npx wrangler deploy
```

---

## ❯ Architecture

```
Agent Request
    │
    ▼
pai-agent-kit (Cloudflare Worker + DO)
    │
    ├── al-mizan-router → selects best model/region
    ├── framework-core → executes agent loop
    ├── seven-layer-storage → manages memory tier
    └── token-calculator → estimates cost
    │
    ▼
Response + state + memory
```

---

## ❯ Al-Mizan Router

Routes inference requests across regions based on cost, latency, and capability:

| Region | Providers | Strategy |
|:-------|:----------|:---------|
| 🇺🇸 US | OpenAI, Workers AI, Groq | Quality-first |
| 🇨🇳 China | DeepSeek, Alibaba DashScope | Cost-arbitrage |
| 🇲🇦 MENA | Jais, Falcon, IQRA | Cultural alignment |

---

## ❯ Related

- [`pai-list/pai-mcp`](https://github.com/pai-list/pai-mcp) — MCP gateway layer
- [`pai-list/pai-cli`](https://github.com/pai-list/pai-cli) — CLI for agent management
- [`pai-list/pai-rehearse`](https://github.com/pai-list/pai-rehearse) — Cognitive pre-simulation

---

## ❯ License

MIT © [PAI Ecosystem](https://github.com/pai-list)

---

*Run agents. Zero cost. Global reach.*
