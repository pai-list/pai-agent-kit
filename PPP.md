# PPP — PAI Protocol (`.ppp`)

> **PAI Protocol — The Wire Format for the Agentic Universe**
> Version 1.0.0-draft · July 2026

---

## 1. Philosophy

PPP is a **request-response protocol** designed for agent-to-agent communication over any transport (HTTP, WebSocket, MCP, or custom). Every message is a `.ppp` document — self-contained, verifiable, and routable.

**One message = one `.ppp` document = one trip to a Single Source of Truth.**

---

## 2. Message Format

Every `.ppp` message has exactly three sections, separated by `---`:

```
.ppp
Header
---
Body
---
Receipt
```

### 2.1 Header

Required fields:

| Field | Type | Description |
|-------|------|-------------|
| `proto` | `string` | Always `ppp/1.0` |
| `type` | `string` | `request` or `response` |
| `endpoint` | `string` | `.PAI` endpoint URI (e.g. `pai://verify`) |
| `id` | `string` | Unique message ID (UUIDv7) |
| `from` | `string` | Sender's DID |
| `to` | `string` | Recipient's DID or `*` (any) |
| `ts` | `string` | ISO 8601 timestamp |
| `ttl` | `number` | Time-to-live in seconds |

Optional fields:

| Field | Type | Description |
|-------|------|-------------|
| `trace` | `string` | Trace ID for request chains |
| `agent` | `string` | Agent name/version |
| `session` | `string` | Session ID for multi-turn |
| `lang` | `string` | Preferred response language (e.g. `en`, `ar`) |

### 2.2 Body

Arbitrary JSON. No schema restrictions — each `.PAI` endpoint defines its own body schema.

The body MUST include a `type` field indicating the action:

```json
{
  "type": "verify.kyc",
  "username": "cryptojoker710"
}
```

Or for responses:

```json
{
  "type": "verify.kyc.result",
  "status": "passed",
  "verifiedAt": "2026-07-18T22:00:00Z",
  "method": "pi_kyc_v3"
}
```

### 2.3 Receipt

The receipt is a **TrustChain proof** — a signed digest of the entire message.

```json
{
  "digest": "sha256:abc123...",
  "signature": "base64:...",
  "signer": "did:pai:abc123...",
  "algorithm": "ed25519"
}
```

The digest is computed as: `SHA256(JSON(header) + "---" + JSON(body))`

---

## 3. Transport

PPP is transport-agnostic. The same `.ppp` document works over:

| Transport | How |
|-----------|-----|
| **HTTP** | POST `.ppp` as `Content-Type: application/vnd.ppp+json` |
| **WebSocket** | Send `.ppp` as a text frame |
| **MCP** | Embed `.ppp` as the tool call payload |
| **Pi Browser** | `pai://endpoint` URL scheme |
| **File** | Save as `.ppp` file and pass between agents |

---

## 4. Routing

Endpoints follow the pattern:

```
pai://<domain>/<action>
```

Where:
- `<domain>` — the `.PAI` namespace (bye, hai, buy, vai, style, why)
- `<action>` — the specific operation

Reserved domains:

| Domain | Meaning | Router |
|--------|---------|--------|
| `pai://bye` | Universe entry | DID-based |
| `pai://hai` | Trust & communication | DID-based |
| `pai://buy` | Marketplace | DID + Pi wallet |
| `pai://vai` | Identity & verification | DID + Pi KYC |
| `pai://style` | Design tokens | Static |
| `pai://why` | Philosophy | Static |

Custom domains can be registered via `pai://vai/register-domain`.

---

## 5. Resolution

To resolve `pai://verify` to a concrete address:

```
Step 1: Query Pi Name Service
  pai://vai/resolve?domain=verify
  → Returns: { "endpoint": "https://pns.pi/verify", "did": "did:pai:verify" }

Step 2: Verify the DID
  pai://vai/verify-did?did=did:pai:verify
  → Returns: { "verified": true, "owner": "did:pai:pi-core-team" }

Step 3: Connect and send .ppp
  POST https://pns.pi/verify
  Content-Type: application/vnd.ppp+json
```

If Pi Name Service is unavailable, fall back to:
- DID document's `serviceEndpoint` field
- Well-known URI: `https://verify.pai/.well-known/ppp`

---

## 6. Example: Full Exchange

### Request

