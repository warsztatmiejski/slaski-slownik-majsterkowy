'use client'

import { useState, useEffect } from 'react'
import { Search, ExternalLink, Plus, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// Mock data - in real app this would come from the database
const mockStats = {
  totalEntries: 1247,
  recentEntries: [
	{ word: 'šichta', translation: 'zmiana robocza', category: 'Górnictwo' },
	{ word: 'kōmputr', translation: 'komputer', category: 'Informatyka' },
	{ word: 'hałda', translation: 'zwał', category: 'Górnictwo' },
  ],
  featuredExample: {
	sentence: 'Idã na šichtã, bo muszã zarobic na familijã.',
	translation: 'Idę na zmianę, bo muszę zarobić na rodzinę.',
	highlightedWord: 'šichta',
	highlightedTranslation: 'zmiana robocza'
  }
}

interface WordEntry {
  id: string
  sourceWord: string
  targetWord: string
  sourceLang: 'SILESIAN' | 'POLISH'
  targetLang: 'SILESIAN' | 'POLISH'
  meanings: { meaning: string; context?: string }[]
  examples: { sourceText: string; translatedText: string }[]
  pronunciation?: string
  category: string
  partOfSpeech?: string
}

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<WordEntry | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Mock search function - replace with actual API call
  const searchDictionary = async (term: string): Promise<WordEntry | null> => {
	if (!term.trim()) return null

	setIsSearching(true)

	// Simulate API delay
	await new Promise(resolve => setTimeout(resolve, 500))

	// Mock response for demonstration
	if (term.toLowerCase().includes('šichta') || term.toLowerCase().includes('zmiana')) {
	  const mockEntry: WordEntry = {
		id: 'sample-mining-1',
		sourceWord: 'šichta',
		targetWord: 'zmiana robocza',
		sourceLang: 'SILESIAN',
		targetLang: 'POLISH',
		meanings: [
		  {
			meaning: 'Czas pracy w kopalni, zazwyczaj 8 godzin',
			context: 'Używane w kontekście organizacji pracy'
		  }
		],
		examples: [
		  {
			sourceText: 'Idã na šichtã.',
			translatedText: 'Idę na zmianę.'
		  },
		  {
			sourceText: 'Kōńczy mi się šichta.',
			translatedText: 'Kończy mi się zmiana.'
		  }
		],
		pronunciation: 'šixta',
		category: 'Górnictwo',
		partOfSpeech: 'rzeczownik'
	  }
	  setIsSearching(false)
	  return mockEntry
	}

	setIsSearching(false)
	return null
  }

  const handleSearch = async (e: React.FormEvent) => {
	e.preventDefault()
	const result = await searchDictionary(searchTerm)
	setSelectedEntry(result)
  }

  const handleWordClick = async (word: string) => {
	setSearchTerm(word)
	const result = await searchDictionary(word)
	setSelectedEntry(result)
  }

  return (
	<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
	  {/* Header */}
	  <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
		<div className="container mx-auto px-4 py-4">
		  <div className="flex items-center justify-between">
			<div className="flex items-center space-x-4">
			  <BookOpen className="h-8 w-8 text-blue-600" />
			  <div>
				<h1 className="text-2xl font-bold text-gray-900">
				  Śląski Słownik Majsterkowy
				</h1>
				<p className="text-sm text-gray-600">
				  Techniczny słownik śląsko-polski
				</p>
			  </div>
			</div>
			<div className="flex items-center space-x-4">
			  <Button variant="outline" size="sm" asChild>
				<a href="https://warsztatmiejski.org" target="_blank" rel="noopener noreferrer">
				  Warsztat Miejski
				  <ExternalLink className="ml-2 h-3 w-3" />
				</a>
			  </Button>
			  <Button size="sm" onClick={() => window.location.href = '/dodaj'}>
				<Plus className="mr-2 h-4 w-4" />
				Dodaj słowo
			  </Button>
			</div>
		  </div>
		</div>
	  </header>

	  <main className="container mx-auto px-4 py-8">
		{/* Search Section */}
		<div className="max-w-3xl mx-auto mb-12">
		  <form onSubmit={handleSearch} className="relative">
			<div className="relative">
			  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
			  <Input
				type="text"
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				placeholder="Szukaj słów po śląsku lub polsku..."
				className="pl-10 pr-4 py-4 text-lg border-2 focus:border-blue-500 rounded-lg shadow-sm"
			  />
			</div>
			<Button
			  type="submit"
			  className="absolute right-2 top-1/2 transform -translate-y-1/2"
			  disabled={isSearching}
			>
			  {isSearching ? 'Szukam...' : 'Szukaj'}
			</Button>
		  </form>
		</div>

		{/* Word Entry Panel */}
		{selectedEntry && (
		  <div className="max-w-3xl mx-auto mb-12">
			<Card className="border-2 border-blue-200 shadow-lg">
			  <CardHeader>
				<div className="flex items-start justify-between">
				  <div>
					<CardTitle className="text-3xl text-blue-900">
					  {selectedEntry.sourceWord}
					</CardTitle>
					{selectedEntry.pronunciation && (
					  <p className="text-sm text-gray-600 font-mono mt-1">
						[{selectedEntry.pronunciation}]
					  </p>
					)}
				  </div>
				  <div className="text-right">
					<Badge variant="secondary">{selectedEntry.category}</Badge>
					{selectedEntry.partOfSpeech && (
					  <p className="text-sm text-gray-600 mt-1">
						{selectedEntry.partOfSpeech}
					  </p>
					)}
				  </div>
				</div>
			  </CardHeader>
			  <CardContent>
				<div className="space-y-6">
				  {/* Translation */}
				  <div>
					<h3 className="font-semibold text-lg mb-2">Tłumaczenie:</h3>
					<p className="text-xl text-green-700 font-medium">
					  {selectedEntry.targetWord}
					</p>
				  </div>

				  {/* Meanings */}
				  <div>
					<h3 className="font-semibold text-lg mb-2">Znaczenie:</h3>
					{selectedEntry.meanings.map((meaning, index) => (
					  <div key={index} className="mb-2">
						<p className="text-gray-800">{meaning.meaning}</p>
						{meaning.context && (
						  <p className="text-sm text-gray-600 italic">
							Kontekst: {meaning.context}
						  </p>
						)}
					  </div>
					))}
				  </div>

				  {/* Examples */}
				  <div>
					<h3 className="font-semibold text-lg mb-2">Przykłady użycia:</h3>
					{selectedEntry.examples.map((example, index) => (
					  <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2">
						<p className="text-blue-800 font-medium">
						  {example.sourceText}
						</p>
						<p className="text-gray-700">
						  {example.translatedText}
						</p>
					  </div>
					))}
				  </div>
				</div>
			  </CardContent>
			</Card>
		  </div>
		)}

		{/* Statistics and Featured Content */}
		<div className="grid md:grid-cols-3 gap-6 mb-12">
		  {/* Dictionary Stats */}
		  <Card>
			<CardHeader>
			  <CardTitle className="text-lg">Słownik w liczbach</CardTitle>
			</CardHeader>
			<CardContent>
			  <div className="text-center">
				<p className="text-3xl font-bold text-blue-600">
				  {mockStats.totalEntries.toLocaleString()}
				</p>
				<p className="text-sm text-gray-600">słów w słowniku</p>
			  </div>
			</CardContent>
		  </Card>

		  {/* Recent Entries */}
		  <Card>
			<CardHeader>
			  <CardTitle className="text-lg">Ostatnio dodane</CardTitle>
			</CardHeader>
			<CardContent>
			  <div className="space-y-2">
				{mockStats.recentEntries.map((entry, index) => (
				  <div key={index} className="flex justify-between items-center">
					<button
					  onClick={() => handleWordClick(entry.word)}
					  className="text-blue-600 hover:underline font-medium"
					>
					  {entry.word}
					</button>
					<Badge variant="outline" className="text-xs">
					  {entry.category}
					</Badge>
				  </div>
				))}
			  </div>
			</CardContent>
		  </Card>

		  {/* Featured Example */}
		  <Card>
			<CardHeader>
			  <CardTitle className="text-lg">Przykład dnia</CardTitle>
			</CardHeader>
			<CardContent>
			  <div className="space-y-3">
				<p className="text-blue-800 font-medium">
				  Idã na{' '}
				  <button
					onClick={() => handleWordClick(mockStats.featuredExample.highlightedWord)}
					className="bg-yellow-200 px-1 rounded hover:bg-yellow-300 transition-colors"
				  >
					{mockStats.featuredExample.highlightedWord}
				  </button>
				  , bo muszã zarobic na familijã.
				</p>
				<p className="text-gray-700 text-sm">
				  {mockStats.featuredExample.translation}
				</p>
			  </div>
			</CardContent>
		  </Card>
		</div>

		{/* Categories Section */}
		<div className="grid md:grid-cols-2 gap-6">
		  {/* Traditional Categories */}
		  <Card>
			<CardHeader>
			  <CardTitle className="text-xl text-amber-700">Branże tradycyjne</CardTitle>
			  <CardDescription>
				Terminologia śląska z tradycyjnych dziedzin przemysłu
			  </CardDescription>
			</CardHeader>
			<CardContent>
			  <div className="grid grid-cols-2 gap-3">
				{['Górnictwo', 'Hutnictwo', 'Inżynieria', 'Produkcja'].map((category) => (
				  <Button
					key={category}
					variant="outline"
					className="justify-start"
					onClick={() => window.location.href = `/kategoria/${category.toLowerCase()}`}
				  >
					{category}
				  </Button>
				))}
			  </div>
			</CardContent>
		  </Card>

		  {/* Modern Categories */}
		  <Card>
			<CardHeader>
			  <CardTitle className="text-xl text-blue-700">Branże nowoczesne</CardTitle>
			  <CardDescription>
				Współczesne terminy techniczne po śląsku
			  </CardDescription>
			</CardHeader>
			<CardContent>
			  <div className="grid grid-cols-2 gap-3">
				{['Informatyka', 'Elektronika', 'Telekomunikacja'].map((category) => (
				  <Button
					key={category}
					variant="outline"
					className="justify-start"
					onClick={() => window.location.href = `/kategoria/${category.toLowerCase()}`}
				  >
					{category}
				  </Button>
				))}
			  </div>
			</CardContent>
		  </Card>
		</div>
	  </main>

	  {/* Footer */}
	  <footer className="border-t bg-gray-50 mt-16">
		<div className="container mx-auto px-4 py-8">
		  <div className="text-center text-gray-600">
			<p className="mb-2">
			  © 2025 Śląski Słownik Majsterkowy - Zachowujemy śląską mowę techniczną
			</p>
			<p className="text-sm">
			  Projekt realizowany przez{' '}
			  <a
				href="https://warsztatmiejski.org"
				className="text-blue-600 hover:underline"
				target="_blank"
				rel="noopener noreferrer"
			  >
				Warsztat Miejski
			  </a>
			</p>
		  </div>
		</div>
	  </footer>
	</div>
  )
}