import React from 'react'
import type { Metadata } from 'next'
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSeoRecord } from '@/lib/seo'

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/dmca" />
      <main className="pt-3 md:pl-72">
        <div className="container mx-auto px-4 py-6 space-y-6">
          <h1 className="text-3xl font-bold text-gold">DMCA Bildirimi ve Kaldırma Politikası</h1>
          <p className="text-muted-foreground">Son güncelleme: 23 Ekim 2025</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Amaç</h2>
            <p className="text-foreground/80">Hokkabaz, telif hakkı sahiplerinin haklarına saygı duyar. ABD Dijital Milenyum Telif Hakkı Yasası (DMCA) ve ilgili mevzuat uyarınca telif hakkı ihlali bildirimlerini değerlendirir ve uygun gördüğü takdirde ilgili içerikleri kaldırır.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. DMCA Bildirimi Nasıl Yapılır?</h2>
            <p className="text-foreground/80">Telif hakkı sahibi veya yetkili temsilci, aşağıdaki bilgileri içeren bir bildirim göndermelidir:</p>
            <ul className="list-disc pl-5 text-foreground/80 space-y-1">
              <li>Telif hakkı sahibinin fiziksel veya elektronik imzası,</li>
              <li>İhlal edildiği iddia edilen eser(ler)in tanımı ve orijinal kaynağı,</li>
              <li>İhlal eden içerik veya bağlantının sitemizdeki tam URL’si,</li>
              <li>İletişim bilgileri (ad, e-posta, telefon),</li>
              <li>İçeriğin telif hakkını ihlal ettiğine iyi niyetli inanç beyanı,</li>
              <li>Bildirimdeki bilgilerin doğru olduğuna ve telif hakkı sahibi olduğuna veya onun adına yetkili olduğuna dair beyan.</li>
            </ul>
            <p className="text-foreground/80">Bildiriminizi <a href="mailto:info@hokkabaz.bet" className="text-gold">info@hokkabaz.bet</a> adresine gönderebilirsiniz.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Karşı Bildirim</h2>
            <p className="text-foreground/80">İçerik kaldırıldıysa ve bunun hata veya yanlış değerlendirme sonucu olduğunu düşünüyorsanız, DMCA karşı bildirimde bulunabilirsiniz. Karşı bildirim; kaldırılan içeriğin URL’sini, kişi bilgilerinizi ve iyi niyetli bir açıklamayı içermelidir.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Bağlantılar ve Üçüncü Taraf İçerikleri</h2>
            <p className="text-foreground/80">Sitemizde bulunan bazı içerikler, üçüncü taraf web sitelerine bağlantı verir. Hokkabaz bu sitelerin içeriği üzerinde kontrol sahibi değildir; ihlal bildirimi için doğrudan ilgili üçüncü tarafa başvurulması gerekebilir.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. İletişim</h2>
            <p className="text-foreground/80">DMCA ve telif hakları ile ilgili tüm talepler için: <a href="mailto:info@hokkabaz.bet" className="text-gold">info@hokkabaz.bet</a></p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoRecord('/dmca', ['dmca']) as any
    const title = seo?.title ?? 'DMCA Bildirimi ve Kaldırma Politikası'
    const description = seo?.description ?? 'Hokkabaz DMCA bildirimi ve telif hakkı kaldırma politikası hakkında bilgi alın.'
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
        url: 'https://hokkabaz.bet/dmca',
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
      title: 'DMCA Bildirimi ve Kaldırma Politikası',
      description: 'Hokkabaz DMCA bildirimi ve telif hakkı kaldırma politikası hakkında bilgi alın.',
    }
  }
}