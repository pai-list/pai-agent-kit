// ════════════════════════════════════════════════════════════════
// 0CostAgenticFramework — Core
// Zero-cost agentic brain on Cloudflare Workers Free Plan
// "Built for All. For None. To Prove to All."
// ════════════════════════════════════════════════════════════════

import { Agent } from "agents";
import { z } from "zod";

// ─── Env (all optional — zero-cost defaults) ──────────────────
export interface ZeroCostEnv {
  AI?: Ai;
  AGENT?: DurableObjectNamespace<ZeroCostAgent>;
  DB?: D1Database;
  SESSIONS?: KVNamespace;
  MEMORY?: VectorizeIndex;
  ARTIFACTS?: R2Bucket;
}

// ─── Memory Types — Neural Topology ───────────────────────────
export type MemoryType =
  | "sensory"      // Immediate input — in-memory cache
  | "working"      // Current task — agent state
  | "episodic"     // Event history — DO SQLite
  | "semantic"     // Knowledge — D1 + Vectorize
  | "procedural"   // Learned skills — KV/R2
  | "collective";  // Cross-agent — D1 shared tables

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  createdAt: number;
}

// ─── Topology Node — Agent Connection ─────────────────────────
export interface TopologyNode {
  agentId: string;
  relation: string;       // 'parent' | 'child' | 'peer' | 'delegate'
  strength: number;       // 0.0 — 1.0 connection weight
  lastContact: number;
}

// ─── Agent State — The Brain ──────────────────────────────────
export interface ZeroCostState {
  identity: string;       // Unique agent ID
  walletAddress: string;  // Pi Network wallet
  topology: TopologyNode[];
  skills: string[];
  createdAt: number;
  lastActive: number;
  config: Record<string, unknown>;
}

// ─── Multi-Layer Memory Topology ───────────────────────────────
// Layer 1: Sensory (in-memory) — lost on hibernation
// Layer 2: Working (DO state) — this.setState()
// Layer 3: Episodic (DO SQLite) — this.sql`...`
// Layer 4: Semantic (D1 + Vectorize) — shared knowledge
// Layer 5: Procedural (KV) — learned patterns
// Layer 6: Artifact (R2) — documents, files
// Layer 7: Collective (D1) — cross-agent connections

// ─── The Agent ────────────────────────────────────────────────
export class ZeroCostAgent extends Agent<Env, ZeroCostState> {
  // ── Layer 1: Sensory (in-memory hot cache) ──
  _sensoryCache = new Map<string, { data: unknown; ttl: number }>();

  // ── Initial State ──
  initialState: ZeroCostState = {
    identity: "",
    walletAddress: "",
    topology: [],
    skills: [],
    createdAt: 0,
    lastActive: 0,
    config: {},
  };

  // ── Lifecycle ──
  async onStart() {
    // Init DO SQLite tables (Layer 3)
    await this.sql`CREATE TABLE IF NOT EXISTS episodic_memory (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`;
    await this.sql`CREATE INDEX IF NOT EXISTS idx_episodic_type ON episodic_memory(type)`;

    await this.sql`CREATE TABLE IF NOT EXISTS procedural_skills (
      name TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      code TEXT NOT NULL,
      dependencies TEXT DEFAULT '[]',
      config_schema TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`;
  }

  // ── Layer 1: Sensory Memory ──
  sensoryRemember(key: string, data: unknown, ttlMs = 5000) {
    this._sensoryCache.set(key, { data, ttl: Date.now() + ttlMs });
  }

