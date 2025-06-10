-- CreateTable
CREATE TABLE "philosopher_personality_aspects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "philosopherId" TEXT NOT NULL,
    "aspectName" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "generatedBy" TEXT NOT NULL DEFAULT 'AI',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "philosopher_personality_aspects_philosopherId_fkey" FOREIGN KEY ("philosopherId") REFERENCES "philosophers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "philosopher_personality_aspects_philosopherId_aspectName_key" ON "philosopher_personality_aspects"("philosopherId", "aspectName");
