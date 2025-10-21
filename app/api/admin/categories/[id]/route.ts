import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/lib/utils'
import { ensureAdminRequest } from '@/lib/auth'

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
    const body = (await request.json()) as { name?: string; slug?: string; description?: string | null }

    const name = body.name?.trim()
    const slugInput = body.slug?.trim()
    const description =
      body.description === undefined || body.description === null
        ? null
        : body.description.trim() || null

    if (!name) {
      return NextResponse.json({ error: 'Nazwa kategorii jest wymagana.' }, { status: 400 })
    }
    if (!slugInput) {
      return NextResponse.json({ error: 'Slug kategorii jest wymagany.' }, { status: 400 })
    }

    const computedSlug = createSlug(slugInput)

    if (!computedSlug) {
      return NextResponse.json(
        { error: 'Nie udało się wygenerować slug-a dla kategorii.' },
        { status: 400 },
      )
    }

    const category = await prisma.category.findUnique({ where: { id } })

    if (!category) {
      return NextResponse.json({ error: 'Kategoria nie istnieje.' }, { status: 404 })
    }

    if (name !== category.name) {
      const existing = await prisma.category.findFirst({
        where: {
          name,
          NOT: { id },
        },
        select: { id: true },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Kategoria o takiej nazwie już istnieje.' },
          { status: 409 },
        )
      }
    }

    if (computedSlug !== category.slug) {
      const existingSlug = await prisma.category.findFirst({
        where: {
          slug: computedSlug,
          NOT: { id },
        },
        select: { id: true },
      })

      if (existingSlug) {
        return NextResponse.json(
          { error: 'Kategoria o tym slug-u już istnieje.' },
          { status: 409 },
        )
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug: computedSlug,
        description,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        type: true,
      },
    })

    return NextResponse.json({ category: updatedCategory })
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
