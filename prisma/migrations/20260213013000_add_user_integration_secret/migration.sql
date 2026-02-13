-- Add user integration secrets (per-user API keys for non-AI providers)
CREATE TYPE "IntegrationProvider" AS ENUM ('apify');

CREATE TABLE "UserIntegrationSecret" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "IntegrationProvider" NOT NULL,
  "encryptedApiKey" TEXT,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserIntegrationSecret_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserIntegrationSecret_userId_provider_key" ON "UserIntegrationSecret"("userId", "provider");
CREATE INDEX "UserIntegrationSecret_provider_userId_idx" ON "UserIntegrationSecret"("provider", "userId");

ALTER TABLE "UserIntegrationSecret"
  ADD CONSTRAINT "UserIntegrationSecret_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
