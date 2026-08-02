/**
 * Vercel Validator Tests
 *
 * Tests the Vercel deployment configuration validation logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VercelValidator, validateVercelConfig, validateVercelManifest } from './vercel-validator';

function createBaseConfig(overrides: Partial<any> = {}): any {
  return {
    hasVercelJson: true,
    framework: 'nextjs',
    buildCommand: 'npm run build',
    outputDirectory: '.next',
    devCommand: 'npm run dev',
    installCommand: 'npm install',
    regions: ['iad1'],
    functions: [],
    headers: [],
    redirects: [],
    rewrites: [],
    cleanUrls: true,
    trailingSlash: false,
    edgeConfig: { id: 'test-id', connected: true, keys: ['feature-flag'] },
    crons: [],
    envVars: ['NODE_ENV'],
    secrets: ['API_KEY'],
    ...overrides
  };
}

describe('VercelValidator', () => {
  let validator: VercelValidator;

  beforeEach(() => {
    validator = new VercelValidator();
  });

  describe('Valid Vercel Config', () => {
    it('should pass validation for a complete config', () => {
      const config = {
        hasVercelJson: true,
        framework: 'nextjs',
        buildCommand: 'npm run build',
        outputDirectory: '.next',
        devCommand: 'npm run dev',
        installCommand: 'npm install',
        regions: ['iad1'],
        functions: [
          { source: 'api/**', runtime: 'edge' },
          { source: 'api/heavy/**', runtime: 'nodejs20.x', maxDuration: 60 }
        ],
        headers: [
          { source: '/(.*)', headers: [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
            { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
            { key: 'Content-Security-Policy', value: "default-src 'self'" }
          ]}
        ],
        redirects: [{ source: '/old', destination: '/new', permanent: true }],
        rewrites: [{ source: '/api/v1/:path*', destination: '/api/v2/:path*' }],
        edgeConfig: { id: 'ec_123', connected: true, keys: ['feature-flag'] },
        crons: [{ path: '/api/cron', schedule: '0 0 * * *' }],
        envVars: ['NODE_ENV', 'API_URL'],
        secrets: ['API_KEY']
      };

      const result = validateVercelConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.riskScore).toBeLessThan(20);
    });
  });

  describe('Missing vercel.json', () => {
    it('should warn when vercel.json is missing', () => {
      const config = { hasVercelJson: false };
      const result = validateVercelConfig(config);

      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('No vercel.json found — using framework defaults');
    });
  });

  describe('Framework Detection', () => {
    it('should warn when framework is not set', () => {
      const config = { hasVercelJson: true, framework: undefined };
      const result = validateVercelConfig({ hasVercelJson: true });

      expect(result.warnings).toContain('Framework not explicitly set — relying on auto-detection');
    });
  });

  describe('Edge Function Validation', () => {
    it('should warn when edge function exceeds 30s maxDuration', () => {
      const config = {
        hasVercelJson: true,
        functions: [{ source: 'api/**', runtime: 'edge', maxDuration: 60 }]
      };

      const result = validateVercelConfig({ hasVercelJson: true, functions: [{ source: 'api/**', runtime: 'edge', maxDuration: 60 }] });

      expect(result.warnings.some(w => w.includes('maxDuration > 30s'))).toBe(true);
    });

    it('should warn when edge function exceeds 128MB memory', () => {
      const config = { hasVercelJson: true, functions: [{ source: 'api/**', runtime: 'edge', memory: 256 }] };
      const result = validateVercelConfig({ hasVercelJson: true, functions: [{ source: 'api/**', runtime: 'edge', memory: 256 }] });

      expect(result.warnings.some(w => w.includes('memory > 128MB'))).toBe(true);
    });

it('should warn when Node.js function exceeds 300s maxDuration', () => {
      const config = { hasVercelJson: true, functions: [{ source: 'api/heavy/**', runtime: 'nodejs20.x', maxDuration: 400 }] };
      const result = validateVercelConfig(config);

      expect(result.warnings.some(w => w.includes('maxDuration > 300s'))).toBe(true);
    });
  });

  describe('Security Headers', () => {
    it('should warn when security headers are missing', () => {
      const config = { hasVercelJson: true, headers: [{ source: '/(.*)', headers: [{ key: 'X-Custom-Header', value: 'test' }] }] };
      const result = validateVercelConfig({ hasVercelJson: true, headers: [{ source: '/(.*)', headers: [{ key: 'X-Custom-Header', value: 'test' }] }] });

      expect(result.warnings.some(w => w.includes('X-Content-Type-Options'))).toBe(true);
      expect(result.warnings.some(w => w.includes('X-Frame-Options'))).toBe(true);
      expect(result.warnings.some(w => w.includes('Strict-Transport-Security'))).toBe(true);
      expect(result.warnings.some(w => w.includes('Content-Security-Policy'))).toBe(true);
    });

    it('should pass when all security headers present', () => {
      const config = { hasVercelJson: true, headers: [{ source: '/(.*)', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'Content-Security-Policy', value: "default-src 'self'" }
      ]}] };

      const result = validateVercelConfig({ hasVercelJson: true, headers: [{ source: '/(.*)', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'Content-Security-Policy', value: "default-src 'self'" }
      ]}] });

      expect(result.warnings.filter(w => w.includes('security header')).length).toBe(0);
    });
  });

  describe('Edge Function Limits', () => {
    it('should warn when edge function exceeds 30s maxDuration', () => {
      const result = validateVercelConfig({
        hasVercelJson: true,
        functions: [{ source: 'api/**', runtime: 'edge', maxDuration: 60 }]
      });

      expect(result.warnings.some(w => w.includes('maxDuration > 30s'))).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(10);
    });

    it('should warn when edge function exceeds 128MB memory', () => {
      const result = validateVercelConfig({
        hasVercelJson: true,
        functions: [{ source: 'api/**', runtime: 'edge', memory: 256 }]
      });

      expect(result.warnings.some(w => w.includes('memory > 128MB'))).toBe(true);
    });

    it('should recommend Edge Runtime for Node.js functions', () => {
      const result = validateVercelConfig({
        hasVercelJson: true,
        functions: [{ source: 'api/**', runtime: 'nodejs20.x' }]
      });

      expect(result.recommendations.some(r => r.includes('Edge Runtime'))).toBe(true);
    });
  });

  describe('Redirects', () => {
    it('should error when redirect missing source or destination', () => {
      const result = validateVercelConfig({
        hasVercelJson: true,
        redirects: [{ source: '/old' }] // missing destination
      });

      expect(result.errors).toContain('Redirect missing source or destination');
    });

    it('should warn when permanent redirect uses HTTP', () => {
      const result = validateVercelConfig({
        hasVercelJson: true,
        redirects: [{ source: '/old', destination: 'http://example.com', permanent: true }]
      });

      expect(result.warnings.some(w => w.includes('Permanent redirect to HTTP'))).toBe(true);
    });
  });

  describe('Edge Config', () => {
    it('should warn when Edge Config not connected', () => {
      const result = validateVercelConfig({
        hasVercelJson: true,
        edgeConfig: { id: 'ec_123', connected: false, keys: ['feature-flag'] }
      });

      expect(result.warnings.some(w => w.includes('Edge Config not connected'))).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(10);
    });

    it('should warn when Edge Config has no keys', () => {
      const result = validateVercelConfig({
        hasVercelJson: true,
        edgeConfig: { id: 'ec_123', connected: true, keys: [] }
      });

      expect(result.warnings.some(w => w.includes('Edge Config has no keys'))).toBe(true);
    });
  });

  describe('Cron Jobs', () => {
    it('should warn when cron schedule is invalid', () => {
      const result = validateVercelConfig({
        hasVercelJson: true,
        crons: [{ path: '/api/cron', schedule: 'invalid' }]
      });

      expect(result.warnings.some(w => w.includes('invalid schedule'))).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Environment & Secrets', () => {
    it('should warn when no environment variables', () => {
      const result = validateVercelConfig({ hasVercelJson: true, envVars: [] });
      expect(result.warnings.some(w => w.includes('No environment variables'))).toBe(true);
    });

    it('should warn when no secrets', () => {
      const result = validateVercelConfig({ hasVercelJson: true, secrets: [] });
      expect(result.warnings.some(w => w.includes('No secrets configured'))).toBe(true);
    });
  });

  describe('Full Manifest Validation', () => {
    it('should validate full manifest with vercel config', () => {
      const manifest = {
        manifestVersion: '0.1',
        app: { appId: 'app_test', name: 'Test', version: '1.0.0', description: 'Test', developerDid: 'did:axiom:dev' },
        permissions: [{ scope: 'memory:read', reason: 'Read' }],
        capabilities: [],
        sandboxed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        vercel: {
          hasVercelJson: true,
          framework: 'nextjs',
          buildCommand: 'npm run build',
          outputDirectory: '.next',
          functions: [{ source: 'api/**', runtime: 'edge' }],
          headers: [{ source: '/(.*)', headers: [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }
          ]}],
          edgeConfig: { id: 'ec_123', connected: true, keys: ['feature-flag'] }
        }
      };

      const result = validateVercelManifest(manifest);

      expect(result.valid).toBe(true);
      expect(result.vercelConfigValid).toBe(true);
    });
  });
});