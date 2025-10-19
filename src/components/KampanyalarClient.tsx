"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
  badgeLabel?: string | null;
  ctaUrl?: string | null;
};

export default function KampanyalarClient() {
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [kampanyalar, setKampanyalar] = useState<UiCampaign[]>([]);
  const [seoTitle, setSeoTitle] = useState<string>('Kampanyalar');

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
            type: 'genel',
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
        // sessiz geç; sayfa yine çalışır
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
    .sort((a, b) => {
      const pa = Number(a.bonusAmount) || 0
      const pb = Number(b.bonusAmount) || 0
      if (pb !== pa) return pb - pa
      return a.title.localeCompare(b.title)
    });

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

  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/kampanyalar" />

      <main className="container mx-auto px-4 py-8 md:pl-72">
        <h1 className="text-3xl font-bold mb-6">{seoTitle}</h1>

        {featuredKampanyalar.length > 0 && (
          <motion.section 
            className="mb-12"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <h2 className="text-2xl font-bold text-gold mb-6 flex items-center">
              <Star className="w-6 h-6 mr-2" />
              Öne Çıkan Kampanyalar
            </h2>
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
          </motion.section>
        )}

        <motion.section 
          className="mb-12"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <h2 className="text-2xl font-bold text-gold mb-6">Aktif Kampanyalar</h2>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {kampanyalar
              .filter(k => !k.featured && k.status === 'active')
              .sort((a, b) => a.title.localeCompare(b.title))
              .map((kampanya) => (
              <motion.div key={kampanya.id} variants={fadeInUp}>
                <Card className="backdrop-blur-lg bg-opacity-80 bg-card border border-border rounded-2xl hover:shadow-xl transition-all duration-300 hover:border-gold">
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
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {kampanyalar.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Kampanya Bulunamadı</h3>
            <p className="text-muted-foreground">
              Henüz kampanya eklenmemiş.
            </p>
          </motion.div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Kampanya Detayları</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
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
      <Footer />
    </div>
  );
}