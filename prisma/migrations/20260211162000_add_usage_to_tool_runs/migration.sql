-- Add provider and token/cost usage metrics to tool runs history
ALTER TABLE "ToolRun"
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "inputTokens" INTEGER,
  ADD COLUMN "outputTokens" INTEGER,
  ADD COLUMN "totalTokens" INTEGER,
  ADD COLUMN "estimatedCostUsd" DOUBLE PRECISION;
