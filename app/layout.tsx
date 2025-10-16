import type { Metadata } from 'next'
import './globals.css'
import ThemeScript from '@/components/theme-script'
import { Analytics } from '@vercel/analytics/next'
import { DEFAULT_SOCIAL_IMAGE, SITE_DESCRIPTION, SITE_NAME, resolveMetadataBase } from '@/lib/seo'

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    url: '/',
    type: 'website',
    locale: 'pl_PL',
    images: [
      {
        url: DEFAULT_SOCIAL_IMAGE,
        alt: `${SITE_NAME} – podgląd grafiki`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE],
  },
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
		<link
		  rel="stylesheet"
		  href="https://webfonts.fontstand.com/WF-030374-6691b984fb11e114352ba7a74c90e792.css"
		  type="text/css"
		/>
	  </head>
	  <body className="min-h-screen bg-background font-sans antialiased">
		{children}
		<Analytics />
	  </body>
	</html>
  )
}
