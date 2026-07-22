export interface ModelProvider {
  name: string;
  region: "us" | "cn" | "mena";
  models: string[];
  costPer1kTokens: { input: number; output: number };
  latencyP50Ms: number;
  freeTierAvailable: boolean;
  complianceRequires: string[]; // e.g. ['icp_license', 'cac_approval']
}

export const AL_MIZAN_PROVIDERS: ModelProvider[] = [
  {
    name: "cloudflare-workers-ai",
    region: "us",
    models: ["@cf/meta/llama-3.1-8b-instruct", "@cf/qwen/qwen1.5-14b-chat"],
    costPer1kTokens: { input: 0.0, output: 0.0 }, // Free Tier 100k req/day
    latencyP50Ms: 250,
    freeTierAvailable: true,
    complianceRequires: []
  },
  {
    name: "tigerdata-openllm",
    region: "cn",
    models: ["qwen2.5-72b-instruct", "deepseek-r1-fp8"],
    costPer1kTokens: { input: 0.00014, output: 0.00028 }, // Funded by $1k credit pool
    latencyP50Ms: 450,
    freeTierAvailable: true, // User $1k credit
    complianceRequires: ["cac_approval"]
  },
  {
    name: "jais-falcon-mena",
    region: "mena",
    models: ["jais-30b-chat", "falcon-180b-instruct"],
    costPer1kTokens: { input: 0.0005, output: 0.001 },
    latencyP50Ms: 300,
    freeTierAvailable: true,
    complianceRequires: ["iqra_substrate_audit"]
  }
];

export class AlMizanRouter {
  static detectLanguage(text: string): "ar" | "zh" | "en" {
    if (/[؀-ۿ]/.test(text)) return "ar";
    if (/[一-鿿]/.test(text)) return "zh";
    return "en";
  }

  static route(prompt: string, options: {
    targetLocale?: "us" | "cn" | "mena" | "auto";
    costPreference?: "cheapest" | "fastest" | "balanced";
    requireSovereign?: boolean;
  }) {
    const lang = this.detectLanguage(prompt);
    let candidate = AL_MIZAN_PROVIDERS;

    // Language prioritization
    if (lang === "ar" || options.targetLocale === "mena") {
      candidate = candidate.filter(p => p.region === "mena" || p.region === "us");
    } else if (lang === "zh" || options.targetLocale === "cn") {
      candidate = candidate.filter(p => p.region === "cn");
    }

    // Default to free tier / lowest cost
    const selected = candidate.sort((a, b) => a.costPer1kTokens.input - b.costPer1kTokens.input)[0];

    return {
      detectedLanguage: lang,
      selectedProvider: selected.name,
      region: selected.region,
      model: selected.models[0],
      isZeroCost: selected.freeTierAvailable,
      estimatedCostPer1k: selected.costPer1kTokens,
      latencyEstimateMs: selected.latencyP50Ms,
      fallbackChain: candidate.map(p => p.name)
    };
  }
}
