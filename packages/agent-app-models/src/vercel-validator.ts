/**
 * Vercel Validator — Vercel Deployment Compliance Extension
 *
 * Validates Next.js app configuration for Vercel deployment best practices.
 * Covers vercel.json, Next.js config, Edge functions, Edge Config, middleware,
 * headers, redirects, and Edge Runtime usage.
 *
 * Official References:
 * - Vercel Project Configuration: https://vercel.com/docs/project-configuration
 * - vercel.json Reference: https://vercel.com/docs/project-configuration/vercel-json
 * - Edge Functions: https://vercel.com/docs/functions/edge-functions
 * - Edge Middleware: https://vercel.com/docs/routing/middleware
 * - Edge Config: https://vercel.com/docs/storage/edge-config
 * - Next.js on Vercel: https://vercel.com/docs/frameworks/nextjs
 *
 * Spec: PPP.md §4 (Deployment Validation), PAI-MEM-SPEC.md §7 (Trust-Gate)
 */

import { AgentAppValidator, AgentAppManifest, AgentAppValidationResult } from './validator';

export interface VercelConfig {
  /** Whether vercel.json exists and is valid */
  hasVercelJson: boolean;
  /** Framework detection (nextjs, remix, astro, etc.) */
  framework?: string;
  /** Build command override */
  buildCommand?: string;
  /** Output directory */
  outputDirectory?: string;
  /** Development command */
  devCommand?: string;
  /** Install command */
  installCommand?: string;
  /** Regions for deployment */
  regions?: string[];
  /** Function configuration */
  functions?: VercelFunctionConfig[];
  /** Headers configuration */
  headers?: VercelHeaderConfig[];
  /** Redirects configuration */
  redirects?: VercelRedirectConfig[];
  /** Rewrites configuration */
  rewrites?: VercelRewriteConfig[];
  /** Clean URLs */
  cleanUrls?: boolean;
  /** Trailing slash handling */
  trailingSlash?: boolean;
  /** Edge Config integration */
  edgeConfig?: VercelEdgeConfig;
  /** Cron jobs */
  crons?: VercelCronConfig[];
  /** Environment variables (validated at deploy) */
  envVars?: string[];
  /** Secrets (validated at deploy) */
  secrets?: string[];
}

export interface VercelFunctionConfig {
  /** Function path pattern */
  source: string;
  /** Runtime: 'nodejs18.x', 'nodejs20.x', 'edge' */
  runtime?: string;
  /** Max duration in seconds */
  maxDuration?: number;
  /** Memory limit in MB */
  memory?: number;
  /** Concurrency limit */
  concurrency?: number;
}

export interface VercelHeaderConfig {
  /** Path pattern */
  source: string;
  /** Headers to apply */
  headers: Array<{ key: string; value: string }>;
}

export interface VercelRedirectConfig {
  /** Source pattern */
  source: string;
  /** Destination URL */
  destination: string;
  /** HTTP status code */
  permanent?: boolean;
  /** Whether to preserve query params */
  has?: Array<{ type: string; key: string; value?: string }>;
}

export interface VercelRewriteConfig {
  /** Source pattern */
  source: string;
  /** Destination */
  destination: string;
  /** Whether to preserve query params */
  has?: Array<{ type: string; key: string; value?: string }>;
}

export interface VercelEdgeConfig {
  /** Edge Config ID */
  id: string;
  /** Whether connected */
  connected: boolean;
  /** Keys stored in Edge Config */
  keys?: string[];
}

export interface VercelCronConfig {
  /** Cron path */
  path: string;
  /** Cron schedule (cron expression) */
  schedule: string;
}

export interface VercelConfigValidationResult {
  /** Overall validity */
  valid: boolean;
  /** Vercel-specific errors */
  errors: string[];
  /** Warnings (non-blocking) */
  warnings: string[];
  /** Recommendations */
  recommendations: string[];
  /** Risk score 0-100 */
  riskScore: number;
}

export interface VercelValidationResult {
  valid: boolean;
  vercelConfigValid: boolean;
  vercelErrors: string[];
  vercelWarnings: string[];
  vercelRecommendations: string[];
  riskScore: number;
}

export interface VercelAppManifest extends Record<string, any> {
  /** Vercel-specific configuration */
  vercel?: VercelConfig;
}

/**
 * Vercel Validator — Validates Next.js app configuration for Vercel deployment
 */
export class VercelValidator {
  /**
   * Validates Vercel configuration for deployment readiness
   */
  public validateVercelConfig(config: VercelConfig): VercelConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // 1. vercel.json presence
    if (!config.hasVercelJson) {
      warnings.push('No vercel.json found — using framework defaults');
      recommendations.push('Add vercel.json for explicit configuration control');
      riskScore += 5;
    }

    // 2. Framework detection
    if (!config.framework) {
      warnings.push('Framework not explicitly set — relying on auto-detection');
      recommendations.push('Set framework explicitly in vercel.json');
      riskScore += 5;
    }

    // 3. Build configuration
    if (!config.buildCommand) {
      warnings.push('No build command specified — using framework default');
      riskScore += 5;
    }

    // 4. Output directory
    if (!config.outputDirectory) {
      warnings.push('No output directory specified — using framework default');
      riskScore += 3;
    }

