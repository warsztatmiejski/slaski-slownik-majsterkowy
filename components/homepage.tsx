'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, Sparkles, ChevronRight, Loader2, Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import ThemeToggle from '@/components/theme-toggle'
import { Skeleton } from '@/components/ui/skeleton'
import AddWordHeader from '@/components/add-word-header'
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
    context?: string
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
      context?: string | null
    }[]
  }>
  total: number
  query: string
}

const languageLabels: Record<LanguageCode, string> = {
  SILESIAN: 'śląski',
  POLISH: 'polski',
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
      context: sentence.context ?? undefined,
    })),
  }
}

function languageDirection(entry: EntryPreview): string {
  return `${languageLabels[entry.sourceLang]} → ${languageLabels[entry.targetLang]}`
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

  const randomEntry = useMemo(() => {
    if (featuredEntry) return featuredEntry
    if (recentEntries.length > 0) return recentEntries[0]
    return null
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
    } else {
      setActiveCategory(null)
      setPendingCategoryFetch(null)
      setCategoryEntries([])
      setCategoryError(null)
      setIsFetchingCategory(false)
      updateUrlWithCategory(null)
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
      className="rounded-sm border border-slate-900/30 bg-white/70 p-4 text-slate-900 shadow-sm transition-colors dark:border-slate-100/30 dark:bg-slate-900/70 dark:text-slate-100"
    >
      <p className="font-medium text-primary">{sentence.sourceText}</p>
      <p className="text-sm text-slate-700 dark:text-slate-300">
        {sentence.translatedText}
      </p>
      {sentence.context && (
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {sentence.context}
        </p>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-white bg-[url('/bg-hex.png')] bg-top bg-no-repeat text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-4 py-14 md:flex-row md:gap-20">
        <aside className="md:w-1/3 md:sticky md:top-10">
          <div className="flex h-full flex-col gap-10 py-6 md:py-0">
            <AddWordHeader />

            {randomEntry && (
              <div className="space-y-3 pt-6">
                
                <button
                  type="button"
                  onClick={() => handleSelectEntry(randomEntry)}
                  className="w-full cursor-pointer space-y-2 border-b-2 border-slate-900 pb-3 text-left transition-colors hover:text-primary dark:border-slate-100"
                >
                  <p className="text-xl font-medium text-slate-900 dark:text-slate-100">
                    Czy wiesz co po śląsku znaczy
                  </p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                    {randomEntry.sourceWord}?
                  </p>
                  <p className="text-right text-sm font-semibold text-primary">
                    Sprawdź →
                  </p>
                </button>
              </div>
            )}

            <div className="space-y-3">
              <nav
                className="space-y-2 text-sm text-slate-900 dark:text-slate-100"
                aria-label={`Kategorie (${stats.totalEntries.toLocaleString('pl-PL')} haseł)`}
              >
                {categories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryClick(category.slug)}
                    className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left transition-colors ${
                      activeCategory === category.slug
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
                ))}
              </nav>
                          </div>
          </div>
        </aside>

        <main className="md:w-2/3">
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-4 md:mt-4 md:flex-row md:items-center md:justify-between">
              <p className="max-w-xl font-bold text-lg text-slate-900 dark:text-slate-100">
                Techniczny słownik śląsko-polski rozwijany przez społeczność i ekspertów branżowych.
              </p>
              <Button asChild>
                <Link href="/dodaj">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Dodaj nowe słowo
                </Link>
              </Button>
            </section>

            <Separator className="h-[2px] bg-slate-900 dark:bg-slate-100" />

            <section className="space-y-5 rounded-sm bg-red-200/50 p-6 md:p-8 dark:bg-red-900/40">
              <h2 className="text-xl font-semibold uppercase tracking-[0.12em]">Wyszukaj w słowniku</h2>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <Input
                    value={searchTerm}
                    onChange={event => handleInputChange(event.target.value)}
                    placeholder="Zacznij wpisywać słowo po śląsku lub po polsku..."
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
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                    Ostatnio dodane hasła
                  </p>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {recentSilesianEntries.map(entry => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => handleRecentClick(entry)}
                        className="flex items-center justify-between text-left text-sm text-slate-900 border-b-1 border-slate-900 dark:border-slate-100 transition-colorsdark:text-slate-100 hover:text-primary hover:border-primary"
                      >
                        <span className="inline-block pb-1 transition-colors ">
                          {entry.sourceWord}
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <Separator className="h-[2px] bg-slate-900 dark:bg-slate-100" />

            {!activeCategory && (selectedEntry || isEntryLoading) && (
              <section className="space-y-6 rounded-sm bg-amber-200/50 p-6 md:p-8 dark:bg-amber-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold uppercase tracking-[0.12em]">Szczegóły hasła</h2>
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {selectedEntry ? languageDirection(selectedEntry) : 'Ładowanie wpisu...'}
                    </p>
                  </div>
                  {selectedEntry && (
                    <Badge variant="secondary" className="bg-white/80 text-slate-900 dark:bg-slate-900/80 dark:text-slate-100">
                      {selectedEntry.category.name}
                    </Badge>
                  )}
                </div>

                {isEntryLoading && !selectedEntry ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-20 w-full" />
                    <div className="grid gap-4 md:grid-cols-2">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </div>
                ) : selectedEntry ? (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <h3 className="text-4xl font-semibold tracking-wide text-primary">
                          {selectedEntry.sourceWord}
                        </h3>
                        {selectedEntry.pronunciation && (
                          <p className="text-sm font-mono text-slate-600 dark:text-slate-300">
                            [{selectedEntry.pronunciation}]
                          </p>
                        )}
                      </div>
                      <div className="space-y-1 text-right text-sm text-slate-600 dark:text-slate-300">
                        {selectedEntry.partOfSpeech && (
                          <p className="uppercase tracking-[0.18em]">{selectedEntry.partOfSpeech}</p>
                        )}
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {selectedEntry.targetWord}
                        </p>
                      </div>
                    </div>

                    {selectedEntry.alternativeTranslations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em]">Alternatywne tłumaczenia</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedEntry.alternativeTranslations.map(translation => (
                            <Badge key={translation} variant="outline">
                              {translation}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEntry.notes && (
                      <div className="rounded-sm border border-slate-900/20 bg-white/70 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-100/20 dark:bg-slate-900/70 dark:text-slate-200">
                        {selectedEntry.notes}
                      </div>
                    )}

                    <div className="space-y-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em]">Przykłady użycia</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        {selectedEntry.exampleSentences.map(renderExampleSentence)}
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
              <section className="space-y-4 rounded-sm bg-slate-200/50 p-6 md:p-8 dark:bg-slate-900/50">
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
                        className="flex items-center justify-between text-left text-sm text-slate-900 border-b-1 border-slate-900 dark:border-slate-100 transition-colorsdark:text-slate-100 hover:text-primary hover:border-primary"
                      >
                        <span className="inline-block pb-1 transition-colors">
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
              Śląski Słownik Majsterkowy chroni fachową terminologię regionu i udostępnia ją kolejnym pokoleniom specjalistów.
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
