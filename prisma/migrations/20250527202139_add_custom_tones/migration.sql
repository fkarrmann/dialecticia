-- CreateTable
CREATE TABLE "custom_tones" (
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
