import HomePage, { type EntryPreview, type HomePageProps } from '@/components/homepage'
import { prisma } from '@/lib/prisma'
import { EntryStatus, SubmissionStatus } from '@prisma/client'
import { createSlug } from '@/lib/utils'

function startOfToday(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

function mapEntry(entry: {
  id: string
  slug: string | null
  sourceWord: string
  sourceLang: 'SILESIAN' | 'POLISH'
  targetWord: string
  targetLang: 'SILESIAN' | 'POLISH'
  pronunciation: string | null
  partOfSpeech: string | null
  notes: string | null
  alternativeTranslations: string[]
  category: {
    id: string
    name: string
    slug: string
  }
  exampleSentences: {
    sourceText: string
    translatedText: string
    order: number
  }[]
}): EntryPreview {
  return {
    id: entry.id,
    slug: entry.slug ?? createSlug(entry.sourceWord),
    sourceWord: entry.sourceWord,
    sourceLang: entry.sourceLang,
    targetWord: entry.targetWord,
    targetLang: entry.targetLang,
    pronunciation: entry.pronunciation ?? undefined,
    partOfSpeech: entry.partOfSpeech ?? undefined,
    notes: entry.notes ?? undefined,
    alternativeTranslations: entry.alternativeTranslations,
    category: {
      id: entry.category.id,
      name: entry.category.name,
      slug: entry.category.slug,
    },
    exampleSentences: entry.exampleSentences
      .sort((a, b) => a.order - b.order)
      .map(sentence => ({
        sourceText: sentence.sourceText,
        translatedText: sentence.translatedText,
      })),
  }
}

export default async function Page() {
  const today = startOfToday()

  const [statsData, recentEntriesRaw, featuredEntryRaw, categories] = await Promise.all([
    Promise.all([
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
    ]),
    prisma.dictionaryEntry.findMany({
      where: { status: EntryStatus.APPROVED },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        exampleSentences: {
          select: {
            sourceText: true,
            translatedText: true,
            order: true,
          },
          orderBy: { order: 'asc' },
          take: 3,
        },
      },
      orderBy: [
        { approvedAt: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: 6,
    }),
    prisma.dictionaryEntry.findFirst({
      where: {
        status: EntryStatus.APPROVED,
        exampleSentences: {
          some: {},
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        exampleSentences: {
          select: {
            sourceText: true,
            translatedText: true,
            order: true,
          },
          orderBy: { order: 'asc' },
          take: 3,
        },
      },
      orderBy: [
        { approvedAt: 'desc' },
        { updatedAt: 'desc' },
      ],
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  const [totalEntries, pendingSubmissions, approvedToday, rejectedToday] = statsData

  const recentEntries = recentEntriesRaw.map(mapEntry)
  const featuredEntry = featuredEntryRaw ? mapEntry(featuredEntryRaw) : null

  const categoryList: HomePageProps['categories'] = categories.map(category => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? undefined,
    type: category.type,
  }))

  const shouldExposeAdminCredentials = process.env.NODE_ENV !== 'production'

  const adminCredentials =
    shouldExposeAdminCredentials && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD
      ? {
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
        }
      : undefined

  const props: HomePageProps = {
    stats: {
      totalEntries,
      pendingSubmissions,
      approvedToday,
      rejectedToday,
    },
    featuredEntry,
    recentEntries,
    categories: categoryList,
    adminCredentials,
  }

  return <HomePage {...props} />
}
