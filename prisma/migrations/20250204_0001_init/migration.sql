-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Language" AS ENUM ('SILESIAN', 'POLISH');

-- CreateEnum
CREATE TYPE "public"."CategoryType" AS ENUM ('TRADITIONAL', 'MODERN');

-- CreateEnum
CREATE TYPE "public"."EntryStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN');

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "type" "public"."CategoryType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dictionary_entries" (
    "id" TEXT NOT NULL,
    "sourceWord" TEXT NOT NULL,
    "sourceLang" "public"."Language" NOT NULL,
    "targetWord" TEXT NOT NULL,
    "targetLang" "public"."Language" NOT NULL,
    "slug" TEXT,
    "status" "public"."EntryStatus" NOT NULL DEFAULT 'PENDING',
    "alternativeTranslations" TEXT[],
    "pronunciation" TEXT,
    "partOfSpeech" TEXT,
    "notes" TEXT,
    "categoryId" TEXT NOT NULL,
    "submittedBy" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dictionary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."example_sentences" (
    "id" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "entryId" TEXT NOT NULL,

    CONSTRAINT "example_sentences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."public_submissions" (
    "id" TEXT NOT NULL,
    "sourceWord" TEXT NOT NULL,
    "sourceLang" "public"."Language" NOT NULL,
    "targetWord" TEXT NOT NULL,
    "targetLang" "public"."Language" NOT NULL,
    "exampleSentences" TEXT[],
    "pronunciation" TEXT,
    "partOfSpeech" TEXT,
    "categoryId" TEXT NOT NULL,
    "submitterName" TEXT,
    "submitterEmail" TEXT,
    "notes" TEXT,
    "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "public"."categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "public"."categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "dictionary_entries_slug_key" ON "public"."dictionary_entries"("slug");

-- CreateIndex
CREATE INDEX "dictionary_entries_sourceWord_idx" ON "public"."dictionary_entries"("sourceWord");

-- CreateIndex
CREATE INDEX "dictionary_entries_targetWord_idx" ON "public"."dictionary_entries"("targetWord");

-- CreateIndex
CREATE INDEX "dictionary_entries_sourceLang_targetLang_idx" ON "public"."dictionary_entries"("sourceLang", "targetLang");

-- CreateIndex
CREATE INDEX "dictionary_entries_status_idx" ON "public"."dictionary_entries"("status");

-- CreateIndex
CREATE INDEX "dictionary_entries_categoryId_idx" ON "public"."dictionary_entries"("categoryId");

-- CreateIndex
CREATE INDEX "public_submissions_status_idx" ON "public"."public_submissions"("status");

-- CreateIndex
CREATE INDEX "public_submissions_createdAt_idx" ON "public"."public_submissions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- AddForeignKey
ALTER TABLE "public"."dictionary_entries" ADD CONSTRAINT "dictionary_entries_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."example_sentences" ADD CONSTRAINT "example_sentences_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "public"."dictionary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

