-- CreateTable
CREATE TABLE "UnlimitedUser" (
    "discordId" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnlimitedUser_pkey" PRIMARY KEY ("discordId")
);
