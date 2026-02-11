import { Provider } from "@prisma/client";
import { AIUsage } from "@/types/ai";

function parsePrice(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function getPricePer1M(provider: Provider): { input: number | null; output: number | null } {
  const input = parsePrice(process.env[`PRICING_${provider.toUpperCase()}_INPUT_PER_1M_USD`]);
  const output = parsePrice(process.env[`PRICING_${provider.toUpperCase()}_OUTPUT_PER_1M_USD`]);
  return { input, output };
}

export function estimateUsdCost(provider: Provider, usage: AIUsage): number | null {
  const { input, output } = getPricePer1M(provider);
  if (input === null || output === null) return null;
  if (usage.inputTokens === null || usage.outputTokens === null) return null;

  const cost = (usage.inputTokens / 1_000_000) * input + (usage.outputTokens / 1_000_000) * output;
  return Math.round(cost * 1_000_000) / 1_000_000;
}
