import { AIResult } from "@/types/ai";

const OPENAI_MODEL = "gpt-5";

export async function callOpenAiApi(apiKey: string, prompt: string): Promise<AIResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 1
    })
  });

  const raw = await response.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`OpenAI returned invalid JSON (${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data?.error?.message ?? `OpenAI API error (${response.status}).`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned an empty response.");

  const inputTokens = Number.isFinite(data?.usage?.prompt_tokens) ? Number(data.usage.prompt_tokens) : null;
  const outputTokens = Number.isFinite(data?.usage?.completion_tokens) ? Number(data.usage.completion_tokens) : null;
  const totalTokens = Number.isFinite(data?.usage?.total_tokens)
    ? Number(data.usage.total_tokens)
    : inputTokens !== null && outputTokens !== null
      ? inputTokens + outputTokens
      : null;

  return {
    model: data?.model ? String(data.model) : OPENAI_MODEL,
    text: String(text).trim(),
    usage: { inputTokens, outputTokens, totalTokens }
  };
}
