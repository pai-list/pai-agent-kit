# PAI Trust Agent Example

Deploy a trust scoring agent for Pi Network identities.

## How it works

1. Input: Pi wallet address or DID
2. Agent queries TrustChain
3. Returns trust score (0-100) with breakdown

Uses `@pai/identity` and AxiomID TrustChain.
