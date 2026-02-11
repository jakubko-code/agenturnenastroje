import { db } from "@/lib/db";

export async function insertToolRun(args: {
  userId: string;
  toolName: string;
  provider?: string;
  model: string;
  inputJson: unknown;
  outputText?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  estimatedCostUsd?: number | null;
  status: "success" | "error";
  errorMessage?: string;
}) {
  return db.toolRun.create({
    data: {
      userId: args.userId,
      toolName: args.toolName,
      provider: args.provider,
      model: args.model,
      inputJson: args.inputJson as object,
      outputText: args.outputText,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      totalTokens: args.totalTokens,
      estimatedCostUsd: args.estimatedCostUsd,
      status: args.status,
      errorMessage: args.errorMessage
    }
  });
}

export async function listRecentRuns(userId: string, limit = 25) {
  return db.toolRun.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit
  });
}
