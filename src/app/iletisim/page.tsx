import IletisimClient from '@/components/IletisimClient'
import type { Metadata } from 'next'
import { db } from '@/lib/db'

export default function Page() {
  return <IletisimClient />
}
export async function generateMetadata(): Promise<Metadata> {
  const s = await (db as any).seoSetting.findUnique({ where: { page: '/iletisim' } })
  const title = s?.title ?? 'İletişim - Hokkabaz'
  const description = s?.description ?? 'Yalnızca işbirliği ve sponsorluk talepleri için iletişim.'
  const canonical = s?.canonicalUrl ?? undefined
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: s?.ogTitle ?? title,
      description: s?.ogDescription ?? description,
      images: s?.ogImageUrl ? [s.ogImageUrl] : undefined,
      url: canonical,
    },
    twitter: {
      title: s?.twitterTitle ?? title,
      description: s?.twitterDescription ?? description,
      images: s?.twitterImageUrl ? [s.twitterImageUrl] : undefined,
      card: 'summary_large_image',
    },
    robots: {
      index: s?.robotsIndex ?? true,
      follow: s?.robotsFollow ?? true,
    },
    other: s?.keywords ? { keywords: s.keywords } : undefined,
  }
}