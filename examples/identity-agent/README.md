# PAI Identity Agent Example

Deploy a DID issuer agent on Pi Network.

## How it works

1. User requests a DID
2. Agent creates `did:pai:<address>`
3. Returns DID document + OpenIdentity manifest

Uses `@pai/identity` and AxiomID protocol.
