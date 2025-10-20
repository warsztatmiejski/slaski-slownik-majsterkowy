import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EntryStatus } from '@prisma/client'

export async function GET() {
  try {
    const [categories, categoryCounts] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.dictionaryEntry.groupBy({
        by: ['categoryId'],
        where: { status: EntryStatus.APPROVED },
        _count: {
          _all: true,
        },
      }),
    ])

    const countMap = new Map(
      categoryCounts.map(entry => [entry.categoryId, entry._count._all]),
    )

    const payload = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? undefined,
      type: category.type,
      entryCount: countMap.get(category.id) ?? 0,
    }))

    return NextResponse.json({ categories: payload })
  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
