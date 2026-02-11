export type AIUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
};

export type AIResult = {
  text: string;
  usage: AIUsage;
};
