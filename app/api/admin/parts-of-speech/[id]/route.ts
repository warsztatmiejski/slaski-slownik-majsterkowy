import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureAdminRequest } from '@/lib/auth'
import { createSlug } from '@/lib/utils'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const unauthorized = ensureAdminRequest(request)
  if (unauthorized) {
    return unauthorized
  }

  try {
    const { id } = params
    const body = (await request.json()) as {
      label?: string
      value?: string
      order?: number
    }

    const existing = await prisma.partOfSpeech.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Część mowy nie istnieje.' }, { status: 404 })
    }

    const label = body.label?.trim()
    const rawValue = body.value?.trim()
    let nextValue: string | undefined

    if (rawValue !== undefined) {
      const computed = createSlug(rawValue || label || existing.label)
      if (!computed) {
        return NextResponse.json({ error: 'Niepoprawna wartość części mowy.' }, { status: 400 })
      }
      nextValue = computed
      if (nextValue !== existing.value) {
        const duplicate = await prisma.partOfSpeech.findUnique({
          where: { value: nextValue },
          select: { id: true },
        })
        if (duplicate && duplicate.id !== id) {
          return NextResponse.json({ error: 'Część mowy o tej wartości już istnieje.' }, { status: 409 })
        }
      }
    }

    const data: {
      label?: string
      value?: string
      order?: number
    } = {}

    if (label !== undefined) {
      if (!label) {
        return NextResponse.json({ error: 'Etykieta nie może być pusta.' }, { status: 400 })
      }
      data.label = label
    }

    if (nextValue !== undefined) {
      data.value = nextValue
    }

    if (body.order !== undefined) {
      data.order = Number.isFinite(body.order) ? Number(body.order) : existing.order
    }

    const updated = await prisma.partOfSpeech.update({
      where: { id },
      data,
      select: {
        id: true,
        label: true,
        value: true,
        order: true,
      },
    })

    return NextResponse.json({ part: updated })
  } catch (error) {
    console.error('Update part of speech error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const unauthorized = ensureAdminRequest(request)
  if (unauthorized) {
    return unauthorized
  }

  try {
    const { id } = params

    const existing = await prisma.partOfSpeech.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Część mowy nie istnieje.' }, { status: 404 })
    }

    const linkedEntries = await prisma.dictionaryEntry.count({
      where: { partOfSpeech: existing.value },
    })

    if (linkedEntries > 0) {
      return NextResponse.json(
        { error: 'Nie można usunąć części mowy używanej w istniejących hasłach.' },
        { status: 409 },
      )
    }

    await prisma.partOfSpeech.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete part of speech error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
