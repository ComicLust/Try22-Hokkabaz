'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useMotionValue, useTransform } from 'framer-motion';
import Image from 'next/image';
import { Search, Filter, Star, Shield, Clock, Calendar, TrendingUp, Check, ExternalLink, CreditCard, Zap, Users, Award, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TelegramPanel from '@/components/TelegramPanel';

// Telegram Icon Component
const TelegramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.5 8.5L15 17.5C15 17.5 14.75 18.25 14 17.75L10.5 15L9 14.5L6.75 13.75C6.75 13.75 6.25 13.5 6.25 13C6.25 12.5 6.75 12.25 6.75 12.25L15.5 8.25C15.5 8.25 16.5 7.75 16.5 8.5Z" fill="currentColor"/>
  </svg>
);

export default function HomeClient() {
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [selectedBonus, setSelectedBonus] = useState<any>(null);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isBonusDialogOpen, setIsBonusDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Parallax effect
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardHover = {
    whileHover: { 
      y: -8,
      transition: { duration: 0.3 }
    }
  };

  // Bonuslar (API) verisi
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [bonusesError, setBonusesError] = useState<string | null>(null);
  const [bonusesLoading, setBonusesLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchBonuses = async () => {
      try {
        setBonusesLoading(true);
        setBonusesError(null);
        const res = await fetch('/api/bonuses?active=true', { cache: 'no-store' });
        const data = await res.json();
        setBonuses(Array.isArray(data) ? data : []);
      } catch (e) {
        setBonusesError('Bonuslar yüklenemedi');
      } finally {
        setBonusesLoading(false);
      }
    };
    fetchBonuses();
  }, []);

  // Geçerlilik metni ve süre kontrolü (Bonuslar sayfasıyla aynı)
  const formatValidity = (b: any) => {
    const vt = (b as any).validityText;
    const sd = (b as any).startDate;
    const ed = (b as any).endDate;
    if (vt) return String(vt);
    if (sd && ed) {
      return `${new Date(sd).toLocaleDateString('tr-TR')} - ${new Date(ed).toLocaleDateString('tr-TR')}`;
    }
    if (sd) return `Başlangıç: ${new Date(sd).toLocaleDateString('tr-TR')}`;
    if (ed) return `Bitiş: ${new Date(ed).toLocaleDateString('tr-TR')}`;
    return '';
  };

  const isExpired = (b: any) => {
    const ed = (b as any).endDate;
    if (!ed) return false;
    try {
      return new Date(ed).getTime() < Date.now();
    } catch {
      return false;
    }
  };

  // Marquee ve Partner Siteler (Anlaşmalı Siteler sayfasıyla aynı veri kaynakları)
  type MarqueeLogo = { id: string; imageUrl: string; href?: string | null; order: number; isActive: boolean };
  const [marqueeLogos, setMarqueeLogos] = useState<MarqueeLogo[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/marquee-logos');
        const data = await res.json();
        setMarqueeLogos(Array.isArray(data) ? data.filter((d: MarqueeLogo) => d.isActive) : []);
      } catch {}
    })();
  }, []);

  const marqueeItems = useMemo(() => {
    const reps = 12;
    if (!marqueeLogos.length) return [] as MarqueeLogo[];
    return Array.from({ length: reps }, (_, i) => marqueeLogos[i % marqueeLogos.length]);
  }, [marqueeLogos]);

  type PartnerSite = { id: string; name?: string; slug?: string; logoUrl?: string | null; siteUrl?: string | null; rating?: number | null; features?: any; isActive: boolean };
  const [partnerSites, setPartnerSites] = useState<PartnerSite[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/partner-sites');
        const data = await res.json();
        const actives = Array.isArray(data) ? data.filter((d: PartnerSite) => d.isActive) : [];
        setPartnerSites(actives);
      } catch {}
    })();
  }, []);
  const badgePool = ["Önerilen", "Yeni", "Bonuslu"];
  const primaryBrandLogos = useMemo(() => {
    const sorted = [...partnerSites].sort((a, b) => ((a?.features?.order ?? 999) - (b?.features?.order ?? 999)));
    return sorted.map((s, i) => ({ img: s.logoUrl ?? '/logo.svg', href: s.siteUrl ?? '#', badge: s?.features?.badge ?? badgePool[i % badgePool.length] }));
  }, [partnerSites]);
  const homeBrandGrid = useMemo(() => {
    // Ana sayfada sadece 2 sıra göstereceğiz (ör: 4 sütun x 2 sıra = 8 öğe)
    return primaryBrandLogos.slice(0, 8);
  }, [primaryBrandLogos]);

  // Telegram grup linki (davet URL’si)
  const telegramUrl = 'https://t.me/+r577e3x2dhIxNjdk';

  // Campaign detail handler
  const handleCampaignDetails = (campaign: any) => {
    setSelectedCampaign(campaign);
    setIsCampaignDialogOpen(true);
  };

  // Bonus detail handler
  const handleBonusDetails = (bonus: any) => {
    setSelectedBonus(bonus);
    setIsBonusDialogOpen(true);
  };

  // Mock data for featured campaigns
  type ApiCampaign = {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    imageUrl?: string | null;
    ctaUrl?: string | null;
    badgeLabel?: string | null;
    bonusText?: string | null;
    bonusAmount?: number | null;
    tags?: string[] | null;
    startDate?: string | null;
    endDate?: string | null;
    isActive: boolean;
    isFeatured: boolean;
    priority: number;
  };

  type UiCampaign = {
    id: string;
    title: string;
    description: string;
    tags: string[];
    status?: string;
    image: string;
    bonusAmount: string;
    featured: boolean;
    badgeLabel?: string | null;
    ctaUrl?: string | null;
  };

  const [kampanyalar, setKampanyalar] = useState<UiCampaign[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/campaigns');
        const data: ApiCampaign[] = await res.json();
        const now = Date.now();
        const mapped: UiCampaign[] = data.map((c) => {
          const start = c.startDate ? Date.parse(c.startDate) : undefined;
          const end = c.endDate ? Date.parse(c.endDate) : undefined;
          const activeRange = (!start || start <= now) && (!end || end >= now);
          const status = c.isActive && activeRange ? 'active' : (start && start > now ? 'upcoming' : 'ended');
          const featured = !!c.isFeatured;
          const bonusDisplay = (c.bonusText && c.bonusText.trim().length > 0)
            ? c.bonusText
            : (c.bonusAmount != null ? String(c.bonusAmount) : '');
          return {
            id: c.id,
            title: c.title,
            description: c.description ?? '',
            tags: Array.isArray(c.tags) ? c.tags! : [],
            status,
            image: c.imageUrl ?? '/api/placeholder/400/225',
            bonusAmount: bonusDisplay,
            featured,
            badgeLabel: c.badgeLabel ?? null,
            ctaUrl: c.ctaUrl ?? null,
          };
        });
        setKampanyalar(mapped);
      } catch (e) {
        // sessiz geç; ana sayfa yine çalışır
      }
    };
    load();
  }, []);

  const featuredKampanyalar = kampanyalar
    .filter(k => k.featured)
    .sort((a, b) => {
      const pa = Number(a.bonusAmount) || 0;
      const pb = Number(b.bonusAmount) || 0;
      if (pb !== pa) return pb - pa;
      return a.title.localeCompare(b.title);
    });

  // Deneme Bonusları artık API'den çekiliyor (bonuses)

  // Mock data for anlaşmalı siteler
  const anlasmaliSiteler = [
    {
      id: 1,
      siteName: 'Bahis Sitesi A',
      rating: 5,
      license: 'Curacao eGaming',
      payment: 'Anında çekim',
      support: '7/24 Türkçe',
      bonus: '500 TL\'ye kadar',
      badges: ['SSL', '18+', 'Güvenilir']
    },
    {
      id: 2,
      siteName: 'Casino B',
      rating: 5,
      license: 'Malta Gaming',
      payment: 'Anında çekim',
      support: '7/24 Türkçe',
      bonus: '1000 TL\'ye kadar',
      badges: ['SSL', '18+', 'Güvenilir']
    },
    {
      id: 3,
      siteName: 'Slot Oyunları C',
      rating: 4,
      license: 'UK Gambling',
      payment: 'Anında çekim',
      support: '7/24 Türkçe',
      bonus: '750 TL\'ye kadar',
      badges: ['SSL', '18+', 'Güvenilir']
    }
  ];

  // Mock data for aktif kampanyalar
  const aktifKampanyalar = [
    {
      id: 1,
      title: 'Haft sonu özel bonus',
      description: 'Haft sonu yapacağınız yatırımlara özel %200 bonus fırsatı!',
      countdown: '23:45:12',
      period: '15 Ekim - 31 Ekim 2025',
      tags: ['Tüm Üyeler'],
      image: '/api/placeholder/400/225'
    },
    {
      id: 2,
      title: 'Yeni üyelere özel',
      description: 'Sitemize yeni kayıt olan herkese 500 TL hoşgeldin bonusu!',
      countdown: '48:00:00',
      period: '1 Ekim - 30 Kasım 2025',
      tags: ['Yeni Üyeler'],
      image: '/api/placeholder/400/225'
    },
    {
      id: 3,
      title: 'VIP özel kampanya',
      description: 'VIP üyelerimize özel %300 çevrimsiz bonus!',
      countdown: '72:00:00',
      period: '1 Ekim - 15 Aralık 2025',
      tags: ['VIP'],
      image: '/api/placeholder/400/225'
    },
    {
      id: 4,
      title: 'Kayıp bonusu',
      description: 'Kaybettiğiniz bahislerin %30\'unu iade ediyoruz!',
      countdown: '120:00:00',
      period: '1 Ekim - 31 Aralık 2025',
      tags: ['Tüm Üyeler'],
      image: '/api/placeholder/400/225'
    }
  ];

  // Mock data for güvenilir siteler features
  const guvenilirSitelerFeatures = [
    {
      icon: Shield,
      title: 'Sadece Lisanslı Siteler',
      description: 'Tüm siteler uluslararası lisanslara sahip, güvenilir platformlardır.'
    },
    {
      icon: TrendingUp,
      title: 'En Yüksek Bonuslar',
      description: 'Piyasada bulunan en yüksek bonus miktarlarını sizler için derledik.'
    },
    {
      icon: CreditCard,
      title: 'Güvenilir Ödemeler',
      description: 'Anında ve güvenli ödeme seçenekleri ile paranız her zaman güvende.'
    },
    {
      icon: Users,
      title: '7/24 Destek',
      description: 'Türkçe speaking destek ekibimiz her zaman yanınızda.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/" />

      <main className="pt-3 md:pl-72">
        {/* Öne Çıkan Kampanyalar - Kampanyalar Sayfasıyla Birebir */}
        <motion.section 
          className="mb-8"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <motion.h2 
                className="text-3xl font-bold text-gold"
                variants={fadeInUp}
              >
                Önerilen Kampanyalar
              </motion.h2>
              <Button variant="outline" className="hover:border-gold hover:text-gold transition-colors" asChild>
                <a href="/kampanyalar">
                  Tümünü Gör
                </a>
              </Button>
            </div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">Türkiye'nin en güvenilir bahis sitelerinin en cazip bonus ve kampanyaları</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredKampanyalar.map((kampanya) => (
                <motion.div key={kampanya.id} variants={fadeInUp}>
                  <Card className="relative overflow-hidden backdrop-blur-lg bg-opacity-80 bg-card border-2 border-gold rounded-2xl hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-gold text-background">{kampanya.badgeLabel ?? 'ÖNE ÇIKAN'}</Badge>
                    </div>
                    <CardHeader>
                      <div className="relative aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                        <Image
                          src={kampanya.image}
                          alt={kampanya.title}
                          fill
                          className="object-cover z-0"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      <CardTitle className="text-lg">{kampanya.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">{kampanya.description}</p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Bonus Miktarı:</span>
                          <span className="font-semibold text-gold">{kampanya.bonusAmount}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {kampanya.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button className="w-full mt-4 gold-gradient neon-button hover:scale-105 transition-transform" onClick={() => handleCampaignDetails(kampanya)}>
                        Detayları Gör
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Deneme Bonuslari Section */}
        <motion.section 
          className="py-8"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <motion.h2 
                className="text-3xl font-bold text-gold"
                variants={fadeInUp}
              >
                Deneme Bonusları
              </motion.h2>
              <Button variant="outline" className="hover:border-gold hover:text-gold transition-colors" asChild>
                <a href="/bonuslar">
                  Tümünü Gör
                </a>
              </Button>
            </div>
            <motion.p 
              className="text-center text-muted-foreground mb-4"
              variants={fadeInUp}
            >
              {bonuses.length} bonus bulundu
            </motion.p>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={staggerContainer}
            >
              {bonuses.map((bonus) => (
                <motion.div key={bonus.id} variants={fadeInUp}>
                  <Card className={`backdrop-blur-lg bg-opacity-80 bg-card border border-border rounded-2xl hover:shadow-xl transition-all duration-300 hover:border-gold ${isExpired(bonus) ? 'opacity-60' : ''}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="w-20 h-12 bg-muted overflow-hidden border flex items-center justify-center">
                          {(bonus as any).imageUrl ? (
                            <img src={(bonus as any).imageUrl} alt={String((bonus as any).title || 'Logo')} className="w-full h-full object-contain" />
                          ) : (
                            <Award className="w-6 h-6 text-gold" />
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-lg">{(bonus as any).title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gold mb-2">
                        {Number((bonus as any).amount || 0)} TL
                      </div>
                      {(((bonus as any).shortDescription || (bonus as any).description)) && (
                        <div className="text-muted-foreground mb-4 text-sm">
                          {String((bonus as any).shortDescription || (bonus as any).description)}
                        </div>
                      )}
                      <div className="space-y-2 mb-4">
                        {(Array.isArray((bonus as any).features) ? (bonus as any).features : ['Çevrim Şartsız', 'Anında Çekim']).map((feature: string, index: number) => (
                          <div key={index} className="flex items-center text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-gold mr-2" />
                            {feature}
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(
                          (Array.isArray((bonus as any).badges) ? (bonus as any).badges : [])
                        ).concat(isExpired(bonus) ? ['Süresi Doldu'] : []).map((badge: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                      {formatValidity(bonus) && (
                        <div className="text-xs text-muted-foreground mb-4">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatValidity(bonus)}
                        </div>
                      )}
                      <Button variant="outline" className="w-full" onClick={() => handleBonusDetails(bonus)}>
                        Detayları Gör
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Anlaşmalı Siteler Section (Marquee + 2 sıra logo grid) */}
        <motion.section 
          className="py-16 bg-secondary-bg"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="container mx-auto px-4">
            <div className="flex itemscenter justify-between mb-6">
              <motion.h2 
                className="text-3xl font-bold text-gold"
                variants={fadeInUp}
              >
                Güvenilir Bahis Siteleri
              </motion.h2>
              <Button variant="outline" className="hover:border-gold hover:text-gold transition-colors" asChild>
                <a href="/anlasmali-siteler">
                  Tümünü Gör
                </a>
              </Button>
            </div>

            {/* Sürekli dönen logolar (marquee) */}
            <section className="w-full rounded-xl border border-border bg-gradient-to-b from-[#0d0d0d] to-[#151515] p-3 mb-10">
              <div className="marquee">
                <div className="marquee-track">
                  {marqueeItems.map((l, i) => (
                    <a key={`home-marquee-${i}`} href={l.href ?? '#'} target="_blank" rel="noopener noreferrer" className="block shrink-0">
                      <img src={l.imageUrl} alt="logo" className="w-[220px] h-[73px] opacity-90 hover:opacity-100 transition-opacity object-contain" />
                    </a>
                  ))}
                </div>
              </div>
            </section>

            {/* İki sıra anlaştığımız markalar */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full justify-items-center"
              variants={staggerContainer}
            >
              {homeBrandGrid.map((b, i) => (
                <a key={`home-brand-${i}`} href={b.href} target="_blank" rel="noopener noreferrer" className="relative group rounded-xl border border-border bg-gradient-to-br from-[#111] to-[#1a1a1a] p-5 text-center hover:border-gold hover:shadow-[0_0_22px_rgba(255,215,0,0.25)] transition-all w-full">
                  <span className="absolute top-2 right-2 text-[10px] md:text-xs px-2 py-1 rounded-full bg-gold/20 text-gold border border-gold">{b.badge}</span>
                  <img src={b.img} alt="logo" className="w-[220px] h-[73px] mx-auto opacity-90 group-hover:opacity-100 transition-opacity object-contain" />
                </a>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Aktif Kampanyalar Section (kampanyalar sayfasıyla aynı kart tasarımı) */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold text-gold">Aktif Kampanyalar</h2>
              <Button variant="outline" className="hover:border-gold hover:text-gold transition-colors" asChild>
                <a href="/kampanyalar">
                  Tümünü Gör
                </a>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kampanyalar
                .filter(k => !k.featured && k.status === 'active')
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((kampanya) => (
                  <Card key={kampanya.id} className="backdrop-blur-lg bg-opacity-80 bg-card border border-border rounded-2xl hover:shadow-xl transition-all duration-300 hover:border-gold">
                    <CardHeader>
                      <div className="relative aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                        <Image
                          src={kampanya.image}
                          alt={kampanya.title}
                          fill
                          className="object-cover z-0"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{kampanya.title}</CardTitle>
                        {(kampanya.badgeLabel || kampanya.featured) && (
                          <Badge className="bg-gold text-background text-xs z-10">{kampanya.badgeLabel ?? 'ÖNE ÇIKAN'}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4">{kampanya.description}</p>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Bonus Miktarı:</span>
                          <span className="font-semibold text-gold">{kampanya.bonusAmount}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {kampanya.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button className="w-full gold-gradient neon-button hover:scale-105 transition-transform" onClick={() => handleCampaignDetails(kampanya)}>
                        Detayları Gör
                      </Button>
                    </CardContent>
                  </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Telegram Sohbet Paneli */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <TelegramPanel groupName="Hokkabaz Telegram" groupLink={telegramUrl} members={15423} onlineBase={562} />
          </div>
        </section>

        {/* Güvenilir Siteler / Neden Hokkabaz Section */}
        <section className="py-16 bg-secondary-bg">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4 text-gold">Neden Hokkabaz?</h2>
            <p className="text-center text-muted-foreground mb-12">Sizi en iyi bonuslara ve güvenilir sitelere yönlendiriyoruz</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {guvenilirSitelerFeatures.map((feature, index) => (
                <Card key={index} className="bg-card border-border text-center">
                  <CardContent className="pt-8">
                    <feature.icon className="w-16 h-16 text-gold mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer kaldırıldı: tek bir global Footer kullanılacak */}

      {/* Campaign Detail Dialog */}
      <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Kampanya Detayları</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              {/* Campaign image in dialog */}
              <div className="relative w-full aspect-square overflow-hidden rounded-md border bg-muted">
                <Image
                  src={selectedCampaign.image}
                  alt={selectedCampaign.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 90vw, 560px"
                />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gold mb-2">
                  {selectedCampaign.title}
                </div>
                <div className="text-muted-foreground mb-2">{selectedCampaign.description}</div>
                <div className="text-2xl font-bold text-gold mb-4">
                  {selectedCampaign.bonusAmount}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Özellikler:</h4>
                {Array.isArray(selectedCampaign.highlights) && selectedCampaign.highlights.map((highlight: string, index: number) => (
                  <div key={index} className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-gold mr-2" />
                    {highlight}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Etiketler:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCampaign.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs border-gold text-gold">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Bu kampanyaya katılmak için siteye kayıt olmanız ve gerekli şartları sağlamanız gerekmektedir.
              </div>
              {selectedCampaign?.ctaUrl ? (
                <Button className="w-full gold-gradient neon-button" asChild>
                  <a href={selectedCampaign.ctaUrl} target="_blank" rel="noopener noreferrer">Kampanyaya Katıl</a>
                </Button>
              ) : (
                <Button className="w-full gold-gradient neon-button">Kampanyaya Katıl</Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bonus Detail Dialog */}
      <Dialog open={isBonusDialogOpen} onOpenChange={setIsBonusDialogOpen}>
        <DialogContent className="sm:max-w-[640px] p-0">
          <DialogHeader className="p-4">
            <DialogTitle>Bonus Detayı</DialogTitle>
          </DialogHeader>
          {selectedBonus && (
            <div className="flex max-h-[85vh] flex-col">
              <div className="overflow-y-auto p-4 space-y-4">
                {!!(selectedBonus as any)?.postImageUrl && (
                  <div className="relative w-full aspect-square overflow-hidden rounded-md border bg-muted">
                    <img src={(selectedBonus as any).postImageUrl} alt="Bonus Post Görseli" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="font-semibold">Özellikler:</h4>
                  {(Array.isArray((selectedBonus as any)?.features)
                    ? (selectedBonus as any).features
                    : ['Çevrim Şartsız', 'Anında Çekim']
                  ).map((feature: string, index: number) => (
                    <div key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-gold mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
                {(selectedBonus as any)?.validityText && (
                  <div className="text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {String((selectedBonus as any).validityText)}
                  </div>
                )}
                {!!(selectedBonus as any)?.description && (
                  <div className="text-sm text-muted-foreground">
                    {(selectedBonus as any).description}
                  </div>
                )}
              </div>
              {Boolean((selectedBonus as any)?.ctaUrl) && (
                <div className="p-4 border-t bg-background">
                  <a
                    href={String((selectedBonus as any).ctaUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full">Kampanyaya Katıl</Button>
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}