import { Language } from '@prisma/client'

// Types for API responses
export interface SearchResult {
  id: string
  slug: string
  sourceWord: string
  targetWord: string
  sourceLang: Language
  targetLang: Language
  exampleSentences: { sourceText: string; translatedText: string }[]
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
  exampleSentences: { sourceText: string; translatedText: string }[]
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
  } | null
}

export interface CategorySummary {
  id: string
  name: string
  slug: string
  description?: string
  type?: string
}

export interface AdminStats {
  totalEntries: number
  pendingSubmissions: number
  approvedToday: number
  rejectedToday: number
}

export interface PendingSubmission {
  id: string
  sourceWord: string
  sourceLang: Language
  targetWord: string
  targetLang: Language
  pronunciation?: string
  partOfSpeech?: string
  categoryId: string
  category: { id: string; name: string; slug: string } | null
  status: string
  submittedAt: string
  submitterName?: string
  submitterEmail?: string
  notes?: string
  exampleSentences: { sourceText: string; translatedText: string }[]
}

export interface AdminExampleSentence {
  id: string
  sourceText: string
  translatedText: string
  order: number
}

export interface AdminEntry {
  id: string
  sourceWord: string
  sourceLang: Language
  targetWord: string
  targetLang: Language
  slug?: string
  pronunciation?: string
  partOfSpeech?: string
  notes?: string
  status: string
  category: { id: string; name: string; slug: string }
  alternativeTranslations: string[]
  exampleSentences: AdminExampleSentence[]
  approvedAt: string | null
  updatedAt: string
}

export interface UpdateEntryPayload {
  sourceWord: string
  sourceLang: Language
  targetWord: string
  targetLang: Language
  slug?: string | null
  pronunciation?: string | null
  partOfSpeech?: string | null
  notes?: string | null
  categoryId: string
  status: string
  alternativeTranslations?: string[]
  exampleSentences?: Array<{ id?: string; sourceText: string; translatedText: string }>
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
	  credentials: 'include',
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
  static async getPendingSubmissions(): Promise<PendingSubmission[]> {
	const response = await this.request<{ submissions: PendingSubmission[] }>(
	  '/submissions?status=PENDING',
	)
	return response.submissions
  }

  // Review submission (admin only)
  static async reviewSubmission(
	submissionId: string,
	action: 'approve' | 'reject',
	reviewNotes?: string,
	adminId: string = 'admin'
  ): Promise<{ success: boolean }> {
	return this.request(`/submissions/${submissionId}`, {
	  method: 'PATCH',
	  body: JSON.stringify({
		action,
		reviewNotes,
		adminId,
	  }),
	})
  }

  // Get admin statistics
  static async getAdminStats(): Promise<AdminStats> {
	return this.request<AdminStats>('/admin/stats')
  }

  static async getAdminEntries(params: { search?: string; status?: string; limit?: number } = {}): Promise<AdminEntry[]> {
	const searchParams = new URLSearchParams()

	if (params.search) searchParams.set('search', params.search)
	if (params.status) searchParams.set('status', params.status)
	if (params.limit) searchParams.set('limit', params.limit.toString())

	const response = await this.request<{ entries: AdminEntry[] }>(
	  `/admin/entries${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
	)
	return response.entries
  }

  static async updateEntry(entryId: string, data: UpdateEntryPayload): Promise<{ entry: AdminEntry }> {
    return this.request(`/admin/entries/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  static async deleteEntry(entryId: string): Promise<{ success: boolean }> {
    return this.request(`/admin/entries/${entryId}`, {
      method: 'DELETE',
    })
  }

  static async getCategories(): Promise<CategorySummary[]> {
	const response = await this.request<{ categories: CategorySummary[] }>('/categories')
	return response.categories
  }

  static async createCategory(data: { name: string; slug?: string }): Promise<{ category: CategorySummary }> {
    return this.request('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async updateCategory(
    categoryId: string,
    data: { name: string; description?: string | null },
  ): Promise<{ category: CategorySummary }> {
    return this.request(`/admin/categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  static async deleteCategory(categoryId: string): Promise<{ success: boolean }> {
	return this.request(`/admin/categories?id=${encodeURIComponent(categoryId)}`, {
	  method: 'DELETE',
	})
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
