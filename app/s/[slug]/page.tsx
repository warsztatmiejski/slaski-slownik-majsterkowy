import Page, { generateMetadata as baseGenerateMetadata } from '../../page'

type ParamsInput = { slug: string } | Promise<{ slug: string }>

export const generateMetadata = async ({ params }: { params: ParamsInput }) => {
  const resolvedParams = await params
  return baseGenerateMetadata({ searchParams: { s: resolvedParams.slug } })
}

export default Page
