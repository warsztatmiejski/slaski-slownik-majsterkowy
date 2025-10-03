'use client'

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  Sparkles,
  ChevronRight,
  Loader2,
  Hammer,
  ChevronLeft,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import AddWordHeader from '@/components/add-word-header'
import Footer from '@/components/footer'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

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
  showAdminCredentials?: boolean
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
  'border border-slate-900 bg-white/80 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]'
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
  showAdminCredentials = false,
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
  const [isCategoryView, setIsCategoryView] = useState(false)
  const [isCategoryPanelOpen, setIsCategoryPanelOpen] = useState(false)
  const lastCategorySlugRef = useRef<string | null>(null)

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
    return base.slice(0, 6)
  }, [recentEntries])

  const activeCategoryData = useMemo(
    () => categories.find(category => category.slug === activeCategory) || null,
    [categories, activeCategory],
  )

  const sortedCategoryEntries = useMemo(
    () =>
      categoryEntries
        .slice()
        .sort((a, b) => a.sourceWord.localeCompare(b.sourceWord, 'pl', { sensitivity: 'base' })),
    [categoryEntries],
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
    startTransition(() => {
      router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, {
        scroll: false,
      })
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
    startTransition(() => {
      router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, {
        scroll: false,
      })
    })
  }

  const clearCategoryState = () => {
    const hadActiveCategory = Boolean(activeCategory)
    setIsCategoryView(false)
    setActiveCategory(null)
    setCategoryEntries([])
    setCategoryError(null)
    setIsFetchingCategory(false)
    setPendingCategoryFetch(null)
    if (hadActiveCategory) {
      updateUrlWithCategory(null)
    }
  }

  const closeCategoryPanel = () => {
    clearCategoryState()
    setIsCategoryPanelOpen(false)
  }

  const showCategoryList = () => {
    clearCategoryState()
    setIsCategoryPanelOpen(true)
  }

  const handleSelectEntry = (entry: EntryPreview) => {
    setSelectedEntry(entry)
    setSuggestions([])
    setSearchError(null)
    closeCategoryPanel()
    updateUrlWithEntry(entry.slug)
  }

  const handleRecentClick = (entry: EntryPreview) => {
    handleSelectEntry(entry)
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

    if (nextCategory) {
      setIsCategoryPanelOpen(true)
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
      setIsCategoryView(true)
    } else {
      showCategoryList()
    }
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
      setIsCategoryView(false)
      return
    }

    setIsCategoryPanelOpen(true)

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
    setIsCategoryView(true)

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
      clearCategoryState()
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
      <p className="text-base leading-relaxed text-slate-700 md:text-right md:text-lg">
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
        className={cn(
          'flex w-full items-center justify-between rounded-sm border border-slate-900 px-3 py-2 text-sm font-semibold uppercase transition-colors',
          isActive ? 'bg-primary/10 border-primary text-primary' : 'text-slate-900 hover:bg-white/25 hover:text-primary hover:border-primary',
        )}
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

  const renderRandomEntryCard = () =>
    randomEntry ? (
      <button
        type="button"
        onClick={() => handleSelectEntry(randomEntry)}
        className="w-full cursor-pointer space-y-2 text-left hover:[&>*]:text-primary [&>*]:transition-colors"
      >
        <p className="text-md md:text-xl font-medium text-slate-900">
          Czy wiesz co po śląsku znaczy
        </p>
        <p className="text-2xl md:text-4xl font-bold text-slate-900">
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

  const renderCategoryEntriesSection = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={showCategoryList}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-slate-900 text-slate-900 transition-colors hover:border-primary hover:bg-white/25 hover:text-primary"
          aria-label="Wróć do listy kategorii"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-900">
          {activeCategoryData ? activeCategoryData.name : 'Kategorie'}
        </span>
        {activeCategoryData?.description && (
          <p className="text-xs text-slate-500">{activeCategoryData.description}</p>
        )}
      </div>

      {isFetchingCategory && sortedCategoryEntries.length === 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      ) : sortedCategoryEntries.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {sortedCategoryEntries.map(entry => (
            <button
              key={entry.id}
              type="button"
              onClick={() => handleSelectEntry(entry)}
              className="w-full border-b border-slate-900 px-0 py-2 text-left text-sm font-medium text-slate-900 transition-colors hover:text-primary"
            >
              {entry.sourceWord}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{categoryError ?? 'Brak haseł w tej kategorii.'}</p>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-white bg-[url('/bg-hex-2.png')] bg-top bg-no-repeat text-slate-900 transition-colors">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 md:gap-12 md:py-14 md:flex-row md:gap-20">
        <aside className="md:w-1/3 md:sticky md:top-10">
          <div className="flex flex-col gap-6 pb-6 md:gap-10 md:pb-0">
            <AddWordHeader />
                    <div className="mt-2 pb-4 border-b-2 border-black">
                      {renderRandomEntryCard() ?? (
                        <div className="rounded-sm border border-dashed border-slate-900/30 p-4 text-sm text-slate-600">
                          Brak wyróżnionego hasła.
                        </div>
                      )}
                    </div>
          </div>
        </aside>

        <main className="md:w-2/3">
          <div className="flex flex-col gap-6">

            <section className="flex flex-wrap items-stretch gap-6 md:mt-2 md:flex-row md:items-start md:justify-between">
              <p className="text-lg min-w-[180px] flex-1 md:max-w-xl font-bold md:text-2xl text-slate-900">
                Techniczny słownik śląsko-polski rozwijany przez społeczność i ekspertów branżowych.
              </p>
            </section>

            <section className="space-y-3 bg-accent/75 p-6 md:p-8">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <Input
                    value={searchTerm}
                    onChange={event => handleInputChange(event.target.value)}
                    placeholder="Wyszukaj w słowniku..."
                    className={`${inputField} h-14 pl-11 text-xl font-semibold tracking-wide`}
                  />
                  {isFetchingSuggestions && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" />
                  )}
                </div>
                {(suggestions.length > 0 || searchError || isFetchingSuggestions) && (
                  <div className="max-h-64 overflow-y-auto rounded-md border border-slate-900/20 bg-white/90 shadow-lg">
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
                            className={cn(
                              'w-full border-b border-slate-900 px-0 py-2 text-left text-sm transition-colors last:border-b-0',
                              isActive ? 'font-semibold text-primary' : 'text-slate-900 hover:text-primary',
                            )}
                          >
                            <span className="block font-medium">{entry.sourceWord}</span>
                            <span className="block text-xs text-slate-500">{entry.targetWord}</span>
                          </button>
                        )
                      })
                    )}
                    {searchError && suggestions.length === 0 && (
                      <p className="px-4 py-3 text-sm text-slate-600">
                        {searchError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <p className="text-sm font-semibold uppercase text-slate-900">
                  Wpisz słowo po polsku lub śląsku lub
              </p>

              <div className="space-y-3">
                <div className="relative overflow-hidden">
                  <div
                    className={cn(
                      'transition-all duration-300',
                      isCategoryPanelOpen
                        ? 'pointer-events-none absolute inset-0 translate-x-[-105%] opacity-0'
                        : 'relative translate-x-0 opacity-100',
                    )}
                  >
                    <button
                      type="button"
                      onClick={showCategoryList}
                      className="flex w-full items-center justify-between rounded-sm border border-slate-900 px-3 py-2 text-sm font-semibold uppercase text-slate-900 transition-colors hover:border-primary hover:bg-white/25 hover:text-primary"
                      aria-expanded={isCategoryPanelOpen}
                      aria-controls="categories-panel"
                    >
                      <span>Znajdź słowo wg kategorii</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div
                    id="categories-panel"
                    className={cn(
                      'transition-all duration-300',
                      isCategoryPanelOpen && !isCategoryView
                        ? 'relative translate-x-0 opacity-100'
                        : 'pointer-events-none absolute inset-0 translate-x-[105%] opacity-0',
                    )}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={closeCategoryPanel}
                          className="flex h-8 w-8 items-center justify-center rounded-sm border border-slate-900 text-slate-900 transition-colors hover:border-primary hover:bg-white/25 hover:text-primary"
                          aria-label="Wróć do poprzedniego widoku"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-900">
                          Kategorie
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">{categoryButtons}</div>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'transition-all duration-300',
                      isCategoryView
                        ? 'relative translate-x-0 opacity-100'
                        : 'pointer-events-none absolute inset-0 translate-x-[105%] opacity-0',
                    )}
                  >
                    {renderCategoryEntriesSection()}
                  </div>
                </div>
              </div>

              {(isEntryLoading && !selectedEntry) || selectedEntry ? (
                <>

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
                      <div className="h-px w-full bg-slate-900/20" />
                      <div className="space-y-3">
                        <Skeleton className="h-5 w-4/5" />
                        <Skeleton className="h-5 w-3/5" />
                        <Skeleton className="h-5 w-2/5" />
                      </div>
                      <div className="h-px w-full bg-slate-900/20" />
                      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] md:items-start">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  ) : selectedEntry ? (
                    <div className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] md:items-start">
                        <div className="space-y-2">
                          <h3 className="mb-4 text-5xl font-semibold leading-tight text-primary md:text-6xl">
                            {selectedEntry.sourceWord}
                          </h3>
                          {selectedEntry.pronunciation && (
                            <p className="text-lg font-mono text-slate-600">
                              [{selectedEntry.pronunciation}]
                            </p>
                          )}
                          {selectedEntry.partOfSpeech && (
                            <p className="text-xs font-bold uppercase text-slate-900">
                              {selectedEntry.partOfSpeech}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 text-right">
                          {translations.length > 0 ? (
                            translations.map(translation => (
                              <p key={translation} className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
                                {translation}
                              </p>
                            ))
                          ) : (
                            <p className="text-base text-slate-700">Brak tłumaczeń.</p>
                          )}
                        </div>
                      </div>

                      <Separator className="h-px bg-slate-900/20" />

                      <div className="space-y-4">
                        {selectedEntry.exampleSentences.length > 0 ? (
                          selectedEntry.exampleSentences.map(renderExampleSentence)
                        ) : (
                          <p className="text-sm text-slate-600">Brak przykładów użycia dla tego hasła.</p>
                        )}
                      </div>

                      <Separator className="h-px bg-slate-900/20" />

                      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] md:items-start">
                        <div className="text-sm text-slate-700">
                          {selectedEntry.notes ?? 'Brak dodatkowych notatek.'}
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleCategoryClick(selectedEntry.category.slug)}
                            className="inline-flex items-center gap-2 rounded-sm border border-slate-900 px-3 py-1 text-sm font-semibold text-slate-900 transition-colors hover:border-primary hover:text-primary"
                          >
                            <span>{selectedEntry.category.name}</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </section>

            <Separator className="h-[2px] bg-slate-900" />

            <section className="p-0">
              <div className="space-y-4 md:flex md:items-start md:justify-between md:space-y-0">
                <div className="space-y-4 md:w-1/2 md:pr-6">
                  <h2 className="text-2xl font-bold">
                    Pomóż nam rozwijać słownik!
                  </h2>
                  <p className="text-sm text-slate-600">
                    Znasz śląskie słowo, które powinno się tu znaleźć? Zapraszamy do dodania go do naszego słownika. Kliknij ponizej aby przejść do formularza.
                  </p>
                  <div className="w-full max-w-sm">{addWordButton}</div>
                </div>
                <div className="space-y-6 md:w-1/2 md:pl-6">
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.18em] text-slate-500">Ostatnio dodane hasła</h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {recentSilesianEntries.length > 0 ? (
                        recentSilesianEntries.map(entry => (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => handleRecentClick(entry)}
                            className="w-full border-b border-slate-900 px-0 py-2 text-left text-sm font-medium text-slate-900 transition-colors hover:text-primary"
                          >
                            {entry.sourceWord}
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Brak nowych wpisów.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="h-[2px] bg-slate-900" />

            <section className="space-y-5 text-slate-900">
              <header className="space-y-3">
                <h2 className="text-2xl font-bold">
                  Na czym polega projekt „Śląski słownik majsterkowy”
                </h2>
                <p className="text-base leading-relaxed text-slate-700">
                  Nasz projekt łączy tradycję gwary śląskiej z majsterkowaniem i edukacją techniczną. Chcemy pokazać,
                  że gwara jest żywa i może być inspirującym narzędziem do nauki.
                </p>
              </header>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-md font-semibold uppercase">Co planujemy?</h3>
                  <ul className="space-y-3 text-base leading-relaxed text-slate-700">
                    <li className="flex items-start gap-3">
                      <Hammer className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                      <span>
                        stworzenie śląskiego słownika majsterkowego - katalogu słów związanych z techniką, narzędziami i
                        wynalazczością. Słownik powstanie wspólnie z mieszkańcami Śląska poprzez narzędzie online, a
                        następnie zostanie wydany w formie drukowanej,
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Hammer className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                      <span>
                        przygotowanie materiałów edukacyjnych dla nauczycieli i edukatorów, które pomogą wprowadzać gwarę
                        do zajęć,
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Hammer className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                      <span>
                        organizację 10 warsztatów: pięciu dla nauczycieli i edukatorów oraz pięciu dla uczniów, łączących
                        praktyczne majsterkowanie z nauką gwary.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-md font-semibold uppercase">Rezultat projektu</h3>
                  <p className="text-base leading-relaxed text-slate-700">
                    Powstaną trzy publikacje: dwa zeszyty inspiracyjne i metodyczne oraz ilustrowany słownik majsterkowy z
                    co najmniej 50 hasłami.
                  </p>
                </div>

                <p className="text-base leading-relaxed text-slate-700">
                  Dzięki wspólnej pracy nad słownikiem i warsztatom mieszkańcy Śląska w różnym wieku będą mogli aktywnie
                  włączyć się w ochronę i rozwój gwary - w nowoczesnej, twórczej formie.
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
          {showAdminCredentials && adminCredentials ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="admin-email">Adres e-mail</Label>
                <Input
                  id="admin-email"
                  value={adminCredentials.email}
                  readOnly
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="admin-password">Hasło</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminCredentials.password}
                  readOnly
                  className="border-slate-300"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-4 text-sm text-slate-600">
              <p>
                Aby uzyskać dostęp do panelu moderatora, użyj swoich danych logowania. Jeśli ich nie posiadasz,
                skontaktuj się z administratorem projektu.
              </p>
              <Button variant="outline" asChild>
                <Link href="/admin">Przejdź do logowania</Link>
              </Button>
            </div>
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

      <Footer onOpenAdminDialog={() => setIsAdminDialogOpen(true)} />
    </div>
  )
}
