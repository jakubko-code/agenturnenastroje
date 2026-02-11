export async function callClaudeApi(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const raw = await response.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Claude returned invalid JSON (${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data?.error?.message ?? `Claude API error (${response.status}).`);
  }

  const block = (data?.content ?? []).find((item: any) => item?.type === "text");
  const text = block?.text;
  if (!text) throw new Error("Claude returned an empty response.");

  if (data?.stop_reason === "max_tokens") {
    return `${String(text).trim()}\n\n[NOTE: output truncated by max token limit.]`;
  }

  return String(text).trim();
}
