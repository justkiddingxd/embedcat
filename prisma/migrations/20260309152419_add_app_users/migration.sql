-- CreateTable
CREATE TABLE "AppUser" (
    "discordId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT '',
    "avatar" TEXT,
    "firstLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("discordId")
);

-- CreateIndex
CREATE INDEX "AppUser_lastLogin_idx" ON "AppUser"("lastLogin");
