-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "campusId" TEXT;

-- CreateTable
CREATE TABLE "campuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_campuses" (
    "careerId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,

    CONSTRAINT "career_campuses_pkey" PRIMARY KEY ("careerId","campusId")
);

-- CreateIndex
CREATE UNIQUE INDEX "campuses_name_key" ON "campuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "campuses_slug_key" ON "campuses"("slug");

-- CreateIndex
CREATE INDEX "career_campuses_campusId_idx" ON "career_campuses"("campusId");

-- CreateIndex
CREATE INDEX "submissions_campusId_idx" ON "submissions"("campusId");

-- AddForeignKey
ALTER TABLE "career_campuses" ADD CONSTRAINT "career_campuses_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "careers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_campuses" ADD CONSTRAINT "career_campuses_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

