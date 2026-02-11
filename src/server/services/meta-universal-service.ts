import { Provider } from "@prisma/client";
import { callClaudeApi } from "@/lib/ai/claude";
import { callGeminiApi } from "@/lib/ai/gemini";
import { callOpenAiApi } from "@/lib/ai/openai";
import { insertToolRun } from "@/server/repos/tool-run-repo";
import { buildMetaUniversalPrompt, MetaUniversalFormData } from "@/server/services/meta-universal-prompt";
import { resolveProviderApiKeyForUser } from "@/server/services/settings-service";

export async function generateMetaUniversalTexts(args: {
  userId: string;
  model: Provider;
  formData: MetaUniversalFormData;
}): Promise<{ generatedText: string }> {
  const prompt = buildMetaUniversalPrompt(args.formData);

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
      toolName: "meta_universal",
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
      toolName: "meta_universal",
      model: args.model,
      inputJson: args.formData,
      status: "error",
      errorMessage: message
    });

    throw error;
  }
}
