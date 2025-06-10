-- CreateTable
CREATE TABLE "llm_providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxTokens" INTEGER NOT NULL DEFAULT 4000,
    "rateLimitRpm" INTEGER NOT NULL DEFAULT 60,
    "rateLimitTpm" INTEGER NOT NULL DEFAULT 60000,
    "costPer1kTokens" REAL NOT NULL DEFAULT 0.002,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "llm_models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxTokens" INTEGER NOT NULL DEFAULT 4000,
    "costPer1kInput" REAL NOT NULL DEFAULT 0.0025,
    "costPer1kOutput" REAL NOT NULL DEFAULT 0.01,
    "capabilities" TEXT,
    "parameters" TEXT,
    "usageFunction" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "llm_models_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "llm_providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prompt_templates" (
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
    "createdBy" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "llm_interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptTemplateId" TEXT,
    "modelId" TEXT,
    "providerId" TEXT NOT NULL,
    "functionName" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" REAL NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "inputHash" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "llm_interactions_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "prompt_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "llm_interactions_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "llm_models" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "llm_interactions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "llm_providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "llm_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "functionName" TEXT NOT NULL,
    "modelId" TEXT,
    "promptTemplateId" TEXT,
    "parameters" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "llm_providers_name_key" ON "llm_providers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "llm_models_providerId_modelName_key" ON "llm_models"("providerId", "modelName");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_templates_name_version_key" ON "prompt_templates"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "llm_configurations_functionName_key" ON "llm_configurations"("functionName");
