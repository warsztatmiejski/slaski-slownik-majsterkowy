import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EntryStatus, Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')?.trim()
    const statusParam = searchParams.get('status') as EntryStatus | null
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 200)

    const where: Prisma.DictionaryEntryWhereInput = {}

    if (statusParam) {
      where.status = statusParam
    }

    if (search) {
      where.OR = [
        { sourceWord: { contains: search, mode: 'insensitive' } },
        { targetWord: { contains: search, mode: 'insensitive' } },
        { alternativeTranslations: { has: search } },
      ]
    }

    const entries = await prisma.dictionaryEntry.findMany({
      where,
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
      orderBy: [{ updatedAt: 'desc' }],
      take: limit,
    })

    const payload = entries.map(entry => ({
      id: entry.id,
      sourceWord: entry.sourceWord,
      sourceLang: entry.sourceLang,
      targetWord: entry.targetWord,
      targetLang: entry.targetLang,
      slug: entry.slug ?? undefined,
      pronunciation: entry.pronunciation ?? undefined,
      partOfSpeech: entry.partOfSpeech ?? undefined,
      notes: entry.notes ?? undefined,
      status: entry.status,
      category: entry.category,
      alternativeTranslations: entry.alternativeTranslations,
      exampleSentences: entry.exampleSentences.map(sentence => ({
        id: sentence.id,
        sourceText: sentence.sourceText,
        translatedText: sentence.translatedText,
        order: sentence.order,
      })),
      approvedAt: entry.approvedAt?.toISOString() ?? null,
      updatedAt: entry.updatedAt.toISOString(),
    }))

    return NextResponse.json({ entries: payload, total: payload.length })
  } catch (error) {
    console.error('Admin entries fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
