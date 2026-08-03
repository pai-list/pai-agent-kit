/**
 * CloudflareValidator — Validates Cloudflare Workers/Pages configuration
 * 
 * Validates wrangler.jsonc/toml against Cloudflare Workers/Pages best practices.
 * Covers Durable Objects, D1, KV, Vectorize, Workers AI, Queues, Service bindings, Routes.
 * 
 * Official References:
 * - wrangler.jsonc Schema: https://developers.cloudflare.com/workers/wrangler/configuration/
 * - Durable Objects: https://developers.cloudflare.com/durable-objects/
 * - D1 Database: https://developers.cloudflare.com/d1/
 * - Vectorize: https://developers.cloudflare.com/vectorize/
 * - Workers AI: https://developers.cloudflare.com/workers-ai/
 * - Queues: https://developers.cloudflare.com/queues/
 * - Service Bindings: https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/
 * - Routing: https://developers.cloudflare.com/workers/configuration/routing/
 */

import { AgentAppValidator, AgentAppManifest, AgentAppValidationResult } from './validator';

export interface CloudflareConfig {
  // Core config
  name: string;
  main: string;
  compatibility_date: string;
  compatibility_flags?: string[];
  
  // Durable Objects
  durable_objects?: {
    bindings: Array<{
      name: string;
      class_name: string;
      script_name?: string;
    }>;
    migrations?: Array<{
      tag: string;
      new_sqlite_classes?: string[];
      deleted_classes?: string[];
    }>;
  };
  
  // D1 Databases
  d1_databases?: Array<{
    binding: string;
    database_name: string;
    database_id: string;
    preview_database_id?: string;
  }>;
  
  // KV Namespaces
  kv_namespaces?: Array<{
    binding: string;
    id: string;
    preview_id?: string;
  }>;
  
  // Vectorize
  vectorize?: Array<{
    binding: string;
    index_name: string;
  }>;
  
  // Workers AI
  ai?: {
    binding: string;
  };
  
  // Queues
  queues?: {
    producers: Array<{
      queue: string;
      binding: string;
    }>;
    consumers: Array<{
      queue: string;
      max_batch_size?: number;
      max_batch_timeout?: number;
    }>;
  };
  
  // Service Bindings
  services?: Array<{
    binding: string;
    service: string;
    environment?: string;
  }>;
  
  // Routes / Custom Domains
  routes?: Array<{
    pattern: string;
    zone_name?: string;
    custom_domain?: boolean;
  }>;
  
  // Custom Domains
  custom_domains?: string[];
  
  // Variables / Secrets
  vars?: Record<string, string>;
  
  // Triggers
  triggers?: {
    crons?: string[];
    queues?: string[];
  };
  
  // Build
  build?: {
    command: string;
    watch_dirs?: string[];
  };
}

export interface CloudflareConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  riskScore: number;
}

export interface CloudflareValidationResult {
  valid: boolean;
  cloudflareConfigValid: boolean;
  cloudflareErrors: string[];
  cloudflareWarnings: string[];
  cloudflareRecommendations: string[];
  riskScore: number;
}

export interface CloudflareAppManifest extends Record<string, any> {
  cloudflare?: CloudflareConfig;
}

/**
 * CloudflareValidator — Validates Cloudflare Workers/Pages configuration
 */
export class CloudflareValidator {
  
  /**
   * Validates Cloudflare configuration
   */
  public validateCloudflareConfig(config: CloudflareConfig): CloudflareConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;
    
    // 1. Required fields
    if (!config.name) {
      errors.push('Missing required field: name');
      riskScore += 20;
    }
    
    if (!config.main) {
      errors.push('Missing required field: main (entry point)');
      riskScore += 20;
    }
    