    // 5. Function runtime validation
    if (config.functions) {
      for (const fn of config.functions) {
        if (fn.runtime === 'edge') {
          // Edge runtime checks
          if (fn.maxDuration && fn.maxDuration > 30) {
            warnings.push(`Edge function ${fn.source} has maxDuration > 30s (edge limit is 30s)`);
            riskScore += 10;
          }
          if (fn.memory && fn.memory > 128) {
            warnings.push(`Edge function ${fn.source} has memory > 128MB (edge limit is 128MB)`);
            riskScore += 10;
          }
        } else if (fn.runtime === 'nodejs18.x' || fn.runtime === 'nodejs20.x') {
          // Node.js runtime - different limits
          if (fn.maxDuration && fn.maxDuration > 300) {
            warnings.push(`Node.js function ${fn.source} has maxDuration > 300s (limit is 300s)`);
            riskScore += 10;
          }
          // Still recommend Edge for better performance
          recommendations.push(`Consider using Edge Runtime for ${fn.source} for lower latency`);
        } else {
          recommendations.push(`Consider using Edge Runtime for ${fn.source} for lower latency`);
        }
      }
    }

    // 5. Headers security
    if (config.headers) {
      const requiredSecurityHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Referrer-Policy',
        'Permissions-Policy',
        'Strict-Transport-Security',
        'Content-Security-Policy'
      ];

      for (const headerConfig of config.headers) {
        const headerKeys = headerConfig.headers.map(h => h.key);
        for (const required of requiredSecurityHeaders) {
          if (!headerKeys.includes(required)) {
            warnings.push(`Missing security header ${required} for ${headerConfig.source}`);
            riskScore += 5;
          }
        }
      }
    } else {
      warnings.push('No custom headers configured — missing security headers');
      recommendations.push('Add security headers in vercel.json');
      riskScore += 10;
    }

    // 6. Redirects validation
    if (config.redirects) {
      for (const redirect of config.redirects) {
        if (!redirect.source || !redirect.destination) {
          errors.push('Redirect missing source or destination');
        }
        if (redirect.permanent && redirect.destination.startsWith('http://')) {
          warnings.push('Permanent redirect to HTTP — consider HTTPS');
          riskScore += 5;
        }
      }
    }

    // 6. Edge Config
    if (config.edgeConfig) {
      if (!config.edgeConfig.connected) {
        warnings.push('Edge Config not connected — dynamic config unavailable');
        riskScore += 10;
      }
      if (!config.edgeConfig.keys || config.edgeConfig.keys.length === 0) {
        warnings.push('Edge Config has no keys');
      }
    }

    // 7. Edge Functions runtime validation
    if (config.functions) {
      for (const fn of config.functions) {
        if (fn.runtime === 'edge') {
          recommendations.push(`Consider using Edge Runtime for ${fn.source} for global low latency`);
          // Check for Node.js APIs that won't work at edge
          // This would need static analysis - just a recommendation
        }
      }
    }

    // 8. Edge Config connection
    if (!config.edgeConfig || !config.edgeConfig.connected) {
      recommendations.push('Connect Edge Config for dynamic feature flags and routing');
    }

    // 9. Cron jobs
    if (config.crons) {
      for (const cron of config.crons) {
        // Basic cron validation
        const cronParts = cron.schedule.split(' ');
        if (cronParts.length !== 5) {
          warnings.push(`Cron ${cron.path} has invalid schedule: ${cron.schedule}`);
          riskScore += 10;
        }
      }
    }

    // 10. Environment variables
    if (config.envVars && config.envVars.length === 0) {
      warnings.push('No environment variables configured');
    }

    // 11. Secrets
    if (config.secrets && config.secrets.length === 0) {
      warnings.push('No secrets configured — sensitive values should use Vercel Secrets');
    }

    const valid = errors.length === 0 && config.hasVercelJson;
    const riskScoreClamped = Math.min(100, riskScore);

    return {
      valid,
      errors,
      warnings,
      recommendations,
      riskScore: riskScoreClamped,
    };
  }

  /**
   * Validates Vercel-specific configuration in app manifest
   */
  public validateVercel(manifest: any): any {
    const vercelConfig = manifest.vercel;
    if (!vercelConfig) {
      return {
        valid: false,
        vercelConfigValid: false,
        vercelErrors: ['No vercel config in manifest'],
        vercelWarnings: ['Add vercel config to manifest for validation'],
        vercelRecommendations: ['Add vercel config with framework, buildCommand, functions, headers'],
        riskScore: 20,
      };
    }

    const result = this.validateVercelConfig(vercelConfig);

    return {
      valid: result.valid && vercelConfig.hasVercelJson,
      vercelConfigValid: result.valid,
      vercelErrors: result.errors,
      vercelWarnings: result.warnings,
      vercelRecommendations: result.recommendations,
      riskScore: result.riskScore,
    };
  }
}

/**
 * Convenience function for CLI and CI validation
 */
export function validateVercelConfig(config: any): any {
  const validator = new VercelValidator();
  return validator.validateVercelConfig(config);
}

/**
 * Validates Vercel config from manifest
 */
export function validateVercelManifest(manifest: any): any {
  const validator = new VercelValidator();
  return validator.validateVercel(manifest);
}