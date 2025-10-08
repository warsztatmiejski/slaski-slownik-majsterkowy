import { NextResponse } from 'next/server'
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
    select: {
      sourceText: true,
      translatedText: true,
      order: true,
    },
    orderBy: { order: 'asc' },
    take: 3,
  },
} as const

const LOCALE = 'pl'

function extractInitialLetter(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) {
    return '#'
  }
  const [first] = Array.from(trimmed)
  return first ? first.toLocaleUpperCase(LOCALE) : '#'
}

export async function GET() {
  try {
    const entries = await prisma.dictionaryEntry.findMany({
      where: { status: EntryStatus.APPROVED },
      include: ENTRY_INCLUDE,
      orderBy: [{ sourceWord: 'asc' }],
    })

    const mapped = entries.map(entry => ({
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
      })),
    }))

    const letters = Array.from(
      new Set(mapped.map(entry => extractInitialLetter(entry.sourceWord))),
    ).sort((a, b) => a.localeCompare(b, LOCALE, { sensitivity: 'base' }))

    return NextResponse.json({
      entries: mapped,
      total: mapped.length,
      letters,
    })
  } catch (error) {
    console.error('Dictionary index error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