```json
.ppp
{
  "proto": "ppp/1.0",
  "type": "request",
  "endpoint": "pai://verify",
  "id": "01J6F...",
  "from": "did:pai:cryptojoker710",
  "to": "did:pai:verify-service",
  "ts": "2026-07-18T22:00:00Z",
  "ttl": 30,
  "agent": "pai-cli/1.0.0"
}
---
{
  "type": "verify.kyc",
  "username": "cryptojoker710"
}
---
null
```

### Response

```json
.ppp
{
  "proto": "ppp/1.0",
  "type": "response",
  "endpoint": "pai://verify",
  "id": "01J6G...",
  "from": "did:pai:verify-service",
  "to": "did:pai:cryptojoker710",
  "ts": "2026-07-18T22:00:01Z",
  "ttl": 86400
}
---
{
  "type": "verify.kyc.result",
  "status": "passed",
  "verifiedAt": "2026-07-18T22:00:00Z"
}
---
{
  "digest": "sha256:def456...",
  "signature": "base64:abc123...",
  "signer": "did:pai:verify-service",
  "algorithm": "ed25519"
}
```

---

## 7. TrustChain Receipt Chain

Every response's receipt includes the request's ID, forming a chain:

```
Request:  { id: "A", ... }                  → Receipt: null
Response: { id: "B", inReplyTo: "A", ... }  → Receipt: { digest, signature, ... }
```

This creates a verifiable chain of custody:

```
A → B → C → D → ...
```

Each link proves:
- What was asked (via `inReplyTo`)
- What was returned (via `digest`)
- Who said it (via `signer`)
- When (via `ts`)
- That it hasn't been tampered with (via `signature`)

---

## 8. Error Format

Errors use standard HTTP-inspired codes:

```json
.ppp
{
  "proto": "ppp/1.0",
  "type": "response",
  "endpoint": "pai://verify",
  "id": "01J6G...",
  "from": "did:pai:verify-service",
  "to": "did:pai:cryptojoker710",
  "ts": "2026-07-18T22:00:01Z",
  "ttl": 60
}
---
{
  "type": "error",
  "code": "PAI_401",
  "message": "Unauthorized: DID not verified",
  "details": {
    "did": "did:pai:cryptojoker710",
    "reason": "KYC expired",
    "retryAfter": "2026-08-18T22:00:00Z"
  }
}
---
{
  "digest": "sha256:ghi789...",
  "signature": "base64:xyz789...",
  "signer": "did:pai:verify-service",
  "algorithm": "ed25519"
}
```

Error codes:

| Code | Meaning |
|------|---------|
| `PAI_400` | Bad request (malformed `.ppp`) |
| `PAI_401` | Unauthorized (DID not verified) |
| `PAI_403` | Forbidden (no permission) |
| `PAI_404` | Endpoint not found |
| `PAI_408` | Timeout |
| `PAI_429` | Rate limited |
| `PAI_500` | Internal error |
| `PAI_502` | Upstream failed |

---

## 9. MCP Compatibility

PPP is designed to embed inside MCP (Model Context Protocol) tool calls:

```json
{
  "tool": "pai_endpoint",
  "input": {
    "ppp": {
      "endpoint": "pai://verify",
      "body": {
        "type": "verify.kyc",
        "username": "cryptojoker710"
      }
    }
  }
}
```

Any MCP-compatible client can call any `.PAI` endpoint without modification.

---

## 10. File Extension

PPP documents use the `.ppp` file extension:

```
request-verify.kyc.ppp
response-verify.kyc.ppp
```

When saved to disk, agents can replay, audit, or forward them.

---

## 11. Formal ABNF

```
ppp-document = header-section body-section receipt-section
header-section = ".ppp" CRLF header-json CRLF "---" CRLF
body-section = body-json CRLF "---" CRLF
receipt-section = receipt-json

header-json = JSON object with "proto", "type", "endpoint", etc.
body-json   = JSON object (arbitrary)
receipt-json = JSON object with "digest", "signature", "signer", "algorithm"
              | null (for requests before signing)
```

---

## 12. Versioning

PPP uses semantic versioning for the protocol:

| Version | Status |
|---------|--------|
| `ppp/1.0` | Current draft |

Breaking changes require a new minor/major version. Extensions use header fields prefixed with `x-`.

---

## License

PiOS — Pi Open Source License

---

*Every `.ppp` message is a trip. Every receipt is a proof. Every endpoint is the truth.*
