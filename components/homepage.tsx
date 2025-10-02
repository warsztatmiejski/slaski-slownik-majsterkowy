'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  Sparkles,
  ChevronRight,
  Loader2,
  Settings,
  ChevronDown,
  List,
  Clock,
  Hammer,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import ThemeToggle from '@/components/theme-toggle'
import { Skeleton } from '@/components/ui/skeleton'
import AddWordHeader from '@/components/add-word-header'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export type LanguageCode = 'SILESIAN' | 'POLISH'

export interface EntryPreview {
  id: string
  slug: string
  sourceWord: string
  sourceLang: LanguageCode
  targetWord: string
  targetLang: LanguageCode
  pronunciation?: string
  partOfSpeech?: string
  notes?: string
  alternativeTranslations: string[]
  category: {
    id: string
    name: string
    slug: string
  }
  exampleSentences: {
    sourceText: string
    translatedText: string
  }[]
}

export interface HomePageCategory {
  id: string
  name: string
  slug: string
  description?: string
  type?: string
}

export interface HomePageProps {
  stats: {
    totalEntries: number
    pendingSubmissions: number
    approvedToday: number
    rejectedToday: number
  }
  featuredEntry: EntryPreview | null
  recentEntries: EntryPreview[]
  categories: HomePageCategory[]
  adminCredentials?: {
    email: string
    password: string
  }
}

interface SearchResponse {
  results: Array<{
    id: string
    slug: string
    sourceWord: string
    sourceLang: LanguageCode
    targetWord: string
    targetLang: LanguageCode
    pronunciation?: string | null
    partOfSpeech?: string | null
    notes?: string | null
    alternativeTranslations: string[]
    category: {
      id: string
      name: string
      slug: string
    }
    exampleSentences: {
      sourceText: string
      translatedText: string
    }[]
  }>
  total: number
  query: string
}

const fieldFrame =
  'border border-slate-900 bg-white/80 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] dark:border-slate-100 dark:bg-slate-900/60 dark:text-slate-100'
const inputField = `w-full rounded-sm text-base ${fieldFrame}`

function mapSearchResult(result: SearchResponse['results'][number]): EntryPreview {
  return {
    id: result.id,
    slug: result.slug,
    sourceWord: result.sourceWord,
    sourceLang: result.sourceLang,
    targetWord: result.targetWord,
    targetLang: result.targetLang,
    pronunciation: result.pronunciation ?? undefined,
    partOfSpeech: result.partOfSpeech ?? undefined,
    notes: result.notes ?? undefined,
    alternativeTranslations: result.alternativeTranslations ?? [],
    category: {
      id: result.category.id,
      name: result.category.name,
      slug: result.category.slug,
    },
    exampleSentences: result.exampleSentences.map(sentence => ({
      sourceText: sentence.sourceText,
      translatedText: sentence.translatedText,
    })),
  }
}

