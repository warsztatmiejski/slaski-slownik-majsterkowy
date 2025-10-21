'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  LogOut,
  Trash2,
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
  PartOfSpeechOption,
  DictionaryAPI,
  PendingSubmission,
  UpdateEntryPayload,
  formatDate,
} from '@/lib/api-clients'
import type { Language } from '@prisma/client'

const STATUS_OPTIONS = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'] as const
const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  DRAFT: 'Szkic',
  PENDING: 'Oczekujące',
  APPROVED: 'Zatwierdzone',
  REJECTED: 'Odrzucone',
}

function sortCategoriesByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' }))
}

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

const inputStyles =
  'border border-slate-400 bg-white text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60'
const textareaStyles =
  'border border-slate-400 bg-white text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60'
const selectStyles =
  'border border-slate-400 bg-white text-left text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60'

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
  const [isCategoryEditDialogOpen, setIsCategoryEditDialogOpen] = useState(false)
  const [categoryEditName, setCategoryEditName] = useState('')
  const [categoryEditDescription, setCategoryEditDescription] = useState('')
  const [categoryEditSlug, setCategoryEditSlug] = useState('')
  const [categoryEditError, setCategoryEditError] = useState<string | null>(null)
  const [categoryBeingEdited, setCategoryBeingEdited] = useState<CategorySummary | null>(null)
  const [isSavingCategoryEdit, setIsSavingCategoryEdit] = useState(false)
  const [isCategoryDeleteDialogOpen, setIsCategoryDeleteDialogOpen] = useState(false)
  const [categoryPendingRemoval, setCategoryPendingRemoval] = useState<CategorySummary | null>(null)
  const [categoryDeleteError, setCategoryDeleteError] = useState<string | null>(null)
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)
  const [partsOfSpeech, setPartsOfSpeech] = useState<PartOfSpeechOption[]>([])
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false)
  const [partLabel, setPartLabel] = useState('')
  const [partValue, setPartValue] = useState('')
  const [partOrder, setPartOrder] = useState('')
  const [partError, setPartError] = useState<string | null>(null)
  const [isSavingPart, setIsSavingPart] = useState(false)
  const [isPartEditDialogOpen, setIsPartEditDialogOpen] = useState(false)
  const [partBeingEdited, setPartBeingEdited] = useState<PartOfSpeechOption | null>(null)
  const [partEditLabel, setPartEditLabel] = useState('')
  const [partEditValue, setPartEditValue] = useState('')
  const [partEditOrder, setPartEditOrder] = useState('')
  const [partEditError, setPartEditError] = useState<string | null>(null)
  const [isSavingPartEdit, setIsSavingPartEdit] = useState(false)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [processingSubmissionId, setProcessingSubmissionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [entryDialogOpen, setEntryDialogOpen] = useState(false)
  const [entryForm, setEntryForm] = useState<EntryFormState | null>(null)
  const [entryError, setEntryError] = useState<string | null>(null)
  const [isSavingEntry, setIsSavingEntry] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [entryPendingDelete, setEntryPendingDelete] = useState<AdminEntry | null>(null)
  const [isDeletingEntry, setIsDeletingEntry] = useState(false)
  const router = useRouter()

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true)
      const response = await fetch('/api/admin/logout', { method: 'POST' })
      if (!response.ok) {
        throw new Error('Logout failed')
      }
      router.replace('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Admin logout failed:', error)
      setGlobalError('Nie udało się wylogować. Odśwież stronę i spróbuj ponownie.')
      setIsLoggingOut(false)
    }
  }, [router])

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

  const refreshPartsOfSpeech = useCallback(async () => {
    const data = await DictionaryAPI.getAdminPartsOfSpeechOptions()
    setPartsOfSpeech(data)
  }, [])

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true)
      setGlobalError(null)
      const [
        statsData,
        pendingData,
        entriesData,
        categoriesData,
        partsData,
      ] = await Promise.all([
        DictionaryAPI.getAdminStats(),
        DictionaryAPI.getPendingSubmissions(),
        DictionaryAPI.getAdminEntries(),
        DictionaryAPI.getCategories(),
        DictionaryAPI.getAdminPartsOfSpeechOptions(),
      ])
      setStats(statsData)
      setPendingSubmissions(pendingData)
      setEntries(entriesData)
      setCategories(sortCategoriesByName(categoriesData))
      setPartsOfSpeech(partsData)
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
      setCategories(prev =>
        sortCategoriesByName([
          ...prev,
          { ...response.category, entryCount: 0 },
        ]),
      )
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

  const handleDeleteEntry = useCallback(async () => {
    if (!entryPendingDelete) {
      return
    }

    try {
      setIsDeletingEntry(true)
      await DictionaryAPI.deleteEntry(entryPendingDelete.id)
      setEntries(prev => prev.filter(entry => entry.id !== entryPendingDelete.id))
      setEntryPendingDelete(null)
      setIsDeleteDialogOpen(false)
      await refreshStats()
    } catch (error) {
      console.error('Delete entry failed:', error)
      setGlobalError('Nie udało się usunąć wpisu. Spróbuj ponownie później.')
    } finally {
      setIsDeletingEntry(false)
    }
  }, [entryPendingDelete, refreshStats])

  const openCategoryEditDialog = (category: CategorySummary) => {
    setCategoryBeingEdited(category)
    setCategoryEditName(category.name)
    setCategoryEditDescription(category.description ?? '')
    setCategoryEditSlug(category.slug)
    setCategoryEditError(null)
    setIsCategoryEditDialogOpen(true)
  }

  const handleUpdateCategory = async (event: FormEvent) => {
    event.preventDefault()
    if (!categoryBeingEdited) {
      return
    }

    const name = categoryEditName.trim()
    const slug = categoryEditSlug.trim()
    const description = categoryEditDescription.trim()

    if (!name) {
      setCategoryEditError('Podaj nazwę kategorii.')
      return
    }
    if (!slug) {
      setCategoryEditError('Podaj slug kategorii.')
      return
    }

    try {
      setIsSavingCategoryEdit(true)
      setCategoryEditError(null)

      const response = await DictionaryAPI.updateCategory(categoryBeingEdited.id, {
        name,
        slug,
        description: description || null,
      })

      setCategories(prev =>
        sortCategoriesByName(
          prev.map(category =>
            category.id === response.category.id
              ? { ...response.category, entryCount: category.entryCount ?? 0 }
              : category,
          ),
        ),
      )
      setIsCategoryEditDialogOpen(false)
      setCategoryBeingEdited(null)
      setCategoryEditSlug('')
    } catch (error) {
      console.error('Update category failed:', error)
      setCategoryEditError('Nie udało się zaktualizować kategorii. Spróbuj ponownie.')
    } finally {
      setIsSavingCategoryEdit(false)
    }
  }

  const openCategoryDeleteDialog = (category: CategorySummary) => {
    setCategoryPendingRemoval(category)
    setCategoryDeleteError(null)
    setIsCategoryDeleteDialogOpen(true)
  }

  const handleDeleteCategory = useCallback(async () => {
    if (!categoryPendingRemoval) {
      return
    }

    try {
      setIsDeletingCategory(true)
      await DictionaryAPI.deleteCategory(categoryPendingRemoval.id)
      setCategories(prev =>
        sortCategoriesByName(prev.filter(category => category.id !== categoryPendingRemoval.id)),
      )
      setIsCategoryDeleteDialogOpen(false)
      setCategoryPendingRemoval(null)
      setCategoryDeleteError(null)
    } catch (error) {
      console.error('Delete category failed:', error)
      setCategoryDeleteError(
        error instanceof Error ? error.message : 'Nie udało się usunąć kategorii. Spróbuj ponownie.',
      )
    } finally {
      setIsDeletingCategory(false)
    }
  }, [categoryPendingRemoval])

  const parseOrderInput = (value: string): number | undefined => {
    const trimmed = value.trim()
    if (!trimmed) {
      return undefined
    }
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  const handleCreatePartOfSpeech = async (event: FormEvent) => {
    event.preventDefault()
    const label = partLabel.trim()
    const value = partValue.trim()

    if (!label) {
      setPartError('Podaj nazwę części mowy.')
      return
    }

    setIsSavingPart(true)
    setPartError(null)

    try {
      await DictionaryAPI.createPartOfSpeechOption({
        label,
        value: value || undefined,
        order: parseOrderInput(partOrder),
      })
      await refreshPartsOfSpeech()
      setPartLabel('')
      setPartValue('')
      setPartOrder('')
      setIsPartDialogOpen(false)
    } catch (error) {
      console.error('Create part of speech failed:', error)
      setPartError(error instanceof Error ? error.message : 'Nie udało się dodać części mowy.')
    } finally {
      setIsSavingPart(false)
    }
  }

  const openPartOfSpeechEditDialog = (part: PartOfSpeechOption) => {
    setPartBeingEdited(part)
    setPartEditLabel(part.label)
    setPartEditValue(part.value)
    setPartEditOrder(part.order.toString())
    setPartEditError(null)
    setIsPartEditDialogOpen(true)
  }

  const handleUpdatePartOfSpeech = async (event: FormEvent) => {
    event.preventDefault()
    if (!partBeingEdited) {
      return
    }

    const label = partEditLabel.trim()
    const value = partEditValue.trim()

    if (!label) {
      setPartEditError('Podaj nazwę części mowy.')
      return
    }

    setIsSavingPartEdit(true)
    setPartEditError(null)

    try {
      await DictionaryAPI.updatePartOfSpeechOption(partBeingEdited.id, {
        label,
        value: value || undefined,
        order: parseOrderInput(partEditOrder),
      })
      await refreshPartsOfSpeech()
      setIsPartEditDialogOpen(false)
      setPartBeingEdited(null)
    } catch (error) {
      console.error('Update part of speech failed:', error)
      setPartEditError(error instanceof Error ? error.message : 'Nie udało się zaktualizować części mowy.')
    } finally {
      setIsSavingPartEdit(false)
    }
  }

  const handleDeletePartOfSpeech = async (part: PartOfSpeechOption) => {
    try {
      await DictionaryAPI.deletePartOfSpeechOption(part.id)
      await refreshPartsOfSpeech()
    } catch (error) {
      console.error('Delete part of speech failed:', error)
      setGlobalError('Nie udało się usunąć części mowy. Upewnij się, że nie jest używana w słowniku.')
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-background">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Wczytywanie panelu administratora…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 sm:items-center">
              <Settings className="mt-1 h-6 w-6 text-primary sm:mt-0" />
              <div>
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">Panel administratora</h1>
                <p className="text-sm text-muted-foreground">Śląski Słownik Majsterkowy</p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
              <Button variant="outline" asChild className="w-full justify-center sm:w-auto">
                <Link href="/">
                  <Eye className="mr-2 h-4 w-4" />
                  Podgląd słownika
                </Link>
              </Button>
              <Button variant="secondary" asChild className="w-full justify-center sm:w-auto">
                <Link href="/dodaj">
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj wpis
                </Link>
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full justify-center sm:w-auto"
              >
                {isLoggingOut ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wylogowywanie…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Wyloguj
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {globalError && (
          <Card className="border-red-300">
            <CardContent className="flex items-center justify-between gap-4 p-4 text-sm text-red-700">
              <span>{globalError}</span>
              <Button size="sm" variant="outline" onClick={() => fetchAllData()}>
                Spróbuj ponownie
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
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
                  <p className="text-3xl font-bold text-orange-600">
                    {stats?.pendingSubmissions ?? pendingSubmissions.length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Zatwierdzone dziś</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.approvedToday ?? '—'}</p>
                </div>
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Odrzucone dziś</p>
                  <p className="text-3xl font-bold text-red-600">{stats?.rejectedToday ?? '—'}</p>
                </div>
                <X className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="flex h-auto w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <TabsTrigger value="pending" className="w-full sm:w-auto sm:flex-1">
              Oczekujące ({pendingSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="entries" className="w-full sm:w-auto sm:flex-1">
              Wpisy ({entries.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="w-full sm:w-auto sm:flex-1">
              Ustawienia
            </TabsTrigger>
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
                      <Card key={submission.id} className="border-orange-200">
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
                                        <p className="text-lg font-semibold text-slate-900">
                                          {submission.sourceWord}
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <Label>Tłumaczenie</Label>
                                        <p className="text-lg font-semibold text-slate-900">
                                          {submission.targetWord}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                      <div className="space-y-1">
                                        <Label>Wymowa</Label>
                                        <p className="font-ipa text-muted-foreground">
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
                                            <li key={`${example.sourceText}-${index}`} className="rounded border border-slate-200 bg-white p-3 text-slate-900">
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

      <Dialog
        open={isPartDialogOpen}
        onOpenChange={open => {
          setIsPartDialogOpen(open)
          if (!open) {
            setPartLabel('')
            setPartValue('')
            setPartOrder('')
            setPartError(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dodaj część mowy</DialogTitle>
            <DialogDescription>Określ nazwę oraz (opcjonalnie) wartość techniczną i kolejność.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreatePartOfSpeech}>
            <div className="space-y-2">
              <Label htmlFor="part-label">Nazwa</Label>
              <Input
                id="part-label"
                value={partLabel}
                onChange={event => setPartLabel(event.target.value)}
                className={inputStyles}
                placeholder="np. przymiotnik"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="part-value">Wartość (opcjonalnie)</Label>
              <Input
                id="part-value"
                value={partValue}
                onChange={event => setPartValue(event.target.value)}
                className={inputStyles}
                placeholder="np. przymiotnik"
              />
              <p className="text-xs text-muted-foreground">
                Wartość wykorzystywana w bazie danych i API. Pozostaw puste, aby wygenerować ją na podstawie nazwy.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="part-order">Kolejność (opcjonalnie)</Label>
              <Input
                id="part-order"
                type="number"
                value={partOrder}
                onChange={event => setPartOrder(event.target.value)}
                className={inputStyles}
                placeholder="np. 1"
                min={0}
              />
            </div>
            {partError && <p className="text-sm text-red-600">{partError}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPartDialogOpen(false)}
                disabled={isSavingPart}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isSavingPart}>
                {isSavingPart ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Dodaj część mowy
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPartEditDialogOpen}
        onOpenChange={open => {
          setIsPartEditDialogOpen(open)
          if (!open) {
            setPartBeingEdited(null)
            setPartEditLabel('')
            setPartEditValue('')
            setPartEditOrder('')
            setPartEditError(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edytuj część mowy</DialogTitle>
            <DialogDescription>Zaktualizuj nazwę, wartość lub kolejność części mowy.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdatePartOfSpeech}>
            <div className="space-y-2">
              <Label htmlFor="edit-part-label">Nazwa</Label>
              <Input
                id="edit-part-label"
                value={partEditLabel}
                onChange={event => setPartEditLabel(event.target.value)}
                className={inputStyles}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-part-value">Wartość</Label>
              <Input
                id="edit-part-value"
                value={partEditValue}
                onChange={event => setPartEditValue(event.target.value)}
                className={inputStyles}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-part-order">Kolejność</Label>
              <Input
                id="edit-part-order"
                type="number"
                value={partEditOrder}
                onChange={event => setPartEditOrder(event.target.value)}
                className={inputStyles}
                min={0}
              />
            </div>
            {partEditError && <p className="text-sm text-red-600">{partEditError}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPartEditDialogOpen(false)}
                disabled={isSavingPartEdit}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isSavingPartEdit || !partBeingEdited}>
                {isSavingPartEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Zapisz zmiany
              </Button>
            </DialogFooter>
          </form>
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
                                  <X className="h-4 w-4 text-red-600" />
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
                  <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
                    <div className="relative w-full sm:max-w-xs md:max-w-none md:w-64">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Szukaj wpisów..."
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button variant="outline" asChild className="w-full sm:w-auto">
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
                      <Card key={entry.id} className="border-green-200">
                        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-lg font-semibold text-primary">
                                {entry.sourceWord} → {entry.targetWord}
                              </h3>
                              <Badge variant="outline">{entry.category.name}</Badge>
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
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
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setEntryPendingDelete(entry)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
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
                    {categories.map(category => {
                      const linkedEntries = category.entryCount ?? 0
                      const hasLinkedEntries = linkedEntries > 0
                      const linkedLabel =
                        linkedEntries === 1
                          ? '1 powiązane hasło'
                          : `${linkedEntries} powiązanych haseł`

                      return (
                        <li
                          key={category.id}
                          className="flex flex-col gap-2 rounded border border-slate-200 bg-white p-3 text-sm text-slate-900 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">{category.name}</p>
                            <p className="text-xs text-muted-foreground">{category.slug}</p>
                            {category.description ? (
                              <p className="text-xs text-muted-foreground">{category.description}</p>
                            ) : null}
                            <p className="text-xs text-muted-foreground">
                              {hasLinkedEntries ? linkedLabel : 'Brak powiązanych haseł'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCategoryEditDialog(category)}
                            >
                              Edytuj
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={hasLinkedEntries}
                              title={
                                hasLinkedEntries
                                  ? 'Usuń powiązane hasła, aby móc skasować kategorię.'
                                  : undefined
                              }
                              onClick={() => openCategoryDeleteDialog(category)}
                            >
                              Usuń
                            </Button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Części mowy</CardTitle>
                  <CardDescription>Zarządzaj listą dostępnych części mowy.</CardDescription>
                </div>
                <Button onClick={() => setIsPartDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Dodaj część mowy
                </Button>
              </CardHeader>
              <CardContent>
                {partsOfSpeech.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Brak zdefiniowanych części mowy. Dodaj pierwszą, aby móc wybierać ją podczas edycji wpisów.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {partsOfSpeech.map(part => (
                      <li
                        key={part.id}
                        className="flex flex-col gap-2 rounded border border-slate-200 bg-white p-3 text-sm text-slate-900 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium">{part.label}</p>
                          <p className="text-xs text-muted-foreground">Wartość: <span className="font-mono">{part.value}</span></p>
                          <p className="text-xs text-muted-foreground">Kolejność: {part.order}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openPartOfSpeechEditDialog(part)}>
                            Edytuj
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeletePartOfSpeech(part)}>
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
        <DialogContent className="flex w-full max-w-5xl max-h-[95vh] overflow-y-auto p-0 sm:max-h-[90vh]">
          <div className="flex h-full w-full flex-col">
            <DialogHeader className="flex-shrink-0 border-b bg-white px-6 py-4">
              <DialogTitle>Edytuj wpis</DialogTitle>
              <DialogDescription>Zaktualizuj wszystkie informacje dotyczące hasła.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {entryForm ? (
                <div className="space-y-6 pb-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={entryForm.status} onValueChange={value => updateEntryFormField('status', value)}>
                        <SelectTrigger className={selectStyles}>
                          <SelectValue placeholder="Wybierz status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(status => (
                            <SelectItem key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  </div>

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

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="partOfSpeech">Część mowy</Label>
                      <Select
                        value={entryForm.partOfSpeech || 'none'}
                        onValueChange={value => updateEntryFormField('partOfSpeech', value === 'none' ? '' : value)}
                      >
                        <SelectTrigger className={selectStyles}>
                          <SelectValue placeholder="Wybierz część mowy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Brak</SelectItem>
                          {partsOfSpeech.length > 0 ? (
                            partsOfSpeech.map(part => (
                              <SelectItem key={part.id} value={part.value}>
                                {part.label}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="__empty__" disabled>
                              Brak zdefiniowanych części mowy
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Kategoria</Label>
                      <Select
                        value={entryForm.categoryId}
                        onValueChange={value => updateEntryFormField('categoryId', value)}
                      >
                        <SelectTrigger className={selectStyles}>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pronunciation">Wymowa</Label>
                    <Input
                      id="pronunciation"
                      value={entryForm.pronunciation}
                      onChange={event => updateEntryFormField('pronunciation', event.target.value)}
                      placeholder="np. [ˈʂixta]"
                      className={`${inputStyles} font-ipa`}
                    />
                    <p className="text-xs text-slate-500">
                      Jak to słowo wymówić po polsku? Transkrypcja fonetyczna uproszczona lub <a className="underline hover:text-primary" href="https://pl.wikipedia.org/wiki/Transkrypcja_fonetyczna" target="_blank" rel="noreferrer">IPA</a>.
                    </p>
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

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notatki</Label>
                    <Textarea
                      id="notes"
                      value={entryForm.notes}
                      onChange={event => updateEntryFormField('notes', event.target.value)}
                      placeholder="Dodatkowe informacje"
                      rows={3}
                      className={textareaStyles}
                    />
                  </div>

                  {entryError && <p className="text-sm text-red-600">{entryError}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nie znaleziono danych wpisu.</p>
              )}
            </div>
            <DialogFooter className="flex-shrink-0 border-t bg-white px-6 py-4">
              <Button variant="outline" onClick={closeEntryDialog} disabled={isSavingEntry}>
                Anuluj
              </Button>
              <Button onClick={handleSaveEntry} disabled={isSavingEntry || !entryForm}>
                {isSavingEntry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Zapisz zmiany
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={open => {
          setIsDeleteDialogOpen(open)
          if (!open) {
            setEntryPendingDelete(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Usuń wpis</DialogTitle>
            <DialogDescription>
              Tej operacji nie można cofnąć. Wpis zostanie usunięty ze słownika.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-muted-foreground">
            <p>
              Czy na pewno chcesz usunąć wpis
              {entryPendingDelete ? (
                <span className="font-semibold text-foreground"> {entryPendingDelete.sourceWord}</span>
              ) : null}
              ?
            </p>
            <p>Wszystkie powiązane przykłady zostaną również usunięte.</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setEntryPendingDelete(null)
              }}
              disabled={isDeletingEntry}
            >
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleDeleteEntry} disabled={isDeletingEntry}>
              {isDeletingEntry ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Usuwam…
                </span>
              ) : (
                'Usuń wpis'
              )}
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
            {categoryError && <p className="text-sm text-red-600">{categoryError}</p>}
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

      <Dialog
        open={isCategoryEditDialogOpen}
        onOpenChange={open => {
          setIsCategoryEditDialogOpen(open)
          if (!open) {
            setCategoryBeingEdited(null)
            setCategoryEditError(null)
            setCategoryEditName('')
            setCategoryEditDescription('')
            setCategoryEditSlug('')
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edytuj kategorię</DialogTitle>
            <DialogDescription>Zaktualizuj nazwę, slug i opis kategorii.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdateCategory}>
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Nazwa kategorii</Label>
              <Input
                id="edit-category-name"
                value={categoryEditName}
                onChange={event => setCategoryEditName(event.target.value)}
                className={inputStyles}
                placeholder="np. Górnictwo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-slug">Slug</Label>
              <Input
                id="edit-category-slug"
                value={categoryEditSlug}
                onChange={event => setCategoryEditSlug(event.target.value)}
                className={inputStyles}
                placeholder="np. gornictwo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-description">Opis</Label>
              <Textarea
                id="edit-category-description"
                value={categoryEditDescription}
                onChange={event => setCategoryEditDescription(event.target.value)}
                className={textareaStyles}
                placeholder="Krótki opis kategorii"
                rows={3}
              />
            </div>
            {categoryEditError && <p className="text-sm text-red-600">{categoryEditError}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCategoryEditDialogOpen(false)
                  setCategoryBeingEdited(null)
                }}
                disabled={isSavingCategoryEdit}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isSavingCategoryEdit}>
                {isSavingCategoryEdit ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Zapisuję…
                  </span>
                ) : (
                  'Zapisz zmiany'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCategoryDeleteDialogOpen}
        onOpenChange={open => {
          setIsCategoryDeleteDialogOpen(open)
          if (!open) {
            setCategoryPendingRemoval(null)
            setCategoryDeleteError(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Usuń kategorię</DialogTitle>
            <DialogDescription>
              Tej operacji nie można cofnąć. Kategoria zostanie usunięta ze słownika.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-muted-foreground">
            <p>
              Czy na pewno chcesz usunąć kategorię
              {categoryPendingRemoval ? (
                <span className="font-semibold text-foreground"> {categoryPendingRemoval.name}</span>
              ) : null}
              ?
            </p>
            <p>Aby kontynuować, upewnij się, że kategoria nie jest powiązana z żadnymi hasłami.</p>
            {categoryDeleteError && (
              <p className="text-sm text-red-600">{categoryDeleteError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCategoryDeleteDialogOpen(false)
                setCategoryPendingRemoval(null)
                setCategoryDeleteError(null)
              }}
              disabled={isDeletingCategory}
            >
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={isDeletingCategory || !categoryPendingRemoval}
            >
              {isDeletingCategory ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Usuwam…
                </span>
              ) : (
                'Usuń kategorię'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
