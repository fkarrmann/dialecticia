CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    TEXT PRIMARY KEY NOT NULL,
    "checksum"              TEXT NOT NULL,
    "finished_at"           DATETIME,
    "migration_name"        TEXT NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        DATETIME,
    "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS "debate_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "debateId" TEXT NOT NULL,
    "philosopherId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "debate_participants_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "debates" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "debate_participants_philosopherId_fkey" FOREIGN KEY ("philosopherId") REFERENCES "philosophers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "philosopherId" TEXT,
    "userId" TEXT,
    "turnNumber" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "debates" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_philosopherId_fkey" FOREIGN KEY ("philosopherId") REFERENCES "philosophers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "votes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "voterType" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "votes_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "votes_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "votes_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "philosophers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "debate_participants_debateId_philosopherId_key" ON "debate_participants"("debateId", "philosopherId");
CREATE UNIQUE INDEX "votes_messageId_voterId_voterType_key" ON "votes"("messageId", "voterId", "voterType");
CREATE TABLE IF NOT EXISTS "debates" (
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
CREATE TABLE IF NOT EXISTS "custom_tones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "user_description" TEXT NOT NULL,
    "ai_interpretation" TEXT NOT NULL,
    "ai_label" TEXT NOT NULL,
    "generated_prompt" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS "invitation_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "createdBy" TEXT
);
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "invitationCodeId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "lastAccessAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sessions_invitationCodeId_fkey" FOREIGN KEY ("invitationCodeId") REFERENCES "invitation_codes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "invitation_codes_code_key" ON "invitation_codes"("code");
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
CREATE TABLE IF NOT EXISTS "philosopher_personality_aspects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "philosopherId" TEXT NOT NULL,
    "aspectName" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "generatedBy" TEXT NOT NULL DEFAULT 'AI',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "philosopher_personality_aspects_philosopherId_fkey" FOREIGN KEY ("philosopherId") REFERENCES "philosophers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "philosopher_personality_aspects_philosopherId_aspectName_key" ON "philosopher_personality_aspects"("philosopherId", "aspectName");
CREATE TABLE IF NOT EXISTS "philosopher_favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "philosopherId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "philosopher_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "philosopher_favorites_philosopherId_fkey" FOREIGN KEY ("philosopherId") REFERENCES "philosophers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "philosophers" (
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
CREATE UNIQUE INDEX "philosophers_name_key" ON "philosophers"("name");
CREATE UNIQUE INDEX "philosophers_shareableId_key" ON "philosophers"("shareableId");
CREATE UNIQUE INDEX "philosopher_favorites_userId_philosopherId_key" ON "philosopher_favorites"("userId", "philosopherId");
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE TABLE IF NOT EXISTS "llm_providers" (
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
CREATE TABLE IF NOT EXISTS "llm_models" (
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
CREATE TABLE IF NOT EXISTS "prompt_templates" (
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
CREATE TABLE IF NOT EXISTS "llm_interactions" (
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
CREATE TABLE IF NOT EXISTS "llm_configurations" (
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
CREATE UNIQUE INDEX "llm_providers_name_key" ON "llm_providers"("name");
CREATE UNIQUE INDEX "llm_models_providerId_modelName_key" ON "llm_models"("providerId", "modelName");
CREATE UNIQUE INDEX "prompt_templates_name_version_key" ON "prompt_templates"("name", "version");
CREATE UNIQUE INDEX "llm_configurations_functionName_key" ON "llm_configurations"("functionName");