    if (!config.compatibility_date) {
      errors.push('Missing required field: compatibility_date');
      riskScore += 15;
    } else {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(config.compatibility_date)) {
        errors.push('compatibility_date must be in YYYY-MM-DD format');
        riskScore += 10;
      } else {
        const date = new Date(config.compatibility_date);
        const now = new Date();
        if (date > new Date(now.getFullYear() + 1, 11, 31)) {
          warnings.push('compatibility_date is far in the future');
        }
      }
    }
    
    // 2. Main entry point exists
    if (config.main && !config.main.endsWith('.ts') && !config.main.endsWith('.js')) {
      warnings.push('main entry point should be .ts or .js file');
    }
    
    // 2. Durable Objects validation
    if (config.durable_objects) {
      const { bindings, migrations } = config.durable_objects;
      
      if (bindings) {
        for (const binding of bindings) {
          if (!binding.name) {
            errors.push('Durable Object binding missing name');
            riskScore += 10;
          }
          if (!binding.class_name) {
            errors.push(`Durable Object binding "${binding.name}" missing class_name`);
            riskScore += 10;
          }
          if (binding.script_name && typeof binding.script_name !== 'string') {
            warnings.push(`Durable Object "${binding.name}" script_name should be string`);
          }
        }
        
        if (migrations) {
          for (const migration of migrations) {
            if (!migration.tag) {
              errors.push('Migration missing tag');
              riskScore += 10;
            }
            if (!migration.new_sqlite_classes && !migration.deleted_classes) {
              warnings.push(`Migration "${migration.tag}" has no new_sqlite_classes or deleted_classes`);
            }
          }
        }
        
        // Check for SQLite-backed DOs (recommended)
        if (bindings && bindings.length > 0) {
          recommendations.push('Use SQLite-backed Durable Objects (new_sqlite_classes) for zero-latency storage');
        }
      }
      
      // 3. D1 Databases
      if (config.d1_databases) {
        for (const db of config.d1_databases) {
          if (!db.binding) {
            errors.push('D1 database missing binding name');
            riskScore += 10;
          }
          if (!db.database_name) {
            errors.push('D1 database missing database_name');
            riskScore += 10;
          }
          if (!db.database_id) {
            errors.push('D1 database missing database_id');
            riskScore += 10;
          }
          
          if (db.preview_database_id === db.database_id) {
            warnings.push(`D1 database "${db.binding}" uses same ID for preview and production`);
          }
        }
        
        if (config.d1_databases.length > 1) {
          recommendations.push('Consider consolidating D1 databases; each has separate storage limits');
        }
      }
      
      // 4. KV Namespaces
      if (config.kv_namespaces) {
        const kvIds = new Set<string>();
        for (const kv of config.kv_namespaces) {
          if (!kv.binding) {
            errors.push('KV namespace missing binding name');
            riskScore += 10;
          }
          if (!kv.id) {
            errors.push(`KV namespace "${kv.binding}" missing id`);
            riskScore += 10;
          }
          if (kvIds.has(kv.id)) {
            errors.push(`Duplicate KV namespace id: ${kv.id}`);
            riskScore += 10;
          }
          kvIds.add(kv.id);
          
          if (!kv.preview_id) {
            warnings.push(`KV namespace "${kv.binding}" missing preview_id`);
          }
        }
        
        // Check for common KV use cases
        const kvBindings = config.kv_namespaces.map(k => k.binding);
        if (!kvBindings.includes('CACHE_KV') && !kvBindings.includes('CACHE')) {
          recommendations.push('Consider adding CACHE_KV binding for caching layer');
        }
        if (!kvBindings.includes('RATE_LIMIT')) {
          recommendations.push('Consider RATE_LIMIT KV namespace for rate limiting');
        }
      }
      
      // 5. Vectorize
      if (config.vectorize) {
        for (const vec of config.vectorize) {
          if (!vec.binding) {
            errors.push('Vectorize index missing binding');
            riskScore += 10;
          }
          if (!vec.index_name) {
            errors.push('Vectorize index missing index_name');
            riskScore += 10;
          }
        }
        
        recommendations.push('Use Vectorize for semantic search / embeddings; ensure index dimensions match embedding model');
      }
      
      // 6. Workers AI
      if (config.ai) {
        if (!config.ai.binding) {
          errors.push('Workers AI missing binding');
          riskScore += 10;
        }
        recommendations.push('Use Workers AI for embeddings (bge-base-en-v1.5) and LLM inference (llama-3.1-8b)');
      }
      
      // 7. Queues
      if (config.queues) {
        const { producers, consumers } = config.queues;
        
        if (producers) {
          for (const producer of producers) {
            if (!producer.queue) {
              errors.push('Queue producer missing queue name');
              riskScore += 10;
            }
            if (!producer.binding) {
              errors.push('Queue producer missing binding');
              riskScore += 10;
            }
          }
        }
        
        if (consumers) {
          for (const consumer of consumers) {
            if (!consumer.queue) {
              errors.push('Queue consumer missing queue name');
              riskScore += 10;
            }
            if (consumer.max_batch_size && consumer.max_batch_size > 1000) {
              warnings.push('max_batch_size > 1000 may cause timeout issues');
            }
            if (consumer.max_batch_timeout && consumer.max_batch_timeout > 30) {
              warnings.push('max_batch_timeout > 30s may cause timeout issues');
            }
          }
        }
      }
      
      // 7. Service Bindings
      if (config.services) {
        for (const service of config.services) {
          if (!service.binding) {
            errors.push('Service binding missing name');
            riskScore += 10;
          }
          if (!service.service) {
            errors.push('Service binding missing service name');
            riskScore += 10;
          }
        }
      }
      
      // 8. Routes / Custom Domains
      if (config.routes) {
        for (const route of config.routes) {
          if (!route.pattern) {
            errors.push('Route missing pattern');
            riskScore += 10;
          }
          if (!route.zone_name && !route.custom_domain) {
            warnings.push(`Route "${route.pattern}" has no zone_name or custom_domain`);
          }
          
          if (route.custom_domain && route.zone_name) {
            warnings.push('Route has both custom_domain and zone_name; custom_domain takes precedence');
          }
        }
      }
      
      if (config.custom_domains) {
        for (const domain of config.custom_domains) {
          if (!domain.includes('.')) {
            warnings.push(`Custom domain "${domain}" may be invalid`);
          }
        }
      }
      
      // 8. Variables / Secrets
      if (config.vars) {
        const sensitiveKeys = ['SECRET', 'SECRET_KEY', 'PRIVATE_KEY', 'TOKEN', 'PASSWORD', 'API_KEY'];
        for (const [key, value] of Object.entries(config.vars)) {
          const upperKey = key.toUpperCase();
          if (sensitiveKeys.some(k => upperKey.includes(k))) {
            warnings.push(`Variable "${key}" may contain secrets; use wrangler secret put instead`);
          }
        }
      }
      
      // 9. Triggers
      if (config.triggers) {
        if (config.triggers.crons) {
          for (const cron of config.triggers.crons) {
            const cronParts = cron.split(' ');
            if (cronParts.length !== 5) {
              warnings.push(`Cron expression "${cron}" may be invalid (expected 5 parts)`);
            }
          }
        }
      }
      
      // 10. Build Config
      if (config.build) {
        if (!config.build.command) {
          warnings.push('Build command not specified');
        }
      }
      
      // 10. Observability recommendations
      recommendations.push('Add observability: Cloudflare Workers Logs + Logpush to R2/S3');
      recommendations.push('Add health check endpoint at /health');
      recommendations.push('Use structured logging (JSON) for observability');
      
      // Risk score
      const riskScoreClamped = Math.min(100, riskScore);
      const valid = errors.length === 0;
      
      return {
        valid,
        errors,
        warnings,
        recommendations,
        riskScore: Math.min(100, riskScore),
      };
    }
  
  /**
   * Validates Cloudflare configuration from app manifest
   */
  public validateCloudflare(manifest: any): any {
    const cloudflareConfig = manifest.cloudflare;
    if (!cloudflareConfig) {
      return {
        valid: false,
        cloudflareConfigValid: false,
        cloudflareErrors: ['No cloudflare config in manifest'],
        cloudflareWarnings: ['Add cloudflare config to manifest for validation'],
        cloudflareRecommendations: ['Add cloudflare config with Workers/Pages configuration'],
        riskScore: 20,
      };
    }
    
    const result = this.validateCloudflareConfig(cloudflareConfig);
    
    return {
      valid: result.valid,
      cloudflareConfigValid: result.valid,
      cloudflareErrors: result.errors,
      cloudflareWarnings: result.warnings,
      cloudflareRecommendations: result.recommendations,
      riskScore: result.riskScore,
    };
  }
}

/**
 * Convenience function for CLI and CI validation
 */
export function validateCloudflareConfig(config: any): any {
  const validator = new CloudflareValidator();
  return validator.validateCloudflareConfig(config);
}

/**
 * Validates Cloudflare config from manifest
 */
export function validateCloudflareManifest(manifest: any): any {
  const validator = new CloudflareValidator();
  return validator.validateCloudflare(manifest);
}