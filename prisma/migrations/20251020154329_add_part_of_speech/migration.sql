-- CreateTable
CREATE TABLE "public"."parts_of_speech" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parts_of_speech_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parts_of_speech_value_key" ON "public"."parts_of_speech"("value");

-- Seed default parts of speech
INSERT INTO "public"."parts_of_speech" ("id", "label", "value", "order")
VALUES
  ('pos-rzeczownik', 'rzeczownik', 'rzeczownik', 1),
  ('pos-czasownik', 'czasownik', 'czasownik', 2),
  ('pos-przymiotnik', 'przymiotnik', 'przymiotnik', 3),
  ('pos-przyslowek', 'przysłówek', 'przyslowek', 4),
  ('pos-liczebnik', 'liczebnik', 'liczebnik', 5),
  ('pos-zaimek', 'zaimek', 'zaimek', 6),
  ('pos-spojnik', 'spójnik', 'spojnik', 7),
  ('pos-przyimek', 'przyimek', 'przyimek', 8),
  ('pos-partykuła', 'partykuła', 'partykula', 9),
  ('pos-imieslow', 'imiesłów', 'imieslow', 10),
  ('pos-wykrzyknik', 'wykrzyknik', 'wykrzyknik', 11)
ON CONFLICT ("value") DO NOTHING;
