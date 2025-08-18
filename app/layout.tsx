import type { Metadata } from 'next'
import './globals.css'

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
	<html lang="pl">
	  <body className="min-h-screen bg-background font-sans antialiased">
		{children}
	  </body>
	</html>
  )
}