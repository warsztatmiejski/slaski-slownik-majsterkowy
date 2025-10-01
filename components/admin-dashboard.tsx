'use client'

import { useState } from 'react'
import { Search, Plus, Edit, Trash2, Check, X, Eye, Settings, BookOpen, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

// Mock data for demonstration
const mockStats = {
  totalEntries: 1247,
  pendingSubmissions: 23,
  approvedToday: 8,
  rejectedToday: 2
}

const mockPendingSubmissions = [
  {
	id: '1',
	sourceWord: 'fajront',
	targetWord: 'koniec pracy',
	sourceLang: 'SILESIAN',
	targetLang: 'POLISH',
	category: 'Górnictwo',
	submittedAt: '2025-01-15T10:30:00Z',
	submitterName: 'Jan Kowalski',
	submitterEmail: 'jan@example.com',
	notes: 'Popularne określenie zakończenia zmiany w kopalni.',
	exampleSentences: ['Już fajront, idymy do dōmu.']
  },
  {
	id: '2',
	sourceWord: 'router',
	targetWord: 'ruter',
	sourceLang: 'POLISH',
	targetLang: 'SILESIAN',
	category: 'Informatyka',
	submittedAt: '2025-01-15T14:15:00Z',
	submitterName: 'Anna Nowak',
	submitterEmail: 'anna@example.com',
	notes: 'Termin sieciowy do słownika nowoczesnych technologii.',
	exampleSentences: ['Skōnfiguruj rutera we do internetu.']
  }
]

const mockApprovedEntries = [
  {
	id: 'entry-1',
	sourceWord: 'šichta',
	targetWord: 'zmiana robocza',
	sourceLang: 'SILESIAN',
	targetLang: 'POLISH',
	category: 'Górnictwo',
	status: 'APPROVED',
	approvedAt: '2025-01-14T16:20:00Z'
  },
  {
	id: 'entry-2',
	sourceWord: 'kōmputr',
	targetWord: 'komputer',
	sourceLang: 'SILESIAN',
	targetLang: 'POLISH',
	category: 'Informatyka',
	status: 'APPROVED',
	approvedAt: '2025-01-14T11:45:00Z'
  }
]

export default function AdminDashboard() {
  const [reviewNotes, setReviewNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const handleReviewSubmission = async (submissionId: string, action: 'approve' | 'reject') => {
	// Here you would call your API to approve/reject the submission
	console.log(`${action}ing submission ${submissionId} with notes: ${reviewNotes}`)

	// Mock success - in real app, update the UI based on API response
	alert(`Zgłoszenie zostało ${action === 'approve' ? 'zatwierdzone' : 'odrzucone'}`)
	setReviewNotes('')
  }

  const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString('pl-PL', {
	  year: 'numeric',
	  month: 'short',
	  day: 'numeric',
	  hour: '2-digit',
	  minute: '2-digit'
	})
  }

  return (
	<div className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-900/20">
	  {/* Admin Header */}
	  <header className="border-b bg-card shadow-sm">
		<div className="container mx-auto px-4 py-4">
		  <div className="flex items-center justify-between">
			<div className="flex items-center space-x-4">
			  <Settings className="h-6 w-6 text-primary" />
			  <div>
				<h1 className="text-2xl font-bold text-foreground">Panel administratora</h1>
				<p className="text-sm text-muted-foreground">Śląski Słownik Majsterkowy</p>
			  </div>
			</div>
			<div className="flex items-center space-x-4">
			  <Button variant="outline" onClick={() => window.location.href = '/'}>
				<Eye className="mr-2 h-4 w-4" />
				Zobacz słownik
			  </Button>
			  <Button>
				<Plus className="mr-2 h-4 w-4" />
				Dodaj wpis
			  </Button>
			</div>
		  </div>
		</div>
	  </header>

	  <main className="container mx-auto px-4 py-8">
		{/* Statistics Cards */}
		<div className="grid md:grid-cols-4 gap-6 mb-8">
		  <Card>
			<CardContent className="p-6">
			  <div className="flex items-center justify-between">
				<div>
				  <p className="text-sm font-medium text-muted-foreground">Wpisy w słowniku</p>
				  <p className="text-3xl font-bold text-primary">{mockStats.totalEntries}</p>
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
				  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{mockStats.pendingSubmissions}</p>
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
				  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{mockStats.approvedToday}</p>
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
				  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{mockStats.rejectedToday}</p>
				</div>
				<X className="h-8 w-8 text-red-600 dark:text-red-400" />
			  </div>
			</CardContent>
		  </Card>
		</div>

		{/* Main Content Tabs */}
		<Tabs defaultValue="pending" className="space-y-6">
		  <TabsList className="grid w-full grid-cols-3">
			<TabsTrigger value="pending">
			  Oczekujące zgłoszenia ({mockStats.pendingSubmissions})
			</TabsTrigger>
			<TabsTrigger value="entries">
			  Zatwierdzone wpisy ({mockStats.totalEntries})
			</TabsTrigger>
			<TabsTrigger value="settings">
			  Ustawienia
			</TabsTrigger>
		  </TabsList>

		  {/* Pending Submissions Tab */}
		  <TabsContent value="pending" className="space-y-6">
			<Card>
			  <CardHeader>
				<CardTitle>Zgłoszenia oczekujące na weryfikację</CardTitle>
				<CardDescription>
				  Przejrzyj i zatwierdź lub odrzuć zgłoszenia od użytkowników
				</CardDescription>
			  </CardHeader>
			  <CardContent>
				<div className="space-y-4">
				  {mockPendingSubmissions.map((submission) => (
					<Card key={submission.id} className="border-orange-200 dark:border-orange-800">
					  <CardContent className="p-6">
						<div className="flex items-start justify-between">
						  <div className="space-y-3 flex-1">
							<div className="flex items-center space-x-3">
							  <h3 className="text-lg font-semibold text-primary">
								{submission.sourceWord} → {submission.targetWord}
							  </h3>
							  <Badge variant="outline">{submission.category}</Badge>
							  <Badge variant="secondary">
								{submission.sourceLang === 'SILESIAN' ? 'śl → pl' : 'pl → śl'}
							  </Badge>
							</div>

						<div className="grid md:grid-cols-2 gap-4 text-sm">
						  <div>
							<p className="font-medium text-foreground">Przykłady:</p>
							<ul className="list-disc list-inside text-muted-foreground">
							  {submission.exampleSentences.map((example, index) => (
								<li key={index}>{example}</li>
							  ))}
							</ul>
						  </div>
						  <div>
							<p className="font-medium text-foreground">Notatki:</p>
							<p className="text-muted-foreground">{submission.notes || 'Brak dodatkowych informacji'}</p>
						  </div>
						</div>

							<div className="text-xs text-muted-foreground">
							  Zgłoszone przez: {submission.submitterName} ({submission.submitterEmail}) • {formatDate(submission.submittedAt)}
							</div>
						  </div>

						  <div className="flex space-x-2 ml-4">
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
								<div className="space-y-4">
								  <div className="grid md:grid-cols-2 gap-4">
									<div>
									  <Label>Słowo źródłowe</Label>
									  <p className="text-lg font-medium">{submission.sourceWord}</p>
									</div>
									<div>
									  <Label>Tłumaczenie</Label>
									  <p className="text-lg font-medium">{submission.targetWord}</p>
									</div>
								  </div>

								  <div>
									<Label>Uwagi do weryfikacji</Label>
									<Textarea
									  value={reviewNotes}
									  onChange={(e) => setReviewNotes(e.target.value)}
									  placeholder="Dodaj uwagi do decyzji..."
									  className="mt-1"
									/>
								  </div>

								  <div className="flex justify-end space-x-2">
									<Button
									  variant="outline"
									  onClick={() => handleReviewSubmission(submission.id, 'reject')}
									>
									  <X className="mr-2 h-4 w-4" />
									  Odrzuć
									</Button>
									<Button
									  onClick={() => handleReviewSubmission(submission.id, 'approve')}
									>
									  <Check className="mr-2 h-4 w-4" />
									  Zatwierdź
									</Button>
								  </div>
								</div>
							  </DialogContent>
							</Dialog>

							<Button
							  variant="outline"
							  size="sm"
							  onClick={() => handleReviewSubmission(submission.id, 'reject')}
							>
							  <X className="h-4 w-4 text-red-600 dark:text-red-400" />
							</Button>
							<Button
							  size="sm"
							  onClick={() => handleReviewSubmission(submission.id, 'approve')}
							>
							  <Check className="h-4 w-4" />
							</Button>
						  </div>
						</div>
					  </CardContent>
					</Card>
				  ))}
				</div>
			  </CardContent>
			</Card>
		  </TabsContent>

		  {/* Approved Entries Tab */}
		  <TabsContent value="entries" className="space-y-6">
			<Card>
			  <CardHeader>
				<div className="flex items-center justify-between">
				  <div>
					<CardTitle>Zatwierdzone wpisy</CardTitle>
					<CardDescription>
					  Zarządzaj wpisami w słowniku
					</CardDescription>
				  </div>
				  <div className="flex space-x-2">
					<div className="relative">
					  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
					  <Input
						placeholder="Szukaj wpisów..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10 w-64"
					  />
					</div>
					<Button>
					  <Plus className="mr-2 h-4 w-4" />
					  Dodaj wpis
					</Button>
				  </div>
				</div>
			  </CardHeader>
			  <CardContent>
				<div className="space-y-4">
				  {mockApprovedEntries.map((entry) => (
					<Card key={entry.id} className="border-green-200 dark:border-green-800">
					  <CardContent className="p-6">
						<div className="flex items-center justify-between">
						  <div className="space-y-2">
							<div className="flex items-center space-x-3">
							  <h3 className="text-lg font-semibold text-primary">
								{entry.sourceWord} → {entry.targetWord}
							  </h3>
							  <Badge variant="outline">{entry.category}</Badge>
							  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
								{entry.status}
							  </Badge>
							</div>
							<p className="text-sm text-muted-foreground">
							  Zatwierdzone: {formatDate(entry.approvedAt)}
							</p>
						  </div>

						  <div className="flex space-x-2">
							<Button variant="outline" size="sm">
							  <Edit className="h-4 w-4" />
							</Button>
							<Button variant="outline" size="sm">
							  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
							</Button>
						  </div>
						</div>
					  </CardContent>
					</Card>
				  ))}
				</div>
			  </CardContent>
			</Card>
		  </TabsContent>

		  {/* Settings Tab */}
		  <TabsContent value="settings" className="space-y-6">
			<Card>
			  <CardHeader>
				<CardTitle>Ustawienia administracyjne</CardTitle>
				<CardDescription>
				  Konfiguracja słownika i panelu administracyjnego
				</CardDescription>
			  </CardHeader>
			  <CardContent>
				<div className="space-y-6">
				  <div>
					<h3 className="text-lg font-semibold mb-4">Kategorie słownika</h3>
					<div className="grid md:grid-cols-2 gap-4">
					  <div>
						<Label>Branże tradycyjne</Label>
						<div className="space-y-2 mt-2">
						  {['Górnictwo', 'Hutnictwo', 'Inżynieria', 'Produkcja'].map(category => (
							<div key={category} className="flex items-center justify-between p-2 border rounded">
							  <span>{category}</span>
							  <Button variant="ghost" size="sm">
								<Edit className="h-4 w-4" />
							  </Button>
							</div>
						  ))}
						</div>
					  </div>
					  <div>
						<Label>Branże nowoczesne</Label>
						<div className="space-y-2 mt-2">
						  {['Informatyka', 'Elektronika', 'Telekomunikacja'].map(category => (
							<div key={category} className="flex items-center justify-between p-2 border rounded">
							  <span>{category}</span>
							  <Button variant="ghost" size="sm">
								<Edit className="h-4 w-4" />
							  </Button>
							</div>
						  ))}
						</div>
					  </div>
					</div>
				  </div>

				  <div>
					<h3 className="text-lg font-semibold mb-4">Eksport danych</h3>
					<div className="space-x-4">
					  <Button variant="outline">Eksportuj CSV</Button>
					  <Button variant="outline">Eksportuj JSON</Button>
					  <Button variant="outline">Backup bazy danych</Button>
					</div>
				  </div>
				</div>
			  </CardContent>
			</Card>
		  </TabsContent>
		</Tabs>
	  </main>
	</div>
  )
}
