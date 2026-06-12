-- DropForeignKey
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_categoryId_fkey";

-- DropIndex
DROP INDEX "submissions_categoryId_idx";

-- AlterTable
ALTER TABLE "submissions" DROP COLUMN "categoryId";

-- DropTable
DROP TABLE "categories";

