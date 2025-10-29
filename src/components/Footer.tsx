"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import SocialBar from "@/components/SocialBar";
import MobileBottomNav from "@/components/MobileBottomNav";

const TelegramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.5 8.5L15 17.5C15 17.5 14.75 18.25 14 17.75L10.5 15L9 14.5L6.75 13.75C6.75 13.75 6.25 13.5 6.25 13C6.25 12.5 6.75 12.25 6.75 12.25L15.5 8.25C15.5 8.25 16.5 7.75 16.5 8.5Z" fill="currentColor"/>
  </svg>
);

interface FooterProps { noSidebarOffset?: boolean }

export default function Footer({ noSidebarOffset = false }: FooterProps) {
  return (
    <footer className="bg-background border-t border-gold">
      <div className={`container mx-auto px-4 ${noSidebarOffset ? '' : 'md:pl-72'} py-12 md:py-16 space-y-10`}>
        {/* Global Social Bar */}
        <SocialBar compact />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand Column */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Image src="/logo.svg" alt="Hokkabaz Logo" width={36} height={36} className="rounded-full bg-gold/10 p-1" />
              <span className="text-xl font-bold text-gold">Hokkabaz</span>
            </div>
            <p className="text-muted-foreground mb-4 text-sm md:text-base">
              Hokkabaz, güvenilir ve güncel bahis bonuslarını tek yerde toplar. Tüm kampanyaları tarafsızca inceler, kullanım koşullarını anlaşılır şekilde özetleriz. En iyi fırsatları kaçırmamanız için sürekli güncelleme yaparız.
            </p>
          </div>

          {/* Hızlı Linkler */}
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-4 text-gold">Hızlı Linkler</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-muted-foreground hover:text-gold transition-colors text-sm md:text-base">Ana Sayfa</a></li>
              <li><a href="/kampanyalar" className="text-muted-foreground hover:text-gold transition-colors">Kampanyalar</a></li>
              <li><a href="/bonuslar" className="text-muted-foreground hover:text-gold transition-colors">Bonuslar</a></li>
              <li><a href="/yorumlar" className="text-muted-foreground hover:text-gold transition-colors">Yorumlar</a></li>
              <li><a href="/guvenilir-bahis-siteleri-listesi" className="text-muted-foreground hover:text-gold transition-colors">Güvenilir Siteler</a></li>
              <li><a href="/banko-kuponlar" className="text-muted-foreground hover:text-gold transition-colors">Banko Kuponlar</a></li>
              <li><a href="/canli-mac-izle" className="text-muted-foreground hover:text-gold transition-colors">Canlı Maç İzle</a></li>
              <li><a href="/vpn-onerileri" className="text-muted-foreground hover:text-gold transition-colors">VPN Önerileri</a></li>
              <li><a href="/guvenilir-telegram" className="text-muted-foreground hover:text-gold transition-colors">Telegram Grupları</a></li>
            </ul>
          </div>

          {/* Bilgi */}
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-4 text-gold">Bilgi</h3>
            <ul className="space-y-2">
              <li><a href="/hakkimizda" className="text-muted-foreground hover:text-gold transition-colors">Hakkımızda</a></li>
              <li><a href="/hizmetlerimiz" className="text-muted-foreground hover:text-gold transition-colors">Hizmetlerimiz</a></li>
              <li><a href="/iletisim" className="text-muted-foreground hover:text-gold transition-colors">İletişim</a></li>
              <li><a href="/kullanim-kosullari" className="text-muted-foreground hover:text-gold transition-colors">Kullanım Koşulları</a></li>
              <li><a href="/gizlilik-politikasi" className="text-muted-foreground hover:text-gold transition-colors">Gizlilik Politikası</a></li>
              <li><a href="/dmca" className="text-muted-foreground hover:text-gold transition-colors">DMCA</a></li>
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-4 text-gold">İletişim</h3>
            <div className="space-y-2">
              <a href="mailto:info@hokkabaz.net" className="flex items-center text-muted-foreground hover:text-gold">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                info@hokkabaz.net
              </a>
              <a href="https://t.me/+r577e3x2dhIxNjdk" target="_blank" rel="noopener noreferrer nofollow" className="flex items-center text-muted-foreground hover:text-gold">
                <TelegramIcon className="w-4 h-4 mr-2" />
                Telegram Davet Linki
              </a>
            </div>
            <Button className="w-full mt-4 gold-gradient neon-button" asChild>
              <a href="/iletisim">Bize Ulaşın</a>
            </Button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-muted-foreground text-sm mb-4 md:mb-0">
              © 2025 Hokkabaz. Tüm hakları saklıdır.
            </div>
            <div className="text-muted-foreground text-sm text-center">
              18+ | Sorumlu Bahis | Lütfen bahis yaparken sınırlarınızı bilin
            </div>
          </div>
        </div>
      </div>
      {/* Mobile bottom navigation (fixed) */}
      <MobileBottomNav />
    </footer>
  );
}