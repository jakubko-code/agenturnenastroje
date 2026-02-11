import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseIntEnv(name, defaultValue) {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) return defaultValue;
  return value;
}

async function main() {
  const retentionDays = parseIntEnv("RETENTION_DAYS", 90);
  const batchSize = parseIntEnv("ARCHIVE_BATCH_SIZE", 250);
  const maxBatches = parseIntEnv("ARCHIVE_MAX_BATCHES", 50);
  const dryRun = process.env.ARCHIVE_DRY_RUN === "true";

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  console.log(
    `[archive] start retentionDays=${retentionDays} batchSize=${batchSize} maxBatches=${maxBatches} dryRun=${dryRun}`
  );
  console.log(`[archive] cutoff=${cutoff.toISOString()}`);

  let totalArchived = 0;

  for (let i = 0; i < maxBatches; i += 1) {
    const runs = await prisma.toolRun.findMany({
      where: { createdAt: { lt: cutoff } },
      orderBy: { createdAt: "asc" },
      take: batchSize
    });

    if (runs.length === 0) {
      console.log("[archive] no more rows to archive");
      break;
    }

    if (dryRun) {
      totalArchived += runs.length;
      console.log(`[archive] dry-run batch=${i + 1} rows=${runs.length}`);
      continue;
    }

    const runIds = runs.map((run) => run.id);

    await prisma.$transaction([
      prisma.toolRunArchive.createMany({
        data: runs.map((run) => ({
          sourceRunId: run.id,
          userId: run.userId,
          toolName: run.toolName,
          provider: run.provider,
          model: run.model,
          inputJson: run.inputJson,
          outputText: run.outputText,
          inputTokens: run.inputTokens,
          outputTokens: run.outputTokens,
          totalTokens: run.totalTokens,
          estimatedCostUsd: run.estimatedCostUsd,
          status: run.status,
          errorMessage: run.errorMessage,
          createdAt: run.createdAt
        })),
        skipDuplicates: true
      }),
      prisma.toolRun.deleteMany({
        where: { id: { in: runIds } }
      })
    ]);

    totalArchived += runs.length;
    console.log(`[archive] batch=${i + 1} archived=${runs.length} total=${totalArchived}`);
  }

  console.log(`[archive] done totalArchived=${totalArchived}`);
}

main()
  .catch((error) => {
    console.error("[archive] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
