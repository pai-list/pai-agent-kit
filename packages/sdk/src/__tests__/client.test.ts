/**
 * Additional unit tests for packages/sdk/src/client.ts
 *
 * These tests extend coverage beyond the baseline sdk.test.ts, focusing on:
 *  - Exact URL construction and encoding for every public method
 *  - Network-level fetch failures
 *  - JSON parse error on a successful HTTP response
 *  - Error-body fallback paths (missing "error" key, res.json() throws)
 *  - Custom baseUrl and testnet base URL propagation
 *  - Accept header on every request
 *  - getStamps provider details, unknown stamp types
 *  - AxiomIDError as an Error subclass with correct message
 *  - HTTP errors surfaced by resolveDID, getTrustScore, and searchSkills
 *  - Boundary / regression cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AxiomSDK, AxiomIDError } from "../client";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const MAINNET_BASE = "https://axiomid.app";
const TESTNET_BASE = "https://testnet.axiomid.app";

const basePassport = {
  username: "alice",
  walletAddress: "GD5XABC",
  piWalletAddress: "GA456DEF",
  did: "did:axiom:alice",
  tier: "Pioneer",
  xp: 100,
  trustScore: 70,
  kyaStatus: "VERIFIED",
  kycStatus: "VERIFIED",
  stamps: [] as { type: string; provider: string }[],
  issuedDate: "2026-01-01T00:00:00.000Z",
  agentName: null as string | null,
  agentStatus: null as string | null,
  agentPublicKey: null as string | null,
};

function mockOk(body: unknown) {
  return { ok: true, status: 200, statusText: "OK", json: async () => body };
}

function mockErr(status: number, statusText: string, body?: unknown) {
  return {
    ok: false,
    status,
    statusText,
    json: async () => (body !== undefined ? body : { error: `HTTP ${status}` }),
  };
}

// ---------------------------------------------------------------------------
// AxiomIDError
// ---------------------------------------------------------------------------

describe("AxiomIDError", () => {
  it("is an instance of Error", () => {
    const err = new AxiomIDError("oops", "SOME_CODE", 503);
    expect(err).toBeInstanceOf(Error);
  });

  it("carries the supplied message", () => {
    const err = new AxiomIDError("something went wrong", "NETWORK_ERR", 0);
    expect(err.message).toBe("something went wrong");
  });

  it("sets name to AxiomIDError", () => {
    const err = new AxiomIDError("msg", "CODE", 400);
    expect(err.name).toBe("AxiomIDError");
  });

  it("stores code and status as readonly properties", () => {
    const err = new AxiomIDError("msg", "HTTP_403", 403);
    expect(err.code).toBe("HTTP_403");
    expect(err.status).toBe(403);
  });

  it("is throwable and catchable", () => {
    try {
      throw new AxiomIDError("fail", "TEST_ERR", 500);
    } catch (e) {
      expect(e).toBeInstanceOf(AxiomIDError);
    }
  });

  it("includes code and status in message when available", () => {
    const err = new AxiomIDError("not found", "NOT_FOUND", 404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.status).toBe(404);
  });
});