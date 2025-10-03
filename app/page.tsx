import type { Metadata } from 'next'
import { Suspense } from 'react'
import HomePage, { type EntryPreview, type HomePageProps } from '@/components/homepage'
import { prisma } from '@/lib/prisma'
import { EntryStatus, SubmissionStatus } from '@prisma/client'
import { createSlug } from '@/lib/utils'
import { DEFAULT_SOCIAL_IMAGE, SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo'

const ENTRY_INCLUDE = {
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
} as const

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

function createBaseMetadata(pathname: string = '/'): Metadata {
  return {
    title: { absolute: SITE_NAME },
    description: SITE_DESCRIPTION,
    alternates: {
      canonical: pathname,
    },
    openGraph: {
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      siteName: SITE_NAME,
      url: pathname,
      type: 'website',
      locale: 'pl_PL',
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE,
          alt: `${SITE_NAME} logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  }
}

async function getEntryForMetadata(slug: string): Promise<EntryPreview | null> {
  const normalizedSlug = slug.trim().toLowerCase()

  const entry = await prisma.dictionaryEntry.findFirst({
    where: {
      status: EntryStatus.APPROVED,
      slug: normalizedSlug,
    },
    include: ENTRY_INCLUDE,
  })

  if (entry) {
    return mapEntry(entry)
  }

  const fallbackEntries = await prisma.dictionaryEntry.findMany({
    where: { status: EntryStatus.APPROVED },
    include: ENTRY_INCLUDE,
  })

  const matched = fallbackEntries.find(item => createSlug(item.sourceWord) === normalizedSlug)

  return matched ? mapEntry(matched) : null
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}): Promise<Metadata> {
  const searchValue = searchParams?.s
  const rawSlug = Array.isArray(searchValue) ? searchValue[0] : searchValue

  if (!rawSlug) {
    return createBaseMetadata()
  }

  const slug = rawSlug.trim()

  if (!slug) {
    return createBaseMetadata()
  }

  const entry = await getEntryForMetadata(slug)
  const metadataSlug = entry?.slug ?? slug
  const metadataPath = `/?s=${encodeURIComponent(metadataSlug)}`
  const baseMetadata = createBaseMetadata(metadataPath)

  if (!entry) {
    return baseMetadata
  }

  const example = entry.exampleSentences[0]
  const details: string[] = []

  details.push(`Słowo: ${entry.sourceWord}${entry.targetWord ? ` (${entry.targetWord})` : ''}`)

  if (example) {
    details.push(`Przykład: ${example.sourceText} - ${example.translatedText}`)
  } else if (entry.targetWord) {
    details.push(`Tłumaczenie: ${entry.targetWord}`)
  }

  details.push(SITE_DESCRIPTION)

  const description = details.join(' · ')
  const title = `${entry.sourceWord} – ${SITE_NAME}`

  return {
    ...baseMetadata,
    title: { absolute: title },
    description,
    openGraph: {
      ...(baseMetadata.openGraph ?? {}),
      title,
      description,
      url: metadataPath,
    },
    twitter: {
      ...(baseMetadata.twitter ?? {}),
      title,
      description,
    },
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
      include: ENTRY_INCLUDE,
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
      include: ENTRY_INCLUDE,
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

  const adminCredentials =
    process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD
      ? {
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
        }
      : undefined

  const showAdminCredentials = process.env.NODE_ENV !== 'production'

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
    showAdminCredentials,
  }

  return (
    <Suspense fallback={null}>
      <HomePage {...props} />
    </Suspense>
  )
}
