import { PrismaClient, CategoryType, Language, EntryStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed with real Silesian content...')

  // Create admin user
  const admin = await prisma.user.upsert({
	where: { email: process.env.ADMIN_EMAIL || 'halo@ywarsztatmiejski.org' },
	update: {},
	create: {
	  email: process.env.ADMIN_EMAIL || 'halo@ywarsztatmiejski.org',
	  name: 'Admin',
	  role: 'ADMIN',
	},
  })
  console.log('✅ Created admin user:', admin.email)

  // Create categories
  const categories = [
	// Traditional categories
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
	// Modern categories
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

  for (const category of categories) {
	await prisma.category.upsert({
	  where: { slug: category.slug },
	  update: {},
	  create: category,
	})
  }
  console.log('✅ Created categories:', categories.length)

  // Get category references
  const gornictwo = await prisma.category.findUnique({ where: { slug: 'gornictwo' } })
  const hutnictwo = await prisma.category.findUnique({ where: { slug: 'hutnictwo' } })
  const inzynieria = await prisma.category.findUnique({ where: { slug: 'inzynieria' } })
  const produkcja = await prisma.category.findUnique({ where: { slug: 'produkcja' } })
  const informatyka = await prisma.category.findUnique({ where: { slug: 'informatyka' } })
  const elektronika = await prisma.category.findUnique({ where: { slug: 'elektronika' } })
  const telekomunikacja = await prisma.category.findUnique({ where: { slug: 'telekomunikacja' } })

  // Define dictionary entries with real Silesian content
  const dictionaryEntries = [
	// MINING TERMS (Górnictwo)
	{
	  id: 'mining-1',
	  sourceWord: 'šichta',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'zmiana robocza',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['zmiana', 'tura'],
	  pronunciation: 'šixta',
	  categoryId: gornictwo!.id,
	  examples: [
		{ sourceText: 'Idã na šichtã.', translatedText: 'Idę na zmianę.', context: 'Codzienne wyrażenie górników', order: 1 },
		{ sourceText: 'Kōńczy mi się šichta.', translatedText: 'Kończy mi się zmiana.', context: 'Pod koniec pracy', order: 2 }
	  ]
	},
	{
	  id: 'mining-2',
	  sourceWord: 'pyrlik',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'młotek górniczy',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['perlik', 'pucka'],
	  pronunciation: 'pyrlik',
	  categoryId: gornictwo!.id,
	  examples: [
		{ sourceText: 'Wyrōb pyrlikym żelazko.', translatedText: 'Obróbka żelazka pyrlikiem.', context: 'Tradycyjna technika górnicza', order: 1 }
	  ]
	},
	{
	  id: 'mining-3',
	  sourceWord: 'żelazko',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'narzędzie urabiające',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['żelosko'],
	  pronunciation: 'żelazko',
	  categoryId: gornictwo!.id,
	  examples: [
		{ sourceText: 'Bier żelazko do roboty.', translatedText: 'Weź żelazko do pracy.', context: 'Przygotowanie narzędzi', order: 1 }
	  ]
	},
	{
	  id: 'mining-4',
	  sourceWord: 'sztygar',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'dozorca w kopalni',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['sztajger'],
	  pronunciation: 'štygar',
	  categoryId: gornictwo!.id,
	  examples: [
		{ sourceText: 'Sztygar přijšou na kontrolã.', translatedText: 'Sztygar przyszedł na kontrolę.', context: 'Nadzór techniczny', order: 1 }
	  ]
	},
	{
	  id: 'mining-5',
	  sourceWord: 'gruba',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'kopalnia',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['szyb'],
	  pronunciation: 'gruba',
	  categoryId: gornictwo!.id,
	  examples: [
		{ sourceText: 'Robotniok w grubi.', translatedText: 'Robotnik w kopalni.', context: 'Określenie miejsca pracy', order: 1 }
	  ]
	},
	{
	  id: 'mining-6',
	  sourceWord: 'bajzyga',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'wyrzynarka',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['piła do drewna'],
	  pronunciation: 'bajzyga',
	  categoryId: gornictwo!.id,
	  examples: [
		{ sourceText: 'Czerp bajzygã na obudowã.', translatedText: 'Weź wyrzynarkę na obudowę.', context: 'Budowa konstrukcji górniczych', order: 1 }
	  ]
	},
	{
	  id: 'mining-7',
	  sourceWord: 'balek',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'stempel górniczy',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['belka'],
	  pronunciation: 'balek',
	  categoryId: gornictwo!.id,
	  examples: [
		{ sourceText: 'Postaw balek pod strop.', translatedText: 'Postaw stempel pod strop.', context: 'Zabezpieczenie wyrobiska', order: 1 }
	  ]
	},
	{
	  id: 'mining-8',
	  sourceWord: 'fajront',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'koniec pracy',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['koniec zmiany'],
	  pronunciation: 'fajront',
	  categoryId: gornictwo!.id,
	  examples: [
		{ sourceText: 'Już fajront, idymy do dōmu.', translatedText: 'Już koniec pracy, idziemy do domu.', context: 'Codzienne zakończenie pracy', order: 1 }
	  ]
	},
	{
	  id: 'mining-9',
	  sourceWord: 'flaps',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'posiłek regeneracyjny',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['zupa regeneracyjna'],
	  pronunciation: 'flaps',
	  categoryId: gornictwo!.id,
	  examples: [
		{ sourceText: 'Idã na flaps przed robotą.', translatedText: 'Idę na posiłek regeneracyjny przed pracą.', context: 'Przygotowanie do pracy', order: 1 }
	  ]
	},
	{
	  id: 'mining-10',
	  sourceWord: 'chodnik',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'korytarz podziemny',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['sztolnia'],
	  pronunciation: 'xodnik',
	  categoryId: gornictwo!.id,
	  examples: [
		{ sourceText: 'Idã chodnikym na przodek.', translatedText: 'Idę korytarzem na przodek.', context: 'Poruszanie się po kopalni', order: 1 }
	  ]
	},

	// METALLURGY TERMS (Hutnictwo)
	{
	  id: 'metallurgy-1',
	  sourceWord: 'huta',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'zakład hutniczy',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['stalownia'],
	  pronunciation: 'huta',
	  categoryId: hutnictwo!.id,
	  examples: [
		{ sourceText: 'Robotniok w hucie stali.', translatedText: 'Robotnik w hucie stali.', context: 'Praca w przemyśle hutniczym', order: 1 }
	  ]
	},
	{
	  id: 'metallurgy-2',
	  sourceWord: 'piec',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'piec hutniczy',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['wielki piec'],
	  pronunciation: 'piec',
	  categoryId: hutnictwo!.id,
	  examples: [
		{ sourceText: 'Piec topi żylazo na stal.', translatedText: 'Piec topi żelazo na stal.', context: 'Proces hutniczy', order: 1 }
	  ]
	},
	{
	  id: 'metallurgy-3',
	  sourceWord: 'walcownia',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'oddział walcowania',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['walcarnia'],
	  pronunciation: 'valcovnia',
	  categoryId: hutnictwo!.id,
	  examples: [
		{ sourceText: 'W walcowni robiōm blachy.', translatedText: 'W walcowni robią blachy.', context: 'Produkcja wyrobów płaskich', order: 1 }
	  ]
	},

	// ENGINEERING TERMS (Inżynieria)
	{
	  id: 'engineering-1',
	  sourceWord: 'maszina',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'maszyna',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['urządzenie'],
	  pronunciation: 'mašina',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Ta maszina je feleranto.', translatedText: 'Ta maszyna jest zepsuta.', context: 'Diagnostyka techniczna', order: 1 }
	  ]
	},
	{
	  id: 'engineering-2',
	  sourceWord: 'śruba',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'element złączny',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['śrubka', 'wkręt'],
	  pronunciation: 'śruba',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Czerp śrubã na maszinã.', translatedText: 'Weź śrubę na maszynę.', context: 'Montaż mechaniczny', order: 1 }
	  ]
	},
	{
	  id: 'engineering-3',
	  sourceWord: 'krajzyga',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'piła tarczowa',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['stół z piłą'],
	  pronunciation: 'krajzyga',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Poćep drzywka na krajzyg.', translatedText: 'Pociągnij drewko na krajzygę.', context: 'Obróbka drewna', order: 1 }
	  ]
	},

	// PRODUCTION TERMS (Produkcja)
	{
	  id: 'production-1',
	  sourceWord: 'fabryka',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'zakład produkcyjny',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['manufaktura'],
	  pronunciation: 'fabryka',
	  categoryId: produkcja!.id,
	  examples: [
		{ sourceText: 'Robotniok w fabryce aut.', translatedText: 'Robotnik w fabryce samochodów.', context: 'Przemysł motoryzacyjny', order: 1 }
	  ]
	},
	{
	  id: 'production-2',
	  sourceWord: 'taśma',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'linia produkcyjna',
	  targetLang: Language.POLISH,
	  alternativeTranslations: ['przenośnik taśmowy'],
	  pronunciation: 'taśma',
	  categoryId: produkcja!.id,
	  examples: [
		{ sourceText: 'Robota na taśmi je mōcno.', translatedText: 'Praca na taśmie jest ciężka.', context: 'Warunki pracy w produkcji', order: 1 }
	  ]
	},

	// IT TERMS (Informatyka)
	{
	  id: 'it-1',
	  sourceWord: 'komputer',
	  sourceLang: Language.POLISH,
	  targetWord: 'kōmputr',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['mašina licząca'],
	  pronunciation: 'kōmputr',
	  categoryId: informatyka!.id,
	  examples: [
		{ sourceText: 'Włōńcz ten kōmputr.', translatedText: 'Włącz ten komputer.', context: 'Obsługa sprzętu komputerowego', order: 1 }
	  ]
	},
	{
	  id: 'it-2',
	  sourceWord: 'program',
	  sourceLang: Language.POLISH,
	  targetWord: 'program',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['aplikacyjo'],
	  pronunciation: 'program',
	  categoryId: informatyka!.id,
	  examples: [
		{ sourceText: 'Instalowaî nowy program.', translatedText: 'Zainstalowałem nowy program.', context: 'Zarządzanie oprogramowaniem', order: 1 }
	  ]
	},
	{
	  id: 'it-3',
	  sourceWord: 'internet',
	  sourceLang: Language.POLISH,
	  targetWord: 'internet',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['sieć'],
	  pronunciation: 'internet',
	  categoryId: informatyka!.id,
	  examples: [
		{ sourceText: 'Šukaj we internecie.', translatedText: 'Szukaj w internecie.', context: 'Wyszukiwanie informacji', order: 1 }
	  ]
	},
	{
	  id: 'it-4',
	  sourceWord: 'router',
	  sourceLang: Language.POLISH,
	  targetWord: 'ruter',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['przekaźnik sieciowy'],
	  pronunciation: 'ruter',
	  categoryId: telekomunikacja!.id,
	  examples: [
		{ sourceText: 'Skōnfiguruj rutera do internetu.', translatedText: 'Skonfiguruj router do internetu.', context: 'Konfiguracja sieci', order: 1 }
	  ]
	},
	{
	  id: 'it-5',
	  sourceWord: 'kabel',
	  sourceLang: Language.POLISH,
	  targetWord: 'kabel',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['sznur'],
	  pronunciation: 'kabel',
	  categoryId: elektronika!.id,
	  examples: [
		{ sourceText: 'Podziōng kabel do kōmputra.', translatedText: 'Podłącz kabel do komputera.', context: 'Połączenia elektroniczne', order: 1 }
	  ]
	},

	// ELECTRONICS TERMS (Elektronika)
	{
	  id: 'electronics-1',
	  sourceWord: 'tranzystor',
	  sourceLang: Language.POLISH,
	  targetWord: 'tranzystor',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['półprzewodnik'],
	  pronunciation: 'tranzystor',
	  categoryId: elektronika!.id,
	  examples: [
		{ sourceText: 'Tranzystor we wzmacniaczu sie popsuł.', translatedText: 'Tranzystor we wzmacniaczu się popsuł.', context: 'Awaria elektroniczna', order: 1 }
	  ]
	},
	{
	  id: 'electronics-2',
	  sourceWord: 'mikrokontroler',
	  sourceLang: Language.POLISH,
	  targetWord: 'mikrokōntroler',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['mały procesor'],
	  pronunciation: 'mikrokōntroler',
	  categoryId: elektronika!.id,
	  examples: [
		{ sourceText: 'Programuj mikrokōntroler na sterownie.', translatedText: 'Programuj mikrokontroler na sterowanie.', context: 'Automatyka przemysłowa', order: 1 }
	  ]
	},

	// TELECOMMUNICATIONS (Telekomunikacja)
	{
	  id: 'telecom-1',
	  sourceWord: 'antena',
	  sourceLang: Language.POLISH,
	  targetWord: 'antena',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['odbiornik fal'],
	  pronunciation: 'antena',
	  categoryId: telekomunikacja!.id,
	  examples: [
		{ sourceText: 'Postaw antenã na dach.', translatedText: 'Postaw antenę na dach.', context: 'Instalacja telekomunikacyjna', order: 1 }
	  ]
	},

	// ADDITIONAL MIXED TERMS
	{
	  id: 'mixed-1',
	  sourceWord: 'młotek',
	  sourceLang: Language.POLISH,
	  targetWord: 'hamer',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['młot'],
	  pronunciation: 'hamer',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Walōnczymy hamerym w ścianã.', translatedText: 'Walmy młotkiem w ścianę.', context: 'Praca budowlana', order: 1 }
	  ]
	},
	{
	  id: 'mixed-2',
	  sourceWord: 'pilnik',
	  sourceLang: Language.POLISH,
	  targetWord: 'fajla',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['pilniczek'],
	  pronunciation: 'fajla',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Wygładzej fajlōm krawędź.', translatedText: 'Wygładź pilnikiem krawędź.', context: 'Wykańczanie detali', order: 1 }
	  ]
	},
	{
	  id: 'mixed-3',
	  sourceWord: 'wiertarka',
	  sourceLang: Language.POLISH,
	  targetWord: 'bormaszynka',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['wiertok'],
	  pronunciation: 'bormaszynka',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Wyrōb dziurã bormaszynkōm.', translatedText: 'Zrób dziurę wiertarką.', context: 'Obróbka mechaniczna', order: 1 }
	  ]
	},
	{
	  id: 'mixed-4',
	  sourceWord: 'klucz',
	  sourceLang: Language.POLISH,
	  targetWord: 'szlīsel',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['klucz francuski'],
	  pronunciation: 'šlīsel',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Dokrynć szlīslym nakryntkã.', translatedText: 'Dokręć kluczem nakrętkę.', context: 'Połączenia gwintowe', order: 1 }
	  ]
	},
	{
	  id: 'mixed-5',
	  sourceWord: 'spawarka',
	  sourceLang: Language.POLISH,
	  targetWord: 'šwajsownica',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['aparatura spawalnicza'],
	  pronunciation: 'švajsovnica',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Pozpawoł šwajsownicōm blachy.', translatedText: 'Zespawaj spawarką blachy.', context: 'Łączenie konstrukcji metalowych', order: 1 }
	  ]
	},
	{
	  id: 'mixed-6',
	  sourceWord: 'śrubokręt',
	  sourceLang: Language.POLISH,
	  targetWord: 'šraubencyjgr',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['wkrętak'],
	  pronunciation: 'šraubencyjgr',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Wykrynć šraubencyjgrym śrubã.', translatedText: 'Wykręć śrubokrętem śrubę.', context: 'Demontaż elementów', order: 1 }
	  ]
	},
	{
	  id: 'mixed-7',
	  sourceWord: 'szczypce',
	  sourceLang: Language.POLISH,
	  targetWord: 'canga',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['obcęgi'],
	  pronunciation: 'canga',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Czerp cangã na druty.', translatedText: 'Weź szczypce na druty.', context: 'Prace elektryczne', order: 1 }
	  ]
	},
	{
	  id: 'mixed-8',
	  sourceWord: 'miara',
	  sourceLang: Language.POLISH,
	  targetWord: 'colštok',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['linijka składana'],
	  pronunciation: 'colštok',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Zmiyř colštokym długość.', translatedText: 'Zmierz miarą długość.', context: 'Pomiary techniczne', order: 1 }
	  ]
	},
	{
	  id: 'mixed-9',
	  sourceWord: 'poziomica',
	  sourceLang: Language.POLISH,
	  targetWord: 'libela',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['poziomnica'],
	  pronunciation: 'libela',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Sprawdź libelōm poziōm.', translatedText: 'Sprawdź poziomica poziom.', context: 'Kontrola montażu', order: 1 }
	  ]
	},
	{
	  id: 'mixed-10',
	  sourceWord: 'łopata',
	  sourceLang: Language.POLISH,
	  targetWord: 'šaufla',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['łopatka'],
	  pronunciation: 'šaufla',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Przekop šauflōm grōnt.', translatedText: 'Przekop łopatą grunt.', context: 'Prace ziemne', order: 1 }
	  ]
	},
	{
	  id: 'mixed-11',
	  sourceWord: 'silnik',
	  sourceLang: Language.POLISH,
	  targetWord: 'motor',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['mašina napędowo'],
	  pronunciation: 'motor',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Motor we mašyni sie přegrzoł.', translatedText: 'Silnik w maszynie się przegrzał.', context: 'Awaria techniczna', order: 1 }
	  ]
	},
	{
	  id: 'mixed-12',
	  sourceWord: 'przekładnia',
	  sourceLang: Language.POLISH,
	  targetWord: 'getribe',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['reduktor'],
	  pronunciation: 'getribe',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Getribe redukuje prędkość motora.', translatedText: 'Przekładnia redukuje prędkość silnika.', context: 'Napędy przemysłowe', order: 1 }
	  ]
	},
	{
	  id: 'mixed-13',
	  sourceWord: 'przenośnik',
	  sourceLang: Language.POLISH,
	  targetWord: 'trōnsporter',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['taśma transportowa'],
	  pronunciation: 'trōnsporter',
	  categoryId: produkcja!.id,
	  examples: [
		{ sourceText: 'Trōnsporter wozi części na linii.', translatedText: 'Przenośnik wozi części na linii.', context: 'Organizacja produkcji', order: 1 }
	  ]
	},
	{
	  id: 'mixed-14',
	  sourceWord: 'telefon',
	  sourceLang: Language.POLISH,
	  targetWord: 'telefōn',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['słuchawka'],
	  pronunciation: 'telefōn',
	  categoryId: telekomunikacja!.id,
	  examples: [
		{ sourceText: 'Zawōłaj do mnie na telefōn.', translatedText: 'Zadzwoń do mnie na telefon.', context: 'Komunikacja codzinna', order: 1 }
	  ]
	},
	{
	  id: 'mixed-15',
	  sourceWord: 'żuraw',
	  sourceLang: Language.POLISH,
	  targetWord: 'kran',
	  targetLang: Language.SILESIAN,
	  alternativeTranslations: ['dźwig'],
	  pronunciation: 'kran',
	  categoryId: inzynieria!.id,
	  examples: [
		{ sourceText: 'Kran ponoszi konstrukcyjã stali.', translatedText: 'Żuraw podnosi konstrukcję stalową.', context: 'Montaż konstrukcji', order: 1 }
	  ]
	}
  ]

  // Create dictionary entries
  let createdEntries = 0
  for (const entry of dictionaryEntries) {
	try {
	  await prisma.dictionaryEntry.upsert({
		where: { id: entry.id },
		update: {},
		create: {
		  id: entry.id,
		  sourceWord: entry.sourceWord,
		  sourceLang: entry.sourceLang,
		  targetWord: entry.targetWord,
		  targetLang: entry.targetLang,
		  alternativeTranslations: entry.alternativeTranslations,
		  pronunciation: entry.pronunciation,
		  status: EntryStatus.APPROVED,
		  categoryId: entry.categoryId,
		  approvedAt: new Date(),
		  approvedBy: admin.id,
		  exampleSentences: {
			create: entry.examples
		  }
		},
	  })
	  createdEntries++
	} catch (error) {
	  console.error(`Failed to create entry ${entry.id}:`, error)
	}
  }

  console.log(`✅ Created ${createdEntries} dictionary entries`)

  // Create some sample public submissions for testing the admin panel
  const sampleSubmissions = [
	{
	  id: 'submission-1',
	  sourceWord: 'hašpel',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'kołowrót górniczy',
	  targetLang: Language.POLISH,
	  exampleSentences: ['Hašpel służy do transportu.', 'Stary hašpel już nie działa.'],
	  pronunciation: 'hašpel',
	  categoryId: gornictwo!.id,
	  submitterName: 'Jan Kowalski',
	  submitterEmail: 'jan.kowalski@example.com',
	  notes: 'Tradycyjne określenie na urządzenie górnicze',
	  status: 'PENDING'
	},
	{
	  id: 'submission-2',
	  sourceWord: 'serwer',
	  sourceLang: Language.POLISH,
	  targetWord: 'serwer',
	  targetLang: Language.SILESIAN,
	  exampleSentences: ['Serwer obsługuje wszystkie kōmputry.', 'Serwer sie wysipou.'],
	  categoryId: informatyka!.id,
	  submitterName: 'Anna Nowak',
	  submitterEmail: 'anna.nowak@example.com',
	  notes: 'Współczesny termin IT',
	  status: 'PENDING'
	},
	{
	  id: 'submission-3',
	  sourceWord: 'bormaszyna',
	  sourceLang: Language.SILESIAN,
	  targetWord: 'wiertarka pneumatyczna',
	  targetLang: Language.POLISH,
	  exampleSentences: ['Bormaszyna wiyrci dziury w skale.', 'Napraw bormaszyna przed šichtōm.'],
	  pronunciation: 'bormašyna',
	  categoryId: gornictwo!.id,
	  submitterName: 'Michał Kowalczyk',
	  submitterEmail: 'michal.kowalczyk@example.com',
	  notes: 'Specjalistyczne narzędzie górnicze',
	  status: 'PENDING'
	}
  ]

  for (const submission of sampleSubmissions) {
	try {
	  await prisma.publicSubmission.upsert({
		where: { id: submission.id },
		update: {},
		create: submission,
	  })
	} catch (error) {
	  console.error(`Failed to create submission ${submission.id}:`, error)
	}
  }

  console.log(`✅ Created ${sampleSubmissions.length} sample submissions`)

  console.log('🎉 Database seeded successfully with real Silesian content!')
  console.log(`📊 Summary:`)
  console.log(`   • ${categories.length} categories`)
  console.log(`   • ${createdEntries} dictionary entries`)
  console.log(`   • ${sampleSubmissions.length} pending submissions`)
  console.log(`   • 1 admin user`)
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
