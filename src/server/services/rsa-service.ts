import { Provider } from "@prisma/client";
import { callClaudeApi } from "@/lib/ai/claude";
import { callGeminiApi } from "@/lib/ai/gemini";
import { callOpenAiApi } from "@/lib/ai/openai";
import { insertToolRun } from "@/server/repos/tool-run-repo";
import { resolveProviderApiKeyForUser } from "@/server/services/settings-service";
import { buildRsaPrompt, RsaFormData } from "@/server/services/rsa-prompt";

export async function generateRsaAds(args: {
  userId: string;
  model: Provider;
  formData: RsaFormData;
}): Promise<{ generatedText: string }> {
  const prompt = buildRsaPrompt(args.formData);

  try {
    const key = await resolveProviderApiKeyForUser(args.userId, args.model);
    let generatedText = "";

    if (args.model === "openai") {
      generatedText = await callOpenAiApi(key, prompt);
    } else if (args.model === "gemini") {
      generatedText = await callGeminiApi(key, prompt);
    } else {
      generatedText = await callClaudeApi(key, prompt);
    }

    await insertToolRun({
      userId: args.userId,
      toolName: "rsa",
      model: args.model,
      inputJson: args.formData,
      outputText: generatedText,
      status: "success"
    });

    return { generatedText };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error.";

    await insertToolRun({
      userId: args.userId,
      toolName: "rsa",
      model: args.model,
      inputJson: args.formData,
      status: "error",
      errorMessage: message
    });

    throw error;
  }
}
