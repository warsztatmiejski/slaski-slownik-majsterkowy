import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EntryStatus, SubmissionStatus } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import { createSlug } from '@/lib/utils'
import { ensureAdminRequest } from '@/lib/auth'

async function generateUniqueSlug(base: string, client: PrismaClient = prisma) {
  const fallback = base || `haslo-${Date.now()}`
  const baseSlug = createSlug(fallback) || fallback.toLowerCase().replace(/\s+/g, '-')
  let slug = baseSlug || `haslo-${Date.now()}`
  let counter = 2

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await client.dictionaryEntry.findUnique({ where: { slug } })
    if (!existing) {
      return slug
    }
    slug = `${baseSlug}-${counter}`
    counter += 1
  }
}

interface ReviewData {
  action: 'approve' | 'reject'
  reviewNotes?: string
  adminId: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = ensureAdminRequest(request)
  if (unauthorized) {
    return unauthorized
  }

  try {
	const { action, reviewNotes, adminId }: ReviewData = await request.json()
	const { id: submissionId } = params

	if (!action || !adminId) {
	  return NextResponse.json(
		{ error: 'Missing required fields: action, adminId' },
		{ status: 400 }
	  )
	}

	// Get the submission
	const submission = await prisma.publicSubmission.findUnique({
	  where: { id: submissionId },
	})

	if (!submission) {
	  return NextResponse.json(
		{ error: 'Submission not found' },
		{ status: 404 }
	  )
	}

	if (submission.status !== 'PENDING') {
	  return NextResponse.json(
		{ error: 'Submission has already been reviewed' },
		{ status: 400 }
	  )
	}

	if (action === 'approve') {
	  // Create a transaction to approve submission and create dictionary entry
	const result = await prisma.$transaction(async (tx) => {
		// Parse example sentences
		const exampleSentences = submission.exampleSentences.map((example, index) => {
		  const [sourceText, translatedText] = example.split(' | ')
		  return {
			sourceText: sourceText || '',
			translatedText: translatedText || '',
			order: index + 1
		  }
		})

		const alternativeTranslations =
		  submission.notes
		    ?.split('\n')
		    .map(line => line.trim())
		    .find(line => line.startsWith('Alternatywne tłumaczenia: '))
		    ?.replace('Alternatywne tłumaczenia: ', '')
		    .split(',')
		    .map(value => value.trim())
		    .filter(Boolean) ?? []

		const slug = await generateUniqueSlug(submission.sourceWord, tx)

		// Create dictionary entry
		const entry = await tx.dictionaryEntry.create({
		  data: {
			sourceWord: submission.sourceWord,
			sourceLang: submission.sourceLang,
			targetWord: submission.targetWord,
			targetLang: submission.targetLang,
			slug,
			pronunciation: submission.pronunciation,
			partOfSpeech: submission.partOfSpeech,
			notes: submission.notes,
			categoryId: submission.categoryId,
			status: EntryStatus.APPROVED,
			submittedBy: submission.submitterEmail || submission.submitterName,
			approvedAt: new Date(),
			approvedBy: adminId,
			exampleSentences: {
			  create: exampleSentences
			},
			alternativeTranslations,
		  }
		})

		// Update submission status
		const updatedSubmission = await tx.publicSubmission.update({
		  where: { id: submissionId },
		  data: {
			status: SubmissionStatus.APPROVED,
			reviewedAt: new Date(),
			reviewedBy: adminId,
			reviewNotes
		  }
		})

		return { entry, submission: updatedSubmission }
	  })

	  return NextResponse.json({
		success: true,
		message: 'Submission approved and dictionary entry created',
		entryId: result.entry.id
	  })

	} else if (action === 'reject') {
	  // Update submission status to rejected
	  const updatedSubmission = await prisma.publicSubmission.update({
		where: { id: submissionId },
		data: {
		  status: SubmissionStatus.REJECTED,
		  reviewedAt: new Date(),
		  reviewedBy: adminId,
		  reviewNotes
		}
	  })

	  return NextResponse.json({
		success: true,
		message: 'Submission rejected',
		submission: updatedSubmission
	  })
	}

	return NextResponse.json(
	  { error: 'Invalid action' },
	  { status: 400 }
	)

  } catch (error) {
	console.error('Review submission error:', error)
	return NextResponse.json(
	  { error: 'Internal server error' },
	  { status: 500 }
	)
  }
}
