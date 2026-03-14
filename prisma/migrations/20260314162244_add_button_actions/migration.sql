-- CreateTable
CREATE TABLE "ButtonAction" (
    "id" TEXT NOT NULL,
    "embedId" TEXT NOT NULL,
    "buttonId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "style" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ButtonAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "buttonActionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ButtonAction_embedId_idx" ON "ButtonAction"("embedId");

-- CreateIndex
CREATE UNIQUE INDEX "ButtonAction_embedId_buttonId_key" ON "ButtonAction"("embedId", "buttonId");

-- CreateIndex
CREATE INDEX "Action_buttonActionId_idx" ON "Action"("buttonActionId");

-- CreateIndex
CREATE INDEX "Action_buttonActionId_order_idx" ON "Action"("buttonActionId", "order");

-- AddForeignKey
ALTER TABLE "ButtonAction" ADD CONSTRAINT "ButtonAction_embedId_fkey" FOREIGN KEY ("embedId") REFERENCES "SavedEmbed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_buttonActionId_fkey" FOREIGN KEY ("buttonActionId") REFERENCES "ButtonAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
