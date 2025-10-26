import type { Metadata } from 'next'
import { db } from '@/lib/db'
import KampanyalarClient from '@/components/KampanyalarClient'

export default async function KampanyalarPage() {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://hokkabaz.net'
  let campaigns: any[] = []
  try {
    campaigns = await (db as any).campaign.findMany({
      where: { isActive: true },
      orderBy: [
        { isFeatured: 'desc' },
        { priority: 'desc' },
      ],
      take: 10,
    })
  } catch {}
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: (campaigns || []).map((c: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: String(c?.title || 'Kampanya'),
      description: String(c?.description || 'Güncel kampanya fırsatları'),
      url: (typeof c?.ctaUrl === 'string' && c.ctaUrl.trim()) ? c.ctaUrl : `${BASE}/kampanyalar`,
      image: c?.imageUrl ? (c.imageUrl.startsWith('http') ? c.imageUrl : `${BASE}${c.imageUrl}`) : `${BASE}/uploads/1760732951329-fzch33159aq.jpg`,
    })),
  }
  return (
    <>
      <KampanyalarClient />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
    </>
  )
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
    const images = seo?.ogImageUrl ? [seo.ogImageUrl] : ['/uploads/1760732951329-fzch33159aq.jpg']

    return {
      title,
      description,
      keywords,
      alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: 'https://hokkabaz.net/kampanyalar',
        siteName: 'Hokkabaz',
        type: seo?.ogType ?? 'website',
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
      title: 'Kampanyalar',
      description: 'Güncel kampanyalar, fırsatlar ve promosyonlar.',
    }
  }
}