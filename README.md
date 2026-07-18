# PAI Agent Kit

> **PAI = Pi + AI**
> The open-source framework for building AI agents on Pi Network.

Connect any AI agent to Pi Network protocols — identity, verification, payments, trust, and commerce.

## Why PAI?

Pi Network has **60M+ users** and **18M KYC'd humans** — the largest real-human user base of any blockchain. But it has **zero agent infrastructure**.

PAI Agent Kit fills that gap. One framework to give Pi agents:

- **Identity** — DIDs, TrustChain, OpenIdentity manifests
- **Verification** — PiVerify human KYC for agents
- **Payments** — Pi wallet integration
- **Trust** — Decentralized trust scoring
- **Commerce** — ACP marketplace integration

## Quickstart

```bash
npx pai create my-agent
cd my-agent
npm start
```

## Packages

| Package | Description |
|---|---|
| `@pai/core` | Agent runtime + Pi SDK integration |
| `@pai/identity` | AxiomID DIDs + OpenIdentity manifests |
| `@pai/verify` | PiVerify human verification |
| `@pai/wallet` | Pi wallet agent tools |
| `@pai/payments` | Pi ↔ USDC payment bridge |
| `@pai/skills` | Plugin loader for composable skills |

## Architecture

```
agent → PAI Core → plugins
                    ├── identity ──→ AxiomID DID
                    ├── verify  ──→ PiVerify KYC
                    ├── wallet  ──→ Pi wallet
                    ├── payments ──→ Pi ↔ USDC
                    └── trust   ──→ TrustChain
                            │
                    Virtuals ACP ← Commerce Layer
```

## Examples

- [Verify Agent](./examples/verify-agent/) — Deploy a human verifier in 5 minutes
- [Trust Agent](./examples/trust-agent/) — Deploy a trust scorer
- [Identity Agent](./examples/identity-agent/) — Deploy a DID issuer

## License

PiOS — Pi Open Source License

---

Built for Pi Network. Powered by AxiomID.
