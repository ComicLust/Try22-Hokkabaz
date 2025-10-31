import HizmetlerimizClient from '@/components/HizmetlerimizClient'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getSeoRecord, validateOgType } from '@/lib/seo'

export default function Page() {
  return <HizmetlerimizClient />
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSeoRecord('hizmetlerimiz')
  
  if (!s) {
    return {
      title: 'Hizmetlerimiz',
      description: 'Hizmetlerimiz hakkında bilgi alın.',
    }
  }
  
  const title = s?.title ?? 'Hizmetlerimiz - Hokkabaz'
  const description = s?.description ?? 'Google SEO, Meta Ads, TikTok Ads, Google Ads, Telegram organik büyütme, SMS ve E-mail Marketing hizmetleri.'
  const canonical = s?.canonicalUrl ?? undefined
  
  const ogType = validateOgType(s?.ogType)
  
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: s?.ogTitle ?? title,
      description: s?.ogDescription ?? description,
      images: s?.ogImageUrl ? [s.ogImageUrl] : ['/uploads/1760732951329-fzch33159aq.jpg'],
      url: canonical,
      type: ogType,
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