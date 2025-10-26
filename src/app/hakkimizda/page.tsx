import HakkimizdaClient from '@/components/HakkimizdaClient'
import type { Metadata } from 'next'
import { db } from '@/lib/db'

export default function Page() {
  return <HakkimizdaClient />
}
export async function generateMetadata(): Promise<Metadata> {
  const s = await (db as any).seoSetting.findUnique({ where: { page: '/hakkimizda' }, select: {
    title: true, description: true, keywords: true, canonicalUrl: true, ogTitle: true, ogDescription: true, ogImageUrl: true, twitterTitle: true, twitterDescription: true, twitterImageUrl: true, robotsIndex: true, robotsFollow: true,
  } })
  const title = s?.title ?? 'Hakkımızda - Hokkabaz'
  const description = s?.description ?? 'Ekibimiz ve yaklaşımımız hakkında bilgiler.'
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
      type: 'website',
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