  sensoryRecall<T>(key: string): T | null {
    const entry = this._sensoryCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.ttl) {
      this._sensoryCache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  // ── Layer 2: Working Memory ──
  async setWorkingMemory(key: string, value: unknown) {
    await this.setState({ [key]: value });
  }

  getWorkingMemory<T>(key: string): T | undefined {
    return this.state?.[key] as T;
  }

  // ── Layer 3: Episodic Memory (DO SQLite) ──
  async episodicRemember(type: string, content: string, metadata: Record<string, unknown> = {}) {
    const id = crypto.randomUUID();
    await this.sql`INSERT INTO episodic_memory (id, type, content, metadata, created_at)
      VALUES (${id}, ${type}, ${content}, ${JSON.stringify(metadata)}, ${Date.now()})`;
    
    // Auto-embed for semantic search (Layer 4)
    if (this.env.AI) {
      try {
        const emb = await this.env.AI.run("@cf/baai/bge-base-en-v1.5", { text: [content] });
        this.semanticStore({ id, values: emb.data[0], metadata: { type, agentId: this.state.identity } });
      } catch {}
    }
    
    return id;
  }

  async episodicRecall(type: string, limit = 20): Promise<MemoryEntry[]> {
    const rows = await this.sql`SELECT * FROM episodic_memory
      WHERE type = ${type} ORDER BY created_at DESC LIMIT ${limit}`;
    return rows.map(r => ({
      id: r.id as string,
      type: r.type as MemoryType,
      content: r.content as string,
      metadata: JSON.parse(r.metadata as string),
      createdAt: r.created_at as number,
    }));
  }

  async episodicSearch(query: string): Promise<MemoryEntry[]> {
    // Semantic search via Vectorize (Layer 4)
    if (this.env.AI && this.env.MEMORY) {
      const emb = await this.env.AI.run("@cf/baai/bge-base-en-v1.5", { text: [query] });
      const results = await this.env.MEMORY.query(emb.data[0], {
        topK: 5,
        filter: { agentId: this.state.identity },
      });
      return results.matches.map(m => ({
        id: m.id,
        type: "episodic" as MemoryType,
        content: m.metadata?.content as string || "",
        metadata: m.metadata || {},
        createdAt: m.score || 0,
      }));
    }
    // Fallback: SQLite LIKE search
    const rows = await this.sql`SELECT * FROM episodic_memory
      WHERE content LIKE ${`%${query}%`} ORDER BY created_at DESC LIMIT 10`;
    return rows.map(r => ({
      id: r.id as string,
      type: r.type as MemoryType,
      content: r.content as string,
      metadata: JSON.parse(r.metadata as string),
      createdAt: r.created_at as number,
    }));
  }

  // ── Layer 4: Semantic Memory (Vectorize) ──
  async semanticStore(vector: { id: string; values: number[]; metadata: Record<string, unknown> }) {
    if (!this.env.MEMORY) return;
    await this.env.MEMORY.upsert([vector]);
  }

  async semanticSearch(query: string, topK = 5): Promise<MemoryEntry[]> {
    if (!this.env.AI || !this.env.MEMORY) return [];
    const emb = await this.env.AI.run("@cf/baai/bge-base-en-v1.5", { text: [query] });
    const results = await this.env.MEMORY.query(emb.data[0], { topK });
    return results.matches.map(m => ({
      id: m.id,
      type: "semantic" as MemoryType,
      content: m.metadata?.content as string || "",
      metadata: m.metadata || {},
      createdAt: m.score || 0,
    }));
  }

  // ── Layer 5: Procedural Memory (KV) ──
  async proceduralLearn(skill: { name: string; version: string; code: string; deps?: string[]; configSchema?: Record<string, unknown> }) {
    await this.sql`INSERT OR REPLACE INTO procedural_skills (name, version, code, dependencies, config_schema, created_at)
      VALUES (${skill.name}, ${skill.version}, ${skill.code}, ${JSON.stringify(skill.deps || [])}, ${JSON.stringify(skill.configSchema || {})}, ${Date.now()})`;
    
    if (this.env.SESSIONS) {
      await this.env.SESSIONS.put(`skill:${skill.name}`, JSON.stringify(skill), { expirationTtl: 86400 * 7 });
    }
  }

  async proceduralRecall(name: string) {
    // Try KV first (fast)
    if (this.env.SESSIONS) {
      const cached = await this.env.SESSIONS.get(`skill:${name}`);
      if (cached) return JSON.parse(cached);
    }
    // Fall back to SQLite
    const row = await this.sql`SELECT * FROM procedural_skills WHERE name = ${name}`;
    if (row.length > 0) return row[0];
    return null;
  }

  // ── Layer 6: Artifact Storage (R2) ──
  async storeArtifact(key: string, data: ArrayBuffer | string, contentType = "application/octet-stream") {
    if (!this.env.ARTIFACTS) throw new Error("R2 not bound");
    return this.env.ARTIFACTS.put(`artifacts/${this.state.identity}/${key}`, data, {
      httpMetadata: { contentType },
      customMetadata: { agentId: this.state.identity, createdAt: String(Date.now()) },
    });
  }

  async getArtifact(key: string) {
    if (!this.env.ARTIFACTS) return null;
    return this.env.ARTIFACTS.get(`artifacts/${this.state.identity}/${key}`);
  }

  // ── Layer 7: Collective Memory (D1) ──
  async collectiveConnect(targetAgentId: string, relation: string) {
    if (!this.env.DB) return;
    await this.env.DB.prepare(
      `INSERT OR REPLACE INTO agent_topology (source_id, target_id, relation, strength, last_contact)
       VALUES (?, ?, ?, 1.0, ?)`
    ).bind(this.state.identity, targetAgentId, relation, Date.now()).run();
    
    // Update local topology
    const updated = [...this.state.topology.filter(t => t.agentId !== targetAgentId),
      { agentId: targetAgentId, relation, strength: 1.0, lastContact: Date.now() },
    ];
    await this.setState({ ...this.state, topology: updated });
  }

  async collectiveQuery(relation?: string): Promise<TopologyNode[]> {
    if (!this.env.DB) return this.state.topology;
    if (relation) {
      const rows = await this.env.DB.prepare(
        `SELECT * FROM agent_topology WHERE source_id = ? AND relation = ? ORDER BY strength DESC`
      ).bind(this.state.identity, relation).all();
      return rows.results as TopologyNode[];
    }
    const rows = await this.env.DB.prepare(
      `SELECT * FROM agent_topology WHERE source_id = ? ORDER BY strength DESC`
    ).bind(this.state.identity).all();
    return rows.results as TopologyNode[];
  }

  // ── AI Reasoning (zero-cost Workers AI) ──
  async think(prompt: string, system?: string): Promise<string> {
    if (!this.env.AI) return "AI not bound (free plan)";
    
    // Add episodic context
    const relevant = await this.episodicSearch(prompt);
    const context = relevant.slice(0, 3).map(e => `[${e.type}] ${e.content}`).join("\n");
    
    const result = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: system || `You are agent ${this.state.identity}. Context:\n${context}` },
        { role: "user", content: prompt },
      ],
    });
    
    const response = (result as any).response || JSON.stringify(result);
    
    // Store in episodic memory
    await this.episodicRemember("thought", `Q: ${prompt}\nA: ${response}`, { model: "llama-3.1-8b" });
    
    return response;
  }

  // ── WebSocket / Real-time ──
  async onConnect(ws: WebSocket) {
    ws.send(JSON.stringify({ type: "connected", agentId: this.state.identity }));
  }

  async onMessage(ws: WebSocket, message: string) {
    const data = JSON.parse(message);
    if (data.type === "chat") {
      const response = await this.think(data.message);
      ws.send(JSON.stringify({ type: "response", content: response }));
    }
    if (data.type === "recall") {
      const memories = await this.episodicRecall(data.type || "thought", data.limit || 10);
      ws.send(JSON.stringify({ type: "memories", data: memories }));
    }
  }

  // ── Email Handler ──
  async onEmail(email: AgentEmail) {
    const subject = email.headers.get("subject") || "";
    const sender = email.from;
    const body = await email.text();
    
    await this.episodicRemember("email", `From: ${sender}\nSubject: ${subject}\nBody: ${body}`, { sender, subject });
    
    const response = await this.think(body, `You received an email from ${sender} with subject "${subject}". Reply helpfully.`);
    
    // Auto-reply if email sending is configured
    if ((this as any).replyToEmail) {
      await (this as any).replyToEmail(email, {
        fromName: `Agent ${this.state.identity}`,
        subject: `Re: ${subject}`,
        body: response,
        contentType: "text/plain",
      });
    }
  }
}

