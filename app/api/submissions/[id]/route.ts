import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EntryStatus, SubmissionStatus } from '@prisma/client'

interface ReviewData {
  action: 'approve' | 'reject'
  reviewNotes?: string
  adminId: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
	const { action, reviewNotes, adminId }: ReviewData = await request.json()
	const submissionId = params.id

	if (!action || !adminId) {
	  return NextResponse.json(
		{ error: 'Missing required fields: action, adminId' },
		{ status: 400 }
	  )
	}

	// Get the submission
	const submission = await prisma.publicSubmission.findUnique({
	  where: { id: submissionId },
	  include: {
		category: true
	  }
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
			context: '',
			order: index + 1
		  }
		})

		// Create dictionary entry
		const entry = await tx.dictionaryEntry.create({
		  data: {
			sourceWord: submission.sourceWord,
			sourceLang: submission.sourceLang,
			targetWord: submission.targetWord,
			targetLang: submission.targetLang,
			pronunciation: submission.pronunciation,
			categoryId: submission.categoryId,
			status: EntryStatus.APPROVED,
			submittedBy: submission.submitterEmail || submission.submitterName,
			approvedAt: new Date(),
			approvedBy: adminId,
			exampleSentences: {
			  create: exampleSentences
			}
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
