import { Language } from '@prisma/client'

// Types for API responses
export interface SearchResult {
  id: string
  sourceWord: string
  targetWord: string
  sourceLang: Language
  targetLang: Language
  meanings: { meaning: string; context?: string }[]
  exampleSentences: { sourceText: string; translatedText: string }[]
  pronunciation?: string
  category: { name: string; slug: string }
  partOfSpeech?: string
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
}

export interface SubmissionData {
  sourceWord: string
  sourceLang: Language
  targetWord: string
  targetLang: Language
  pronunciation?: string
  categoryId: string
  partOfSpeech?: string
  meanings: { meaning: string; context?: string }[]
  exampleSentences: { sourceText: string; translatedText: string; context?: string }[]
  submitterName?: string
  submitterEmail?: string
  notes?: string
}

// API client functions
export class DictionaryAPI {
  private static async request<T>(
	endpoint: string,
	options: RequestInit = {}
  ): Promise<T> {
	const url = `/api${endpoint}`
	const config: RequestInit = {
	  headers: {
		'Content-Type': 'application/json',
		...options.headers,
	  },
	  ...options,
	}

	const response = await fetch(url, config)

	if (!response.ok) {
	  const error = await response.json().catch(() => ({ error: 'Request failed' }))
	  throw new Error(error.error || `HTTP ${response.status}`)
	}

	return response.json()
  }

  // Search dictionary entries
  static async search(
	query: string,
	options: {
	  lang?: Language
	  category?: string
	  limit?: number
	} = {}
  ): Promise<SearchResponse> {
	const params = new URLSearchParams({
	  q: query,
	  ...(options.lang && { lang: options.lang }),
	  ...(options.category && { category: options.category }),
	  ...(options.limit && { limit: options.limit.toString() }),
	})

	return this.request<SearchResponse>(`/search?${params}`)
  }

  // Submit new word
  static async submitWord(data: SubmissionData): Promise<{ success: boolean; submissionId: string }> {
	return this.request('/submissions', {
	  method: 'POST',
	  body: JSON.stringify(data),
	})
  }

  // Get pending submissions (admin only)
  static async getPendingSubmissions(): Promise<{ submissions: any[] }> {
	return this.request('/submissions?status=PENDING')
  }

  // Review submission (admin only)
  static async reviewSubmission(
	submissionId: string,
	action: 'approve' | 'reject',
	reviewNotes?: string,
	adminId: string = 'admin'
  ): Promise<{ success: boolean }> {
	return this.request(`/admin/submissions/${submissionId}`, {
	  method: 'PATCH',
	  body: JSON.stringify({
		action,
		reviewNotes,
		adminId,
	  }),
	})
  }

  // Get dictionary statistics
  static async getStats(): Promise<{
	totalEntries: number
	pendingSubmissions: number
	approvedToday: number
	rejectedToday: number
  }> {
	// This would be a real API call in production
	// For now, return mock data
	return {
	  totalEntries: 1247,
	  pendingSubmissions: 23,
	  approvedToday: 8,
	  rejectedToday: 2,
	}
  }

  // Get recent entries for homepage
  static async getRecentEntries(limit: number = 5): Promise<SearchResult[]> {
	// This would be a real API call in production
	// For now, return mock data
	return [
	  {
		id: '1',
		sourceWord: 'šichta',
		targetWord: 'zmiana robocza',
		sourceLang: 'SILESIAN',
		targetLang: 'POLISH',
		meanings: [{ meaning: 'Czas pracy w kopalni, zazwyczaj 8 godzin' }],
		exampleSentences: [{ sourceText: 'Idã na šichtã.', translatedText: 'Idę na zmianę.' }],
		category: { name: 'Górnictwo', slug: 'gornictwo' },
	  },
	  {
		id: '2',
		sourceWord: 'kōmputr',
		targetWord: 'komputer',
		sourceLang: 'SILESIAN',
		targetLang: 'POLISH',
		meanings: [{ meaning: 'Elektroniczna maszyna do przetwarzania danych' }],
		exampleSentences: [{ sourceText: 'Włōńcz kōmputr.', translatedText: 'Włącz komputer.' }],
		category: { name: 'Informatyka', slug: 'informatyka' },
	  },
	]
  }

  // Get featured example for homepage
  static async getFeaturedExample(): Promise<{
	sentence: string
	translation: string
	highlightedWord: string
	highlightedTranslation: string
  }> {
	// This would be a real API call in production
	return {
	  sentence: 'Idã na šichtã, bo muszã zarobic na familijã.',
	  translation: 'Idę na zmianę, bo muszę zarobić na rodzinę.',
	  highlightedWord: 'šichta',
	  highlightedTranslation: 'zmiana robocza',
	}
  }
}

// Helper function to format dates consistently
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pl-PL', {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
  })
}

// Helper function to get language display name
export function getLanguageName(lang: Language): string {
  return lang === 'SILESIAN' ? 'śląski' : 'polski'
}

// Helper function to get language direction display
export function getLanguageDirection(sourceLang: Language, targetLang: Language): string {
  const source = sourceLang === 'SILESIAN' ? 'śl' : 'pl'
  const target = targetLang === 'SILESIAN' ? 'śl' : 'pl'
  return `${source} → ${target}`
}