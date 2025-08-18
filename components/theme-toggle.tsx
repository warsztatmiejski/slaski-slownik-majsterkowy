'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Theme = 'light' | 'dark' | 'system'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
	setMounted(true)

	// Get saved theme or default to light
	const savedTheme = localStorage.getItem('theme') as Theme
	if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
	  setTheme(savedTheme)
	  applyTheme(savedTheme)
	} else {
	  setTheme('light')
	  applyTheme('light')
	}
  }, [])

  const applyTheme = (newTheme: Theme) => {
	const root = document.documentElement

	// Remove existing dark class
	root.classList.remove('dark')

	if (newTheme === 'dark') {
	  root.classList.add('dark')
	} else if (newTheme === 'system') {
	  // Use system preference
	  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
	  if (systemTheme) {
		root.classList.add('dark')
	  }
	}
	// Light theme = no class needed (default)
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

  if (!mounted) {
	return <div className="w-24 h-8" /> // Placeholder to prevent layout shift
  }

  return (
	<div className="flex items-center space-x-1 rounded-md border border-border p-1 bg-background">
	  <Button
		variant={theme === 'light' ? 'default' : 'ghost'}
		size="sm"
		onClick={() => handleThemeChange('light')}
		className="h-7 w-7 p-0"
	  >
		<Sun className="h-3 w-3" />
	  </Button>

	  <Button
		variant={theme === 'dark' ? 'default' : 'ghost'}
		size="sm"
		onClick={() => handleThemeChange('dark')}
		className="h-7 w-7 p-0"
	  >
		<Moon className="h-3 w-3" />
	  </Button>

	  <Button
		variant={theme === 'system' ? 'default' : 'ghost'}
		size="sm"
		onClick={() => handleThemeChange('system')}
		className="h-7 w-7 p-0"
	  >
		<Monitor className="h-3 w-3" />
	  </Button>
	</div>
  )
}