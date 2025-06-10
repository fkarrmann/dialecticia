-- CreateTable
CREATE TABLE "philosopher_favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "philosopherId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "philosopher_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "philosopher_favorites_philosopherId_fkey" FOREIGN KEY ("philosopherId") REFERENCES "philosophers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_philosophers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "philosophicalSchool" TEXT NOT NULL,
    "personalityTraits" TEXT NOT NULL,
    "coreBeliefs" TEXT NOT NULL,
    "argumentStyle" TEXT NOT NULL,
    "questioningApproach" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isDeletable" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareableId" TEXT,
    "photoUrl" TEXT,
    "publicDescription" TEXT,
    "inspirationSource" TEXT,
    "debateMechanics" TEXT NOT NULL DEFAULT 'socratic_dialogue',
    "customPrompt" TEXT,
    "tags" TEXT,
    "rating" REAL NOT NULL DEFAULT 0.0,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "philosophers_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_philosophers" ("argumentStyle", "coreBeliefs", "createdAt", "createdBy", "description", "id", "isActive", "isDefault", "isDeletable", "isPublic", "name", "personalityTraits", "philosophicalSchool", "questioningApproach", "shareableId", "updatedAt", "usageCount") SELECT "argumentStyle", "coreBeliefs", "createdAt", "createdBy", "description", "id", "isActive", "isDefault", "isDeletable", "isPublic", "name", "personalityTraits", "philosophicalSchool", "questioningApproach", "shareableId", "updatedAt", "usageCount" FROM "philosophers";
DROP TABLE "philosophers";
ALTER TABLE "new_philosophers" RENAME TO "philosophers";
CREATE UNIQUE INDEX "philosophers_name_key" ON "philosophers"("name");
CREATE UNIQUE INDEX "philosophers_shareableId_key" ON "philosophers"("shareableId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "philosopher_favorites_userId_philosopherId_key" ON "philosopher_favorites"("userId", "philosopherId");
