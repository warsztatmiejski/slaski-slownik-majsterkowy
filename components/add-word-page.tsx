'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Meaning {
  id: string
  meaning: string
  context: string
}

interface ExampleSentence {
  id: string
  sourceText: string
  translatedText: string
  context: string
}

interface SubmissionForm {
  sourceWord: string
  sourceLang: 'SILESIAN' | 'POLISH'
  targetWord: string
  targetLang: 'SILESIAN' | 'POLISH'
  pronunciation: string
  categoryId: string
  partOfSpeech: string
  meanings: Meaning[]
  exampleSentences: ExampleSentence[]
  submitterName: string
  submitterEmail: string
  notes: string
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

export default function AddWordPage() {
  const [form, setForm] = useState<SubmissionForm>({
	sourceWord: '',
	sourceLang: 'SILESIAN',
	targetWord: '',
	targetLang: 'POLISH',
	pronunciation: '',
	categoryId: '',
	partOfSpeech: '',
	meanings: [{ id: '1', meaning: '', context: '' }],
	exampleSentences: [{ id: '1', sourceText: '', translatedText: '', context: '' }],
	submitterName: '',
	submitterEmail: '',
	notes: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const addMeaning = () => {
	const newMeaning: Meaning = {
	  id: Date.now().toString(),
	  meaning: '',
	  context: '',
	}
	setForm(prev => ({
	  ...prev,
	  meanings: [...prev.meanings, newMeaning]
	}))
  }

  const removeMeaning = (id: string) => {
	if (form.meanings.length > 1) {
	  setForm(prev => ({
		...prev,
		meanings: prev.meanings.filter(m => m.id !== id)
	  }))
	}
  }

  const updateMeaning = (id: string, field: keyof Meaning, value: string) => {
	setForm(prev => ({
	  ...prev,
	  meanings: prev.meanings.map(m =>
		m.id === id ? { ...m, [field]: value } : m
	  )
	}))
  }

  const addExampleSentence = () => {
	const newExample: ExampleSentence = {
	  id: Date.now().toString(),
	  sourceText: '',
	  translatedText: '',
	  context: '',
	}
	setForm(prev => ({
	  ...prev,
	  exampleSentences: [...prev.exampleSentences, newExample]
	}))
  }

  const removeExampleSentence = (id: string) => {
	if (form.exampleSentences.length > 1) {
	  setForm(prev => ({
		...prev,
		exampleSentences: prev.exampleSentences.filter(e => e.id !== id)
	  }))
	}
  }

  const updateExampleSentence = (id: string, field: keyof ExampleSentence, value: string) => {
	setForm(prev => ({
	  ...prev,
	  exampleSentences: prev.exampleSentences.map(e =>
		e.id === id ? { ...e, [field]: value } : e
	  )
	}))
  }

  const handleSubmit = async (e: React.FormEvent) => {
	e.preventDefault()
	setIsSubmitting(true)

	// Here you would submit to your API
	// For now, just simulate the submission
	try {
	  await new Promise(resolve => setTimeout(resolve, 2000))
	  setSubmitSuccess(true)
	  // Reset form after successful submission
	  setForm({
		sourceWord: '',
		sourceLang: 'SILESIAN',
		targetWord: '',
		targetLang: 'POLISH',
		pronunciation: '',
		categoryId: '',
		partOfSpeech: '',
		meanings: [{ id: '1', meaning: '', context: '' }],
		exampleSentences: [{ id: '1', sourceText: '', translatedText: '', context: '' }],
		submitterName: '',
		submitterEmail: '',
		notes: '',
	  })
	} catch (error) {
	  console.error('Submission failed:', error)
	} finally {
	  setIsSubmitting(false)
	}
  }

  const swapLanguages = () => {
	setForm(prev => ({
	  ...prev,
	  sourceLang: prev.sourceLang === 'SILESIAN' ? 'POLISH' : 'SILESIAN',
	  targetLang: prev.targetLang === 'SILESIAN' ? 'POLISH' : 'SILESIAN',
	  sourceWord: prev.targetWord,
	  targetWord: prev.sourceWord,
	}))
  }

  if (submitSuccess) {
	return (
	  <div className="min-h-screen bg-gradient-to-b from-green-50 to-background dark:from-green-900/20">
		<div className="container mx-auto px-4 py-16">
		  <div className="max-w-2xl mx-auto text-center">
			<div className="bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
			  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
			  </svg>
			</div>
			<h1 className="text-3xl font-bold text-foreground mb-4">
			  Dziękujemy za zgłoszenie!
			</h1>
			<p className="text-lg text-muted-foreground mb-8">
			  Twoje słowo zostało dodane do kolejki weryfikacji. Po zatwierdzeniu przez moderatorów
			  pojawi się w słowniku.
			</p>
			<div className="space-x-4">
			  <Button onClick={() => setSubmitSuccess(false)}>
				Dodaj kolejne słowo
			  </Button>
			  <Button variant="outline" onClick={() => window.location.href = '/'}>
				Powrót do słownika
			  </Button>
			</div>
		  </div>
		</div>
	  </div>
	)
  }

  return (
	<div className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-900/20">
	  {/* Header */}
	  <header className="border-b bg-card">
		<div className="container mx-auto px-4 py-4">
		  <div className="flex items-center justify-between">
			<Button variant="ghost" onClick={() => window.location.href = '/'}>
			  <ArrowLeft className="mr-2 h-4 w-4" />
			  Powrót do słownika
			</Button>
			<h1 className="text-2xl font-bold text-foreground">
			  Dodaj nowe słowo
			</h1>
			<div></div>
		  </div>
		</div>
	  </header>

	  <main className="container mx-auto px-4 py-8">
		<div className="max-w-4xl mx-auto">
		  <Card>
			<CardHeader>
			  <CardTitle>Zgłoś nowe słowo do słownika</CardTitle>
			  <CardDescription>
				Pomóż rozwijać śląski słownik techniczny! Wszystkie zgłoszenia są weryfikowane przed publikacją.
			  </CardDescription>
			</CardHeader>
			<CardContent>
			  <form onSubmit={handleSubmit} className="space-y-8">
				{/* Basic Word Information */}
				<div className="space-y-4">
				  <h3 className="text-lg font-semibold">Podstawowe informacje</h3>

				  <div className="grid md:grid-cols-2 gap-4">
					<div className="space-y-2">
					  <Label htmlFor="sourceWord">
						Słowo w języku {form.sourceLang === 'SILESIAN' ? 'śląskim' : 'polskim'}
					  </Label>
					  <Input
						id="sourceWord"
						value={form.sourceWord}
						onChange={(e) => setForm(prev => ({ ...prev, sourceWord: e.target.value }))}
						placeholder={form.sourceLang === 'SILESIAN' ? 'np. šichta' : 'np. komputer'}
						required
					  />
					</div>

					<div className="space-y-2">
					  <Label htmlFor="targetWord">
						Tłumaczenie na język {form.targetLang === 'SILESIAN' ? 'śląski' : 'polski'}
					  </Label>
					  <Input
						id="targetWord"
						value={form.targetWord}
						onChange={(e) => setForm(prev => ({ ...prev, targetWord: e.target.value }))}
						placeholder={form.targetLang === 'SILESIAN' ? 'np. kōmputr' : 'np. zmiana robocza'}
						required
					  />
					</div>
				  </div>

				  <div className="flex justify-center">
					<Button
					  type="button"
					  variant="outline"
					  onClick={swapLanguages}
					  className="flex items-center space-x-2"
					>
					  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
					  </svg>
					  <span>Zamień kierunek tłumaczenia</span>
					</Button>
				  </div>

				  <div className="grid md:grid-cols-3 gap-4">
					<div className="space-y-2">
					  <Label htmlFor="pronunciation">Wymowa (opcjonalnie)</Label>
					  <Input
						id="pronunciation"
						value={form.pronunciation}
						onChange={(e) => setForm(prev => ({ ...prev, pronunciation: e.target.value }))}
						placeholder="np. šixta"
					  />
					</div>

					<div className="space-y-2">
					  <Label htmlFor="category">Kategoria</Label>
					  <Select value={form.categoryId} onValueChange={(value) => setForm(prev => ({ ...prev, categoryId: value }))}>
						<SelectTrigger>
						  <SelectValue placeholder="Wybierz kategorię" />
						</SelectTrigger>
						<SelectContent>
						  <div className="p-2">
							<div className="text-sm font-medium text-muted-foreground mb-2">Branże tradycyjne</div>
							{categories.filter(c => c.type === 'traditional').map(category => (
							  <SelectItem key={category.id} value={category.id}>
								{category.name}
							  </SelectItem>
							))}
						  </div>
						  <Separator />
						  <div className="p-2">
							<div className="text-sm font-medium text-muted-foreground mb-2">Branże nowoczesne</div>
							{categories.filter(c => c.type === 'modern').map(category => (
							  <SelectItem key={category.id} value={category.id}>
								{category.name}
							  </SelectItem>
							))}
						  </div>
						</SelectContent>
					  </Select>
					</div>

					<div className="space-y-2">
					  <Label htmlFor="partOfSpeech">Część mowy</Label>
					  <Select value={form.partOfSpeech} onValueChange={(value) => setForm(prev => ({ ...prev, partOfSpeech: value }))}>
						<SelectTrigger>
						  <SelectValue placeholder="Wybierz część mowy" />
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
				</div>

				<Separator />

				{/* Meanings Section */}
				<div className="space-y-4">
				  <div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold">Znaczenia</h3>
					<Button type="button" variant="outline" onClick={addMeaning}>
					  <Plus className="mr-2 h-4 w-4" />
					  Dodaj znaczenie
					</Button>
				  </div>

				  {form.meanings.map((meaning, index) => (
					<Card key={meaning.id} className="relative">
					  <CardContent className="pt-6">
						<div className="space-y-4">
						  <div className="flex items-center justify-between">
							<Badge variant="secondary">Znaczenie {index + 1}</Badge>
							{form.meanings.length > 1 && (
							  <Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => removeMeaning(meaning.id)}
							  >
								<Trash2 className="h-4 w-4" />
							  </Button>
							)}
						  </div>

						  <div className="space-y-2">
							<Label>Znaczenie *</Label>
							<Textarea
							  value={meaning.meaning}
							  onChange={(e) => updateMeaning(meaning.id, 'meaning', e.target.value)}
							  placeholder="Opisz znaczenie słowa..."
							  required
							/>
						  </div>

						  <div className="space-y-2">
							<Label>Kontekst użycia (opcjonalnie)</Label>
							<Input
							  value={meaning.context}
							  onChange={(e) => updateMeaning(meaning.id, 'context', e.target.value)}
							  placeholder="np. Używane w kontekście organizacji pracy"
							/>
						  </div>
						</div>
					  </CardContent>
					</Card>
				  ))}
				</div>

				<Separator />

				{/* Example Sentences Section */}
				<div className="space-y-4">
				  <div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold">Przykłady użycia</h3>
					<Button type="button" variant="outline" onClick={addExampleSentence}>
					  <Plus className="mr-2 h-4 w-4" />
					  Dodaj przykład
					</Button>
				  </div>

				  {form.exampleSentences.map((example, index) => (
					<Card key={example.id} className="relative">
					  <CardContent className="pt-6">
						<div className="space-y-4">
						  <div className="flex items-center justify-between">
							<Badge variant="secondary">Przykład {index + 1}</Badge>
							{form.exampleSentences.length > 1 && (
							  <Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => removeExampleSentence(example.id)}
							  >
								<Trash2 className="h-4 w-4" />
							  </Button>
							)}
						  </div>

						  <div className="grid md:grid-cols-2 gap-4">
							<div className="space-y-2">
							  <Label>
								Zdanie w języku {form.sourceLang === 'SILESIAN' ? 'śląskim' : 'polskim'} *
							  </Label>
							  <Textarea
								value={example.sourceText}
								onChange={(e) => updateExampleSentence(example.id, 'sourceText', e.target.value)}
								placeholder={form.sourceLang === 'SILESIAN' ? 'np. Idã na šichtã.' : 'np. Włącz komputer.'}
								required
							  />
							</div>

							<div className="space-y-2">
							  <Label>
								Tłumaczenie na język {form.targetLang === 'SILESIAN' ? 'śląski' : 'polski'} *
							  </Label>
							  <Textarea
								value={example.translatedText}
								onChange={(e) => updateExampleSentence(example.id, 'translatedText', e.target.value)}
								placeholder={form.targetLang === 'SILESIAN' ? 'np. Włōńcz kōmputr.' : 'np. Idę na zmianę.'}
								required
							  />
							</div>
						  </div>

						  <div className="space-y-2">
							<Label>Kontekst przykładu (opcjonalnie)</Label>
							<Input
							  value={example.context}
							  onChange={(e) => updateExampleSentence(example.id, 'context', e.target.value)}
							  placeholder="np. Powszechne wyrażenie wśród górników"
							/>
						  </div>
						</div>
					  </CardContent>
					</Card>
				  ))}
				</div>

				<Separator />

				{/* Submitter Information */}
				<div className="space-y-4">
				  <h3 className="text-lg font-semibold">Informacje kontaktowe (opcjonalnie)</h3>
				  <p className="text-sm text-muted-foreground">
					Podanie danych kontaktowych pozwoli nam skontaktować się w razie pytań o zgłoszenie.
				  </p>

				  <div className="grid md:grid-cols-2 gap-4">
					<div className="space-y-2">
					  <Label htmlFor="submitterName">Imię i nazwisko</Label>
					  <Input
						id="submitterName"
						value={form.submitterName}
						onChange={(e) => setForm(prev => ({ ...prev, submitterName: e.target.value }))}
						placeholder="Jan Kowalski"
					  />
					</div>

					<div className="space-y-2">
					  <Label htmlFor="submitterEmail">Adres email</Label>
					  <Input
						id="submitterEmail"
						type="email"
						value={form.submitterEmail}
						onChange={(e) => setForm(prev => ({ ...prev, submitterEmail: e.target.value }))}
						placeholder="jan@przykład.pl"
					  />
					</div>
				  </div>

				  <div className="space-y-2">
					<Label htmlFor="notes">Dodatkowe uwagi</Label>
					<Textarea
					  id="notes"
					  value={form.notes}
					  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
					  placeholder="Jakiekolwiek dodatkowe informacje o słowie, jego pochodzeniu, częstości użycia itp."
					  rows={3}
					/>
				  </div>
				</div>

				{/* Submit Button */}
				<div className="flex justify-end space-x-4 pt-6">
				  <Button type="button" variant="outline" onClick={() => window.location.href = '/'}>
					Anuluj
				  </Button>
				  <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
					{isSubmitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
				  </Button>
				</div>
			  </form>
			</CardContent>
		  </Card>
		</div>
	  </main>
	</div>
  )
}