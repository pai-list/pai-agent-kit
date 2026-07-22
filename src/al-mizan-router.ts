export interface ModelProvider {
  name: string;
  providerKey: string;
  region: "us" | "cn" | "mena";
  models: string[];
  costPer1kTokensUSD: { input: number; output: number };
  latencyP50Ms: number;
  devCreditTier: string; // e.g. "Alibaba 70M Tokens", "Cloudflare 100k Req/Day"
  complianceFlags: {
    icpLicenseRequired: boolean;
    cacApproved: boolean;
  };
}

export const AL_MIZAN_PROVIDERS: ModelProvider[] = [
  // 🇺🇸 US FRONTIER & EDGE PROVIDERS
  {
    name: "Cloudflare Workers AI",
    providerKey: "cloudflare",
    region: "us",
    models: ["@cf/meta/llama-3.1-8b-instruct", "@cf/meta/llama-3.3-70b-instruct"],
    costPer1kTokensUSD: { input: 0.0, output: 0.0 },
    latencyP50Ms: 180,
    devCreditTier: "Cloudflare 100k Requests/Day Free Tier",
    complianceFlags: { icpLicenseRequired: false, cacApproved: false }
  },
  {
    name: "OpenAI API",
    providerKey: "openai",
    region: "us",
    models: ["gpt-4o", "gpt-4o-mini"],
    costPer1kTokensUSD: { input: 0.0025, output: 0.010 },
    latencyP50Ms: 650,
    devCreditTier: "Standard Paid API",
    complianceFlags: { icpLicenseRequired: false, cacApproved: false }
  },
  {
    name: "Groq Cloud",
    providerKey: "groq",
    region: "us",
    models: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
    costPer1kTokensUSD: { input: 0.00059, output: 0.00079 },
    latencyP50Ms: 120,
    devCreditTier: "Groq Developer Free Rate Limits",
    complianceFlags: { icpLicenseRequired: false, cacApproved: false }
  },

  // 🇨🇳 CHINA OPEN-WEIGHTS & MOE ARBITRAGE PROVIDERS
  {
    name: "DeepSeek API",
    providerKey: "deepseek",
    region: "cn",
    models: ["deepseek-chat", "deepseek-reasoner"],
    costPer1kTokensUSD: { input: 0.00014, output: 0.00028 }, // ~18x cheaper than GPT-4o
    latencyP50Ms: 400,
    devCreditTier: "DeepSeek Direct API Tier",
    complianceFlags: { icpLicenseRequired: true, cacApproved: true }
  },
  {
    name: "Alibaba DashScope",
    providerKey: "dashscope",
    region: "cn",
    models: ["qwen-turbo", "qwen-max", "qwen2.5-coder-72b-instruct"],
    costPer1kTokensUSD: { input: 0.0003, output: 0.0006 },
    latencyP50Ms: 350,
    devCreditTier: "Alibaba 70 Million Free Qwen Dev Tokens",
    complianceFlags: { icpLicenseRequired: true, cacApproved: true }
  },
  {
    name: "Together AI",
    providerKey: "together",
    region: "cn",
    models: ["Qwen/Qwen2.5-72B-Instruct-Turbo", "deepseek-ai/DeepSeek-R1"],
    costPer1kTokensUSD: { input: 0.0009, output: 0.0009 },
    latencyP50Ms: 380,
    devCreditTier: "$25 Initial Developer Credit",
    complianceFlags: { icpLicenseRequired: false, cacApproved: true }
  },

  // 🇸🇦 MIDDLE EAST SOVEREIGN LAYER
  {
    name: "PAI MENA Sovereign Layer",
    providerKey: "mena-sovereign",
    region: "mena",
    models: ["jais-30b-chat", "falcon-180b-instruct"],
    costPer1kTokensUSD: { input: 0.0005, output: 0.001 },
    latencyP50Ms: 280,
    devCreditTier: "IQRA Substrate Sovereign Local",
    complianceFlags: { icpLicenseRequired: false, cacApproved: false }
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

    if (lang === "ar" || options.targetLocale === "mena") {
      candidate = candidate.filter(p => p.region === "mena" || p.region === "us");
    } else if (lang === "zh" || options.targetLocale === "cn") {
      candidate = candidate.filter(p => p.region === "cn" || p.providerKey === "together");
    }

    // Sort by cost efficiency or latency based on preference
    if (options.costPreference === "fastest") {
      candidate.sort((a, b) => a.latencyP50Ms - b.latencyP50Ms);
    } else {
      candidate.sort((a, b) => a.costPer1kTokensUSD.input - b.costPer1kTokensUSD.input);
    }

    const selected = candidate[0];

    return {
      routerVersion: "PAI-AL-MIZAN v1.3 (Model Arbitrage Engine)",
      detectedLanguage: lang,
      selectedProvider: selected.name,
      providerKey: selected.providerKey,
      region: selected.region,
      model: selected.models[0],
      devCreditTier: selected.devCreditTier,
      costPer1kTokensUSD: selected.costPer1kTokensUSD,
      latencyEstimateMs: selected.latencyP50Ms,
      complianceFlags: selected.complianceFlags,
      fallbackChain: candidate.map(p => p.name)
    };
  }
}
