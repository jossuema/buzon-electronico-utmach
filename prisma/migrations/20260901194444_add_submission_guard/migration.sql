-- CreateTable
CREATE TABLE "submission_guards" (
    "id" TEXT NOT NULL,
    "deviceHash" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_guards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submission_guards_deviceHash_createdAt_idx" ON "submission_guards"("deviceHash", "createdAt");

-- CreateIndex
CREATE INDEX "submission_guards_ipHash_createdAt_idx" ON "submission_guards"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "submission_guards_contentHash_createdAt_idx" ON "submission_guards"("contentHash", "createdAt");