// ─── Agent Factory ─────────────────────────────────────────────
export function spawnAgent(env: Env, name: string): DurableObjectStub<ZeroCostAgent> {
  const id = env.AGENT.idFromName(name);
  return env.AGENT.get(id);
}

// ─── Topology Schema for D1 ───────────────────────────────────
export const TOPOLOGY_SCHEMA = `
  CREATE TABLE IF NOT EXISTS agent_topology (
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    relation TEXT NOT NULL,
    strength REAL DEFAULT 1.0,
    last_contact INTEGER,
    PRIMARY KEY (source_id, target_id)
  );
  CREATE INDEX IF NOT EXISTS idx_topology_source ON agent_topology(source_id);
  CREATE INDEX IF NOT EXISTS idx_topology_target ON agent_topology(target_id);
`;

// ─── Routes ────────────────────────────────────────────────────
export default {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url);
    const agent = spawnAgent(env, url.searchParams.get("id") || "default");
    
    if (url.pathname === "/chat") {
      const { message } = await req.json() as { message: string };
      const response = await agent.think(message);
      return Response.json({ response });
    }
    
    if (url.pathname === "/memory") {
      const memories = await agent.episodicRecall("thought");
      return Response.json({ memories });
    }
    
    if (url.pathname === "/connect") {
      const { targetId, relation } = await req.json() as { targetId: string; relation: string };
      await agent.collectiveConnect(targetId, relation);
      return Response.json({ status: "connected" });
    }
    
    if (url.pathname === "/topology") {
      const topology = await agent.collectiveQuery();
      return Response.json({ topology });
    }
    
    return new Response("0CostAgenticFramework — " + url.pathname, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
