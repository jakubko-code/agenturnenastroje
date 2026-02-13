-- Add per-user restricted page access mapping
CREATE TYPE "RestrictedPage" AS ENUM ('reporting_google_ads', 'reporting_meta_ads');

CREATE TABLE "UserPageAccess" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "page" "RestrictedPage" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserPageAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserPageAccess_userId_page_key" ON "UserPageAccess"("userId", "page");
CREATE INDEX "UserPageAccess_page_userId_idx" ON "UserPageAccess"("page", "userId");

ALTER TABLE "UserPageAccess"
  ADD CONSTRAINT "UserPageAccess_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
