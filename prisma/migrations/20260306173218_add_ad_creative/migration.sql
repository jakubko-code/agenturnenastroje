-- CreateTable
CREATE TABLE "CreativeClient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "defaultStyle" TEXT NOT NULL,
    "defaultLighting" TEXT NOT NULL,
    "defaultColorGrading" TEXT NOT NULL,
    "defaultAspectRatio" TEXT NOT NULL,
    "brandNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreativeClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCreativeRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "promptJson" JSONB NOT NULL,
    "imagePath" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdCreativeRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdCreativeRun_userId_createdAt_idx" ON "AdCreativeRun"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AdCreativeRun_clientId_createdAt_idx" ON "AdCreativeRun"("clientId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "AdCreativeRun" ADD CONSTRAINT "AdCreativeRun_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CreativeClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
