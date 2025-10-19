import type { Metadata } from 'next'
import { db } from '@/lib/db'
import KampanyalarClient from '@/components/KampanyalarClient'

export default function KampanyalarPage() {
  return <KampanyalarClient />
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await (db as any).seoSetting.findUnique({ where: { page: '/kampanyalar' } })
    const title = seo?.title ?? 'Kampanyalar'
    const description = seo?.description ?? 'Güncel kampanyalar, fırsatlar ve promosyonlar.'
    const keywords = seo?.keywords?.split(',').map((k: string) => k.trim()).filter(Boolean)
    const ogTitle = seo?.ogTitle ?? title
    const ogDescription = seo?.ogDescription ?? description
    const twitterTitle = seo?.twitterTitle ?? title
    const twitterDescription = seo?.twitterDescription ?? description
    const images = seo?.ogImageUrl ? [seo.ogImageUrl] : undefined

    return {
      title,
      description,
      keywords,
      alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: 'https://hokkabaz.com/kampanyalar',
        siteName: 'Hokkabaz',
        type: 'website',
        locale: 'tr_TR',
        images,
      },
      twitter: {
        card: 'summary_large_image',
        title: twitterTitle,
        description: twitterDescription,
        images,
      },
      robots: {
        index: seo?.robotsIndex ?? true,
        follow: seo?.robotsFollow ?? true,
      },
      other: seo?.structuredData ? { structuredData: JSON.stringify(seo.structuredData) } : undefined,
    }
  } catch {
    return {
      title: 'Kampanyalar',
      description: 'Güncel kampanyalar, fırsatlar ve promosyonlar.',
    }
  }
}