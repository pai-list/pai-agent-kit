# PAI Verify Agent Example

Deploy a human verification agent on Pi Network in 5 minutes.

## How it works

1. User connects with Pi wallet
2. Agent calls PiVerify KYC endpoint
3. Returns cryptographic proof attestation
4. Proof stored on Pi blockchain

## Run

```bash
npx pai create verify-agent
cd verify-agent
npm start
```

Uses `@pai/verify` under the hood.
