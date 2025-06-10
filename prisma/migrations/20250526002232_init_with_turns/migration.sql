-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "philosophers" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "debates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topic" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TOPIC_CLARIFICATION',
    "userId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "currentTurn" TEXT NOT NULL DEFAULT 'SOCRATES',
    "turnNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "concludedAt" DATETIME,
    CONSTRAINT "debates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "debate_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "debateId" TEXT NOT NULL,
    "philosopherId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "debate_participants_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "debates" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "debate_participants_philosopherId_fkey" FOREIGN KEY ("philosopherId") REFERENCES "philosophers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
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

-- CreateTable
CREATE TABLE "votes" (
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "philosophers_name_key" ON "philosophers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "debate_participants_debateId_philosopherId_key" ON "debate_participants"("debateId", "philosopherId");

-- CreateIndex
CREATE UNIQUE INDEX "votes_messageId_voterId_voterType_key" ON "votes"("messageId", "voterId", "voterType");
