"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, ArrowRight, Info, Gift, Tag, Zap, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SeoArticle from '@/components/SeoArticle';
import { TopBrandTicker } from '@/components/top-brand-ticker/TopBrandTicker';

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
  type: string;
  status: string;
  image: string;
  bonusAmount: string;
  featured: boolean;
  priority: number;
  badgeLabel?: string | null;
  ctaUrl?: string | null;
};

export default function KampanyalarClient() {
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [kampanyalar, setKampanyalar] = useState<UiCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [seoTitle, setSeoTitle] = useState<string>('Kampanyalar');

  // Marquee (kayan logolar)
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

  // SEO başlığını çek
  useEffect(() => {
    const loadSeo = async () => {
      try {
        const res = await fetch('/api/seo?page=/kampanyalar');
        const data = await res.json();
        if (data?.title) {
          setSeoTitle(String(data.title));
        }
      } catch {}
    };
    loadSeo();
  }, []);

  // Kampanyaları API'den çek
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/campaigns');
        const data: ApiCampaign[] = await res.json();
        const now = Date.now();
        const mapped: UiCampaign[] = data.map((c) => {
          const start = c.startDate ? Date.parse(c.startDate) : undefined;
          const end = c.endDate ? Date.parse(c.endDate) : undefined;
          // İstek: Admin'de aktif olanların tamamı kamu listesinde görünsün.
          // Bu nedenle aktiflik durumunu yalnızca `isActive` alanına göre belirliyoruz.
          const status = c.isActive ? 'active' : (start && start > now ? 'upcoming' : 'ended');
          const featured = !!c.isFeatured;
          const bonusDisplay = (c.bonusText && c.bonusText.trim().length > 0)
            ? c.bonusText
            : (c.bonusAmount != null ? String(c.bonusAmount) : '');
          return {
            id: c.id,
            title: c.title,
            description: c.description ?? '',
            tags: Array.isArray(c.tags) ? c.tags! : [],
            type: 'genel',
            status,
            image: c.imageUrl ?? '/api/placeholder/400/225',
            bonusAmount: bonusDisplay,
            featured,
            priority: c.priority ?? 0,
            badgeLabel: c.badgeLabel ?? null,
            ctaUrl: c.ctaUrl ?? null,
          };
        });
        setKampanyalar(mapped);
      } catch (e) {
        // sessiz geç; sayfa yine çalışır
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Seçilen kampanya detaylarını aç
  const handleCampaignDetails = (campaign: any) => {
    setSelectedCampaign(campaign);
    setIsDialogOpen(true);
  };

  const featuredKampanyalar = kampanyalar
    .filter(k => k.featured)
    .sort((a, b) => b.priority - a.priority);

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

  // Hero istatistikleri
  const totalCount = useMemo(() => kampanyalar.length, [kampanyalar])
  const activeCount = useMemo(() => kampanyalar.filter(k => k.status === 'active').length, [kampanyalar])
  // Yaklaşan yerine öne çıkan sayısını göstereceğiz
  const featuredCount = useMemo(() => kampanyalar.filter(k => k.featured).length, [kampanyalar])
  const endedCount = useMemo(() => kampanyalar.filter(k => k.status === 'ended').length, [kampanyalar])

  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/kampanyalar" />

      {marqueeItems.length > 0 && (
        <TopBrandTicker
          items={marqueeItems.map((m) => ({ imageUrl: m.imageUrl, href: m.href }))}
          className="md:pl-72"
        />
      )}

      <main className="container mx-auto px-4 py-8 md:pl-72">
        {/* Hero */}
        <motion.section className="mb-6" initial="initial" animate="animate" variants={fadeInUp}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-bold text-gold flex items-center gap-2">
                <Star className="w-6 h-6" /> Kampanyalar
              </h1>
              <p className="mt-1 text-sm md:text-base text-muted-foreground">
                Güncel kampanya fırsatlarını keşfet, şartlarını karşılaştır ve hızlıca detaylara ulaş.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild className="gap-1.5">
                  <a href="#aktif-kampanyalar">Kampanyaları Keşfet <ArrowRight className="w-4 h-4" /></a>
                </Button>
                <Button variant="outline" className="gap-1.5" asChild>
                  <a href="#one-cikan-kampanyalar">Öne Çıkanlar <ArrowRight className="w-4 h-4" aria-hidden /></a>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-gold" aria-hidden /> Toplam
                </div>
                <div className="mt-1 text-xl font-semibold">{totalCount}</div>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-gold" aria-hidden /> Aktif
                </div>
                <div className="mt-1 text-xl font-semibold">{activeCount}</div>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-gold" aria-hidden /> Öne Çıkan
                </div>
                <div className="mt-1 text-xl font-semibold">{featuredCount}</div>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="w-4 h-4 text-gold" aria-hidden /> Biten
                </div>
                <div className="mt-1 text-xl font-semibold">{endedCount}</div>
              </div>
            </div>
          </div>
        </motion.section>
        {/* SEO başlığı ekran tekrarı olmasın diye gizli */}
        <h1 className="sr-only">{seoTitle}</h1>

        {featuredKampanyalar.length > 0 && (
          <motion.section 
            id="one-cikan-kampanyalar"
            className="mb-12"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <h2 className="text-2xl font-bold text-gold mb-6 flex items-center">
              <Star className="w-6 h-6 mr-2" />
              Öne Çıkan Kampanyalar
            </h2>
            <div className="content-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredKampanyalar.map((kampanya) => (
                <motion.div key={kampanya.id} variants={fadeInUp}>
                  <Card className="relative overflow-hidden md:backdrop-blur-sm bg-opacity-80 bg-card border-2 border-gold rounded-2xl hover:shadow-lg transition-colors duration-200 shadow-smooth">
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-gold text-background flex items-center gap-1.5"><Star className="w-3 h-3" aria-hidden /> {kampanya.badgeLabel ?? 'ÖNE ÇIKAN'}</Badge>
                    </div>
                    <CardHeader>
                      <div className="relative aspect-square bg-muted rounded-lg mb-4 overflow-hidden">
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
                      <p className="text-muted-foreground text-sm mb-4 overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{kampanya.description}</p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Bonus Miktarı:</span>
                          <span className="font-semibold text-gold">{kampanya.bonusAmount}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {kampanya.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1.5">
                            <Tag className="w-3 h-3" aria-hidden /> {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button className="w-full mt-4 gold-gradient neon-button hover:scale-105 transition-transform flex items-center justify-center gap-1.5 flex-wrap text-xs md:text-sm text-center leading-tight" onClick={() => handleCampaignDetails(kampanya)}>
                        <Info className="w-4 h-4" aria-hidden /> Detayları Gör <ArrowRight className="w-4 h-4" aria-hidden />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {isLoading && (
          <motion.section className="mb-12" initial="initial" animate="animate" variants={fadeInUp}>
            <h2 className="text-2xl font-bold text-gold mb-6">Kampanyalar yükleniyor…</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="md:backdrop-blur-sm bg-opacity-80 bg-card border border-border rounded-2xl">
                  <CardHeader>
                    <div className="relative aspect-square rounded-lg mb-4 overflow-hidden border bg-muted">
                      <Skeleton className="h-full w-full" />
                    </div>
                    <Skeleton className="h-5 w-40" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        <motion.section 
          id="aktif-kampanyalar"
          className="mb-12"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <h2 className="text-2xl font-bold text-gold mb-6">Aktif Kampanyalar</h2>
          <motion.div 
            className="content-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {kampanyalar
              .filter(k => k.status === 'active' && !k.featured)
              .sort((a, b) => b.priority - a.priority)
              .map((kampanya) => (
              <motion.div key={kampanya.id} variants={fadeInUp}>
                <Card className="md:backdrop-blur-sm bg-opacity-80 bg-card border border-border rounded-2xl hover:shadow-lg transition-colors duration-200 hover:border-gold shadow-smooth">
                  <CardHeader>
                    <div className="relative aspect-square bg-muted rounded-lg mb-4 overflow-hidden">
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
                    <p className="text-muted-foreground text-sm mb-4 overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{kampanya.description}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Bonus Miktarı:</span>
                        <span className="font-semibold text-gold">{kampanya.bonusAmount}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {kampanya.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1.5">
                          <Tag className="w-3 h-3" aria-hidden /> {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button className="w-full gold-gradient neon-button hover:scale-105 transition-transform flex items-center justify-center gap-1.5" onClick={() => handleCampaignDetails(kampanya)}>
                      <Info className="w-4 h-4" aria-hidden /> Detayları Gör <ArrowRight className="w-4 h-4" aria-hidden />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {!isLoading && kampanyalar.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Kampanya bulunamadı</h3>
            <p className="text-muted-foreground">Henüz kampanya eklenmemiş.</p>
          </motion.div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[640px] p-0">
          <div className="flex max-h-[85vh] flex-col">
            <DialogHeader className="p-4">
              <DialogTitle>Kampanya Detayları</DialogTitle>
            </DialogHeader>
            {selectedCampaign && (
              <div className="overflow-y-auto p-4 space-y-4">
                <div className="relative w-full aspect-square overflow-hidden rounded-md border bg-muted">
                  <Image src={selectedCampaign.image} alt={selectedCampaign.title} fill className="object-contain" sizes="(max-width: 768px) 90vw, 560px" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold mb-2">{selectedCampaign.title}</div>
                  <div className="text-muted-foreground mb-2 whitespace-pre-line">{selectedCampaign.description}</div>
                  <div className="text-2xl font-bold text-gold mb-4">{selectedCampaign.bonusAmount}</div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Etiketler:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCampaign.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs border-gold text-gold flex items-center gap-1.5"><Tag className="w-3 h-3" aria-hidden /> {tag}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Bu kampanyaya katılmak için siteye kayıt olmanız ve gerekli şartları sağlamanız gerekmektedir.
                </div>
              </div>
            )}
            {selectedCampaign?.ctaUrl ? (
              <div className="p-4 border-t bg-background">
                <Button className="w-full flex items-center justify-center gap-1.5 flex-wrap text-xs md:text-sm text-center leading-tight" asChild>
                  <a href={selectedCampaign.ctaUrl} target="_blank" rel="noopener noreferrer"><Gift className="w-4 h-4" aria-hidden /> Kampanyaya Katıl <ArrowRight className="w-4 h-4" aria-hidden /></a>
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
      <SeoArticle slug="kampanyalar" />
      <Footer />
    </div>
  );
}