export default function HomePage({
  stats,
  featuredEntry,
  recentEntries,
  categories,
  adminCredentials,
}: HomePageProps) {

  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<EntryPreview[]>([])
  const [selectedEntry, setSelectedEntry] = useState<EntryPreview | null>(null)
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
  const [isEntryLoading, setIsEntryLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [pendingCategoryFetch, setPendingCategoryFetch] = useState<string | null>(null)
  const [categoryEntries, setCategoryEntries] = useState<EntryPreview[]>([])
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [isFetchingCategory, setIsFetchingCategory] = useState(false)
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false)
  const lastCategorySlugRef = useRef<string | null>(null)
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const [isRecentMenuOpen, setIsRecentMenuOpen] = useState(false)
  const categorySectionRef = useRef<HTMLElement | null>(null)
  const entrySectionRef = useRef<HTMLElement | null>(null)

  const [randomEntry, setRandomEntry] = useState<EntryPreview | null>(
    featuredEntry ?? recentEntries[0] ?? null,
  )

  useEffect(() => {
    const pool = [featuredEntry, ...recentEntries].filter(
      (entry): entry is EntryPreview => Boolean(entry),
    )

    if (!pool.length) {
      setRandomEntry(null)
      return
    }

    const randomIndex = Math.floor(Math.random() * pool.length)
    setRandomEntry(pool[randomIndex])
  }, [featuredEntry, recentEntries])

  const recentSilesianEntries = useMemo(() => {
    if (!recentEntries.length) return []
    const filtered = recentEntries.filter(entry => entry.sourceLang === 'SILESIAN')
    const base = filtered.length ? filtered : recentEntries
    return base.slice(0, 9)
  }, [recentEntries])

  const activeCategoryData = useMemo(
    () => categories.find(category => category.slug === activeCategory) || null,
    [categories, activeCategory],
  )

  const translations = useMemo(() => {
    if (!selectedEntry) return []
    const unique = new Set<string>()
    const mainTranslation = selectedEntry.targetWord?.trim()
    if (mainTranslation) {
      unique.add(mainTranslation)
    }
    selectedEntry.alternativeTranslations.forEach(translation => {
      const normalized = translation.trim()
      if (normalized) {
        unique.add(normalized)
      }
    })
    return Array.from(unique)
  }, [selectedEntry])

  useEffect(() => {
    if (!activeCategory) {
      setCategoryEntries([])
      setCategoryError(null)
      setIsFetchingCategory(false)
    }
  }, [activeCategory])

  const updateUrlWithEntry = (entrySlug: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (entrySlug) {
      params.set('s', entrySlug)
      params.delete('k')
    } else {
      params.delete('s')
    }
    const queryString = params.toString()
    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, {
      scroll: false,
    })
  }

  const updateUrlWithCategory = (categorySlug: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (categorySlug) {
      params.set('k', categorySlug)
      params.delete('s')
    } else {
      params.delete('k')
    }
    const queryString = params.toString()
    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, {
      scroll: false,
    })
  }

  const handleSelectEntry = (entry: EntryPreview) => {
    setActiveCategory(null)
    setSelectedEntry(entry)
    setSuggestions([])
    setSearchError(null)
    setCategoryEntries([])
    setCategoryError(null)
    updateUrlWithCategory(null)
    updateUrlWithEntry(entry.slug)
    if (entrySectionRef.current) {
      entrySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleRecentClick = (entry: EntryPreview) => {
    handleSelectEntry(entry)
    setIsRecentMenuOpen(false)
  }

  const loadSuggestions = useCallback(
    async ({ query, category, signal, mode = 'search' }: {
      query?: string
      category?: string
      signal?: AbortSignal
      mode?: 'search' | 'category'
    }) => {
      if (!query && !category) {
        return
      }

      const params = new URLSearchParams()

      if (query) params.set('q', query)
      if (category) params.set('category', category)
      params.set('limit', mode === 'category' ? '24' : '8')

      try {
        if (mode === 'search') {
          setIsFetchingSuggestions(true)
        } else {
          setIsFetchingCategory(true)
        }

        const response = await fetch(`/api/search?${params.toString()}`, { signal })

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: 'Błąd wyszukiwania' }))
          throw new Error(data.error || 'Błąd wyszukiwania')
        }

        const data = (await response.json()) as SearchResponse
        const mappedResults = data.results.map(mapSearchResult)

        if (mode === 'search') {
          setSuggestions(mappedResults)
          setSearchError(mappedResults.length === 0 ? 'Brak wyników' : null)
        } else {
          setCategoryEntries(mappedResults)
          setCategoryError(mappedResults.length === 0 ? 'Brak haseł w tej kategorii' : null)
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return
        }
        console.error('Search failed:', error)
        if (!signal?.aborted) {
          if (mode === 'search') {
            setSearchError('Nie udało się pobrać wyników. Spróbuj ponownie później.')
          } else {
            setCategoryError('Nie udało się pobrać haseł dla tej kategorii.')
          }
        }
      } finally {
        if (!signal?.aborted) {
          if (mode === 'search') {
            setIsFetchingSuggestions(false)
          } else {
            setIsFetchingCategory(false)
          }
        }
      }
    },
  [])

  const handleCategoryClick = (slug: string) => {
    const nextCategory = activeCategory === slug ? null : slug

    const scrollToCategory = () => {
      if (categorySectionRef.current) {
        categorySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    if (nextCategory) {
      setActiveCategory(nextCategory)
      setSearchTerm('')
      setSuggestions([])
      setSearchError(null)
      setCategoryError(null)
      setIsFetchingSuggestions(false)
      setSelectedEntry(null)
      setCategoryEntries([])
      setPendingCategoryFetch(nextCategory)
      updateUrlWithCategory(nextCategory)
      scrollToCategory()
    } else {
      setActiveCategory(null)
      setPendingCategoryFetch(null)
      setCategoryEntries([])
      setCategoryError(null)
      setIsFetchingCategory(false)
      updateUrlWithCategory(null)
    }
    setIsCategoryMenuOpen(false)
  }

  useEffect(() => {
    const entrySlug = searchParams.get('s')

    if (!entrySlug) {
      setSelectedEntry(null)
      return
    }

    if (selectedEntry && selectedEntry.slug === entrySlug) {
      return
    }

    const controller = new AbortController()
    const fetchEntry = async () => {
      try {
        setIsEntryLoading(true)
        const response = await fetch(`/api/dictionary/${encodeURIComponent(entrySlug)}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Nie znaleziono hasła')
        }

        const data = (await response.json()) as { entry: EntryPreview }
        setSelectedEntry(data.entry)
        setSuggestions([])
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Entry fetch failed:', error)
          setSelectedEntry(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsEntryLoading(false)
        }
      }
    }

    fetchEntry()

    return () => {
      controller.abort()
    }
  }, [searchParams, selectedEntry])
  useEffect(() => {
    const categorySlug = searchParams.get('k')

    if (!categorySlug) {
      lastCategorySlugRef.current = null
      setActiveCategory(prev => (prev !== null ? null : prev))
      setCategoryEntries([])
      setCategoryError(null)
      setIsFetchingCategory(false)
      setPendingCategoryFetch(null)
      return
    }

    if (lastCategorySlugRef.current === categorySlug) {
      return
    }

    lastCategorySlugRef.current = categorySlug
    const controller = new AbortController()

    setActiveCategory(prev => (prev === categorySlug ? prev : categorySlug))
    setSearchTerm('')
    setSuggestions([])
    setSearchError(null)
    setSelectedEntry(null)
    setIsFetchingSuggestions(false)
    setCategoryEntries([])
    setCategoryError(null)
    setPendingCategoryFetch(categorySlug)

    loadSuggestions({ category: categorySlug, signal: controller.signal, mode: 'category' })
      .finally(() => {
        setPendingCategoryFetch(prev => (prev === categorySlug ? null : prev))
      })

    return () => controller.abort()
  }, [searchParams, loadSuggestions])


  useEffect(() => {
    const query = searchTerm.trim()

    if (!query) {
      if (!activeCategory) {
        setSuggestions([])
      }
      setSearchError(null)
      setIsFetchingSuggestions(false)
      return
    }

    if (selectedEntry && query.toLowerCase() === selectedEntry.sourceWord.toLowerCase()) {
      setSuggestions([])
      setSearchError(null)
      setIsFetchingSuggestions(false)
      return
    }

    if (query.length < 2) {
      setSuggestions([])
      setSearchError(null)
      setIsFetchingSuggestions(false)
      return
    }

    setActiveCategory(null)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      loadSuggestions({ query, signal: controller.signal, mode: 'search' })
    }, 200)

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [searchTerm, selectedEntry, activeCategory, loadSuggestions])

  const handleSuggestionClick = (entry: EntryPreview) => {
    handleSelectEntry(entry)
  }

  const handleInputChange = (value: string) => {
    if (activeCategory) {
      setActiveCategory(null)
      updateUrlWithCategory(null)
    }
    if (selectedEntry && value.toLowerCase() !== selectedEntry.sourceWord.toLowerCase()) {
      setSelectedEntry(null)
      updateUrlWithEntry(null)
    }
    if (!value.trim()) {
      updateUrlWithEntry(null)
      setSelectedEntry(null)
      setCategoryEntries([])
      setCategoryError(null)
      setIsFetchingCategory(false)
    }
    setSearchTerm(value)
  }

  const renderExampleSentence = (
    sentence: EntryPreview['exampleSentences'][number],
    index: number,
  ) => (
    <div
      key={`${sentence.sourceText}-${index}`}
      className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] md:items-start md:gap-6"
    >
      <p className="text-2xl font-semibold italic leading-tight text-primary md:text-3xl">
        {sentence.sourceText}
      </p>
      <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 md:text-right md:text-lg">
        {sentence.translatedText}
      </p>
    </div>
  )

  const categoryButtons = categories.map(category => {
    const isActive = activeCategory === category.slug
    return (
      <button
        key={category.id}
        type="button"
        onClick={() => handleCategoryClick(category.slug)}
        className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <span>{category.name}</span>
        {pendingCategoryFetch === category.slug ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
    )
  })

  const recentEntryButtons = recentSilesianEntries.map(entry => (
    <button
      key={entry.id}
      type="button"
      onClick={() => handleRecentClick(entry)}
      className="flex items-center justify-between text-left text-sm text-slate-900 border-b-1 border-slate-900 dark:border-slate-100 transition-colorsdark:text-slate-100 hover:text-primary hover:border-primary"
    >
      <span className="inline-block pb-1 transition-colors ">{entry.sourceWord}</span>
      <ChevronRight className="h-4 w-4" />
    </button>
  ))

  const renderRandomEntryCard = () =>
    randomEntry ? (
      <button
        type="button"
        onClick={() => handleSelectEntry(randomEntry)}
        className="w-full cursor-pointer space-y-2 text-left hover:[&>*]:text-primary [&>*]:transition-colors"
      >
        <p className="text-xl font-medium text-slate-900 dark:text-slate-100">
          Czy wiesz co po śląsku znaczy
        </p>
        <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">
          {randomEntry.sourceWord}?
        </p>
        <p className="text-right text-sm font-semibold">Sprawdź →</p>
      </button>
    ) : null

  const addWordButton = (
    <Button asChild className="w-full">
      <Link href="/dodaj">
        <Sparkles className="mr-2 h-4 w-4" />
        Dodaj słowo!
      </Link>
    </Button>
  )

  return (
    <div className="min-h-screen bg-white bg-[url('/bg-hex.png')] bg-top bg-no-repeat text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 md:gap-12 md:py-14 md:flex-row md:gap-20">
        <aside className="md:w-1/3 md:sticky md:top-10">
          <div className="flex flex-col gap-6 pb-6 md:gap-10 md:pb-0">
            <AddWordHeader />

            <div className="flex flex-col gap-6 pt-6">
              <div className="flex flex-wrap items-stretch gap-6 md:hidden">
                <div className="min-w-[200px] flex-1">{addWordButton}</div>
                <Collapsible
                  open={isCategoryMenuOpen}
                  onOpenChange={setIsCategoryMenuOpen}
                  className="min-w-[180px] flex-1"
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-sm border border-slate-900 px-3 py-2 text-sm font-semibold text-slate-900 transition-colors hover:border-primary hover:text-primary dark:border-slate-100 dark:text-slate-100"
                    >
                      <span className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        Kategorie
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {categoryButtons}
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="hidden md:block space-y-3">{addWordButton}</div>

              <div className="hidden md:block space-y-3">
                <h2 className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                  Kategorie
                </h2>
                <nav
                  className="space-y-2 text-sm text-slate-900 dark:text-slate-100"
                  aria-label={`Kategorie (${stats.totalEntries.toLocaleString('pl-PL')} haseł)`}
                >
                  {categoryButtons}
                </nav>
              </div>
            </div>
          </div>
        </aside>

        <main className="md:w-2/3">
          <div className="flex flex-col gap-6">
            <section className="flex flex-wrap items-stretch gap-6 md:mt-4 md:flex-row md:items-start md:justify-between">
              <p className="text-md min-w-[180px] flex-1 md:max-w-xl font-bold md:text-lg text-slate-900 dark:text-slate-100">
                Techniczny słownik śląsko-polski rozwijany przez społeczność i ekspertów branżowych.
              </p>
              <div className="min-w-[200px] flex-1">
                {renderRandomEntryCard() ?? (
                  <div className="rounded-sm border border-dashed border-slate-900/30 p-4 text-sm text-slate-600 dark:border-slate-100/30 dark:text-slate-300">
                    Brak wyróżnionego hasła.
                  </div>
                )}
              </div>
            </section>

            <Separator className="h-[2px] bg-slate-900 dark:bg-slate-100" />

            <section className="space-y-3 rounded-sm bg-red-200/50 p-6 md:p-8 dark:bg-red-900/40">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <Input
                    value={searchTerm}
                    onChange={event => handleInputChange(event.target.value)}
                    placeholder="Wyszukaj w słowniku..."
                    className={`${inputField} h-14 pl-11 text-lg font-semibold tracking-wide`}
                  />
                  {isFetchingSuggestions && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" />
                  )}
                </div>
                {(suggestions.length > 0 || searchError || isFetchingSuggestions) && (
                  <div className="max-h-64 overflow-y-auto rounded-md border border-slate-900/20 bg-white/90 shadow-lg dark:border-slate-100/20 dark:bg-slate-900/90">
                    {isFetchingSuggestions && suggestions.length === 0 && !searchError ? (
                      <div className="space-y-3 p-4">
                        <Skeleton className="h-4 w-2/5" />
                        <Skeleton className="h-4 w-3/5" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ) : (
                      suggestions.map(entry => {
                        const isActive = selectedEntry?.slug === entry.slug
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => handleSuggestionClick(entry)}
                            className={`flex w-full items-center justify-between border-b border-slate-900/10 px-3 py-2 text-left text-sm transition-colors last:border-b-0 dark:border-slate-100/10 ${
                              isActive
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              <span className="inline-block border-b-2 border-slate-900/30 pb-1 transition-colors dark:border-slate-100/30">{entry.sourceWord}</span>
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-300">
                              → {entry.targetWord}
                            </span>
                          </button>
                        )
                      })
                    )}
                    {searchError && suggestions.length === 0 && (
                      <p className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                        {searchError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {recentSilesianEntries.length > 0 && (
                <>
                  <div className="md:hidden">
                    <Collapsible open={isRecentMenuOpen} onOpenChange={setIsRecentMenuOpen}>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-sm border border-slate-900 px-3 py-2 text-sm font-semibold text-slate-900 transition-colors hover:border-primary hover:text-primary dark:border-slate-100 dark:text-slate-100"
                        >
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Ostatnio dodane hasła
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${isRecentMenuOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 space-y-2">
                        {recentEntryButtons}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  <div className="hidden md:block space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                      Ostatnio dodane hasła
                    </p>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {recentEntryButtons}
                    </div>
                  </div>
                </>
              )}
            </section>

            {!activeCategory && (selectedEntry || isEntryLoading) && (
              <section
                ref={entrySectionRef}
                className="space-y-6 rounded-sm bg-amber-200/50 p-6 md:p-8 dark:bg-amber-900/50"
              >
                {isEntryLoading && !selectedEntry ? (
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] md:items-end">
                      <div className="space-y-3">
                        <Skeleton className="h-12 w-3/4" />
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <div className="space-y-3 md:text-right">
                        <Skeleton className="h-12 w-2/3 md:ml-auto" />
                        <Skeleton className="h-3 w-1/3 md:ml-auto" />
                        <Skeleton className="h-3 w-1/4 md:ml-auto" />
                      </div>
                    </div>
                    <div className="h-px w-full bg-slate-900/20 dark:bg-slate-100/20" />
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-4/5" />
                      <Skeleton className="h-5 w-3/5" />
                      <Skeleton className="h-5 w-2/5" />
                    </div>
                    <div className="h-px w-full bg-slate-900/20 dark:bg-slate-100/20" />
                    <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] md:items-start">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ) : selectedEntry ? (
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] md:items-start">
                      <div className="space-y-2">
                        <h3 className="text-5xl font-semibold leading-tight text-primary mb-4 md:text-6xl">
                          {selectedEntry.sourceWord}
                        </h3>
                        {selectedEntry.pronunciation && (
                          <p className="text-lg font-mono text-slate-600 dark:text-slate-300">
                            [{selectedEntry.pronunciation}]
                          </p>
                        )}
                        {selectedEntry.partOfSpeech && (
                          <p className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">
                            {selectedEntry.partOfSpeech}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right">
                        {translations.length > 0 ? (
                          translations.map(translation => (
                            <p
                              key={translation}
                              className="text-3xl font-semibold leading-tight text-slate-900 dark:text-slate-100 md:text-4xl"
                            >
                              {translation}
                            </p>
                          ))
                        ) : (
                          <p className="text-base text-slate-700 dark:text-slate-300">
                            Brak tłumaczeń.
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator className="h-px bg-slate-900/20 dark:bg-slate-100/20" />

                    <div className="space-y-4">
                      {selectedEntry.exampleSentences.length > 0 ? (
                        selectedEntry.exampleSentences.map(renderExampleSentence)
                      ) : (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Brak przykładów użycia dla tego hasła.
                        </p>
                      )}
                    </div>

                    <Separator className="h-px bg-slate-900/20 dark:bg-slate-100/20" />

                    <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] md:items-start">
                      <div className="text-md text-slate-900 dark:text-slate-100">
                        {selectedEntry.notes ?? 'Brak dodatkowych notatek.'}
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleCategoryClick(selectedEntry.category.slug)}
                          className="inline-flex items-center gap-2 rounded-sm border border-slate-900 px-3 py-1 text-sm font-semibold text-slate-900 transition-colors hover:border-primary hover:text-primary dark:border-slate-100 dark:text-slate-100 dark:hover:border-primary"
                        >
                          <span>{selectedEntry.category.name}</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-sm border border-dashed border-slate-900/30 p-6 text-sm text-slate-600 dark:border-slate-100/30 dark:text-slate-300">
                    Brak wybranego wpisu. Zacznij wpisywać słowo lub wybierz je z listy powyżej.
                  </div>
                )}
              </section>
            )}

            {activeCategory && (
              <section
                ref={categorySectionRef}
                className="space-y-4 rounded-sm bg-slate-200/50 p-6 md:p-8 dark:bg-slate-900/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold uppercase tracking-[0.12em]">
                      Hasła w kategorii {activeCategoryData ? activeCategoryData.name : activeCategory}
                    </h2>
                </div>
                {isFetchingCategory && categoryEntries.length === 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} className="h-8 w-full" />
                    ))}
                  </div>
                ) : categoryEntries.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryEntries.map(entry => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => handleSelectEntry(entry)}
                        className="flex items-center justify-between text-left text-sm text-slate-900 border-b-1 border-slate-900 dark:border-slate-100 transition-colors dark:text-slate-100 hover:text-primary hover:border-primary"
                      >
                        <span className="inline-block pb-1">
                          {entry.sourceWord}
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {categoryError ?? 'Brak haseł w wybranej kategorii.'}
                  </p>
                )}
              </section>
            )}

            <section className="space-y-5 mt-5 text-slate-900 dark:text-slate-100">
              <header className="space-y-3">
                <h2 className="text-2xl font-semibold">
                  Na czym polega projekt „Śląski słownik majsterkowy”
                </h2>
                <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
                  Nasz projekt łączy tradycję gwary śląskiej z majsterkowaniem i edukacją techniczną. Chcemy pokazać,
                  że gwara jest żywa i może być inspirującym narzędziem do nauki.
                </p>
              </header>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold uppercase">Co planujemy?</h3>
                  <ul className="space-y-3 text-base leading-relaxed text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-3">
                      <Hammer className="mt-1 h-5 w-5 text-primary" />
                      <span>
                        stworzenie śląskiego słownika majsterkowego – katalogu słów związanych z techniką, narzędziami i
                        wynalazczością. Słownik powstanie wspólnie z mieszkańcami Śląska poprzez narzędzie online, a
                        następnie zostanie wydany w formie drukowanej,
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Hammer className="mt-1 h-5 w-5 text-primary" />
                      <span>
                        przygotowanie materiałów edukacyjnych dla nauczycieli i edukatorów, które pomogą wprowadzać gwarę
                        do zajęć,
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Hammer className="mt-1 h-5 w-5 text-primary" />
                      <span>
                        organizację 10 warsztatów: pięciu dla nauczycieli i edukatorów oraz pięciu dla uczniów, łączących
                        praktyczne majsterkowanie z nauką gwary.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold uppercase">Rezultat projektu</h3>
                  <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
                    Powstaną trzy publikacje: dwa zeszyty inspiracyjne i metodyczne oraz ilustrowany słownik majsterkowy z
                    co najmniej 50 hasłami.
                  </p>
                </div>

                <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
                  Dzięki wspólnej pracy nad słownikiem i warsztatom mieszkańcy Śląska w różnym wieku będą mogli aktywnie
                  włączyć się w ochronę i rozwój gwary – w nowoczesnej, twórczej formie.
                </p>
              </div>
            </section>

          </div>
        </main>
      </div>

      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Panel administratora</DialogTitle>
            <DialogDescription>
              Użyj poniższych danych, aby zalogować się do panelu moderacji.
            </DialogDescription>
          </DialogHeader>
          {adminCredentials ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="admin-email">Adres e-mail</Label>
                <Input
                  id="admin-email"
                  value={adminCredentials.email}
                  readOnly
                  className="border-slate-300 dark:border-slate-700"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="admin-password">Hasło</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminCredentials.password}
                  readOnly
                  className="border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>
          ) : (
            <p className="py-4 text-sm text-slate-600 dark:text-slate-300">
              Brak zdefiniowanych danych logowania. Uzupełnij zmienne środowiskowe
              <code className="mx-1 rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-800">ADMIN_EMAIL</code>
              i
              <code className="mx-1 rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-800">ADMIN_PASSWORD</code>.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdminDialogOpen(false)}>
              Zamknij
            </Button>
            <Button asChild>
              <Link href="/admin">Przejdź do panelu</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="border-t border-slate-300 bg-white/90 text-slate-700 transition-colors dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-200">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Panel administratora"
              onClick={() => setIsAdminDialogOpen(true)}
              className="h-10 w-10 rounded-full border border-slate-900 bg-white/80 text-slate-900 transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] dark:border-slate-100 dark:bg-slate-900/60 dark:text-slate-100"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>

          <div className="flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl">
              Projekt współfinansowany ze środków Ministra Kultury i Dziedzictwa Narodowego w ramach programu dotacyjnego „Różnorodność Językowa” Instytutu Różnorodności Językowej Rzeczypospolitej.
            </p>
            <div className="flex items-center gap-10">
              <Image
                src="/mkdin.svg"
                alt="Ministerstwo Kultury"
                width={140}
                height={48}
                className="h-10 w-auto dark:invert"
              />
              <Image
                src="/irjr.svg"
                alt="Instytut Różnorodności Językowej"
                width={140}
                height={48}
                className="h-10 w-auto dark:invert"
              />
            </div>
          </div>

          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Śląski Słownik Majsterkowy • Współtworzony przez Warsztat Miejski i społeczność regionu
          </p>
        </div>
      </footer>
    </div>
  )
}
