-- Truncate existing IDs to fit VarChar(12)
UPDATE "SavedEmbed" SET "id" = LEFT("id", 7);

-- AlterTable
ALTER TABLE "SavedEmbed" DROP CONSTRAINT "SavedEmbed_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(12),
ADD CONSTRAINT "SavedEmbed_pkey" PRIMARY KEY ("id");
