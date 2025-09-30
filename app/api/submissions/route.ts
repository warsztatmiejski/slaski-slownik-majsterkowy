import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Language } from '@prisma/client'

interface SubmissionData {
  sourceWord: string
  sourceLang: Language
  targetWord: string
  targetLang: Language
  pronunciation?: string
  categoryId: string
  partOfSpeech?: string
  exampleSentences: { sourceText: string; translatedText: string; context?: string }[]
  submitterName?: string
  submitterEmail?: string
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
	const data: SubmissionData = await request.json()

	// Validate required fields
	if (!data.sourceWord || !data.targetWord || !data.categoryId) {
	  return NextResponse.json(
		{ error: 'Missing required fields: sourceWord, targetWord, categoryId' },
		{ status: 400 }
	  )
	}

	if (!data.exampleSentences.length) {
	  return NextResponse.json(
		{ error: 'At least one example sentence is required' },
		{ status: 400 }
	  )
	}

	// Verify category exists
	const category = await prisma.category.findUnique({
	  where: { id: data.categoryId }
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
		  equals: data.sourceWord,
		  mode: 'insensitive'
		},
		targetWord: {
		  equals: data.targetWord,
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
	const submission = await prisma.publicSubmission.create({
	  data: {
		sourceWord: data.sourceWord.trim(),
		sourceLang: data.sourceLang,
		targetWord: data.targetWord.trim(),
		targetLang: data.targetLang,
		pronunciation: data.pronunciation?.trim() || null,
		categoryId: data.categoryId,
		exampleSentences: data.exampleSentences.map(e => `${e.sourceText} | ${e.translatedText}`),
		submitterName: data.submitterName?.trim() || null,
		submitterEmail: data.submitterEmail?.trim() || null,
		notes: data.notes?.trim() || null,
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
  try {
	const searchParams = request.nextUrl.searchParams
	const status = searchParams.get('status')
	const limit = parseInt(searchParams.get('limit') || '50')

	const submissions = await prisma.publicSubmission.findMany({
	  where: {
		...(status && { status: status as any })
	  },
	  orderBy: { createdAt: 'desc' },
	  take: limit
	})

	return NextResponse.json({
	  submissions,
	  total: submissions.length
	})

  } catch (error) {
	console.error('Get submissions error:', error)
	return NextResponse.json(
	  { error: 'Internal server error' },
	  { status: 500 }
	)
  }
}
