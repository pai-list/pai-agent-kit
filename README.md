# PAI Agent Kit

> **Pi + AI = PAI** — Open-source framework for building AI agents on Pi Network

---

## Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Spec** | ✅ Ratified | PPP protocol v1.0-draft |
| **AgentAppValidator** | ✅ **Production** | Risk-scoring, sandbox enforcement, Pi app validation |
| **Crypto (Ed25519/JCS)** | ✅ **Production** | Sovereign key derivation, signing, JCS canonicalization |
| **AxiomSDK** | ✅ **Production** | Passport, DID, TrustScore, Skills API wrapper |
| **Agent Runtime** | 🔄 **In Progress** | PPP message loop, skill execution, transport |
| **PPP Runtime** | 🔄 **In Progress** | Encoder/decoder, receipt signer, router |
| **Pi SDK Package** | ⏳ **Planned** | Port AxiomID Pi SDK logic (initSandbox, auth, payments, native features) |
| **Identity / Verify / Wallet / Payments / Skills** | ⏳ **Planned** | Package scaffolding only |

---

## Packages

| Package | Status | Description |
|---------|--------|-------------|
| `@axiomid/agent-app-models` | ✅ **Production** | Manifest types, JSON schemas, **AgentAppValidator** (risk scoring, sandbox enforcement) |
| `@axiomid/crypto` | ✅ **Production** | Ed25519 derivation, JCS canonical JSON, signing/verification |
| `@axiomid/sdk` | ✅ **Production** | AxiomID REST wrapper (Passport, DID, TrustScore, Skills) |
| `@pai/core` | 🔄 **In Progress** | Agent runtime, PPP message loop, skill execution |
| `@axiomid/pi-sdk` | ⏳ **Planned** | Pi SDK init, sandbox detection, auth, payments, native features |
| `@pai/identity` | ⏳ **Planned** | DIDs + OpenIdentity manifests |
| `@pai/verify` | ⏳ **Planned** | PiVerify human verification |
| `@pai/wallet` | ⏳ **Planned** | Pi wallet agent tools |
| `@pai/payments` | ⏳ **Planned** | Pi Network payments |
| `@pai/skills` | ⏳ **Planned** | Composable skill loader |
| `@pai/verify` | ⏳ **Planned** | PiVerify KYC for agents |

---

## Quick Start

```bash
# Install dependencies
npm install

# Run tests (only agent-app-models has tests currently)
npm test

# Build all packages
npm run build

# Run AgentAppValidator tests
cd packages/agent-app-models && npx tsx src/agent-app-models.test.ts
```

---

## AgentAppValidator — Pi App Validation

The `AgentAppValidator` is the core security gate for Pi Studio app submissions:

```typescript
import { AgentAppValidator } from '@axiomid/agent-app-models';

const validator = new AgentAppValidator();
const result = validator.validateAppManifest(manifest);

// result: { valid, appId, errors[], securityRiskScore (0-100) }
```

**Risk scoring (0-100):**
- App ID format: +30 if invalid
- Developer DID (must be `did:axiom:`): +25 if invalid
- Missing permissions: +20
- `execute:command` permission: +25 risk
- `write:filesystem` without reason: +15 risk
- `network:egress` without allowedDomains: +30 risk
- **Unsandboxed + execute:command = 100 risk (FORBIDDEN)**

---

## PPP Protocol

See `PPP.md` — The wire format for agent-to-agent communication.

```
.ppp
Header (proto, type, endpoint, id, from, to, ts, ttl, trace, session, lang)
---
Body (arbitrary JSON with "type" field)
---
Receipt (TrustChain proof — signed digest)
```

---

## Examples

| Example | Description |
|---------|-------------|
| `examples/identity-agent` | DID issuer agent on Pi Network |
| `examples/trust-agent` | Trust scoring agent for Pi identities |
| `examples/verify-agent` | Human verification agent (5 min deploy) |

---

## License

**PiOS** — Open for all agents, all humans, all purposes.

---

*Part of the PAI Universe. Built on Pi Network.*