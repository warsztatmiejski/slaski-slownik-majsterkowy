import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EntryStatus, Language, Prisma } from '@prisma/client'
import { createSlug } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
	const searchParams = request.nextUrl.searchParams
	const query = searchParams.get('q')?.trim()
	const lang = searchParams.get('lang') as Language | null
	const category = searchParams.get('category')
	const limit = parseInt(searchParams.get('limit') || '10')

	// Build search conditions
	const searchConditions: Prisma.DictionaryEntryWhereInput = {
	  status: EntryStatus.APPROVED,
	  AND: [] as Prisma.DictionaryEntryWhereInput[],
	}

	if (query) {
	  searchConditions.AND.push({
		OR: [
		  {
			sourceWord: {
			  contains: query,
			  mode: 'insensitive',
			},
		  },
		  {
			targetWord: {
			  contains: query,
			  mode: 'insensitive',
			},
		  },
		  {
			alternativeTranslations: {
			  has: query,
			},
		  },
		],
	  })
	}

	if (lang) {
	  searchConditions.AND.push({
		OR: [{ sourceLang: lang }, { targetLang: lang }],
	  })
	}

	if (category) {
	  searchConditions.AND.push({
		category: {
		  slug: category,
		},
	  })
	}

	if (!query && !lang && !category) {
	  return NextResponse.json(
		{ error: 'At least one filter parameter is required' },
		{ status: 400 },
	  )
	}

	// Execute search
	const entries = await prisma.dictionaryEntry.findMany({
	  where: searchConditions,
	  include: {
		category: true,
		exampleSentences: {
		  orderBy: { order: 'asc' },
		},
	  },
	  take: limit,
	  orderBy: [
		{ approvedAt: 'desc' },
		{ updatedAt: 'desc' },
	  ],
	})

	const results = entries.map(entry => ({
	  id: entry.id,
	  slug: entry.slug ?? createSlug(entry.sourceWord),
	  sourceWord: entry.sourceWord,
	  targetWord: entry.targetWord,
	  sourceLang: entry.sourceLang,
	  targetLang: entry.targetLang,
	  pronunciation: entry.pronunciation || undefined,
	  category: entry.category,
	  partOfSpeech: entry.partOfSpeech || undefined,
	  exampleSentences: entry.exampleSentences.map(example => ({
		sourceText: example.sourceText,
		translatedText: example.translatedText,
		context: example.context ?? undefined,
	  })),
	  notes: entry.notes ?? undefined,
	  alternativeTranslations: entry.alternativeTranslations,
	}))

	return NextResponse.json({
	  results,
	  total: results.length,
	  query
	})

  } catch (error) {
	console.error('Search error:', error)
	return NextResponse.json(
	  { error: 'Internal server error' },
	  { status: 500 }
	)
  }
}
