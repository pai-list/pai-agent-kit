export interface TokenBudgetEstimate {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUSD: number;
  provider: string;
  fitsInDailyFreeTier: boolean;
}

export class AlMizanTokenCalculator {
  /**
   * Estimates token count without calling LLM APIs (O(1) local math)
   * Uses ~4 characters per token heuristic for English, ~2 chars per token for Arabic/Chinese
   */
  static estimateTokens(text: string): number {
    const isArabicOrChinese = /[؀-ۿ一-鿿]/.test(text);
    const charsPerToken = isArabicOrChinese ? 2.2 : 4.0;
    return Math.ceil(text.length / charsPerToken);
  }

  /**
   * Pre-calculates simulation token consumption vs daily free point quota
   */
  static calculateSimulationBudget(prompt: string, expectedOutputLength = 500, providerKey = "deepseek"): TokenBudgetEstimate {
    const inputTokens = this.estimateTokens(prompt);
    const outputTokens = expectedOutputLength;
    
    // Model pricing per 1M tokens
    let inputRateUSD = 0.14; // DeepSeek default
    let outputRateUSD = 0.28;
    let providerName = "DeepSeek V3 (MoE)";
    let freeTierAvailable = true;

    if (providerKey === "openai") {
      inputRateUSD = 2.50;
      outputRateUSD = 10.00;
      providerName = "OpenAI GPT-4o";
      freeTierAvailable = false;
    } else if (providerKey === "cloudflare") {
      inputRateUSD = 0.00;
      outputRateUSD = 0.00;
      providerName = "Cloudflare Workers AI (100k Free Req/Day)";
      freeTierAvailable = true;
    } else if (providerKey === "dashscope") {
      inputRateUSD = 0.50;
      outputRateUSD = 0.50;
      providerName = "Alibaba DashScope (70M Free Dev Tokens)";
      freeTierAvailable = true;
    }

    const costUSD = (inputTokens * inputRateUSD + outputTokens * outputRateUSD) / 1000000;

    return {
      estimatedInputTokens: inputTokens,
      estimatedOutputTokens: outputTokens,
      estimatedCostUSD: parseFloat(costUSD.toFixed(6)),
      provider: providerName,
      fitsInDailyFreeTier: freeTierAvailable
    };
  }
}
