import { Language } from '@prisma/client'

// Types for API responses
export interface SearchResult {
  id: string
  slug: string
  sourceWord: string
  targetWord: string
  sourceLang: Language
  targetLang: Language
  exampleSentences: { sourceText: string; translatedText: string; context?: string }[]
  pronunciation?: string
  category: { id: string; name: string; slug: string }
  partOfSpeech?: string
  notes?: string
  alternativeTranslations: string[]
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
  exampleSentences: { sourceText: string; translatedText: string; context?: string }[]
  submitterName?: string
  submitterEmail?: string
  notes?: string
  newCategoryName?: string
}

export interface RecentEntry {
  id: string
  slug: string
  sourceWord: string
  targetWord: string
  sourceLang: Language
  targetLang: Language
  pronunciation?: string
  partOfSpeech?: string
  notes?: string
  category: { id: string; name: string; slug: string }
  exampleSentence: {
    sourceText: string
    translatedText: string
    context?: string
  } | null
}

export interface FeaturedEntry {
  id: string
  slug: string
  sourceWord: string
  targetWord: string
  sourceLang: Language
  targetLang: Language
  pronunciation?: string
  partOfSpeech?: string
  notes?: string
  category: { id: string; name: string; slug: string }
  exampleSentence: {
    sourceText: string
    translatedText: string
    context?: string
  } | null
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
  static async getPendingSubmissions(): Promise<{ submissions: unknown[] }> {
	return this.request<{ submissions: unknown[] }>(
	  '/submissions?status=PENDING',
	)
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
	return this.request('/admin/stats')
  }

  // Get recent entries for homepage
  static async getRecentEntries(limit: number = 5): Promise<RecentEntry[]> {
	const response = await this.request<{ entries: RecentEntry[] }>(
	  `/dictionary/recent?limit=${Math.max(1, limit)}`,
	)
	return response.entries
  }

  // Get featured example for homepage
  static async getFeaturedExample(): Promise<FeaturedEntry | null> {
	const response = await this.request<{ entry: FeaturedEntry | null }>(
	  '/dictionary/featured',
	)
	return response.entry
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
