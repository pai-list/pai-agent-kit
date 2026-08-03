/**
 * Pi App Validator Tests
 *
 * Tests the Pi-specific validation logic for Pi Studio compliance.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PiAppValidator, validatePiAppManifest } from './pi-app-validator';
import { AgentAppManifest, AgentAppPermission } from './types';

function createBaseManifest(overrides: Partial<any> = {}): any {
  return {
    manifestVersion: '0.1',
    app: {
      appId: 'app_axiomid_test',
      name: 'Test Agent App',
      version: '1.0.0',
      description: 'A test agent app for Pi Network',
      developerDid: 'did:axiom:dev_test123',
      iconUrl: 'https://axiomid.app/icon.png',
    },
    permissions: [
      { scope: 'memory:read', reason: 'Read user preferences', maxCallsPerMin: 60 },
    ],
    capabilities: [],
    sandboxed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

function createPiConfig(overrides: Partial<any> = {}) {
  return {
    sdkInit: true,
    authFlow: 'oauth' as const,
    payments: true,
    nativeFeatures: ['sharePassport', 'requestUsername'],
    sandboxToggle: true,
    cspHeaders: true,
    userContext: true,
    ...overrides
  };
}

describe('PiAppValidator', () => {
  let validator: PiAppValidator;

  beforeEach(() => {
    validator = new PiAppValidator();
  });

  describe('Valid Pi App Manifest', () => {
    it('should pass validation for a fully compliant Pi app', () => {
      const manifest = createBaseManifest({
        pi: { sdkInit: true, authFlow: 'oauth', payments: true, nativeFeatures: ['sharePassport', 'requestUsername'], sandboxToggle: true, cspHeaders: true, userContext: true }
      });

      const result = validator.validatePiApp(manifest);

      expect(result.valid).toBe(true);
      expect(result.piCompliant).toBe(true);
      expect(result.piErrors).toHaveLength(0);
      expect(result.piRiskScore).toBe(0);
      expect(result.securityRiskScore).toBeLessThan(80);
    });
  });

  describe('Missing Pi Config', () => {
    it('should fail when pi config is missing', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'memory:read', reason: 'Read' }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

      const result = validator.validatePiApp(manifest);

      expect(result.valid).toBe(false);
      expect(result.piCompliant).toBe(false);
      expect(result.piErrors).toContain('Missing pi config for Pi Studio submission (required)');
      expect(result.piRiskScore).toBeGreaterThan(0);
    });
  });

  describe('Pi SDK Initialization', () => {
    it('should fail when sdkInit is missing', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'memory:read', reason: 'Read' }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: false, authFlow: 'oauth', payments: true, nativeFeatures: ['sharePassport'], sandboxToggle: true, cspHeaders: true, userContext: true } };

      const result = validator.validatePiApp(manifest);

      expect(result.valid).toBe(false);
      expect(result.piErrors).toContain('Missing pi.sdkInit — must call initSandboxCompatibility() + determineSandboxMode() at startup');
      expect(result.piRiskScore).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Authentication Flow', () => {
    it('should fail when authFlow is missing', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'memory:read', reason: 'Read' }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: true, authFlow: undefined as any, payments: true, nativeFeatures: ['sharePassport'], sandboxToggle: true, cspHeaders: true, userContext: true } };

      const result = validator.validatePiApp(manifest);

      expect(result.valid).toBe(false);
      expect(result.piErrors).toContain('Missing or invalid pi.authFlow — must be "oauth" or "native"');
    });

    it('should fail when authFlow is invalid', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'memory:read', reason: 'Read' }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: true, authFlow: 'invalid' as any, payments: true, nativeFeatures: ['sharePassport'], sandboxToggle: true, cspHeaders: true, userContext: true } };

      const result = validator.validatePiApp(manifest);

      expect(result.valid).toBe(false);
      expect(result.piErrors).toContain('Missing or invalid pi.authFlow — must be "oauth" or "native"');
    });

    it('should accept oauth flow', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'memory:read', reason: 'Read' }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: true, authFlow: 'oauth', payments: true, nativeFeatures: ['sharePassport'], sandboxToggle: true, cspHeaders: true, userContext: true } };

      const result = validator.validatePiApp(manifest);
      expect(result.valid).toBe(true);
    });

    it('should accept native flow', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'memory:read', reason: 'Read' }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: true, authFlow: 'native', payments: true, nativeFeatures: ['sharePassport'], sandboxToggle: true, cspHeaders: true, userContext: true } };

      const result = validator.validatePiApp(manifest);
      expect(result.valid).toBe(true);
    });
  });

  describe('Payments', () => {
    it('should require payments config when network:egress is used', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'network:egress', reason: 'External API calls', allowedDomains: ['api.example.com'] }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: true, authFlow: 'oauth', payments: false, nativeFeatures: ['sharePassport'], sandboxToggle: true, cspHeaders: true, userContext: true } };

      const result = validator.validatePiApp(manifest);

      expect(result.valid).toBe(false);
      expect(result.piErrors).toContain('network:egress permission requires pi.payments config (Pi Payments integration)');
    });

    it('should allow network:egress when payments is true', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'network:egress', reason: 'Pi Payments API', allowedDomains: ['api.minepi.com'] }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: true, authFlow: 'oauth', payments: true, nativeFeatures: ['sharePassport'], sandboxToggle: true, cspHeaders: true, userContext: true } };

      const result = validator.validatePiApp(manifest);
      expect(result.valid).toBe(true);
    });
  });

  describe('Native Features', () => {
    it('should require at least one native feature', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'memory:read', reason: 'Read' }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: true, authFlow: 'oauth', payments: true, nativeFeatures: [], sandboxToggle: true, cspHeaders: true, userContext: true } };

      const result = validator.validatePiApp(manifest);

      expect(result.valid).toBe(false);
      expect(result.piErrors).toContain('Pi Studio requires at least one native feature (sharePassport, requestUsername, etc.)');
    });

    it('should reject unknown native features', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'memory:read', reason: 'Read' }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: true, authFlow: 'oauth', payments: true, nativeFeatures: ['unknownFeature'], sandboxToggle: true, cspHeaders: true, userContext: true } };

      const result = validator.validatePiApp(manifest);

      expect(result.valid).toBe(false);
      expect(result.piErrors).toContain('Unknown Pi native feature: unknownFeature');
    });

    it('should accept known native features', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'memory:read', reason: 'Read' }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: true, authFlow: 'oauth', payments: true, nativeFeatures: ['sharePassport', 'requestUsername', 'requestWalletAddress', 'requestKYCStatus'], sandboxToggle: true, cspHeaders: true, userContext: true } };

      const result = validator.validatePiApp(manifest);
      expect(result.valid).toBe(true);
    });
  });

  describe('Sandbox Toggle', () => {
    it('should require sandboxToggle', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'memory:read', reason: 'Read' }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: true, authFlow: 'oauth', payments: true, nativeFeatures: ['sharePassport'], sandboxToggle: false, cspHeaders: true, userContext: true } };

      const result = validator.validatePiApp(manifest);

      expect(result.valid).toBe(false);
      expect(result.piErrors).toContain('Missing pi.sandboxToggle — must expose determineSandboxMode() toggle in UI');
    });
  });

  describe('CSP Headers', () => {
    it('should require cspHeaders', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'memory:read', reason: 'Read' }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: true, authFlow: 'oauth', payments: true, nativeFeatures: ['sharePassport'], sandboxToggle: true, cspHeaders: false, userContext: true } };

      const result = validator.validatePiApp(manifest);

      expect(result.valid).toBe(false);
      expect(result.piErrors).toContain('Missing pi.cspHeaders — must configure frame-ancestors for *.minepi.com, *.pinet.com');
    });
  });

  describe('User Context', () => {
    it('should require userContext', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'memory:read', reason: 'Read' }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: true, authFlow: 'oauth', payments: true, nativeFeatures: ['sharePassport'], sandboxToggle: true, cspHeaders: true, userContext: false } };

      const result = validator.validatePiApp(manifest);

      expect(result.valid).toBe(false);
      expect(result.piErrors).toContain('Missing pi.userContext — must implement fetchPiUser + session mapping');
    });
  });

  describe('Standalone validatePiAppManifest function', () => {
    it('should work as a standalone function', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'memory:read', reason: 'Read' }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: true, authFlow: 'oauth', payments: true, nativeFeatures: ['sharePassport'], sandboxToggle: true, cspHeaders: true, userContext: true } };
      const result = validatePiAppManifest(manifest);

      expect(result.valid).toBe(true);
      expect(result.piCompliant).toBe(true);
    });
  });

  describe('Combined with Base Validator', () => {
    it('should combine base errors with Pi errors', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'invalid-id', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'memory:read', reason: 'Read' }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: false, authFlow: 'oauth', payments: true, nativeFeatures: ['sharePassport'], sandboxToggle: true, cspHeaders: true, userContext: true } };

      const result = validator.validatePiApp(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      expect(result.errors.some(e => e.includes('appId'))).toBe(true);
      expect(result.errors.some(e => e.includes('sdkInit'))).toBe(true);
    });

    it('should combine risk scores', () => {
      const manifest = { manifestVersion: '0.1', app: { appId: 'app_axiomid_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev_test123' }, permissions: [{ scope: 'memory:read', reason: 'Read' }], capabilities: [], sandboxed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), pi: { sdkInit: false, authFlow: 'oauth', payments: true, nativeFeatures: ['sharePassport'], sandboxToggle: true, cspHeaders: true, userContext: true } };

      const result = validator.validatePiApp(manifest);

      expect(result.securityRiskScore).toBeGreaterThan(0);
      expect(result.piRiskScore).toBeGreaterThan(0);
    });
  });
});