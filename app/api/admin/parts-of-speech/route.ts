import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureAdminRequest } from '@/lib/auth'
import { createSlug } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request)
  if (unauthorized) {
    return unauthorized
  }

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
    console.error('Admin parts of speech fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request)
  if (unauthorized) {
    return unauthorized
  }

  try {
    const body = (await request.json()) as {
      label?: string
      value?: string
      order?: number
    }

    const label = body.label?.trim()
    if (!label) {
      return NextResponse.json({ error: 'Etykieta części mowy jest wymagana.' }, { status: 400 })
    }

    const rawValue = body.value?.trim() || label
    const computedValue = createSlug(rawValue)

    if (!computedValue) {
      return NextResponse.json({ error: 'Nie udało się wygenerować wartości części mowy.' }, { status: 400 })
    }

    const existing = await prisma.partOfSpeech.findUnique({ where: { value: computedValue } })
    if (existing) {
      return NextResponse.json({ error: 'Część mowy o tej wartości już istnieje.' }, { status: 409 })
    }

    const order = Number.isFinite(body.order) ? Number(body.order) : 0

    const created = await prisma.partOfSpeech.create({
      data: {
        label,
        value: computedValue,
        order,
      },
      select: {
        id: true,
        label: true,
        value: true,
        order: true,
      },
    })

    return NextResponse.json({ part: created }, { status: 201 })
  } catch (error) {
    console.error('Create part of speech error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
