-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_prompt_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "systemPrompt" TEXT NOT NULL,
    "userPrompt" TEXT,
    "parameters" TEXT,
    "description" TEXT,
    "usage" TEXT,
    "testData" TEXT,
    "modelId" TEXT,
    "createdBy" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "prompt_templates_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "llm_models" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_prompt_templates" ("category", "createdAt", "createdBy", "description", "displayName", "id", "isActive", "metadata", "name", "parameters", "systemPrompt", "testData", "updatedAt", "usage", "userPrompt", "version") SELECT "category", "createdAt", "createdBy", "description", "displayName", "id", "isActive", "metadata", "name", "parameters", "systemPrompt", "testData", "updatedAt", "usage", "userPrompt", "version" FROM "prompt_templates";
DROP TABLE "prompt_templates";
ALTER TABLE "new_prompt_templates" RENAME TO "prompt_templates";
CREATE UNIQUE INDEX "prompt_templates_name_version_key" ON "prompt_templates"("name", "version");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
