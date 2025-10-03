'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import AddWordHeader from '@/components/add-word-header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ExampleSentence {
  id: string
  sourceText: string
  translatedText: string
}

interface LocationArea {
  id: string
  name: string
}

interface SubmissionForm {
  sourceWord: string
  sourceLang: 'SILESIAN' | 'POLISH'
  targetWord: string
  targetLang: 'SILESIAN' | 'POLISH'
  pronunciation: string
  categoryId: string
  partOfSpeech: string
  exampleSentences: ExampleSentence[]
  locations: LocationArea[]
  submitterName: string
  submitterEmail: string
  notes: string
  newCategoryName: string
  isSuggestingCategory: boolean
}

const categories = [
  { id: 'gornictwo', name: 'Górnictwo', type: 'traditional' },
  { id: 'hutnictwo', name: 'Hutnictwo', type: 'traditional' },
  { id: 'inzynieria', name: 'Inżynieria', type: 'traditional' },
  { id: 'produkcja', name: 'Produkcja', type: 'traditional' },
  { id: 'informatyka', name: 'Informatyka', type: 'modern' },
  { id: 'elektronika', name: 'Elektronika', type: 'modern' },
  { id: 'telekomunikacja', name: 'Telekomunikacja', type: 'modern' },
]

const partsOfSpeech = [
  'rzeczownik',
  'czasownik',
  'przymiotnik',
  'przysłówek',
  'wykrzyknienie',
  'zaimek',
  'przyimek',
  'spójnik',
  'fraza',
]

const languageLabel: Record<'SILESIAN' | 'POLISH', string> = {
  SILESIAN: 'Śląski',
  POLISH: 'Polski',
}

const fieldFrame =
  'border border-slate-900 bg-white/80 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]'
const inputField = `w-full rounded-sm text-base ${fieldFrame}`
const wordField = `w-full rounded-sm text-lg font-semibold tracking-wide ${fieldFrame}`
const textareaField = `w-full min-h-[170px] rounded-sm px-3 py-3 text-base ${fieldFrame}`
const selectTriggerStyles = `w-full rounded-sm px-3 py-3 text-base font-medium text-left ${fieldFrame}`
const separatorStyles = 'h-[2px] w-full bg-slate-900'

