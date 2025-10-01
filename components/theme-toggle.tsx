'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ThemeToggleProps {
  variant?: 'default' | 'panel'
}

type Theme = 'light' | 'dark'

const PLACEHOLDER_SIZE = 'h-10 w-10'

const baseButtonStyles =
  'flex items-center justify-center border border-slate-900 bg-white/80 text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] dark:border-slate-100 dark:bg-slate-900/60 dark:text-slate-100'
const panelButtonStyles =
  'w-full rounded-full px-6 py-3 text-base'

export default function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
	const root = document.documentElement
	const savedTheme = localStorage.getItem('theme') as Theme | 'system' | null
	if (savedTheme === 'light' || savedTheme === 'dark') {
	  setTheme(savedTheme)
	  applyTheme(savedTheme)
	  setMounted(true)
	  return
	}

	if (savedTheme === 'system') {
	  localStorage.removeItem('theme')
	}

	const prefersDark = root.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches
	const initialTheme: Theme = prefersDark ? 'dark' : 'light'
	setTheme(initialTheme)
	applyTheme(initialTheme)
	localStorage.setItem('theme', initialTheme)
	setMounted(true)
  }, [])

  const applyTheme = (nextTheme: Theme) => {
	const root = document.documentElement
	if (nextTheme === 'dark') {
	  root.classList.add('dark')
	} else {
	  root.classList.remove('dark')
	}
  }

  const toggleTheme = () => {
	const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'
	setTheme(nextTheme)
	localStorage.setItem('theme', nextTheme)
	applyTheme(nextTheme)
  }

  if (!mounted) {
	return <div className={PLACEHOLDER_SIZE} />
  }

  const Icon = theme === 'light' ? Moon : Sun

  const sizeClasses = variant === 'panel' ? panelButtonStyles : 'h-10 w-10 rounded-full'

  return (
	<Button
	  type="button"
	  variant="ghost"
	  size={variant === 'panel' ? 'default' : 'icon'}
	  onClick={toggleTheme}
	  aria-label={`Przełącz na tryb ${theme === 'light' ? 'ciemny' : 'jasny'}`}
	  className={`${baseButtonStyles} ${sizeClasses}`}
	>
	  <Icon className="h-5 w-5" />
	</Button>
  )
}
