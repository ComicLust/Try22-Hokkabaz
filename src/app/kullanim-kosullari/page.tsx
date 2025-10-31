import React from 'react'
import type { Metadata } from 'next'
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSeoRecord } from '@/lib/seo'

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/kullanim-kosullari" />
      <main className="pt-3 md:pl-72">
        <div className="container mx-auto px-4 py-6 space-y-6">
          <h1 className="text-3xl font-bold text-gold">Kullanım Koşulları</h1>
          <p className="text-muted-foreground">Son güncelleme: 23 Ekim 2025</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Genel Bilgiler</h2>
            <p className="text-foreground/80">Hokkabaz, bahis ve kampanya dünyasına ilişkin bilgilendirme ve yönlendirme içerikleri sunan bir platformdur. Hizmetlerimiz, kullanıcıları resmi kurum/marka sitelerine yönlendiren bağlantılar ve bilgilendirme içeriklerinden oluşur. Hokkabaz bir bahis veya oyun operatörü değildir.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Uygunluk ve Sorumluluk</h2>
            <p className="text-foreground/80">Sitemizi kullanarak bulunduğunuz ülkenin geçerli mevzuatına uymayı ve 18 yaşından büyük olduğunuzu beyan edersiniz. Sunulan içerikler bilgilendirme amaçlıdır; nihai karar ve sorumluluk kullanıcıya aittir.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. İçerik ve Doğruluk</h2>
            <p className="text-foreground/80">Kampanyalar, bonuslar ve üçüncü taraf bağlantıları sıkça değişebilir. Doğruluğu düzenli olarak kontrol etsek de, resmi kaynaklarda yapılmış değişiklikler nedeniyle bilgiler farklılık gösterebilir. En güncel şartlar için her zaman ilgili markanın resmi web sitesini kontrol ediniz.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Üçüncü Taraf Bağlantıları</h2>
            <p className="text-foreground/80">Sitemizde yer alan bağlantılar, üçüncü taraf web sitelerine yönlendirme yapabilir. Bu siteler üzerinde kontrolümüz yoktur ve içeriklerinden sorumlu değiliz. Üçüncü taraf sitelerin kullanım koşullarını ve gizlilik politikalarını ayrıca inceleyiniz.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Yasaklı Kullanımlar</h2>
            <ul className="list-disc pl-5 text-foreground/80 space-y-1">
              <li>Hizmetlerimizi yasa dışı amaçlarla kullanmak,</li>
              <li>Otomatik araçlarla veri kazımak veya servislerimizi bozmak,</li>
              <li>Marka veya telif haklarını ihlal eden içerik paylaşmak.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Fikri Mülkiyet Hakları</h2>
            <p className="text-foreground/80">Hokkabaz’a ait logo, marka ve özgün içerikler telif hakkına tabidir. İzinsiz kopyalama, çoğaltma veya yeniden yayınlama yasaktır.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Sorumluluğun Sınırlandırılması</h2>
            <p className="text-foreground/80">Hokkabaz, dolaylı, arızi veya sonuç olarak doğan zararlardan sorumlu değildir. Kullanıcı, sitede yer alan bilgileri kendi sorumluluğunda kullanır.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Değişiklikler</h2>
            <p className="text-foreground/80">Bu koşullar zaman zaman güncellenebilir. Güncellemeler yayımlandığı anda yürürlüğe girer. Önemli değişikliklerde bildirim yapmaya çalışırız.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. İletişim</h2>
            <p className="text-foreground/80">Her türlü soru, öneri ve şikayet için <a href="mailto:info@hokkabaz.bet" className="text-gold">info@hokkabaz.bet</a> adresinden bize ulaşabilirsiniz.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoRecord('/kullanim-kosullari', ['kullanim-kosullari']) as any
    const title = seo?.title ?? 'Kullanım Koşulları'
    const description = seo?.description ?? 'Hokkabaz kullanım koşulları ve hizmet şartları hakkında bilgi alın.'
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
        url: 'https://hokkabaz.bet/kullanim-kosullari',
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
      title: 'Kullanım Koşulları',
      description: 'Hokkabaz kullanım koşulları ve hizmet şartları hakkında bilgi alın.',
    }
  }
}