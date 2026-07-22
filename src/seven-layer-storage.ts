export interface StorageLayerConfig {
  layer: number;
  name: string;
  provider: string;
  freeLimitDescription: string;
  dataClassification: "ephemeral" | "relational" | "vector" | "gist" | "cms" | "blob" | "sovereign";
}

export const SEVEN_LAYER_STORAGE_MATRIX: StorageLayerConfig[] = [
  {
    layer: 1,
    name: "Layer 1: Edge Ephemeral & KV",
    provider: "Cloudflare KV / Durable Objects",
    freeLimitDescription: "100k reads/day, 1k writes/day",
    dataClassification: "ephemeral"
  },
  {
    layer: 2,
    name: "Layer 2: Relational Metadata",
    provider: "Cloudflare D1 SQL",
    freeLimitDescription: "500MB DB, 5M reads/day",
    dataClassification: "relational"
  },
  {
    layer: 3,
    name: "Layer 3: Vector Semantic Memory",
    provider: "Tembo pgvector & Cloudflare Vectorize",
    freeLimitDescription: "500MB Postgres vector storage",
    dataClassification: "vector"
  },
  {
    layer: 4,
    name: "Layer 4: Versioned Code Diffs & CI Traces",
    provider: "GitHub Gists (gist.github.com)",
    freeLimitDescription: "Unlimited Public/Secret Gists",
    dataClassification: "gist"
  },
  {
    layer: 5,
    name: "Layer 5: Headless Content & Documentation",
    provider: "Ghost CMS Headless API",
    freeLimitDescription: "Self-hosted / Free API tier",
    dataClassification: "cms"
  },
  {
    layer: 6,
    name: "Layer 6: Distributed Object Blob Store",
    provider: "Cloudflare R2 / IPFS / Arweave",
    freeLimitDescription: "10GB free object storage/month",
    dataClassification: "blob"
  },
  {
    layer: 7,
    name: "Layer 7: Sovereign Cryptographic Vault",
    provider: "Ed25519 WebCrypto + Local Memory Vault",
    freeLimitDescription: "Unlimited Local Disk Storage",
    dataClassification: "sovereign"
  }
];

export class SevenLayerStorageEngine {
  /**
   * Automatically routes data to the optimal storage layer based on type
   */
  static getLayerForData(type: "cache" | "sql" | "vector" | "diff" | "article" | "media" | "backup"): StorageLayerConfig {
    switch (type) {
      case "cache": return SEVEN_LAYER_STORAGE_MATRIX[0];
      case "sql": return SEVEN_LAYER_STORAGE_MATRIX[1];
      case "vector": return SEVEN_LAYER_STORAGE_MATRIX[2];
      case "diff": return SEVEN_LAYER_STORAGE_MATRIX[3];
      case "article": return SEVEN_LAYER_STORAGE_MATRIX[4];
      case "media": return SEVEN_LAYER_STORAGE_MATRIX[5];
      case "backup": default: return SEVEN_LAYER_STORAGE_MATRIX[6];
    }
  }

  /**
   * Helper to create a GitHub Gist for agent review diffs or CI logs
   */
  static async publishGist(githubToken: string, filename: string, content: string, description: string, isPublic = false) {
    const resp = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers: {
        Authorization: `token ${githubToken}`,
        "User-Agent": "PAI-7Layer-Storage-Engine",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        description,
        public: isPublic,
        files: {
          [filename]: { content }
        }
      })
    });
    if (!resp.ok) throw new Error(`Gist publishing failed: ${resp.statusText}`);
    const data = await resp.json() as { html_url: string };
    return data.html_url;
  }
}
