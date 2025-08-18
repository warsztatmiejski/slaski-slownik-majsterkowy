import { PrismaClient, CategoryType, Language, EntryStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const admin = await prisma.user.upsert({
	where: { email: process.env.ADMIN_EMAIL || 'admin@dictionary.com' },
	update: {},
	create: {
	  email: process.env.ADMIN_EMAIL || 'admin@dictionary.com',
	  name: 'Admin',
	  role: 'ADMIN',
	},
  })
  console.log('✅ Created admin user:', admin.email)

  // Create traditional categories
  const traditionalCategories = [
	{
	  name: 'Górnictwo',
	  slug: 'gornictwo',
	  description: 'Terminology related to mining and extraction',
	  type: CategoryType.TRADITIONAL,
	},
	{
	  name: 'Hutnictwo',
	  slug: 'hutnictwo',
	  description: 'Ironworks and metallurgy terminology',
	  type: CategoryType.TRADITIONAL,
	},
	{
	  name: 'Inżynieria',
	  slug: 'inzynieria',
	  description: 'General engineering terms',
	  type: CategoryType.TRADITIONAL,
	},
	{
	  name: 'Produkcja',
	  slug: 'produkcja',
	  description: 'Manufacturing and production processes',
	  type: CategoryType.TRADITIONAL,
	},
  ]

  // Create modern categories
  const modernCategories = [
	{
	  name: 'Informatyka',
	  slug: 'informatyka',
	  description: 'Information technology and programming',
	  type: CategoryType.MODERN,
	},
	{
	  name: 'Elektronika',
	  slug: 'elektronika',
	  description: 'Electronics and electronic devices',
	  type: CategoryType.MODERN,
	},
	{
	  name: 'Telekomunikacja',
	  slug: 'telekomunikacja',
	  description: 'Telecommunications and networking',
	  type: CategoryType.MODERN,
	},
  ]

  const allCategories = [...traditionalCategories, ...modernCategories]

  for (const category of allCategories) {
	await prisma.category.upsert({
	  where: { slug: category.slug },
	  update: {},
	  create: category,
	})
  }
  console.log('✅ Created categories:', allCategories.length)

  // Create some sample dictionary entries
  const gornictwo = await prisma.category.findUnique({ where: { slug: 'gornictwo' } })
  const informatyka = await prisma.category.findUnique({ where: { slug: 'informatyka' } })

  if (gornictwo) {
	await prisma.dictionaryEntry.upsert({
	  where: { id: 'sample-mining-1' },
	  update: {},
	  create: {
		id: 'sample-mining-1',
		sourceWord: 'šichta',
		sourceLang: Language.SILESIAN,
		targetWord: 'zmiana robocza',
		targetLang: Language.POLISH,
		alternativeTranslations: ['zmiana', 'tura'],
		status: EntryStatus.APPROVED,
		categoryId: gornictwo.id,
		pronunciation: 'šixta',
		approvedAt: new Date(),
		approvedBy: admin.id,
		meanings: {
		  create: [
			{
			  meaning: 'Czas pracy w kopalni, zazwyczaj 8 godzin',
			  context: 'Używane w kontekście organizacji pracy',
			  order: 1,
			}
		  ]
		},
		exampleSentences: {
		  create: [
			{
			  sourceText: 'Idã na šichtã.',
			  translatedText: 'Idę na zmianę.',
			  context: 'Powszechne wyrażenie wśród górników',
			  order: 1,
			}
		  ]
		}
	  },
	})
  }

  if (informatyka) {
	await prisma.dictionaryEntry.upsert({
	  where: { id: 'sample-it-1' },
	  update: {},
	  create: {
		id: 'sample-it-1',
		sourceWord: 'komputer',
		sourceLang: Language.POLISH,
		targetWord: 'kōmputr',
		targetLang: Language.SILESIAN,
		alternativeTranslations: ['mašina licųco'],
		status: EntryStatus.APPROVED,
		categoryId: informatyka.id,
		approvedAt: new Date(),
		approvedBy: admin.id,
		meanings: {
		  create: [
			{
			  meaning: 'Elektroniczna maszyna do przetwarzania danych',
			  context: 'Współczesne urządzenie IT',
			  order: 1,
			}
		  ]
		},
		exampleSentences: {
		  create: [
			{
			  sourceText: 'Włōńcz ten kōmputr.',
			  translatedText: 'Włącz ten komputer.',
			  context: 'Instrukcje obsługi',
			  order: 1,
			}
		  ]
		}
	  },
	})
  }

  console.log('✅ Created sample dictionary entries')
  console.log('🎉 Database seeded successfully!')
}

main()
  .then(async () => {
	await prisma.$disconnect()
  })
  .catch(async (e) => {
	console.error('❌ Seed failed:', e)
	await prisma.$disconnect()
	process.exit(1)
  })