'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Theme = 'light' | 'dark' | 'system'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before rendering to avoid hydration mismatch
  useEffect(() => {
	setMounted(true)

	// Get saved theme or default to system
	const savedTheme = localStorage.getItem('theme') as Theme
	if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
	  setTheme(savedTheme)
	  applyTheme(savedTheme)
	} else {
	  setTheme('system')
	  applyTheme('system')
	}
  }, [])

  const applyTheme = (newTheme: Theme) => {
	const root = window.document.documentElement

	// Remove existing theme class
	root.classList.remove('dark')

	if (newTheme === 'dark') {
	  root.classList.add('dark')
	} else if (newTheme === 'system') {
	  // Use system preference
	  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
	  if (systemTheme === 'dark') {
		root.classList.add('dark')
	  }
	}
	// Light theme is default (no class needed)
  }

  const handleThemeChange = (newTheme: Theme) => {
	setTheme(newTheme)
	localStorage.setItem('theme', newTheme)
	applyTheme(newTheme)
  }

  // Listen for system theme changes when in system mode
  useEffect(() => {
	if (theme === 'system') {
	  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

	  const handleChange = () => {
		if (theme === 'system') {
		  applyTheme('system')
		}
	  }

	  mediaQuery.addEventListener('change', handleChange)
	  return () => mediaQuery.removeEventListener('change', handleChange)
	}
  }, [theme])

  // Don't render on server or before hydration
  if (!mounted) {
	return (
	  <div className="flex items-center space-x-1">
		<Button variant="ghost" size="sm" disabled>
		  <Monitor className="h-4 w-4" />
		</Button>
	  </div>
	)
  }

  return (
	<div className="flex items-center space-x-1 rounded-md border border-border p-1">
	  <Button
		variant={theme === 'light' ? 'default' : 'ghost'}
		size="sm"
		onClick={() => handleThemeChange('light')}
		className="h-8 w-8 p-0"
		aria-label="Light theme"
	  >
		<Sun className="h-4 w-4" />
	  </Button>

	  <Button
		variant={theme === 'dark' ? 'default' : 'ghost'}
		size="sm"
		onClick={() => handleThemeChange('dark')}
		className="h-8 w-8 p-0"
		aria-label="Dark theme"
	  >
		<Moon className="h-4 w-4" />
	  </Button>

	  <Button
		variant={theme === 'system' ? 'default' : 'ghost'}
		size="sm"
		onClick={() => handleThemeChange('system')}
		className="h-8 w-8 p-0"
		aria-label="System theme"
	  >
		<Monitor className="h-4 w-4" />
	  </Button>
	</div>
  )
}