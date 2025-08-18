import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Language } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
	const searchParams = request.nextUrl.searchParams
	const query = searchParams.get('q')
	const lang = searchParams.get('lang') as Language | null
	const category = searchParams.get('category')
	const limit = parseInt(searchParams.get('limit') || '10')

	if (!query) {
	  return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
	}

	// Build search conditions
	const searchConditions = {
	  OR: [
		{
		  sourceWord: {
			contains: query,
			mode: 'insensitive' as const
		  }
		},
		{
		  targetWord: {
			contains: query,
			mode: 'insensitive' as const
		  }
		},
		{
		  alternativeTranslations: {
			has: query
		  }
		}
	  ],
	  status: 'APPROVED',
	  ...(lang && {
		OR: [
		  { sourceLang: lang },
		  { targetLang: lang }
		]
	  }),
	  ...(category && {
		category: {
		  slug: category
		}
	  })
	}

	// Execute search
	const entries = await prisma.dictionaryEntry.findMany({
	  where: searchConditions,
	  include: {
		category: true,
		meanings: {
		  orderBy: { order: 'asc' }
		},
		exampleSentences: {
		  orderBy: { order: 'asc' }
		}
	  },
	  take: limit,
	  orderBy: [
		{ updatedAt: 'desc' },
		{ sourceWord: 'asc' }
	  ]
	})

	return NextResponse.json({
	  results: entries,
	  total: entries.length,
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