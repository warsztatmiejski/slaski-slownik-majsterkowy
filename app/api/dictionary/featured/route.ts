import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EntryStatus } from '@prisma/client'
import { createSlug } from '@/lib/utils'

export async function GET() {
  try {
    const entry = await prisma.dictionaryEntry.findFirst({
      where: {
        status: EntryStatus.APPROVED,
        exampleSentences: {
          some: {},
        },
      },
      include: {
        category: true,
        exampleSentences: {
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
      orderBy: [
        { approvedAt: 'desc' },
        { updatedAt: 'desc' },
      ],
    })

    if (!entry) {
      return NextResponse.json({ entry: null })
    }

    const firstExample = entry.exampleSentences[0]

    return NextResponse.json({
      entry: {
        id: entry.id,
        slug: entry.slug ?? createSlug(entry.sourceWord),
        sourceWord: entry.sourceWord,
        targetWord: entry.targetWord,
        sourceLang: entry.sourceLang,
        targetLang: entry.targetLang,
        category: {
          id: entry.category.id,
          name: entry.category.name,
          slug: entry.category.slug,
        },
        pronunciation: entry.pronunciation ?? undefined,
        partOfSpeech: entry.partOfSpeech ?? undefined,
        notes: entry.notes ?? undefined,
        exampleSentence: firstExample
          ? {
              sourceText: firstExample.sourceText,
              translatedText: firstExample.translatedText,
              context: firstExample.context ?? undefined,
            }
          : null,
      },
    })
  } catch (error) {
    console.error('Featured entry error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
