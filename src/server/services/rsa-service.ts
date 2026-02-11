import { Provider } from "@prisma/client";
import { callClaudeApi } from "@/lib/ai/claude";
import { callGeminiApi } from "@/lib/ai/gemini";
import { callOpenAiApi } from "@/lib/ai/openai";
import { insertToolRun } from "@/server/repos/tool-run-repo";
import { buildRsaPrompt, RsaFormData } from "@/server/services/rsa-prompt";
import { resolveProviderApiKeyForUser } from "@/server/services/settings-service";
import { estimateUsdCost } from "@/server/services/usage-pricing";

export async function generateRsaAds(args: {
  userId: string;
  model: Provider;
  formData: RsaFormData;
}): Promise<{ generatedText: string }> {
  const prompt = buildRsaPrompt(args.formData);

  try {
    const key = await resolveProviderApiKeyForUser(args.userId, args.model);

    const aiResult =
      args.model === "openai"
        ? await callOpenAiApi(key, prompt)
        : args.model === "gemini"
          ? await callGeminiApi(key, prompt)
          : await callClaudeApi(key, prompt);

    await insertToolRun({
      userId: args.userId,
      toolName: "rsa",
      provider: args.model,
      model: args.model,
      inputJson: args.formData,
      outputText: aiResult.text,
      inputTokens: aiResult.usage.inputTokens,
      outputTokens: aiResult.usage.outputTokens,
      totalTokens: aiResult.usage.totalTokens,
      estimatedCostUsd: estimateUsdCost(args.model, aiResult.usage),
      status: "success"
    });

    return { generatedText: aiResult.text };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error.";

    await insertToolRun({
      userId: args.userId,
      toolName: "rsa",
      provider: args.model,
      model: args.model,
      inputJson: args.formData,
      status: "error",
      errorMessage: message
    });

    throw error;
  }
}
