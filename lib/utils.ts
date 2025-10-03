import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to format language names
export function formatLanguage(lang: 'SILESIAN' | 'POLISH'): string {
  return lang === 'SILESIAN' ? 'Śląski' : 'Polski'
}

// Helper function to create URL-safe slugs
export function createSlug(text: string): string {
  return text
	.toLowerCase()
	.replace(/[^\w\s-]/g, '') // Remove special characters
	.replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
	.replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Helper function to highlight search terms in text
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm) return text

  const regex = new RegExp(`(${searchTerm})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
}
