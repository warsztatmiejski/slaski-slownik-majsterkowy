import type { Metadata } from 'next'
import './globals.css'
import ThemeScript from '@/components/theme-script'

export const metadata: Metadata = {
  title: 'Śląski Słownik Majsterkowy',
  description: 'Techniczny słownik śląsko-polski dla branż tradycyjnych i nowoczesnych',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
	<html lang="pl" suppressHydrationWarning>
	  <head>
		<ThemeScript />
	  </head>
	  <body className="min-h-screen bg-background font-sans antialiased">
		{children}
	  </body>
	</html>
  )
}