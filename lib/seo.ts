const SITE_NAME = 'Śląski Słownik Majsterkowy'
const SITE_DESCRIPTION = 'Techniczny słownik śląsko-polski dla branż tradycyjnych i nowoczesnych'
const DEFAULT_SOCIAL_IMAGE = '/ssm.svg'

function resolveMetadataBase(): URL | undefined {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)

  if (!envUrl) {
    return undefined
  }

  try {
    return new URL(envUrl)
  } catch (error) {
    console.warn('Invalid metadata base URL provided:', error)
    return undefined
  }
}

export { SITE_NAME, SITE_DESCRIPTION, DEFAULT_SOCIAL_IMAGE, resolveMetadataBase }
