import { PrismaClient, CategoryType, EntryStatus, Language } from '@prisma/client'

const prisma = new PrismaClient()

interface DictionarySeedEntry {
  id: string
  sourceWord: string
  sourceLang: Language
  targetWord: string
  targetLang: Language
  pronunciation?: string
  partOfSpeech?: string
  notes?: string
  categorySlug: string
  alternativeTranslations: string[]
  examples: {
    sourceText: string
    translatedText: string
  }[]
}

interface SubmissionSeedEntry {
  id: string
  sourceWord: string
  sourceLang: Language
  targetWord: string
  targetLang: Language
  pronunciation?: string
  partOfSpeech?: string
  categorySlug: string
  submitterName: string
  submitterEmail: string
  exampleSentences: string[]
  notes?: string
}

const usedSlugs = new Set<string>()

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getUniqueSlug(sourceWord: string, fallback: string): string {
  const base = toSlug(sourceWord) || toSlug(fallback) || fallback.toLowerCase()
  let slug = base || `haslo-${Date.now()}`
  let counter = 2

  while (usedSlugs.has(slug)) {
    slug = `${base}-${counter}`
    counter += 1
  }

  usedSlugs.add(slug)
  return slug
}

async function main() {
  console.log('🌱 Seeding Śląski Słownik Majsterkowy...')

  const adminEmail = process.env.ADMIN_EMAIL || 'halo@ywarsztatmiejski.org'

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin',
      role: 'ADMIN',
    },
  })

  console.log(`✅ Admin account ready: ${admin.email}`)

  const categorySeeds = [
    {
      name: 'Górnictwo',
      slug: 'gornictwo',
      description: 'Terminologia związana z pracą w kopalniach i górnictwem',
      type: CategoryType.TRADITIONAL,
    },
    {
      name: 'Hutnictwo',
      slug: 'hutnictwo',
      description: 'Słownictwo hutnicze i metalurgiczne',
      type: CategoryType.TRADITIONAL,
    },
    {
      name: 'Inżynieria',
      slug: 'inzynieria',
      description: 'Pojęcia techniczne z zakresu inżynierii i mechaniki',
      type: CategoryType.TRADITIONAL,
    },
    {
      name: 'Produkcja',
      slug: 'produkcja',
      description: 'Wyrażenia używane w zakładach produkcyjnych',
      type: CategoryType.TRADITIONAL,
    },
    {
      name: 'Informatyka',
      slug: 'informatyka',
      description: 'Nowoczesna terminologia IT i cyfrowa',
      type: CategoryType.MODERN,
    },
    {
      name: 'Elektronika',
      slug: 'elektronika',
      description: 'Słownictwo związane z elektroniką i układami elektrycznymi',
      type: CategoryType.MODERN,
    },
    {
      name: 'Telekomunikacja',
      slug: 'telekomunikacja',
      description: 'Wyrażenia sieciowe i telekomunikacyjne',
      type: CategoryType.MODERN,
    },
  ]

  await Promise.all(
    categorySeeds.map(category =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          description: category.description,
          type: category.type,
        },
        create: category,
      }),
    ),
  )

  const categories = await prisma.category.findMany({ select: { id: true, slug: true } })
  const categoryMap = new Map(categories.map(category => [category.slug, category.id]))

  const partOfSpeechSeeds = [
    { label: 'rzeczownik', value: 'rzeczownik', order: 1 },
    { label: 'czasownik', value: 'czasownik', order: 2 },
    { label: 'przymiotnik', value: 'przymiotnik', order: 3 },
    { label: 'przysłówek', value: 'przysłówek', order: 4 },
    { label: 'liczebnik', value: 'liczebnik', order: 5 },
    { label: 'zaimek', value: 'zaimek', order: 6 },
    { label: 'spójnik', value: 'spójnik', order: 7 },
    { label: 'przyimek', value: 'przyimek', order: 8 },
    { label: 'partykuła', value: 'partykuła', order: 9 },
    { label: 'imiesłów', value: 'imiesłów', order: 10 },
    { label: 'wykrzyknik', value: 'wykrzyknik', order: 11 },
  ]

  await Promise.all(
    partOfSpeechSeeds.map(option =>
      prisma.partOfSpeech.upsert({
        where: { value: option.value },
        update: {
          label: option.label,
          order: option.order,
        },
        create: option,
      }),
    ),
  )

  const dictionaryEntries: DictionarySeedEntry[] = [
    {
      id: 'entry-sichta',
      sourceWord: 'šichta',
      sourceLang: Language.SILESIAN,
      targetWord: 'zmiana robocza',
      targetLang: Language.POLISH,
      pronunciation: 'šixta',
      partOfSpeech: 'rzeczownik',
      notes: 'Klasyczne określenie zmiany w kopalni.',
      categorySlug: 'gornictwo',
      alternativeTranslations: ['zmiana'],
      examples: [
        {
          sourceText: 'Idã na šichtã, musza być na dół za pół godziny.',
          translatedText: 'Idę na zmianę, muszę być na dole za pół godziny.',
        },
        {
          sourceText: 'Po nocnej šichty je człowiek spodlony.',
          translatedText: 'Po nocnej zmianie człowiek jest zmęczony.',
        },
      ],
    },
    {
      id: 'entry-pyrlik',
      sourceWord: 'pyrlik',
      sourceLang: Language.SILESIAN,
      targetWord: 'młotek górniczy',
      targetLang: Language.POLISH,
      pronunciation: 'pyrlik',
      partOfSpeech: 'rzeczownik',
      notes: 'Narzędzie do obróbki skał i węgla.',
      categorySlug: 'gornictwo',
      alternativeTranslations: ['perlik'],
      examples: [
        {
          sourceText: 'Trza naostrzic pyrlik przed robotą.',
          translatedText: 'Trzeba naostrzyć młotek górniczy przed pracą.',
        },
      ],
    },
    {
      id: 'entry-fajront',
      sourceWord: 'fajront',
      sourceLang: Language.SILESIAN,
      targetWord: 'koniec pracy',
      targetLang: Language.POLISH,
      pronunciation: 'fajront',
      partOfSpeech: 'rzeczownik',
      notes: 'Popularne określenie zakończenia zmiany.',
      categorySlug: 'gornictwo',
      alternativeTranslations: ['koniec zmiany'],
      examples: [
        {
          sourceText: 'Już fajront, idymy na wierzch.',
          translatedText: 'Koniec pracy, wychodzimy na powierzchnię.',
        },
      ],
    },
    {
      id: 'entry-huta',
      sourceWord: 'huta',
      sourceLang: Language.SILESIAN,
      targetWord: 'zakład hutniczy',
      targetLang: Language.POLISH,
      pronunciation: 'huta',
      partOfSpeech: 'rzeczownik',
      notes: 'Miejsce, w którym przetapia się metal.',
      categorySlug: 'hutnictwo',
      alternativeTranslations: ['stalownia'],
      examples: [
        {
          sourceText: 'Mój ojciec robił w hucie przez trzydzieści lot.',
          translatedText: 'Mój ojciec pracował w hucie przez trzydzieści lat.',
        },
      ],
    },
    {
      id: 'entry-krajzyga',
      sourceWord: 'krajzyga',
      sourceLang: Language.SILESIAN,
      targetWord: 'piła tarczowa',
      targetLang: Language.POLISH,
      pronunciation: 'krajzyga',
      partOfSpeech: 'rzeczownik',
      notes: 'Popularna nazwa stołowej piły tarczowej.',
      categorySlug: 'inzynieria',
      alternativeTranslations: ['piła stołowa'],
      examples: [
        {
          sourceText: 'Pilnuj palców, jak robisz na krajzydze.',
          translatedText: 'Pilnuj palców, gdy pracujesz na pile tarczowej.',
        },
      ],
    },
    {
      id: 'entry-fabryka',
      sourceWord: 'fabryka',
      sourceLang: Language.SILESIAN,
      targetWord: 'zakład produkcyjny',
      targetLang: Language.POLISH,
      pronunciation: 'fabryka',
      partOfSpeech: 'rzeczownik',
      notes: 'Miejsce wytwarzania towarów w dużej skali.',
      categorySlug: 'produkcja',
      alternativeTranslations: ['manufaktura'],
      examples: [
        {
          sourceText: 'U nas we fabryce skłodajōm auta.',
          translatedText: 'U nas w fabryce składają samochody.',
        },
      ],
    },
    {
      id: 'entry-tasma',
      sourceWord: 'taśma',
      sourceLang: Language.SILESIAN,
      targetWord: 'linia produkcyjna',
      targetLang: Language.POLISH,
      pronunciation: 'taśma',
      partOfSpeech: 'rzeczownik',
      notes: 'Potoczna nazwa przenośnika taśmowego.',
      categorySlug: 'produkcja',
      alternativeTranslations: ['przenośnik'],
      examples: [
        {
          sourceText: 'Robota na taśmie je szybka, trza uważać.',
          translatedText: 'Praca na taśmie jest szybka, trzeba uważać.',
        },
      ],
    },
    {
      id: 'entry-komputer',
      sourceWord: 'komputer',
      sourceLang: Language.POLISH,
      targetWord: 'kōmputr',
      targetLang: Language.SILESIAN,
      pronunciation: 'kōmputr',
      partOfSpeech: 'rzeczownik',
      notes: 'Podstawowe słowo używane w branży IT.',
      categorySlug: 'informatyka',
      alternativeTranslations: ['maszina licząca'],
      examples: [
        {
          sourceText: 'Potrzebujã nowy kōmputr do pracy z grafiką.',
          translatedText: 'Potrzebuję nowy komputer do pracy z grafiką.',
        },
      ],
    },
    {
      id: 'entry-program',
      sourceWord: 'program',
      sourceLang: Language.POLISH,
      targetWord: 'program',
      targetLang: Language.SILESIAN,
      pronunciation: 'program',
      partOfSpeech: 'rzeczownik',
      notes: 'Oprogramowanie komputerowe lub aplikacja.',
      categorySlug: 'informatyka',
      alternativeTranslations: ['aplikacyjo'],
      examples: [
        {
          sourceText: 'Instalujã nowy program do obróbki zdjęć.',
          translatedText: 'Instaluję nowy program do obróbki zdjęć.',
        },
      ],
    },
    {
      id: 'entry-router',
      sourceWord: 'router',
      sourceLang: Language.POLISH,
      targetWord: 'ruter',
      targetLang: Language.SILESIAN,
      pronunciation: 'ruter',
      partOfSpeech: 'rzeczownik',
      notes: 'Urządzenie rozdzielające ruch sieciowy w domu lub firmie.',
      categorySlug: 'telekomunikacja',
      alternativeTranslations: ['przekaźnik sieciowy'],
      examples: [
        {
          sourceText: 'Skōnfiguruj ruter, żeby mioł mocne hasło.',
          translatedText: 'Skonfiguruj router, aby miał mocne hasło.',
        },
      ],
    },
  ]

  for (const [index, entry] of dictionaryEntries.entries()) {
    const categoryId = categoryMap.get(entry.categorySlug)

    if (!categoryId) {
      console.warn(`⚠️  Skipping entry ${entry.id} – category ${entry.categorySlug} not found`)
      continue
    }

    const approvedAt = new Date(Date.now() - index * 60 * 60 * 1000)
    const slug = getUniqueSlug(entry.sourceWord, entry.targetWord)

    await prisma.exampleSentence.deleteMany({ where: { entryId: entry.id } })

    await prisma.dictionaryEntry.upsert({
      where: { id: entry.id },
      update: {
        sourceWord: entry.sourceWord,
        sourceLang: entry.sourceLang,
        targetWord: entry.targetWord,
        targetLang: entry.targetLang,
        slug,
        alternativeTranslations: entry.alternativeTranslations,
        pronunciation: entry.pronunciation ?? null,
        partOfSpeech: entry.partOfSpeech ?? null,
        notes: entry.notes ?? null,
        status: EntryStatus.APPROVED,
        categoryId,
        approvedAt,
        approvedBy: admin.id,
        submittedBy: 'seed',
        exampleSentences: {
          create: entry.examples.map((example, exampleIndex) => ({
            sourceText: example.sourceText,
            translatedText: example.translatedText,
            order: exampleIndex + 1,
          })),
        },
      },
      create: {
        id: entry.id,
        sourceWord: entry.sourceWord,
        sourceLang: entry.sourceLang,
        targetWord: entry.targetWord,
        targetLang: entry.targetLang,
        slug,
        alternativeTranslations: entry.alternativeTranslations,
        pronunciation: entry.pronunciation ?? null,
        partOfSpeech: entry.partOfSpeech ?? null,
        notes: entry.notes ?? null,
        status: EntryStatus.APPROVED,
        categoryId,
        submittedBy: 'seed',
        approvedAt,
        approvedBy: admin.id,
        exampleSentences: {
          create: entry.examples.map((example, exampleIndex) => ({
            sourceText: example.sourceText,
            translatedText: example.translatedText,
            order: exampleIndex + 1,
          })),
        },
      },
    })
  }

  console.log(`✅ Seeded ${dictionaryEntries.length} dictionary entries`)

  const submissionSeeds: SubmissionSeedEntry[] = [
    {
      id: 'submission-haspel',
      sourceWord: 'hašpel',
      sourceLang: Language.SILESIAN,
      targetWord: 'kołowrót górniczy',
      targetLang: Language.POLISH,
      pronunciation: 'hašpel',
      partOfSpeech: 'rzeczownik',
      categorySlug: 'gornictwo',
      submitterName: 'Jan Kowalski',
      submitterEmail: 'jan.kowalski@example.com',
      exampleSentences: [
        'Hašpel służy do wciągania wozków.',
        'Stary hašpel wymaga remontu.',
      ],
      notes: 'Używane w kopalniach do transportu ludzi lub urobku.',
    },
    {
      id: 'submission-serwer',
      sourceWord: 'serwer',
      sourceLang: Language.POLISH,
      targetWord: 'serwer',
      targetLang: Language.SILESIAN,
      pronunciation: 'serwer',
      partOfSpeech: 'rzeczownik',
      categorySlug: 'informatyka',
      submitterName: 'Anna Nowak',
      submitterEmail: 'anna.nowak@example.com',
      exampleSentences: [
        'Serwer obsuguje aplikacyje firmowe.',
        'Jak serwer padnie, to nojlepsza zrobić kopiã zapasowõ.',
      ],
      notes: 'Propozycja terminologii sieciowej.',
    },
  ]

  for (const submission of submissionSeeds) {
    const categoryId = categoryMap.get(submission.categorySlug)

    if (!categoryId) {
      console.warn(`⚠️  Skipping submission ${submission.id} – category ${submission.categorySlug} not found`)
      continue
    }

    await prisma.publicSubmission.upsert({
      where: { id: submission.id },
      update: {
        sourceWord: submission.sourceWord,
        sourceLang: submission.sourceLang,
        targetWord: submission.targetWord,
        targetLang: submission.targetLang,
        pronunciation: submission.pronunciation ?? null,
        partOfSpeech: submission.partOfSpeech ?? null,
        categoryId,
        exampleSentences: submission.exampleSentences,
        submitterName: submission.submitterName,
        submitterEmail: submission.submitterEmail,
        notes: submission.notes ?? null,
      },
      create: {
        id: submission.id,
        sourceWord: submission.sourceWord,
        sourceLang: submission.sourceLang,
        targetWord: submission.targetWord,
        targetLang: submission.targetLang,
        pronunciation: submission.pronunciation ?? null,
        partOfSpeech: submission.partOfSpeech ?? null,
        categoryId,
        exampleSentences: submission.exampleSentences,
        submitterName: submission.submitterName,
        submitterEmail: submission.submitterEmail,
        notes: submission.notes ?? null,
      },
    })
  }

  console.log(`✅ Prepared ${submissionSeeds.length} sample public submissions`)

  console.log('🎉 Seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async error => {
    console.error('❌ Seed failed:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
