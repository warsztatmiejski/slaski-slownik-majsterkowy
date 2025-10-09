import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/lib/utils'
import { CategoryType } from '@prisma/client'
import { ensureAdminRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request)
  if (unauthorized) {
    return unauthorized
  }

  try {
    const {
      name,
      slug,
      type,
    }: { name?: string; slug?: string; type?: CategoryType } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nazwa kategorii jest wymagana.' }, { status: 400 })
    }

    const fallbackSlugSource = slug?.trim() || name
    const computedSlug = createSlug(fallbackSlugSource)

    if (!computedSlug) {
      return NextResponse.json({ error: 'Nie udało się wygenerować slug-a dla kategorii.' }, { status: 400 })
    }

    const existing = await prisma.category.findUnique({
      where: { slug: computedSlug },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json({ error: 'Kategoria o tym slug-u już istnieje.' }, { status: 409 })
    }

    const categoryType = type && Object.values(CategoryType).includes(type)
      ? type
      : CategoryType.TRADITIONAL

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: computedSlug,
        type: categoryType,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        type: true,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const unauthorized = ensureAdminRequest(request)
  if (unauthorized) {
    return unauthorized
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Brak identyfikatora kategorii.' }, { status: 400 })
    }

    const category = await prisma.category.findUnique({ where: { id } })

    if (!category) {
      return NextResponse.json({ error: 'Kategoria nie istnieje.' }, { status: 404 })
    }

    const linkedEntries = await prisma.dictionaryEntry.count({ where: { categoryId: id } })
    if (linkedEntries > 0) {
      return NextResponse.json(
        { error: 'Nie można usunąć kategorii powiązanej z istniejącymi wpisami.' },
        { status: 409 },
      )
    }

    await prisma.category.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
