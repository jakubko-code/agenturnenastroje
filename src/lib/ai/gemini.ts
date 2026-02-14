import { AIResult } from "@/types/ai";

const GEMINI_MODEL = "gemini-3-pro-preview";

export async function callGeminiApi(apiKey: string, prompt: string): Promise<AIResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topP: 1,
        maxOutputTokens: 8192
      }
    })
  });

  const raw = await response.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Gemini returned invalid JSON (${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data?.error?.message ?? `Gemini API error (${response.status}).`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response.");

  const usageMeta = data?.usageMetadata ?? {};
  const inputTokens = Number.isFinite(usageMeta?.promptTokenCount) ? Number(usageMeta.promptTokenCount) : null;
  const outputTokens = Number.isFinite(usageMeta?.candidatesTokenCount)
    ? Number(usageMeta.candidatesTokenCount)
    : null;
  const totalTokens = Number.isFinite(usageMeta?.totalTokenCount)
    ? Number(usageMeta.totalTokenCount)
    : inputTokens !== null && outputTokens !== null
      ? inputTokens + outputTokens
      : null;

  return {
    model: GEMINI_MODEL,
    text: String(text).trim(),
    usage: { inputTokens, outputTokens, totalTokens }
  };
}
