export interface StorageLayerConfig {
  layer: number;
  name: string;
  provider: string;
  capacityLimit: string;
  useCase: string;
  dataClassification: "ephemeral" | "relational" | "agent_db" | "vector" | "gist" | "web_drive" | "sovereign";
}

export const SEVEN_LAYER_STORAGE_MATRIX: StorageLayerConfig[] = [
  {
    layer: 1,
    name: "Layer 1: Edge Ephemeral & KV",
    provider: "Cloudflare KV & Durable Objects",
    capacityLimit: "100k reads/day, 1k writes/day",
    useCase: "Session state, hot cache, sub-ms locks",
    dataClassification: "ephemeral"
  },
  {
    layer: 2,
    name: "Layer 2: Relational Metadata",
    provider: "Cloudflare D1 SQL",
    capacityLimit: "500MB DB, 5M reads/day",
    useCase: "User accounts, core DID registry, transactional state",
    dataClassification: "relational"
  },
  {
    layer: 3,
    name: "Layer 3: Agentic Postgres DB",
    provider: "Ghost.build (TimescaleDB)",
    capacityLimit: "1 TB Free Storage, 100 Compute Hours/mo, Unlimited Forks",
    useCase: "On-demand agent database branching, dynamic schema forks",
    dataClassification: "agent_db"
  },
  {
    layer: 4,
    name: "Layer 4: Vector Semantic Memory",
    provider: "Tembo pgvector & Cloudflare Vectorize",
    capacityLimit: "500MB Postgres vector storage",
    useCase: "RAG embeddings, long-term semantic search",
    dataClassification: "vector"
  },
  {
    layer: 5,
    name: "Layer 5: Versioned Diffs & CI Logs",
    provider: "GitHub Gists (gist.github.com)",
    capacityLimit: "Unlimited Public/Secret Gists",
    useCase: "Pre-commit review diffs, CI/CD run traces, benchmarks",
    dataClassification: "gist"
  },
  {
    layer: 6,
    name: "Layer 6: Instant Web Sites & Agent Drives",
    provider: "Here.now Drives (here.now/docs)",
    capacityLimit: "Zero-config instant agent web publishing & drives",
    useCase: "Instant static dApp deployments, agent file drives",
    dataClassification: "web_drive"
  },
  {
    layer: 7,
    name: "Layer 7: Sovereign Cryptographic Vault",
    provider: "Ed25519 WebCrypto + Local Disk (openidentity.md)",
    capacityLimit: "Unlimited Local Disk Storage",
    useCase: "Encrypted private keys, sovereign memory vault",
    dataClassification: "sovereign"
  }
];

export class SevenLayerStorageEngine {
  static getMatrix() {
    return SEVEN_LAYER_STORAGE_MATRIX;
  }
}
