import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getSeoRecord } from '@/lib/seo'
import YorumlarClient from '@/components/YorumlarClient'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoRecord('/yorumlar', ['yorumlar']) as any
    const title = seo?.title ?? 'Bet Siteleri Yorumları'
    const description = seo?.description ?? 'Bet sitelerinin kullanıcı yorumları, arama ve sıralama seçenekleriyle liste halinde.'
    const keywords = seo?.keywords?.split(',').map((k: string) => k.trim()).filter(Boolean)
    const ogTitle = seo?.ogTitle ?? title
    const ogDescription = seo?.ogDescription ?? description
    const twitterTitle = seo?.twitterTitle ?? title
    const twitterDescription = seo?.twitterDescription ?? description
    const images = seo?.ogImageUrl ? [seo.ogImageUrl] : ['/uploads/1760732951329-fzch33159aq.jpg']

    return {
      title,
      description,
      keywords,
      alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: 'https://hokkabaz.bet/yorumlar',
        siteName: 'Hokkabaz',
        type: 'website',
        locale: 'tr_TR',
        images,
      },
      twitter: {
        card: 'summary_large_image',
        title: twitterTitle,
        description: twitterDescription,
        images: seo?.twitterImageUrl ? [seo.twitterImageUrl] : ['/uploads/1760732951329-fzch33159aq.jpg'],
      },
      robots: {
        index: seo?.robotsIndex ?? true,
        follow: seo?.robotsFollow ?? true,
      },
      other: seo?.structuredData ? { structuredData: JSON.stringify(seo.structuredData) } : undefined,
    }
  } catch {
    return {
      title: 'Bet Siteleri Yorumları',
      description: 'Bet sitelerinin kullanıcı yorumları, arama ve sıralama seçenekleriyle liste halinde.',
    }
  }
}

export default function YorumlarPage() {
  return <YorumlarClient />
}