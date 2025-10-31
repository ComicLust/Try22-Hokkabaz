import type { Metadata } from 'next'
import OzelOranlarClient from '@/components/OzelOranlarClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SeoArticle from '@/components/SeoArticle'

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
    const title = 'Özel Oranlar'
    const description = 'Derbi ve özel maçlara özel artırılmış oranlı kuponlar.'
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: '/ozel-oranlar',
        images: ['/uploads/1760532229828-d1r5fy9lmim.png'],
      },
      twitter: {
        title,
        description,
        images: ['/uploads/1760532229828-d1r5fy9lmim.png'],
      },
      robots: {
        index: true,
        follow: true,
      },
    }
  } catch {
    return {
      title: 'Özel Oranlar',
      description: 'Derbi ve özel maçlara özel artırılmış oranlı kuponlar.',
    }
  }
}