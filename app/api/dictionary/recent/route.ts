import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EntryStatus } from '@prisma/client'
import { createSlug } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '5', 10), 20)

    const entries = await prisma.dictionaryEntry.findMany({
      where: {
        status: EntryStatus.APPROVED,
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
      take: limit,
    })

    const payload = entries.map(entry => ({
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
      exampleSentence: entry.exampleSentences[0]
        ? {
            sourceText: entry.exampleSentences[0].sourceText,
            translatedText: entry.exampleSentences[0].translatedText,
          }
        : null,
    }))

    return NextResponse.json({ entries: payload })
  } catch (error) {
    console.error('Recent entries error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
