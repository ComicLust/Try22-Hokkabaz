import React from 'react'
import type { Metadata } from 'next'
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSeoRecord } from '@/lib/seo'

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/gizlilik-politikasi" />
      <main className="pt-3 md:pl-72">
        <div className="container mx-auto px-4 py-6 space-y-6">
          <h1 className="text-3xl font-bold text-gold">Gizlilik Politikası</h1>
          <p className="text-muted-foreground">Son güncelleme: 23 Ekim 2025</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Kapsam</h2>
            <p className="text-foreground/80">Hokkabaz, kullanıcılarının gizlilik ve veri güvenliğini önemser. Bu politika; hangi verileri topladığımızı, nasıl kullandığımızı ve hangi taraflarla paylaştığımızı açıklar.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Toplanan Veriler</h2>
            <ul className="list-disc pl-5 text-foreground/80 space-y-1">
              <li>Temel kullanım verileri (ziyaret edilen sayfalar, tıklanan bağlantılar),</li>
              <li>Cihaz/ tarayıcı bilgileri (user-agent, dil, yaklaşık konum),</li>
              <li>IP adresi ve anonimleştirilmiş analiz verileri,</li>
              <li>Gönüllü olarak sağlanan iletişim verileri (e-posta vb.).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Çerezler ve Benzeri Teknolojiler</h2>
            <p className="text-foreground/80">Sitemiz; site performansını artırmak, hataları gidermek ve deneyimi kişiselleştirmek için çerezler ve benzeri teknolojiler kullanabilir. Tarayıcı ayarlarınızdan çerez tercihlerinizi yönetebilirsiniz.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Veri Kullanım Amaçları</h2>
            <ul className="list-disc pl-5 text-foreground/80 space-y-1">
              <li>Hizmetlerin sunulması ve iyileştirilmesi,</li>
              <li>İçerik kalitesinin artırılması ve hataların giderilmesi,</li>
              <li>Güvenlik ve kötüye kullanımın önlenmesi,</li>
              <li>İstatistiksel ve analitik değerlendirmeler.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Üçüncü Taraflarla Paylaşım</h2>
            <p className="text-foreground/80">Bazı veriler; analiz, barındırma ve güvenlik hizmeti sağlayıcılarıyla, sözleşmesel ve mevzuat gerekliliklerine uygun şekilde paylaşılabilir. Üçüncü taraf sitelere giden yönlendirmelerde, bu sitelerin kendi gizlilik politikaları geçerlidir.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Saklama Süresi</h2>
            <p className="text-foreground/80">Veriler, işleme amaçlarıyla sınırlı olmak üzere makul sürelerde saklanır; mevzuat gerektiren durumlarda ilgili yasal süreler uygulanır.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Güvenlik</h2>
            <p className="text-foreground/80">Veri güvenliği için makul idari ve teknik önlemler alırız. İnternet üzerinden iletilen verilerin tam güvenliği garanti edilemez; kullanıcılar kişisel verileri paylaşırken dikkatli olmalıdır.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Haklarınız</h2>
            <p className="text-foreground/80">Kişisel verilerinize ilişkin erişim, düzeltme, silme ve işleme itirazı gibi haklara sahipsiniz. Talepleriniz için bizimle iletişime geçebilirsiniz.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. İletişim</h2>
      <p className="text-foreground/80">Gizlilikle ilgili sorularınız için <a href="mailto:info@hokkabaz.bet" className="text-gold">info@hokkabaz.bet</a> adresine yazabilirsiniz.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. Değişiklikler</h2>
            <p className="text-foreground/80">Bu politika güncellenebilir. Güncellemeler yayımlandığı anda yürürlüğe girer.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoRecord('/gizlilik-politikasi', ['gizlilik-politikasi']) as any
    const title = seo?.title ?? 'Gizlilik Politikası'
    const description = seo?.description ?? 'Hokkabaz gizlilik politikası ve kişisel verilerin korunması hakkında bilgi alın.'
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
        url: 'https://hokkabaz.bet/gizlilik-politikasi',
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
      title: 'Gizlilik Politikası',
      description: 'Hokkabaz gizlilik politikası ve kişisel verilerin korunması hakkında bilgi alın.',
    }
  }
}