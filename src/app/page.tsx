import HomeClient from '@/components/HomeClient'
import { db } from '@/lib/db'
import { getSeoRecord } from '@/lib/seo'
import type { Metadata } from 'next'
import Script from 'next/script'

export default function Page() {
  return (
    <>
      {/* SSR fallback: boş ekranı önlemek için minimal içerik */}
      <div id="app-root">
        <HomeClient />
      </div>
      <div id="fallback" className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <a href="/" className="font-semibold text-lg text-gold">Hokkabaz</a>
            <span className="text-xs text-muted-foreground">Temel görünüm</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Sayfa yüklenemedi veya gömülü tarayıcıda (ör. Telegram) bir sorun oluştu. Aşağıdaki bağlantılar üzerinden içeriğe erişebilirsiniz.
          </p>
          <nav className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <a href="/kampanyalar" className="px-3 py-2 rounded-md ring-1 ring-border hover:bg-gold/5 transition-colors">Kampanyalar</a>
            <a href="/bonuslar" className="px-3 py-2 rounded-md ring-1 ring-border hover:bg-gold/5 transition-colors">Bonuslar</a>
            <a href="/guvenilir-bahis-siteleri-listesi" className="px-3 py-2 rounded-md ring-1 ring-border hover:bg-gold/5 transition-colors">Güvenilir Siteler</a>
            <a href="/banko-kuponlar" className="px-3 py-2 rounded-md ring-1 ring-border hover:bg-gold/5 transition-colors">Banko Kuponlar</a>
            <a href="/vpn-onerileri" className="px-3 py-2 rounded-md ring-1 ring-border hover:bg-gold/5 transition-colors">VPN Önerileri</a>
            <a href="/guvenilir-telegram" className="px-3 py-2 rounded-md ring-1 ring-border hover:bg-gold/5 transition-colors">Telegram Grupları</a>
          </nav>
        </div>
      </div>
      <Script id="faq-schema" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Kampanyalar nasıl seçiliyor?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Kampanyaları objektif kriterlere göre değerlendiriyoruz: güvenilirlik, kullanıcı geri bildirimleri, bonus şartları ve çekim kolaylığı. Öne çıkanları ana sayfada listeliyoruz."
              }
            },
            {
              "@type": "Question",
              "name": "Deneme bonusları gerçekten ücretsiz mi?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Deneme bonusları çoğunlukla ücretsizdir. Bazılarında kimlik doğrulama veya minimum çevrim şartı olabilir. Her kartta özet şartları ve geçerlilik metnini ayrıca belirtiyoruz."
              }
            },
            {
              "@type": "Question",
              "name": "Banko Kuponlar nasıl güncelleniyor?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Banko Kuponlar her gün saat 18:00’de yenilenir. Maç sonuçları otomatik işlenir ve arşivden geçmiş kuponlara ulaşabilirsiniz."
              }
            },
            {
              "@type": "Question",
              "name": "Güvenilir siteleri nasıl belirliyorsunuz?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Lisans, ödeme geçmişi, kullanıcı yorumları ve şeffaf kurallar temel kriterlerimizdir. Anlaşmalı Siteler bölümünde düzenli olarak güncellenen listemizi bulabilirsiniz."
              }
            },
            {
              "@type": "Question",
              "name": "Telegram grubuna nasıl katılırım?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Footer’daki Telegram Grupları ve ana sayfadaki panelden davet linkine tıklayarak direkt katılabilirsiniz. Duyurular ve canlı sohbet için grubu kullanıyoruz."
              }
            },
            {
              "@type": "Question",
              "name": "Canlı maç yayınlarını nereden izlerim?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Canlı Maç İzle sayfasında yayın bilgilerini ve gerekli yönlendirmeleri paylaşıyoruz. Yayın kurallarına ve yerel mevzuata uymanızı tavsiye ederiz."
              }
            },
            {
              "@type": "Question",
              "name": "VPN önerileri ne işe yarar?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Erişim sorunlarında alternatif çözümler sunar. VPN Önerileri sayfasında ücretli/ücretsiz seçenekleri, konumlar ve resmi site linklerini bulabilirsiniz."
              }
            },
            {
              "@type": "Question",
              "name": "Yorumlar nasıl onaylanıyor?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yorumlar moderasyon sürecinden geçer. Spam, hakaret veya yanıltıcı içerikler reddedilir. Onaylı yorumlar marka sayfalarında görünür."
              }
            },
            {
              "@type": "Question",
              "name": "Bonus çekimi için tipik şartlar nelerdir?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Çoğunlukla minimum çevrim, oyun kısıtları ve süre şartları bulunur. Her kampanya kartında özetlenir, detaylara resmi siteden erişebilirsiniz."
              }
            },
            {
              "@type": "Question",
              "name": "Destek ekibiyle nasıl iletişime geçerim?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "İletişim sayfasındaki formu veya e-posta adresini kullanabilirsiniz. Acil durumlar için Telegram grubundaki moderatörlere yazabilirsiniz."
              }
            }
          ]
        })}
      </Script>
    </>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const s = await getSeoRecord('/', ['']) as any

    const title = s?.title ?? 'Hokkabaz'
    const description = s?.description ?? 'Güvenilir bahis ve casino içerikleri'
    const canonical = s?.canonicalUrl ?? undefined
    return {
      title,
      description,
      alternates: canonical ? { canonical } : undefined,
      openGraph: {
        title: s?.ogTitle ?? title,
        description: s?.ogDescription ?? description,
        type: 'website',
        images: s?.ogImageUrl ? [s.ogImageUrl] : ['/uploads/1760732951329-fzch33159aq.jpg'],
        url: canonical,
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
  } catch {
    return {
      title: 'Hokkabaz',
      description: 'Güvenilir bahis ve casino içerikleri',
      openGraph: {
        title: 'Hokkabaz',
        description: 'Güvenilir bahis ve casino içerikleri',
        type: 'website',
        images: ['/uploads/1760732951329-fzch33159aq.jpg'],
      },
      twitter: {
        title: 'Hokkabaz',
        description: 'Güvenilir bahis ve casino içerikleri',
        images: ['/uploads/1760732951329-fzch33159aq.jpg'],
        card: 'summary_large_image',
      },
      robots: {
        index: true,
        follow: true,
      },
    }
  }
}