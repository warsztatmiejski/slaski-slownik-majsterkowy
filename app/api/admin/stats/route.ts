import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EntryStatus, SubmissionStatus } from '@prisma/client'
import { ensureAdminRequest } from '@/lib/auth'

function startOfToday(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

export async function GET(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request)
  if (unauthorized) {
    return unauthorized
  }

  try {
    const today = startOfToday()

    const [totalEntries, pendingSubmissions, approvedToday, rejectedToday] = await Promise.all([
      prisma.dictionaryEntry.count({
        where: { status: EntryStatus.APPROVED },
      }),
      prisma.publicSubmission.count({
        where: { status: SubmissionStatus.PENDING },
      }),
      prisma.dictionaryEntry.count({
        where: {
          status: EntryStatus.APPROVED,
          approvedAt: { gte: today },
        },
      }),
      prisma.publicSubmission.count({
        where: {
          status: SubmissionStatus.REJECTED,
          reviewedAt: { gte: today },
        },
      }),
    ])

    return NextResponse.json({
      totalEntries,
      pendingSubmissions,
      approvedToday,
      rejectedToday,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
