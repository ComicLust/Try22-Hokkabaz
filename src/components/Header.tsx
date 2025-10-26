'use client';

import { useState, useEffect } from 'react';
import { Award, Menu, Users, Star, Gift, Trophy, Ticket, Send, Twitter, Facebook, Home, MessageSquare, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import Breadcrumbs from '@/components/Breadcrumbs';

// Telegram Icon Component
const TelegramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.5 8.5L15 17.5C15 17.5 14.75 18.25 14 17.75L10.5 15L9 14.5L6.75 13.75C6.75 13.75 6.25 13.5 6.25 13C6.25 12.5 6.75 12.25 6.75 12.25L15.5 8.25C15.5 8.25 16.5 7.75 16.5 8.5Z" fill="currentColor"/>
  </svg>
);

interface HeaderProps {
  currentPath?: string;
}

export default function Header({ currentPath = '/' }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsOpen(true)
    window.addEventListener('open-mobile-menu', handler as EventListener)
    return () => window.removeEventListener('open-mobile-menu', handler as EventListener)
  }, [])

  const navigationItems = [
    { href: '/', label: 'Ana Sayfa', active: currentPath === '/' },
    { href: '/kampanyalar', label: 'Kampanyalar', active: currentPath === '/kampanyalar' },
    { href: '/bonuslar', label: 'Bonuslar', active: currentPath === '/bonuslar' },
    { href: '/guvenilir-bahis-siteleri-listesi', label: 'Güvenilir Siteler', active: currentPath === '/guvenilir-bahis-siteleri-listesi' },
    { href: '/yorumlar', label: 'Yorumlar', active: currentPath === '/yorumlar' },
    { href: '/banko-kuponlar', label: 'Banko Kuponlar', active: currentPath === '/banko-kuponlar' },
    { href: '/hakkimizda', label: 'Hakkımızda', active: currentPath === '/hakkimizda' },
    { href: '/iletisim', label: 'İletişim', active: currentPath === '/iletisim' },
  ];

  const primaryMenu: { href: string; label: string; Icon: any; active?: boolean; external?: boolean; comingSoon?: boolean }[] = [
    { href: '/', label: 'Ana Sayfa', Icon: Home, active: currentPath === '/' },
    { href: '/guvenilir-bahis-siteleri-listesi', label: 'Güvenilir Siteler', Icon: Award, active: currentPath === '/guvenilir-bahis-siteleri-listesi' },
    { href: '/kampanyalar', label: 'Aktif Kampanyalar', Icon: Star, active: currentPath === '/kampanyalar' },
    { href: '/yorumlar', label: 'Yorumlar', Icon: MessageSquare, active: currentPath === '/yorumlar' },
    { href: '/banko-kuponlar', label: 'Banko Kuponlar', Icon: Trophy, active: currentPath === '/banko-kuponlar' },
    // Canlı Maç öğesi buradan kaldırıldı; Eğlence/Kazan altında kalacak
    { href: 'https://t.me/+r577e3x2dhIxNjdk', label: 'Topluluk', Icon: Users, external: true },
    { href: '/guvenilir-telegram', label: 'Telegram Grupları', Icon: Send, active: currentPath === '/guvenilir-telegram' },
  ];

  const rewardsMenu: { href: string; label: string; Icon: any; active?: boolean; external?: boolean; comingSoon?: boolean }[] = [
    { href: '/bonuslar', label: 'Bonuslar', Icon: Gift, active: currentPath === '/bonuslar' },
    { href: '/bonuslar?type=Deneme%20Bonusu', label: 'Deneme Bonusları', Icon: Ticket },
  ];

  const funMenu: { href: string; label: string; Icon: any; active?: boolean; external?: boolean; comingSoon?: boolean }[] = [
    { href: '#', label: 'Şans Çarkı', Icon: Trophy, comingSoon: true },
    { href: '/canli-mac-izle', label: 'Canlı Maç', Icon: Trophy, active: currentPath === '/canli-mac-izle' },
  ];

  const vpnMenu: { href: string; label: string; Icon: any; active?: boolean; external?: boolean; comingSoon?: boolean }[] = [
    { href: '/vpn-onerileri', label: 'VPN Önerileri', Icon: Shield, active: currentPath === '/vpn-onerileri' },
  ];

  const handleNavigationClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header only (desktopta gizli) */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-background/90 border-b border-border md:hidden">
        <div className="container mx-auto px-4">
          {/* Mobil Header: logo ortalı, sağda hamburger */}
          <div className="flex md:hidden items-center justify-center h-16 relative">
            <a href="/" className="flex items-center space-x-2" aria-label="Hokkabaz">
              <img src="/logo.svg" alt="Hokkabaz" className="h-10 w-auto max-w-[180px]" />
            </a>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute right-0 hover:bg-gold/10 hover:text-gold">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-[380px] bg-background border-r border-gold/20 p-0">
                <div className="flex h-full flex-col">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Mobil Menü</SheetTitle>
                  </SheetHeader>
                {/* Menü Başlık */}
                <div className="px-4 pt-6 pb-4 border-b border-border">
                  <a href="/" className="block" aria-label="Hokkabaz">
                    <img src="/logo.svg" alt="Hokkabaz" className="h-10 w-auto max-w-[180px]" />
                  </a>
                </div>
                {/* Ana Sayfa ayrı buton kaldırıldı; menü listesinde ilk öğe olarak gösteriliyor */}
                {/* Menü İçerik */}
                <div className="flex-1 min-h-0 px-4 py-4 space-y-6 overflow-y-auto">
                  {/* Üst grup */}
                  <div className="space-y-2">
                    {primaryMenu.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={handleNavigationClick}
                        className={`flex items-center justify-between rounded-lg px-3 py-3 transition-all border ${
                          item.active ? 'bg-gold/10 border-gold text-gold' : 'bg-secondary-bg/60 border-border hover:border-gold/50 hover:bg-gold/5'
                        } hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-gold/20`}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer nofollow' : undefined}
                      >
                        <div className="flex items-center gap-2">
                          <item.Icon className={`w-4 h-4 ${item.active ? 'text-gold' : 'text-foreground/70'}`} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        {item.comingSoon && (
                          <span className="text-xs text-foreground/60">Eklenecek</span>
                        )}
                      </a>
                    ))}
                  </div>

                  {/* ÖDÜLLER */}
                  <div>
                    <div className="text-xs uppercase tracking-wider text-foreground/60 mb-2">ÖDÜLLER</div>
                    <div className="space-y-1.5">
                      {rewardsMenu.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          onClick={handleNavigationClick}
                          className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-all border ${
                            item.active ? 'bg-gold/10 border-gold text-gold' : 'bg-secondary-bg/40 border-border hover:border-gold/50 hover:bg-gold/5'
                          } hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-gold/20 ${
                            item.label === 'Bonuslar' ? 'gold-border gold-glow hover:scale-[1.03] hover:shadow-gold/40' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <item.Icon className={`w-4 h-4 ${item.active ? 'text-gold' : 'text-foreground/70'}`} />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          {item.comingSoon && (
                            <span className="text-xs text-foreground/60">Eklenecek</span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* EĞLENCE, KAZAN */}
                  <div>
                    <div className="text-xs uppercase tracking-wider text-foreground/60 mb-2">EĞLENCE, KAZAN</div>
                    <div className="space-y-1.5">
                      {funMenu.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          onClick={handleNavigationClick}
                          className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-all border ${
                            item.active ? 'bg-gold/10 border-gold text-gold' : 'bg-secondary-bg/40 border-border hover:border-gold/50 hover:bg-gold/5'
                          } hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-gold/20`}
                        >
                          <div className="flex items-center gap-2">
                            <item.Icon className={`w-4 h-4 ${item.active ? 'text-gold' : 'text-foreground/70'}`} />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          {item.comingSoon && (
                            <span className="text-xs text-foreground/60">Eklenecek</span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* VPN */}
                  <div>
                    <div className="text-xs uppercase tracking-wider text-foreground/60 mb-2">VPN</div>
                    <div className="space-y-1.5">
                      {vpnMenu.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          onClick={handleNavigationClick}
                          className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-all border ${
                            item.active ? 'bg-gold/10 border-gold text-gold' : 'bg-secondary-bg/40 border-border hover:border-gold/50 hover:bg-gold/5'
                          } hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-gold/20`}
                        >
                          <div className="flex items-center gap-2">
                            <item.Icon className={`w-4 h-4 ${item.active ? 'text-gold' : 'text-foreground/70'}`} />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          {item.comingSoon && (
                            <span className="text-xs text-foreground/60">Eklenecek</span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Telegram CTA kartı */}
                  <a
                    href="https://t.me/+r577e3x2dhIxNjdk"
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                  className="flex items-center justify-between rounded-lg px-3 py-3 border border-gold/40 bg-secondary-bg/40 hover:border-gold hover:bg-gold/10 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-sm hover:shadow-gold/20"
                  >
                    <div className="flex items-center gap-2">
                      <TelegramIcon className="w-4 h-4 text-gold" />
                      <div>
                        <div className="text-sm font-medium">Telegram'a Katıl!</div>
                        <div className="text-xs text-foreground/60">160B aktif üye</div>
                      </div>
                    </div>
                    <span className="text-foreground/60">→</span>
                  </a>

                  {/* Alt linkler: Hakkımızda, İletişim */}
                  <div className="pt-4 border-t border-border flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <a href="/hakkimizda" onClick={handleNavigationClick} className="text-foreground/80 hover:text-gold">Hakkımızda</a>
                      <a href="/iletisim" onClick={handleNavigationClick} className="text-foreground/80 hover:text-gold">İletişim</a>
                    </div>
                    {/* Küçük sosyal ikonlar */}
                    <div className="flex items-center gap-2">
                      <a
                        href="https://t.me/+r577e3x2dhIxNjdk"
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        aria-label="Telegram"
                        className="w-8 h-8 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80"
                      >
                        <Send className="w-4 h-4" />
                      </a>
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        aria-label="Facebook"
                        className="w-8 h-8 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80"
                      >
                        <Facebook className="w-4 h-4" />
                      </a>
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        aria-label="Twitter"
                        className="w-8 h-8 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </header>

      {/* Desktop Sidebar (ekremabi859.com benzeri) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 z-40 border-r border-border bg-background/95 backdrop-blur-sm">
        <div className="flex flex-col w-full h-full">
          {/* Brand */}
          <div className="px-4 py-4 border-b border-border space-y-3">
            <a href="/" className="block" aria-label="Hokkabaz">
              <img src="/logo.svg" alt="Hokkabaz" className="h-16 w-auto max-w-[240px]" />
            </a>
            {/* Ana Sayfa ayrı buton kaldırıldı; menü listesinde ilk öğe olarak gösteriliyor */}
          </div>

          {/* Menu content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            {/* Üst grup */}
            <div className="space-y-2">
              {primaryMenu.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between rounded-lg px-3 py-3 transition-all border ${
                    item.active ? 'bg-gold/10 border-gold text-gold' : 'bg-secondary-bg/60 border-border hover:border-gold/50 hover:bg-gold/5'
                  } hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-gold/20`}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer nofollow' : undefined}
                >
                  <div className="flex items-center gap-2">
                    <item.Icon className={`w-4 h-4 ${item.active ? 'text-gold' : 'text-foreground/70'}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {item.comingSoon && (
                    <span className="text-xs text-foreground/60">Eklenecek</span>
                  )}
                </a>
              ))}
            </div>

            {/* ÖDÜLLER */}
            <div>
              <div className="text-xs uppercase tracking-wider text-foreground/60 mb-2">ÖDÜLLER</div>
              <div className="space-y-1.5">
                {rewardsMenu.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-all border ${
                      item.active ? 'bg-gold/10 border-gold text-gold' : 'bg-secondary-bg/40 border-border hover:border-gold/50 hover:bg-gold/5'
                    } hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-gold/20 ${
                      item.label === 'Bonuslar' ? 'gold-border gold-glow hover:scale-[1.03] hover:shadow-gold/40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <item.Icon className={`w-4 h-4 ${item.active ? 'text-gold' : 'text-foreground/70'}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {item.comingSoon && (
                      <span className="text-xs text-foreground/60">Eklenecek</span>
                    )}
                  </a>
                ))}
              </div>
            </div>

            {/* EĞLENCE, KAZAN */}
            <div>
              <div className="text-xs uppercase tracking-wider text-foreground/60 mb-2">EĞLENCE, KAZAN</div>
              <div className="space-y-1.5">
                {funMenu.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-all border ${
                      item.active ? 'bg-gold/10 border-gold text-gold' : 'bg-secondary-bg/40 border-border hover:border-gold/50 hover:bg-gold/5'
                    } hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-gold/20`}
                  >
                    <div className="flex items-center gap-2">
                      <item.Icon className={`w-4 h-4 ${item.active ? 'text-gold' : 'text-foreground/70'}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {item.comingSoon && (
                      <span className="text-xs text-foreground/60">Eklenecek</span>
                    )}
                  </a>
                ))}
              </div>
            </div>

            {/* VPN */}
            <div>
              <div className="text-xs uppercase tracking-wider text-foreground/60 mb-2">VPN</div>
              <div className="space-y-1.5">
                {vpnMenu.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-all border ${
                      item.active ? 'bg-gold/10 border-gold text-gold' : 'bg-secondary-bg/40 border-border hover:border-gold/50 hover:bg-gold/5'
                    } hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-gold/20`}
                  >
                    <div className="flex items-center gap-2">
                      <item.Icon className={`w-4 h-4 ${item.active ? 'text-gold' : 'text-foreground/70'}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {item.comingSoon && (
                      <span className="text-xs text-foreground/60">Eklenecek</span>
                    )}
                  </a>
                ))}
              </div>
            </div>

            {/* Telegram CTA kartı */}
            <a
              href="https://t.me/+r577e3x2dhIxNjdk"
              target="_blank"
              rel="noopener noreferrer nofollow"
            className="flex items-center justify-between rounded-lg px-3 py-3 border border-gold/40 bg-secondary-bg/40 hover:border-gold hover:bg-gold/10 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-sm hover:shadow-gold/20"
            >
              <div className="flex items-center gap-2">
                <TelegramIcon className="w-4 h-4 text-gold" />
                <div>
                  <div className="text-sm font-medium">Telegram'a Katıl!</div>
                  <div className="text-xs text-foreground/60">160B aktif üye</div>
                </div>
              </div>
              <span className="text-foreground/60">→</span>
            </a>
            <div className="flex items-center gap-4 text-sm">
              <a href="/hakkimizda" className="text-foreground/80 hover:text-gold">Hakkımızda</a>
              <a href="/iletisim" className="text-foreground/80 hover:text-gold">İletişim</a>
            </div>
          </div>
        </div>
      </aside>
      {/* Spacer: sadece mobilde üst bar yüksekliği kadar boşluk */}
      <div className="h-16 md:h-0" />
      {/* Breadcrumbs: header altında, içerik öncesi */}
      <div className="md:pl-72">
        <div className="container mx-auto px-4">
          <Breadcrumbs />
        </div>
      </div>
    </>
  );
}