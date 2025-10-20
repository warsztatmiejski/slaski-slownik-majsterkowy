import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const parts = await prisma.partOfSpeech.findMany({
      orderBy: [{ order: 'asc' }, { label: 'asc' }],
      select: {
        id: true,
        label: true,
        value: true,
        order: true,
      },
    })

    return NextResponse.json({ parts })
  } catch (error) {
    console.error('Public parts of speech fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
