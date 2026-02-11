-- Archive table for long-term AI generation history retention
CREATE TABLE "ToolRunArchive" (
  "id" TEXT NOT NULL,
  "sourceRunId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "toolName" TEXT NOT NULL,
  "provider" TEXT,
  "model" TEXT NOT NULL,
  "inputJson" JSONB NOT NULL,
  "outputText" TEXT,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "totalTokens" INTEGER,
  "estimatedCostUsd" DOUBLE PRECISION,
  "status" "RunStatus" NOT NULL DEFAULT 'success',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ToolRunArchive_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ToolRunArchive_sourceRunId_key" ON "ToolRunArchive"("sourceRunId");
CREATE INDEX "ToolRunArchive_userId_createdAt_idx" ON "ToolRunArchive"("userId", "createdAt" DESC);
CREATE INDEX "ToolRunArchive_toolName_createdAt_idx" ON "ToolRunArchive"("toolName", "createdAt" DESC);
CREATE INDEX "ToolRunArchive_archivedAt_idx" ON "ToolRunArchive"("archivedAt" DESC);
