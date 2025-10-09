import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EntryStatus } from '@prisma/client'
import { createSlug } from '@/lib/utils'
import { ensureAdminRequest } from '@/lib/auth'

interface ExampleSentencePayload {
  id?: string
  sourceText: string
  translatedText: string
}

interface UpdateEntryPayload {
  sourceWord: string
  sourceLang: 'SILESIAN' | 'POLISH'
  targetWord: string
  targetLang: 'SILESIAN' | 'POLISH'
  slug?: string | null
  pronunciation?: string | null
  partOfSpeech?: string | null
  notes?: string | null
  categoryId: string
  status: EntryStatus
  alternativeTranslations?: string[]
  exampleSentences?: ExampleSentencePayload[]
}

function sanitizeSlug(slug: string | null | undefined, fallback: string): string {
  const cleaned = createSlug(slug?.trim() || fallback)
  return cleaned || createSlug(fallback) || fallback
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const unauthorized = ensureAdminRequest(request)
  if (unauthorized) {
    return unauthorized
  }

  try {
    const { id } = params
    const payload = (await request.json()) as UpdateEntryPayload

    if (!payload.sourceWord || !payload.targetWord || !payload.categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    const entry = await prisma.dictionaryEntry.findUnique({
      where: { id },
      include: {
        exampleSentences: {
          select: { id: true },
        },
      },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const requestedSlug = sanitizeSlug(payload.slug, payload.sourceWord)

    if (entry.slug !== requestedSlug) {
      const existingSlug = await prisma.dictionaryEntry.findUnique({
        where: { slug: requestedSlug },
        select: { id: true },
      })

      if (existingSlug && existingSlug.id !== id) {
        return NextResponse.json(
          { error: 'Slug already in use. Choose a different one.' },
          { status: 409 },
        )
      }
    }

    const alternativeTranslations = (payload.alternativeTranslations || [])
      .map(translation => translation.trim())
      .filter(Boolean)

    const exampleSentences = (payload.exampleSentences || [])
      .map(sentence => ({
        id: sentence.id,
        sourceText: sentence.sourceText.trim(),
        translatedText: sentence.translatedText.trim(),
      }))
      .filter(sentence => sentence.sourceText && sentence.translatedText)

    const approvedAt =
      payload.status === EntryStatus.APPROVED
        ? entry.approvedAt ?? new Date()
        : payload.status === EntryStatus.REJECTED
          ? null
          : entry.approvedAt

    await prisma.$transaction(async tx => {
      await tx.dictionaryEntry.update({
        where: { id },
        data: {
          sourceWord: payload.sourceWord.trim(),
          sourceLang: payload.sourceLang,
          targetWord: payload.targetWord.trim(),
          targetLang: payload.targetLang,
          slug: requestedSlug,
          pronunciation: payload.pronunciation?.trim() || null,
          partOfSpeech: payload.partOfSpeech?.trim() || null,
          notes: payload.notes?.trim() || null,
          categoryId: payload.categoryId,
          status: payload.status,
          alternativeTranslations,
          approvedAt,
        },
      })

      const existingIds = entry.exampleSentences.map(example => example.id)
      const incomingIds = exampleSentences
        .map(example => example.id)
        .filter((exampleId): exampleId is string => Boolean(exampleId))

      const idsToDelete = existingIds.filter(exampleId => !incomingIds.includes(exampleId))

      if (idsToDelete.length) {
        await tx.exampleSentence.deleteMany({
          where: {
            id: { in: idsToDelete },
          },
        })
      }

      await Promise.all(
        exampleSentences.map((sentence, index) => {
          if (sentence.id) {
            return tx.exampleSentence.update({
              where: { id: sentence.id },
              data: {
                sourceText: sentence.sourceText,
                translatedText: sentence.translatedText,
                order: index + 1,
              },
            })
          }

          return tx.exampleSentence.create({
            data: {
              entryId: id,
              sourceText: sentence.sourceText,
              translatedText: sentence.translatedText,
              order: index + 1,
            },
          })
        }),
      )
    })

    const updatedEntry = await prisma.dictionaryEntry.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        exampleSentences: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!updatedEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json({
      entry: {
        id: updatedEntry.id,
        sourceWord: updatedEntry.sourceWord,
        sourceLang: updatedEntry.sourceLang,
        targetWord: updatedEntry.targetWord,
        targetLang: updatedEntry.targetLang,
        slug: updatedEntry.slug ?? undefined,
        pronunciation: updatedEntry.pronunciation ?? undefined,
        partOfSpeech: updatedEntry.partOfSpeech ?? undefined,
        notes: updatedEntry.notes ?? undefined,
        status: updatedEntry.status,
        category: updatedEntry.category,
        alternativeTranslations: updatedEntry.alternativeTranslations,
        exampleSentences: updatedEntry.exampleSentences.map(sentence => ({
          id: sentence.id,
          sourceText: sentence.sourceText,
          translatedText: sentence.translatedText,
          order: sentence.order,
        })),
        approvedAt: updatedEntry.approvedAt?.toISOString() ?? null,
        updatedAt: updatedEntry.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Admin entry update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
