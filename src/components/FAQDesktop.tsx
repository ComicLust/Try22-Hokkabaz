"use client";

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function FAQDesktop() {
  return (
    <section className="hidden lg:block border-t border-border py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gold text-center mb-8">Sıkça Sorulan Sorular</h2>
        <div className="grid grid-cols-2 gap-8">
          {/* Sol sütun */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-1">
              <AccordionTrigger>Kampanyalar nasıl seçiliyor?</AccordionTrigger>
              <AccordionContent>
                Kampanyaları objektif kriterlere göre değerlendiriyoruz: güvenilirlik, kullanıcı geri bildirimleri,
                bonus şartları ve çekim kolaylığı. Öne çıkanları ana sayfada listeliyoruz.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-2">
              <AccordionTrigger>Deneme bonusları gerçekten ücretsiz mi?</AccordionTrigger>
              <AccordionContent>
                Deneme bonusları çoğunlukla ücretsizdir. Bazılarında kimlik doğrulama veya minimum çevrim şartı olabilir.
                Her kartta özet şartları ve geçerlilik metnini ayrıca belirtiyoruz.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-3">
              <AccordionTrigger>Banko Kuponlar nasıl güncelleniyor?</AccordionTrigger>
              <AccordionContent>
                Banko Kuponlar her gün saat 18:00’de yenilenir. Maç sonuçları otomatik işlenir ve arşivden geçmiş
                kuponlara ulaşabilirsiniz.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-4">
              <AccordionTrigger>Güvenilir siteleri nasıl belirliyorsunuz?</AccordionTrigger>
              <AccordionContent>
                Lisans, ödeme geçmişi, kullanıcı yorumları ve şeffaf kurallar temel kriterlerimizdir. "Anlaşmalı Siteler"
                bölümünde düzenli olarak güncellenen listemizi bulabilirsiniz.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-5">
              <AccordionTrigger>Telegram grubuna nasıl katılırım?</AccordionTrigger>
              <AccordionContent>
                Footer’daki "Telegram Grupları" ve ana sayfadaki panelden davet linkine tıklayarak direkt katılabilirsiniz.
                Duyurular ve canlı sohbet için grubu kullanıyoruz.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Sağ sütun */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-6">
              <AccordionTrigger>Canlı maç yayınlarını nereden izlerim?</AccordionTrigger>
              <AccordionContent>
                "Canlı Maç İzle" sayfasında yayın bilgilerini ve gerekli yönlendirmeleri paylaşıyoruz. Yayın kurallarına
                ve yerel mevzuata uymanızı tavsiye ederiz.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-7">
              <AccordionTrigger>VPN önerileri ne işe yarar?</AccordionTrigger>
              <AccordionContent>
                Erişim sorunlarında alternatif çözümler sunar. "VPN Önerileri" sayfasında ücretli/ücretsiz seçenekleri,
                konumlar ve resmi site linklerini bulabilirsiniz.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-8">
              <AccordionTrigger>Yorumlar nasıl onaylanıyor?</AccordionTrigger>
              <AccordionContent>
                Yorumlar moderasyon sürecinden geçer. Spam, hakaret veya yanıltıcı içerikler reddedilir. Onaylı yorumlar
                marka sayfalarında görünür.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-9">
              <AccordionTrigger>Bonus çekimi için tipik şartlar nelerdir?</AccordionTrigger>
              <AccordionContent>
                Çoğunlukla minimum çevrim, oyun kısıtları ve süre şartları bulunur. Her kampanya kartında özetlenir,
                detaylara resmi siteden erişebilirsiniz.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-10">
              <AccordionTrigger>Destek ekibiyle nasıl iletişime geçerim?</AccordionTrigger>
              <AccordionContent>
                "İletişim" sayfasındaki formu veya e-posta adresini kullanabilirsiniz. Acil durumlar için Telegram
                grubundaki moderatörlere yazabilirsiniz.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
}