import IletisimClient from '@/components/IletisimClient'
import type { Metadata } from 'next'
import { getSeoRecord } from '@/lib/seo'

export default function Page() {
  return <IletisimClient />
}
export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoRecord('/iletisim', ['iletisim']) as any
    const title = seo?.title ?? 'İletişim - Hokkabaz'
    const description = seo?.description ?? 'Yalnızca işbirliği ve sponsorluk talepleri için iletişim.'
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
        url: 'https://hokkabaz.bet/iletisim',
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
      title: 'İletişim - Hokkabaz',
      description: 'Yalnızca işbirliği ve sponsorluk talepleri için iletişim.',
    }
  }
}