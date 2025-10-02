'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  Edit,
  Check,
  X,
  Eye,
  Settings,
  BookOpen,
  Clock,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AdminEntry,
  AdminStats,
  CategorySummary,
  DictionaryAPI,
  PendingSubmission,
  UpdateEntryPayload,
  formatDate,
} from '@/lib/api-clients'
import type { Language } from '@prisma/client'

const STATUS_OPTIONS = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'] as const

interface ExampleFormState {
  id?: string
  tempId: string
  sourceText: string
  translatedText: string
}

interface EntryFormState {
  id: string
  sourceWord: string
  sourceLang: Language
  targetWord: string
  targetLang: Language
  slug: string
  pronunciation: string
  partOfSpeech: string
  notes: string
  categoryId: string
  status: string
  alternativeTranslationsText: string
  exampleSentences: ExampleFormState[]
}

const inputStyles = 'border border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100'
const textareaStyles = 'border border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100'

function generateTempId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normaliseAlternativeTranslations(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map(value => value.trim())
    .filter(Boolean)
}

function mapEntryToForm(entry: AdminEntry): EntryFormState {
  return {
    id: entry.id,
    sourceWord: entry.sourceWord,
    sourceLang: entry.sourceLang,
    targetWord: entry.targetWord,
    targetLang: entry.targetLang,
    slug: entry.slug ?? '',
    pronunciation: entry.pronunciation ?? '',
    partOfSpeech: entry.partOfSpeech ?? '',
    notes: entry.notes ?? '',
    categoryId: entry.category.id,
    status: entry.status,
    alternativeTranslationsText: entry.alternativeTranslations.join('\n'),
    exampleSentences: entry.exampleSentences.map(sentence => ({
      id: sentence.id,
      tempId: sentence.id,
      sourceText: sentence.sourceText,
      translatedText: sentence.translatedText,
    })),
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([])
  const [entries, setEntries] = useState<AdminEntry[]>([])
  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategorySlug, setNewCategorySlug] = useState('')
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [processingSubmissionId, setProcessingSubmissionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [entryDialogOpen, setEntryDialogOpen] = useState(false)
  const [entryForm, setEntryForm] = useState<EntryFormState | null>(null)
  const [entryError, setEntryError] = useState<string | null>(null)
  const [isSavingEntry, setIsSavingEntry] = useState(false)

  const refreshStats = useCallback(async () => {
    const data = await DictionaryAPI.getAdminStats()
    setStats(data)
  }, [])

  const refreshPendingSubmissions = useCallback(async () => {
    const data = await DictionaryAPI.getPendingSubmissions()
    setPendingSubmissions(data)
  }, [])

  const refreshEntries = useCallback(async () => {
    const data = await DictionaryAPI.getAdminEntries()
    setEntries(data)
  }, [])

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true)
      setGlobalError(null)
      const [statsData, pendingData, entriesData, categoriesData] = await Promise.all([
        DictionaryAPI.getAdminStats(),
        DictionaryAPI.getPendingSubmissions(),
        DictionaryAPI.getAdminEntries(),
        DictionaryAPI.getCategories(),
      ])
      setStats(statsData)
      setPendingSubmissions(pendingData)
      setEntries(entriesData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Admin dashboard fetch failed:', error)
      setGlobalError('Nie udało się pobrać danych panelu administratora. Spróbuj ponownie później.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAllData()
  }, [fetchAllData])

  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) {
      return entries
    }
    const term = searchTerm.toLowerCase()
    return entries.filter(entry =>
      entry.sourceWord.toLowerCase().includes(term) ||
      entry.targetWord.toLowerCase().includes(term) ||
      entry.slug?.toLowerCase().includes(term) ||
      entry.alternativeTranslations.some(translation => translation.toLowerCase().includes(term)),
    )
  }, [entries, searchTerm])

  const openEntryDialog = (entry: AdminEntry) => {
    setEntryForm(mapEntryToForm(entry))
    setEntryError(null)
    setEntryDialogOpen(true)
  }

  const handleCreateCategory = async (event: FormEvent) => {
    event.preventDefault()
    const name = newCategoryName.trim()
    const slug = newCategorySlug.trim()

    if (!name) {
      setCategoryError('Podaj nazwę kategorii.')
      return
    }

    setIsSavingCategory(true)
    setCategoryError(null)

    try {
      const response = await DictionaryAPI.createCategory({ name, slug: slug || undefined })
      setCategories(prev => [...prev, response.category])
      setNewCategoryName('')
      setNewCategorySlug('')
      setIsCategoryDialogOpen(false)
    } catch (error) {
      console.error('Create category failed:', error)
      setCategoryError('Nie udało się dodać kategorii. Spróbuj ponownie.')
    } finally {
      setIsSavingCategory(false)
    }
  }

  const closeEntryDialog = () => {
    setEntryDialogOpen(false)
    setEntryForm(null)
    setEntryError(null)
  }

  const updateEntryFormField = <K extends keyof EntryFormState>(field: K, value: EntryFormState[K]) => {
    setEntryForm(prev => (prev ? { ...prev, [field]: value } : prev))
  }

  const updateExampleSentence = (tempId: string, field: keyof ExampleFormState, value: string) => {
    setEntryForm(prev =>
      prev
        ? {
            ...prev,
            exampleSentences: prev.exampleSentences.map(example =>
              example.tempId === tempId ? { ...example, [field]: value } : example,
            ),
          }
        : prev,
    )
  }

  const addExampleSentence = () => {
    setEntryForm(prev =>
      prev
        ? {
            ...prev,
            exampleSentences: [
              ...prev.exampleSentences,
              {
                tempId: generateTempId(),
                sourceText: '',
                translatedText: '',
              },
            ],
          }
        : prev,
    )
  }

  const removeExampleSentence = (tempId: string) => {
    setEntryForm(prev =>
      prev
        ? {
            ...prev,
            exampleSentences: prev.exampleSentences.filter(example => example.tempId !== tempId),
          }
        : prev,
    )
  }

  const handleReviewSubmission = async (submissionId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingSubmissionId(submissionId)
      await DictionaryAPI.reviewSubmission(
        submissionId,
        action,
        reviewNotes[submissionId]?.trim() || undefined,
        'admin-dashboard',
      )
      const remainingNotes = { ...reviewNotes }
      delete remainingNotes[submissionId]
      setReviewNotes(remainingNotes)
      await Promise.all([refreshPendingSubmissions(), refreshEntries(), refreshStats()])
    } catch (error) {
      console.error('Review submission failed:', error)
      setGlobalError('Nie udało się zaktualizować zgłoszenia. Spróbuj ponownie.')
    } finally {
      setProcessingSubmissionId(null)
    }
  }

  const handleSaveEntry = async () => {
    if (!entryForm) return

    const alternativeTranslations = normaliseAlternativeTranslations(entryForm.alternativeTranslationsText)

    const exampleSentencesPayload: NonNullable<UpdateEntryPayload['exampleSentences']> = entryForm.exampleSentences
      .map(({ id, sourceText, translatedText }) => ({
        id,
        sourceText: sourceText.trim(),
        translatedText: translatedText.trim(),
      }))
      .filter(sentence => sentence.sourceText && sentence.translatedText)

    if (exampleSentencesPayload.length === 0) {
      setEntryError('Dodaj co najmniej jeden przykład użycia.')
      return
    }

    const payload: UpdateEntryPayload = {
      sourceWord: entryForm.sourceWord.trim(),
      sourceLang: 'SILESIAN' as Language,
      targetWord: entryForm.targetWord.trim(),
      targetLang: 'POLISH' as Language,
      slug: entryForm.slug.trim() || null,
      pronunciation: entryForm.pronunciation.trim() || null,
      partOfSpeech: entryForm.partOfSpeech.trim() || null,
      notes: entryForm.notes.trim() || null,
      categoryId: entryForm.categoryId,
      status: entryForm.status,
      alternativeTranslations,
      exampleSentences: exampleSentencesPayload,
    }

    try {
      setIsSavingEntry(true)
      const response = await DictionaryAPI.updateEntry(entryForm.id, payload)
      setEntries(prev => prev.map(entry => (entry.id === response.entry.id ? response.entry : entry)))
      closeEntryDialog()
      await refreshStats()
    } catch (error) {
      console.error('Entry update failed:', error)
      setEntryError('Nie udało się zapisać zmian. Sprawdź dane i spróbuj ponownie.')
    } finally {
      setIsSavingEntry(false)
    }
  }

  const renderSubmissionExamples = (examples: PendingSubmission['exampleSentences']) => {
    if (!examples.length) {
      return <p className="text-muted-foreground">Brak przykładów w zgłoszeniu.</p>
    }
    return (
      <ul className="space-y-2 text-muted-foreground">
        {examples.map((example, index) => (
          <li key={`${example.sourceText}-${index}`}>
            <span className="font-medium text-foreground">{example.sourceText}</span>
            <span className="mx-2 text-sm text-muted-foreground">→</span>
            <span>{example.translatedText}</span>
          </li>
        ))}
      </ul>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-background dark:from-slate-900/20">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Wczytywanie panelu administratora…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-900/20">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Settings className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Panel administratora</h1>
                <p className="text-sm text-muted-foreground">Śląski Słownik Majsterkowy</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" asChild>
                <Link href="/">
                  <Eye className="mr-2 h-4 w-4" />
                  Podgląd słownika
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/dodaj">
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj wpis
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {globalError && (
          <Card className="border-red-300 dark:border-red-800">
            <CardContent className="flex items-center justify-between gap-4 p-4 text-sm text-red-700 dark:text-red-300">
              <span>{globalError}</span>
              <Button size="sm" variant="outline" onClick={() => fetchAllData()}>
                Spróbuj ponownie
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Wpisy w słowniku</p>
                  <p className="text-3xl font-bold text-primary">{stats?.totalEntries ?? '—'}</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Oczekujące zgłoszenia</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {stats?.pendingSubmissions ?? pendingSubmissions.length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Zatwierdzone dziś</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.approvedToday ?? '—'}</p>
                </div>
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Odrzucone dziś</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats?.rejectedToday ?? '—'}</p>
                </div>
                <X className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Oczekujące zgłoszenia ({pendingSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="entries">Wpisy ({entries.length})</TabsTrigger>
            <TabsTrigger value="settings">Ustawienia</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Zgłoszenia oczekujące na weryfikację</CardTitle>
                <CardDescription>
                  Przejrzyj i zatwierdź lub odrzuć zgłoszenia od użytkowników
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingSubmissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Brak zgłoszeń oczekujących na weryfikację.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingSubmissions.map(submission => (
                      <Card key={submission.id} className="border-orange-200 dark:border-orange-800">
                        <CardContent className="space-y-4 p-6">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-lg font-semibold text-primary">
                                  {submission.sourceWord} → {submission.targetWord}
                                </h3>
                                <Badge variant="outline">
                                  {submission.category?.name ?? 'Nieznana kategoria'}
                                </Badge>
                              </div>
                              <div className="grid gap-4 text-sm md:grid-cols-2">
                                <div>
                                  <p className="font-medium text-foreground">Przykłady:</p>
                                  {renderSubmissionExamples(submission.exampleSentences)}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">Notatki:</p>
                                  <p className="text-muted-foreground">
                                    {submission.notes || 'Brak dodatkowych informacji'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Zgłoszone przez: {submission.submitterName ?? 'Anonimowy użytkownik'}
                                {submission.submitterEmail ? ` (${submission.submitterEmail})` : ''} •{' '}
                                {formatDate(submission.submittedAt)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:flex-col md:items-stretch md:gap-3">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Szczegóły zgłoszenia</DialogTitle>
                                    <DialogDescription>
                                      Przejrzyj wszystkie dane zgłoszenia przed podjęciem decyzji
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 text-sm">
                                    <div className="grid gap-4 md:grid-cols-2">
                                      <div className="space-y-1">
                                        <Label>Słowo źródłowe</Label>
                                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                          {submission.sourceWord}
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <Label>Tłumaczenie</Label>
                                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                          {submission.targetWord}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                      <div className="space-y-1">
                                        <Label>Wymowa</Label>
                                        <p className="text-muted-foreground">
                                          {submission.pronunciation ? `[${submission.pronunciation}]` : '—'}
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <Label>Część mowy</Label>
                                        <p className="text-muted-foreground">{submission.partOfSpeech ?? '—'}</p>
                                      </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                      <div className="space-y-1">
                                        <Label>Kategoria</Label>
                                        <p className="text-muted-foreground">
                                          {submission.category?.name ?? 'Nieznana kategoria'}
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <Label>Zgłaszający</Label>
                                        <p className="text-muted-foreground">
                                          {submission.submitterName ?? 'Anonimowy użytkownik'}
                                          {submission.submitterEmail ? ` (${submission.submitterEmail})` : ''}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Przykłady użycia</Label>
                                      {submission.exampleSentences.length ? (
                                        <ul className="space-y-2">
                                          {submission.exampleSentences.map((example, index) => (
                                            <li key={`${example.sourceText}-${index}`} className="rounded border border-slate-200 bg-white p-3 text-slate-900 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-100">
                                              <p className="font-medium">{example.sourceText}</p>
                                              <p className="text-xs text-muted-foreground">→ {example.translatedText}</p>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-muted-foreground">Brak przykładów.</p>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Notatki autora</Label>
                                      <p className="text-muted-foreground">{submission.notes ?? 'Brak dodatkowych informacji.'}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Uwagi do decyzji</Label>
                                      <Textarea
                                        value={reviewNotes[submission.id] ?? ''}
                                        onChange={event =>
                                          setReviewNotes(prev => ({
                                            ...prev,
                                            [submission.id]: event.target.value,
                                          }))
                                        }
                                        placeholder="Dodaj uwagi do decyzji..."
                                        className={textareaStyles}
                                      />
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => handleReviewSubmission(submission.id, 'reject')}
                                        disabled={processingSubmissionId === submission.id}
                                      >
                                        {processingSubmissionId === submission.id ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <X className="mr-2 h-4 w-4" />
                                        )}
                                        Odrzuć zgłoszenie
                                      </Button>
                                      <Button
                                        onClick={() => handleReviewSubmission(submission.id, 'approve')}
                                        disabled={processingSubmissionId === submission.id}
                                      >
                                        {processingSubmissionId === submission.id ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <Check className="mr-2 h-4 w-4" />
                                        )}
                                        Zatwierdź zgłoszenie
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReviewSubmission(submission.id, 'reject')}
                                disabled={processingSubmissionId === submission.id}
                              >
                                {processingSubmissionId === submission.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleReviewSubmission(submission.id, 'approve')}
                                disabled={processingSubmissionId === submission.id}
                              >
                                {processingSubmissionId === submission.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="entries" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Wpisy w słowniku</CardTitle>
                    <CardDescription>Zarządzaj zatwierdzonymi hasłami</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Szukaj wpisów..."
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button variant="outline" asChild>
                      <Link href="/dodaj">
                        <Plus className="mr-2 h-4 w-4" />
                        Nowy wpis
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Brak wpisów spełniających kryteria wyszukiwania.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredEntries.map(entry => (
                      <Card key={entry.id} className="border-green-200 dark:border-green-800">
                        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-lg font-semibold text-primary">
                                {entry.sourceWord} → {entry.targetWord}
                              </h3>
                              <Badge variant="outline">{entry.category.name}</Badge>
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                                {entry.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Zaktualizowano: {formatDate(entry.updatedAt)}
                              {entry.approvedAt ? ` • Zatwierdzone: ${formatDate(entry.approvedAt)}` : ''}
                            </p>
                            {entry.slug && (
                              <p className="text-sm text-muted-foreground">Slug: {entry.slug}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEntryDialog(entry)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Kategorie słownika</CardTitle>
                  <CardDescription>Zarządzaj listą kategorii</CardDescription>
                </div>
                <Button onClick={() => setIsCategoryDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Dodaj kategorię
                </Button>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Brak zdefiniowanych kategorii.</p>
                ) : (
                  <ul className="space-y-3">
                    {categories.map(category => (
                      <li
                        key={category.id}
                        className="flex flex-col gap-2 rounded border border-slate-200 bg-white p-3 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-100 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">{category.slug}</p>
                          {category.description && (
                            <p className="text-xs text-muted-foreground">{category.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                await DictionaryAPI.deleteCategory(category.id)
                                setCategories(prev => prev.filter(item => item.id !== category.id))
                              } catch (error) {
                                console.error('Delete category failed:', error)
                                setGlobalError('Nie udało się usunąć kategorii. Spróbuj ponownie.')
                              }
                            }}
                          >
                            Usuń
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={entryDialogOpen} onOpenChange={open => (open ? setEntryDialogOpen(true) : closeEntryDialog())}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edytuj wpis</DialogTitle>
            <DialogDescription>Zaktualizuj wszystkie informacje dotyczące hasła.</DialogDescription>
          </DialogHeader>
          {entryForm ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sourceWord">Słowo źródłowe</Label>
                  <Input
                    id="sourceWord"
                    value={entryForm.sourceWord}
                    onChange={event => updateEntryFormField('sourceWord', event.target.value)}
                    className={inputStyles}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetWord">Tłumaczenie</Label>
                  <Input
                    id="targetWord"
                    value={entryForm.targetWord}
                    onChange={event => updateEntryFormField('targetWord', event.target.value)}
                    className={inputStyles}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={entryForm.slug}
                    onChange={event => updateEntryFormField('slug', event.target.value)}
                    placeholder="np. szychta"
                    className={inputStyles}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategoria</Label>
                  <Select
                    value={entryForm.categoryId}
                    onValueChange={value => updateEntryFormField('categoryId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz kategorię" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={entryForm.status} onValueChange={value => updateEntryFormField('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="pronunciation">Wymowa</Label>
                  <Input
                    id="pronunciation"
                    value={entryForm.pronunciation}
                    onChange={event => updateEntryFormField('pronunciation', event.target.value)}
                    placeholder="np. šihta"
                    className={inputStyles}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partOfSpeech">Część mowy</Label>
                  <Input
                    id="partOfSpeech"
                    value={entryForm.partOfSpeech}
                    onChange={event => updateEntryFormField('partOfSpeech', event.target.value)}
                    placeholder="np. rzeczownik"
                    className={inputStyles}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notatki</Label>
                  <Input
                    id="notes"
                    value={entryForm.notes}
                    onChange={event => updateEntryFormField('notes', event.target.value)}
                    placeholder="Dodatkowe informacje"
                    className={inputStyles}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternatives">Alternatywne tłumaczenia</Label>
                <Textarea
                  id="alternatives"
                  value={entryForm.alternativeTranslationsText}
                  onChange={event => updateEntryFormField('alternativeTranslationsText', event.target.value)}
                  placeholder="Każde tłumaczenie w nowej linii lub rozdzielone przecinkami"
                  rows={3}
                  className={textareaStyles}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Przykłady użycia</Label>
                  <Button variant="outline" size="sm" onClick={addExampleSentence}>
                    <Plus className="mr-2 h-4 w-4" /> Dodaj przykład
                  </Button>
                </div>
                <div className="space-y-4">
                  {entryForm.exampleSentences.map(example => (
                    <div key={example.tempId} className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Zdanie źródłowe</Label>
                        <Textarea
                          value={example.sourceText}
                          onChange={event => updateExampleSentence(example.tempId, 'sourceText', event.target.value)}
                          rows={2}
                          className={textareaStyles}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tłumaczenie</Label>
                        <Textarea
                          value={example.translatedText}
                          onChange={event => updateExampleSentence(example.tempId, 'translatedText', event.target.value)}
                          rows={2}
                          className={textareaStyles}
                        />
                      </div>
                      <div className="md:col-span-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExampleSentence(example.tempId)}
                          disabled={entryForm.exampleSentences.length <= 1}
                        >
                          Usuń przykład
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {entryError && <p className="text-sm text-red-600 dark:text-red-400">{entryError}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nie znaleziono danych wpisu.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeEntryDialog} disabled={isSavingEntry}>
              Anuluj
            </Button>
            <Button onClick={handleSaveEntry} disabled={isSavingEntry || !entryForm}>
              {isSavingEntry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Zapisz zmiany
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dodaj nową kategorię</DialogTitle>
            <DialogDescription>
              Podaj nazwę (i opcjonalnie slug) dla nowej kategorii słownika.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateCategory}>
            <div className="space-y-2">
              <Label htmlFor="new-category-name">Nazwa kategorii</Label>
              <Input
                id="new-category-name"
                value={newCategoryName}
                onChange={event => setNewCategoryName(event.target.value)}
                className={inputStyles}
                placeholder="np. Górnictwo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-category-slug">Slug (opcjonalnie)</Label>
              <Input
                id="new-category-slug"
                value={newCategorySlug}
                onChange={event => setNewCategorySlug(event.target.value)}
                className={inputStyles}
                placeholder="np. gornictwo"
              />
            </div>
            {categoryError && <p className="text-sm text-red-600 dark:text-red-400">{categoryError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)} disabled={isSavingCategory}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isSavingCategory}>
                {isSavingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Dodaj kategorię
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
