import Page, { generateMetadata as baseGenerateMetadata } from '../page'

export const generateMetadata = async () =>
  baseGenerateMetadata({ searchParams: { view: 'categories' } })

export default Page
