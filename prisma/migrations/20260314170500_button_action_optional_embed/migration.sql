ALTER TABLE "ButtonAction" ALTER COLUMN "embedId" DROP NOT NULL;
ALTER TABLE "ButtonAction" ADD COLUMN "messageId" TEXT;
ALTER TABLE "ButtonAction" DROP CONSTRAINT IF EXISTS "ButtonAction_embedId_buttonId_key";
CREATE UNIQUE INDEX "ButtonAction_buttonId_key" ON "ButtonAction"("buttonId");
CREATE INDEX "ButtonAction_messageId_idx" ON "ButtonAction"("messageId");
