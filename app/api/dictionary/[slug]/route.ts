import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EntryStatus } from '@prisma/client'
import { createSlug } from '@/lib/utils'

const ENTRY_INCLUDE = {
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
} as const

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params

    const normalizedSlug = slug.trim().toLowerCase()

    let entry = await prisma.dictionaryEntry.findFirst({
      where: {
        status: EntryStatus.APPROVED,
        slug: normalizedSlug,
      },
      include: ENTRY_INCLUDE,
    })

    if (!entry) {
      const fallbackEntries = await prisma.dictionaryEntry.findMany({
        where: {
          status: EntryStatus.APPROVED,
        },
        include: ENTRY_INCLUDE,
      })

      entry = fallbackEntries.find(item => {
        const computedSlug = createSlug(item.sourceWord)
        return computedSlug === normalizedSlug
      })
    }

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json({
      entry: {
        id: entry.id,
        slug: entry.slug ?? createSlug(entry.sourceWord),
        sourceWord: entry.sourceWord,
        targetWord: entry.targetWord,
        sourceLang: entry.sourceLang,
        targetLang: entry.targetLang,
        pronunciation: entry.pronunciation ?? undefined,
        partOfSpeech: entry.partOfSpeech ?? undefined,
        notes: entry.notes ?? undefined,
        alternativeTranslations: entry.alternativeTranslations,
        category: entry.category,
        exampleSentences: entry.exampleSentences.map(sentence => ({
          sourceText: sentence.sourceText,
          translatedText: sentence.translatedText,
          context: sentence.context ?? undefined,
        })),
      },
    })
  } catch (error) {
    console.error('Dictionary entry error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
