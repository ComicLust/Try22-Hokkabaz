import type { Metadata } from 'next'
import OzelOranlarClient from '@/components/OzelOranlarClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SeoArticle from '@/components/SeoArticle'
import { getSeoRecord } from '@/lib/seo'

export default async function OzelOranlarPage() {
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://hokkabaz.bet'
  const specials = [
    {
      title: 'Örnek Marka A – Galatasaray vs Fenerbahçe',
      description: 'Derbiye özel 10.0 oranlı tekli kupon. Yeni üyelere özel.',
      url: `${BASE}/ozel-oranlar`,
      image: `${BASE}/uploads/1760532229828-d1r5fy9lmim.png`,
    },
    {
      title: 'Örnek Marka B – Beşiktaş vs Trabzonspor',
      description: '7.0 özel oran, kombine kuponlarda geçerli değildir.',
      url: `${BASE}/ozel-oranlar`,
      image: `${BASE}/uploads/1760656077922-1izqxopgu4m.png`,
    },
    {
      title: 'Örnek Marka C – E-spor Finali',
      description: '5.0 özel oran, maksimum kazanç 5.000₺.',
      url: `${BASE}/ozel-oranlar`,
      image: `${BASE}/uploads/1760657878298-1e9xw9zce0j.png`,
    },
  ]

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: specials.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.title,
      description: s.description,
      url: s.url,
      image: s.image,
    })),
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/ozel-oranlar" />
      <main className="pt-3 md:pl-72">
        <OzelOranlarClient />
      </main>
      <SeoArticle slug="ozel-oranlar" />
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoRecord('/ozel-oranlar', ['ozel-oranlar']) as any
    const title = seo?.title ?? 'Özel Oranlar'
    const description = seo?.description ?? 'Derbi ve özel maçlara özel artırılmış oranlı kuponlar.'
    const keywords = seo?.keywords?.split(',').map((k: string) => k.trim()).filter(Boolean)
    const ogTitle = seo?.ogTitle ?? title
    const ogDescription = seo?.ogDescription ?? description
    const twitterTitle = seo?.twitterTitle ?? title
    const twitterDescription = seo?.twitterDescription ?? description
    const images = seo?.ogImageUrl ? [seo.ogImageUrl] : ['/uploads/1760532229828-d1r5fy9lmim.png']

    return {
      title,
      description,
      keywords,
      alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: 'https://hokkabaz.bet/ozel-oranlar',
        siteName: 'Hokkabaz',
        type: 'website',
        locale: 'tr_TR',
        images,
      },
      twitter: {
        card: 'summary_large_image',
        title: twitterTitle,
        description: twitterDescription,
        images: seo?.twitterImageUrl ? [seo.twitterImageUrl] : ['/uploads/1760532229828-d1r5fy9lmim.png'],
      },
      robots: {
        index: seo?.robotsIndex ?? true,
        follow: seo?.robotsFollow ?? true,
      },
      other: seo?.structuredData ? { structuredData: JSON.stringify(seo.structuredData) } : undefined,
    }
  } catch {
    return {
      title: 'Özel Oranlar',
      description: 'Derbi ve özel maçlara özel artırılmış oranlı kuponlar.',
    }
  }
}