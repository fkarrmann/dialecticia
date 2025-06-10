/*
  Warnings:

  - You are about to drop the column `turnNumber` on the `debates` table. All the data in the column will be lost.
  - Made the column `description` on table `debates` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_debates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TOPIC_CLARIFICATION',
    "currentTurn" TEXT NOT NULL DEFAULT 'SOCRATES_QUESTION',
    "nextSpeaker" TEXT NOT NULL DEFAULT 'PHILOSOPHER',
    "currentPhase" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "concludedAt" DATETIME,
    CONSTRAINT "debates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_debates" ("concludedAt", "createdAt", "currentTurn", "description", "id", "isPublic", "status", "topic", "updatedAt", "userId") SELECT "concludedAt", "createdAt", "currentTurn", "description", "id", "isPublic", "status", "topic", "updatedAt", "userId" FROM "debates";
DROP TABLE "debates";
ALTER TABLE "new_debates" RENAME TO "debates";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
