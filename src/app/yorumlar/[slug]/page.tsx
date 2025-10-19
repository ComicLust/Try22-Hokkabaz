import type { Metadata } from 'next'
import { db } from '@/lib/db'
import YorumDetayClient from '@/components/YorumDetayClient'
const prisma: any = db

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const brand = await prisma.reviewBrand.findUnique({ where: { slug: params.slug } })
    if (!brand) return { title: 'Site Yorumları' }

    const canonical = `https://hokkabaz.com/yorumlar/${params.slug}`
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

export default function YorumDetayPage({ params }: Props) {
  return <YorumDetayClient slug={params.slug} />
}