-- CreateTable
CREATE TABLE "SavedEmbed" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "mode" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedEmbed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedEmbed_userId_idx" ON "SavedEmbed"("userId");
