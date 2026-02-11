import { db } from "@/lib/db";

export async function insertToolRun(args: {
  userId: string;
  toolName: string;
  model: string;
  inputJson: unknown;
  outputText?: string;
  status: "success" | "error";
  errorMessage?: string;
}) {
  return db.toolRun.create({
    data: {
      userId: args.userId,
      toolName: args.toolName,
      model: args.model,
      inputJson: args.inputJson as object,
      outputText: args.outputText,
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