export default function AddWordPage() {
  const createInitialForm = (): SubmissionForm => ({
    sourceWord: '',
    sourceLang: 'SILESIAN',
    targetWord: '',
    targetLang: 'POLISH',
    pronunciation: '',
    categoryId: '',
    partOfSpeech: '',
    exampleSentences: [{ id: '1', sourceText: '', translatedText: '' }],
    locations: [{ id: '1', name: '' }],
    submitterName: '',
    submitterEmail: '',
    notes: '',
    newCategoryName: '',
    isSuggestingCategory: false,
  })

  const [form, setForm] = useState<SubmissionForm>(createInitialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const resetForm = () => {
    setForm(createInitialForm())
  }

  const addExampleSentence = () => {
    const newExample: ExampleSentence = {
      id: Date.now().toString(),
      sourceText: '',
      translatedText: '',
    }
    setForm(prev => ({
      ...prev,
      exampleSentences: [...prev.exampleSentences, newExample],
    }))
  }

  const removeExampleSentence = (id: string) => {
    if (form.exampleSentences.length > 1) {
      setForm(prev => ({
        ...prev,
        exampleSentences: prev.exampleSentences.filter(e => e.id !== id),
      }))
    }
  }

  const updateExampleSentence = (id: string, field: keyof ExampleSentence, value: string) => {
    setForm(prev => ({
      ...prev,
      exampleSentences: prev.exampleSentences.map(e => (e.id === id ? { ...e, [field]: value } : e)),
    }))
  }

  const addLocation = () => {
    const newLocation: LocationArea = {
      id: Date.now().toString(),
      name: '',
    }
    setForm(prev => ({
      ...prev,
      locations: [...prev.locations, newLocation],
    }))
  }

  const removeLocation = (id: string) => {
    if (form.locations.length > 1) {
      setForm(prev => ({
        ...prev,
        locations: prev.locations.filter(location => location.id !== id),
      }))
    }
  }

  const updateLocation = (id: string, value: string) => {
    setForm(prev => ({
      ...prev,
      locations: prev.locations.map(location => (location.id === id ? { ...location, name: value } : location)),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const suggestedCategoryNote =
        form.isSuggestingCategory && form.newCategoryName.trim().length > 0
          ? `Propozycja nowej kategorii: ${form.newCategoryName.trim()}`
          : null
      const combinedNotes = [form.notes.trim(), suggestedCategoryNote]
        .filter(Boolean)
        .join('\n')

      console.log('Symulated submission payload', {
        ...form,
        notes: combinedNotes,
      })

      await new Promise(resolve => setTimeout(resolve, 2000))
      setSubmitSuccess(true)
      setForm(createInitialForm())
    } catch (error) {
      console.error('Submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white bg-[url('/bg-hex.png')] bg-top bg-no-repeat text-slate-900 transition-colors">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-4 py-14 md:flex-row md:gap-20">
        <aside className="md:w-1/3 md:sticky md:top-10">
          <AddWordHeader />
        </aside>

        <main className="md:w-2/3">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="space-y-3">
              <p className="text-3xl font-bold uppercase tracking-[0.24em]">Zgłoś nowe słowo do słownika</p>
              <p className="text-sm text-slate-600">
                Podziel się terminem, który powinien trafić do Śląskiego Słownika Majsterkowego.
              </p>
            </div>

            <section className="space-y-6 p-6 md:p-8 bg-red-200/50">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold uppercase tracking-[0.12em]">Podstawowe informacje</h2>
                <p className="text-sm text-slate-600">
                  Wprowadź słowo w języku {languageLabel[form.sourceLang].toLowerCase()}m oraz jego tłumaczenie na język {languageLabel[form.targetLang].toLowerCase()}.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{languageLabel[form.sourceLang]}</h3>
                  <Input
                    variant="large"
                    id="sourceWord"
                    value={form.sourceWord}
                    onChange={e => setForm(prev => ({ ...prev, sourceWord: e.target.value }))}
                    placeholder={form.sourceLang === 'SILESIAN' ? 'np. šichta' : 'np. komputer'}
                    required
                    className={wordField}
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{languageLabel[form.targetLang]}</h3>
                  <Input
                    variant="large"
                    id="targetWord"
                    value={form.targetWord}
                    onChange={e => setForm(prev => ({ ...prev, targetWord: e.target.value }))}
                    placeholder={form.targetLang === 'SILESIAN' ? 'np. kōmputr' : 'np. zmiana robocza'}
                    required
                    className={wordField}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="pronunciation">Wymowa (opcjonalnie)</Label>
                  <Input
                    id="pronunciation"
                    value={form.pronunciation}
                    onChange={e => setForm(prev => ({ ...prev, pronunciation: e.target.value }))}
                    placeholder="np. szichta"
                    className={inputField}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="category">Kategoria</Label>
                  <Select
                    value={form.isSuggestingCategory ? '__new__' : form.categoryId}
                    onValueChange={value => {
                      if (value === '__new__') {
                        setForm(prev => ({
                          ...prev,
                          isSuggestingCategory: true,
                          categoryId: '',
                          newCategoryName: '',
                        }))
                        return
                      }
                      setForm(prev => ({
                        ...prev,
                        categoryId: value,
                        isSuggestingCategory: false,
                        newCategoryName: prev.newCategoryName,
                      }))
                    }}
                  >
                    <SelectTrigger className={selectTriggerStyles}>
                      <SelectValue placeholder="Wybierz kategorię" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                      <Separator className="my-1" />
                      <SelectItem value="__new__">
                        <span className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Dodaj nową...
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {form.isSuggestingCategory && (
                    <Input
                      value={form.newCategoryName}
                      onChange={e => setForm(prev => ({ ...prev, newCategoryName: e.target.value }))}
                      placeholder="Podaj nazwę nowej kategorii"
                      className={inputField}
                    />
                  )}
                  {form.isSuggestingCategory && (
                    <p className="text-xs text-slate-600">
                      Wpis zostanie oznaczony, że proponujesz nową kategorię – podaj jej nazwę powyżej.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partOfSpeech">Część mowy</Label>
                  <Select value={form.partOfSpeech} onValueChange={value => setForm(prev => ({ ...prev, partOfSpeech: value }))}>
                    <SelectTrigger className={selectTriggerStyles}>
                      <SelectValue placeholder="Wybierz" />
                    </SelectTrigger>
                    <SelectContent>
                      {partsOfSpeech.map(pos => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator className={separatorStyles} />

            <section className="space-y-6 p-6 md:p-8 bg-amber-200/50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold uppercase tracking-[0.12em]">Przykłady użycia</h2>
                <Button type="button" variant="outline" onClick={addExampleSentence}>
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj przykład
                </Button>
              </div>

              <div className="space-y-10">
                {form.exampleSentences.map((example, index) => (
                  <div key={example.id} className="space-y-4">
                    <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.18em]">
                      <span>Przykład {index + 1}</span>
                      {form.exampleSentences.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeExampleSentence(example.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Zdanie w języku {form.sourceLang === 'SILESIAN' ? 'śląskim' : 'polskim'} *</Label>
                        <Textarea
                          value={example.sourceText}
                          onChange={e => updateExampleSentence(example.id, 'sourceText', e.target.value)}
                          placeholder={form.sourceLang === 'SILESIAN' ? 'np. Idã na šichtã.' : 'np. Włącz komputer.'}
                          required
                          className={textareaField}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tłumaczenie na język {form.targetLang === 'SILESIAN' ? 'śląski' : 'polski'} *</Label>
                        <Textarea
                          value={example.translatedText}
                          onChange={e => updateExampleSentence(example.id, 'translatedText', e.target.value)}
                          placeholder={form.targetLang === 'SILESIAN' ? 'np. Włōńcz kōmputr.' : 'np. Idę na zmianę.'}
                          required
                          className={textareaField}
                        />
                      </div>
                    </div>
                    {index < form.exampleSentences.length - 1 && (
                      <Separator className="h-px w-full bg-slate-900/40" />
                    )}
                  </div>
                ))}
              </div>
            </section>

            <Separator className={separatorStyles} />

            <section className="space-y-6 p-6 md:p-8 bg-blue-200/50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold uppercase tracking-[0.12em]">Zasięg występowania</h2>
                <Button type="button" variant="outline" size="sm" onClick={addLocation}>
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj lokalizację
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {form.locations.map((location, index) => (
                  <div key={location.id} className="flex items-center gap-2">
                    <Input
                      value={location.name}
                      onChange={e => updateLocation(location.id, e.target.value)}
                      placeholder={index === 0 ? 'np. Katowice' : 'Dodaj kolejną lokalizację'}
                      className={inputField}
                      aria-label="Nazwa miejscowości"
                    />
                    {form.locations.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeLocation(location.id)} className="h-10 w-10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <Separator className={separatorStyles} />

            <section className="space-y-6 p-6 md:p-8 bg-slate-200/50">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold uppercase tracking-[0.12em]">Informacje kontaktowe (opcjonalnie)</h2>
                <p className="text-sm text-slate-600">
                  Dane pozwolą nam skontaktować się w razie pytań dotyczących zgłoszenia.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="submitterName">Imię i nazwisko</Label>
                  <Input
                    id="submitterName"
                    value={form.submitterName}
                    onChange={e => setForm(prev => ({ ...prev, submitterName: e.target.value }))}
                    placeholder="Jan Kowalski"
                    className={inputField}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="submitterEmail">Adres email</Label>
                  <Input
                    id="submitterEmail"
                    type="email"
                    value={form.submitterEmail}
                    onChange={e => setForm(prev => ({ ...prev, submitterEmail: e.target.value }))}
                    placeholder="jan@przyklad.pl"
                    className={inputField}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Dodatkowe uwagi</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Np. informacje o pochodzeniu słowa, częstości użycia itp."
                  className={textareaField}
                  rows={4}
                />
              </div>
            </section>

            <div className="flex flex-wrap justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Wyczyść formularz
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                {isSubmitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
              </Button>
            </div>
          </form>
        </main>
      </div>

      <Dialog open={submitSuccess} onOpenChange={setSubmitSuccess}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dziękujemy za zgłoszenie!</DialogTitle>
            <DialogDescription>
              Twoje słowo trafiło do kolejki weryfikacyjnej moderatorów. Po akceptacji pojawi się w słowniku.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-end">
            <Button onClick={() => setSubmitSuccess(false)}>Dodaj kolejne słowo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
