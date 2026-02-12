import { Provider } from "@prisma/client";
import { callClaudeApi } from "@/lib/ai/claude";
import { callGeminiApi } from "@/lib/ai/gemini";
import { callOpenAiApi } from "@/lib/ai/openai";
import { insertToolRun } from "@/server/repos/tool-run-repo";
import { resolveProviderApiKeyForUser } from "@/server/services/settings-service";
import { buildToneOfVoicePrompt, ToneOfVoiceFormData } from "@/server/services/tone-of-voice-prompt";
import { estimateUsdCost } from "@/server/services/usage-pricing";

function normalizeToneOfVoiceHtml(rawText: string): string {
  let html = rawText.trim();
  if (html.startsWith("```")) {
    html = html.replace(/^```[a-zA-Z]*\s*/i, "").replace(/```$/i, "").trim();
  }

  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?(html|head|body)[^>]*>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){2,}/gi, "<br>");

  return html.trim();
}

export async function generateToneOfVoiceManual(args: {
  userId: string;
  model: Provider;
  formData: ToneOfVoiceFormData;
}): Promise<{ generatedText: string }> {
  const prompt = buildToneOfVoicePrompt(args.formData);

  try {
    const key = await resolveProviderApiKeyForUser(args.userId, args.model);

    const aiResult =
      args.model === "openai"
        ? await callOpenAiApi(key, prompt)
        : args.model === "gemini"
          ? await callGeminiApi(key, prompt)
          : await callClaudeApi(key, prompt);

    const outputHtml = normalizeToneOfVoiceHtml(aiResult.text);

    await insertToolRun({
      userId: args.userId,
      toolName: "tone_of_voice",
      provider: args.model,
      model: aiResult.model,
      inputJson: args.formData,
      outputText: outputHtml,
      inputTokens: aiResult.usage.inputTokens,
      outputTokens: aiResult.usage.outputTokens,
      totalTokens: aiResult.usage.totalTokens,
      estimatedCostUsd: estimateUsdCost(args.model, aiResult.usage),
      status: "success"
    });

    return { generatedText: outputHtml };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error.";

    await insertToolRun({
      userId: args.userId,
      toolName: "tone_of_voice",
      provider: args.model,
      model: args.model,
      inputJson: args.formData,
      status: "error",
      errorMessage: message
    });

    throw error;
  }
}
