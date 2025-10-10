import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Language, SubmissionStatus, CategoryType } from '@prisma/client'
import { ensureAdminRequest } from '@/lib/auth'
import { createSlug } from '@/lib/utils'

interface SubmissionData {
  sourceWord: string
  sourceLang: Language
  targetWord: string
  targetLang: Language
  pronunciation?: string
  categoryId: string
  partOfSpeech?: string
  exampleSentences: { sourceText: string; translatedText: string }[]
  submitterName?: string
  submitterEmail?: string
  notes?: string
  newCategoryName?: string
  alternativeTranslations?: string[]
}

export async function POST(request: NextRequest) {
  try {
	const data: SubmissionData = await request.json()

	const translations = (data.targetWord || '')
	  .split(',')
	  .map(value => value.trim())
	  .filter(Boolean)

	const primaryTargetWord = translations.shift() ?? data.targetWord?.trim() ?? ''
	const alternativeTranslations = translations
	const trimmedSourceWord = data.sourceWord?.trim() ?? ''
	const newCategoryName = data.newCategoryName?.trim() ?? ''
	let categoryId = data.categoryId?.trim() ?? ''

	if (!categoryId && newCategoryName) {
	  const slug = createSlug(newCategoryName)
	  if (!slug) {
		return NextResponse.json({ error: 'Nie udało się utworzyć nowej kategorii.' }, { status: 400 })
	  }

	  const existingCategory = await prisma.category.findFirst({
		where: { slug },
		select: { id: true },
	  })

	  if (existingCategory) {
		categoryId = existingCategory.id
	  } else {
		const category = await prisma.category.create({
		  data: {
			name: newCategoryName,
			slug,
			type: CategoryType.TRADITIONAL,
		  },
		  select: { id: true },
		})
		categoryId = category.id
	  }
	}

	// Validate required fields
	if (!trimmedSourceWord || !primaryTargetWord || !categoryId) {
	  return NextResponse.json(
		{ error: 'Missing required fields: sourceWord, targetWord, categoryId' },
		{ status: 400 }
	  )
	}

	const cleanedExamples = (data.exampleSentences || []).map(example => ({
	  sourceText: example.sourceText.trim(),
	  translatedText: example.translatedText.trim(),
	}))

	if (!cleanedExamples.length || !cleanedExamples[0].sourceText || !cleanedExamples[0].translatedText) {
	  return NextResponse.json(
		{ error: 'At least one example sentence is required' },
		{ status: 400 }
	  )
	}

	// Verify category exists
	const category = await prisma.category.findUnique({
	  where: { id: categoryId }
	})

	if (!category) {
	  return NextResponse.json(
		{ error: 'Invalid category ID' },
		{ status: 400 }
	  )
	}

	// Check for duplicate submissions
	const existingSubmission = await prisma.publicSubmission.findFirst({
	  where: {
		sourceWord: {
		  equals: trimmedSourceWord,
		  mode: 'insensitive'
		},
		targetWord: {
		  equals: primaryTargetWord,
		  mode: 'insensitive'
		},
		status: 'PENDING'
	  }
	})

	if (existingSubmission) {
	  return NextResponse.json(
		{ error: 'A similar submission is already pending review' },
		{ status: 409 }
	  )
	}

	// Create submission
	const noteLines = [
	  data.notes?.trim() || null,
	  newCategoryName ? `Propozycja nowej kategorii: ${newCategoryName}` : null,
	  alternativeTranslations.length ? `Alternatywne tłumaczenia: ${alternativeTranslations.join(', ')}` : null,
	].filter(Boolean)

	const submission = await prisma.publicSubmission.create({
	  data: {
		sourceWord: trimmedSourceWord,
		sourceLang: data.sourceLang,
		targetWord: primaryTargetWord,
		targetLang: data.targetLang,
		pronunciation: data.pronunciation?.trim() || null,
		partOfSpeech: data.partOfSpeech?.trim() || null,
		categoryId,
		exampleSentences: cleanedExamples.map(e => `${e.sourceText} | ${e.translatedText}`),
		submitterName: data.submitterName?.trim() || null,
		submitterEmail: data.submitterEmail?.trim() || null,
		notes: noteLines.length ? noteLines.join('\n') : null,
		status: 'PENDING'
	  }
	})

	return NextResponse.json({
	  success: true,
	  submissionId: submission.id,
	  message: 'Submission created successfully'
	}, { status: 201 })

  } catch (error) {
	console.error('Submission error:', error)
	return NextResponse.json(
	  { error: 'Internal server error' },
	  { status: 500 }
	)
  }
}

export async function GET(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request)
  if (unauthorized) {
    return unauthorized
  }

  try {
	const searchParams = request.nextUrl.searchParams
	const status = searchParams.get('status') as SubmissionStatus | null
	const limit = parseInt(searchParams.get('limit') || '50')

  const submissions = await prisma.publicSubmission.findMany({
		  where: {
			...(status && { status }),
		  },
	  orderBy: { createdAt: 'desc' },
	  take: limit
	})

	const categoryIds = Array.from(new Set(submissions.map(submission => submission.categoryId)))
	const categories = categoryIds.length
	  ? await prisma.category.findMany({
	      where: {
	        id: {
	          in: categoryIds,
	        },
	      },
	      select: {
	        id: true,
	        name: true,
	        slug: true,
	      },
	    })
	  : []

	const categoryMap = new Map(categories.map(category => [category.id, category]))

	const payload = submissions.map(submission => ({
	  id: submission.id,
	  sourceWord: submission.sourceWord,
	  sourceLang: submission.sourceLang,
	  targetWord: submission.targetWord,
	  targetLang: submission.targetLang,
	  pronunciation: submission.pronunciation ?? undefined,
	  partOfSpeech: submission.partOfSpeech ?? undefined,
	  category: categoryMap.get(submission.categoryId) ?? null,
	  categoryId: submission.categoryId,
	  status: submission.status,
	  submittedAt: submission.createdAt.toISOString(),
	  submitterName: submission.submitterName ?? undefined,
	  submitterEmail: submission.submitterEmail ?? undefined,
	  notes: submission.notes ?? undefined,
	  exampleSentences: submission.exampleSentences.map(example => {
		const [sourceText, translatedText = ''] = example.split('|')
		return {
		  sourceText: sourceText.trim(),
		  translatedText: translatedText.trim(),
		}
	  }),
	}))

	return NextResponse.json({
	  submissions: payload,
	  total: payload.length
	})

  } catch (error) {
	console.error('Get submissions error:', error)
	return NextResponse.json(
	  { error: 'Internal server error' },
	  { status: 500 }
	)
  }
}
