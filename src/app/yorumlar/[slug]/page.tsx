import type { Metadata } from 'next'
import { db } from '@/lib/db'
import YorumDetayClient from '@/components/YorumDetayClient'
const prisma: any = db

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params
    const brand = await prisma.reviewBrand.findUnique({ where: { slug } })
    if (!brand) return { title: 'Site Yorumları' }

    const canonical = `https://hokkabaz.com/yorumlar/${slug}`
    const title = `${brand.name} Yorumları`
    const description = `${brand.name} için kullanıcı yorumları ve değerlendirmeler`
    const images = brand.logoUrl ? [brand.logoUrl] : undefined

    const structuredData = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        url: canonical,
        description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Brand',
        name: brand.name,
        url: brand.siteUrl || canonical,
        logo: brand.logoUrl || undefined,
        description: brand.editorialSummary || undefined,
      },
    ]

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'Hokkabaz',
        type: 'website',
        locale: 'tr_TR',
        images,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images,
      },
      other: { structuredData: JSON.stringify(structuredData) },
    }
  } catch {
    return { title: 'Site Yorumları' }
  }
}

export default async function YorumDetayPage({ params }: Props) {
  const { slug } = await params
  return <YorumDetayClient slug={slug} />
}