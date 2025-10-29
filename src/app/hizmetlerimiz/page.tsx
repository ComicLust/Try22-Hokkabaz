import HizmetlerimizClient from '@/components/HizmetlerimizClient'
import type { Metadata } from 'next'
import { db } from '@/lib/db'

export default function Page() {
  return <HizmetlerimizClient />
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await (db as any).seoSetting.findUnique({ where: { page: '/hizmetlerimiz' } })
  const title = s?.title ?? 'Hizmetlerimiz - Hokkabaz'
  const description = s?.description ?? 'Google SEO, Meta Ads, TikTok Ads, Google Ads, Telegram organik büyütme, SMS ve E-mail Marketing hizmetleri.'
  const canonical = s?.canonicalUrl ?? undefined
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: s?.ogTitle ?? title,
      description: s?.ogDescription ?? description,
      images: s?.ogImageUrl ? [s.ogImageUrl] : ['/uploads/1760732951329-fzch33159aq.jpg'],
      url: canonical,
      type: s?.ogType ?? 'website',
    },
    twitter: {
      title: s?.twitterTitle ?? title,
      description: s?.twitterDescription ?? description,
      images: s?.twitterImageUrl ? [s.twitterImageUrl] : ['/uploads/1760732951329-fzch33159aq.jpg'],
      card: 'summary_large_image',
    },
    robots: {
      index: s?.robotsIndex ?? true,
      follow: s?.robotsFollow ?? true,
    },
    other: s?.keywords ? { keywords: s.keywords } : undefined,
  }
}