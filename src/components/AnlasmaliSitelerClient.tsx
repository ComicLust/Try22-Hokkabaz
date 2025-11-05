"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Instagram, Twitter, Youtube, Send, Award, Calendar, Check, ArrowRight, Info, Gift, AlertTriangle, ShieldCheck, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SeoArticle from "@/components/SeoArticle";
import { TopBrandTicker } from "@/components/top-brand-ticker/TopBrandTicker";

export default function AnlasmaliSitelerClient() {
  const [searchQuery, setSearchQuery] = useState("");

  type MarqueeLogo = { id: string; imageUrl: string; href?: string | null; order: number; isActive: boolean };
  const [marqueeLogos, setMarqueeLogos] = useState<MarqueeLogo[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/marquee-logos')
        const data = await res.json()
        setMarqueeLogos(Array.isArray(data) ? data.filter((d: MarqueeLogo) => d.isActive) : [])
      } catch {}
    })()
  }, [])

  // Masaüstü slider kaldırıldı; ilgili veri ve fetch işlemleri temizlendi.

  const marqueeItems = useMemo(() => {
    const reps = 12;
    if (!marqueeLogos.length) return []
    return Array.from({ length: reps }, (_, i) => marqueeLogos[i % marqueeLogos.length]);
  }, [marqueeLogos]);

  type PartnerSite = { id: string; name: string; slug: string; logoUrl?: string | null; siteUrl?: string | null; rating?: number | null; features?: any; isActive: boolean };
  const [partnerSites, setPartnerSites] = useState<PartnerSite[]>([])
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/partner-sites')
        const data = await res.json()
        const actives = Array.isArray(data) ? data.filter((d: PartnerSite) => d.isActive) : []
        setPartnerSites(actives)
      } catch {}
    })()
  }, [])
  const primaryBrandLogos = useMemo(() => {
    const sorted = [...partnerSites].sort((a, b) => ((a?.features?.order ?? 999) - (b?.features?.order ?? 999)))
    return sorted.map((s) => ({
      img: s.logoUrl ?? '/logo.svg',
      href: s.siteUrl ?? '#',
      badge: (typeof s.features?.badge === 'string' && s.features?.badge?.trim()) ? String(s.features.badge).trim() : undefined,
    }))
  }, [partnerSites])
  const featuredBrandLogos = useMemo(() => {
    const hero = [...partnerSites]
      .filter((s) => s.isActive && s.features?.hero)
      .sort((a, b) => ((a.features?.heroOrder ?? 999) - (b.features?.heroOrder ?? 999)))
      .slice(0, 3)
    const list = hero.length === 3
      ? hero
      : [...partnerSites]
          .filter((s) => s.isActive)
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 3)
    return list.map((s) => ({
      img: s.logoUrl ?? '/logo.svg',
      href: s.siteUrl ?? '#',
      badge: (typeof s.features?.badge === 'string' && s.features?.badge?.trim()) ? String(s.features.badge).trim() : undefined,
    }))
  }, [partnerSites])
  const secondaryBrandLogos = useMemo(() => {
    const sorted = [...partnerSites].sort((a, b) => ((a?.features?.order ?? 999) - (b?.features?.order ?? 999)))
    const rest = sorted.slice(3)
    return rest.map((s) => ({
      img: s.logoUrl ?? '/logo.svg',
      href: s.siteUrl ?? '#',
      badge: (typeof s.features?.badge === 'string' && s.features?.badge?.trim()) ? String(s.features.badge).trim() : undefined,
    }))
  }, [partnerSites])

  type Bonus = {
    id: string;
    title: string;
    imageUrl?: string;
    postImageUrl?: string;
    amount?: number;
    bonusType?: string;
    shortDescription?: string;
    ctaUrl?: string;
  };
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [selectedBonus, setSelectedBonus] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/bonuses?active=true&featured=true");
        const data = await res.json();
        setBonuses((data || []).slice(0, 4));
      } catch (e) {}
    })();
  }, []);

  // Mini istatistikler (Hero için)
  const totalSites = useMemo(() => partnerSites.length, [partnerSites])
  const highRatedCount = useMemo(() => partnerSites.filter((s)=> (s.rating ?? 0) >= 4).length, [partnerSites])
  const badgedCount = useMemo(() => partnerSites.filter((s)=> Boolean(typeof s.features?.badge === 'string' && String(s.features?.badge).trim())).length, [partnerSites])
  const externalUrlCount = useMemo(() => partnerSites.filter((s)=> !!s.siteUrl && /^(https?:\/\/|\/\/)/i.test(String(s.siteUrl))).length, [partnerSites])

  const handleBonusDetails = (bonus: any) => {
    setSelectedBonus(bonus)
    setIsDialogOpen(true)
  }

  const formatValidity = (b: any) => {
    const vt = (b as any).validityText
    const sd = (b as any).startDate
    const ed = (b as any).endDate
    if (vt) return String(vt)
    if (sd && ed) {
      return `${new Date(sd).toLocaleDateString('tr-TR')} - ${new Date(ed).toLocaleDateString('tr-TR')}`
    }
    if (sd) return `Başlangıç: ${new Date(sd).toLocaleDateString('tr-TR')}`
    if (ed) return `Bitiş: ${new Date(ed).toLocaleDateString('tr-TR')}`
    return ''
  }

  const isExpired = (b: any) => {
    const ed = (b as any).endDate
    if (!ed) return false
    try {
      return new Date(ed).getTime() < Date.now()
    } catch {
      return false
    }
  }

  const filteredPrimary = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const list = q
      ? partnerSites.filter((s) => (s.name?.toLowerCase().includes(q) || s.slug?.toLowerCase().includes(q)))
      : partnerSites
    return list.map((s) => ({
      img: s.logoUrl ?? '/logo.svg',
      href: s.siteUrl ?? '#',
      badge: (typeof s.features?.badge === 'string' && s.features?.badge?.trim()) ? String(s.features.badge).trim() : undefined,
    }))
  }, [partnerSites, searchQuery])



  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const isExternalUrl = (url?: string | null) => !!url && /^(https?:\/\/|\/\/)/i.test(url);

  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/guvenilir-bahis-siteleri-listesi" />
      {/* Üstte tam genişlikte kayan logolar (Ana sayfa ile aynı stil) */}
      <TopBrandTicker items={marqueeItems.map((m)=>({ imageUrl: m.imageUrl, href: m.href ?? undefined }))} />

      <main className="container mx-auto px-4 py-8 space-y-16 md:pl-72">

        {/* Hero bölümünü ekliyoruz */}
        <motion.section className="mb-6" initial="initial" animate="animate" variants={fadeInUp}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-bold text-gold flex items-center gap-2">
                <ShieldCheck className="w-6 h-6" /> Güvenilir Bahis Siteleri Listesi
              </h1>
              <p className="mt-1 text-sm md:text-base text-muted-foreground">
                Güvenilir ve aktif bahis markalarını tek yerde keşfedin. Arama ve filtrelerle hızlıca istediğiniz siteye ulaşın; puan ve rozet bilgileriyle karşılaştırın.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild className="gap-1.5">
                  <a href="#site-listesi">Siteleri Keşfet <ArrowRight className="w-4 h-4" /></a>
                </Button>
                <Button variant="outline" className="gap-1.5" asChild>
                  <a href="/yorumlar">Yorumlara Git <ArrowRight className="w-4 h-4" aria-hidden /></a>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="w-4 h-4 text-gold" aria-hidden /> Toplam Site
                </div>
                <div className="mt-1 text-xl font-semibold">{totalSites}</div>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-gold" aria-hidden /> Yüksek Puanlı
                </div>
                <div className="mt-1 text-xl font-semibold">{highRatedCount}</div>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="w-4 h-4 text-gold" aria-hidden /> Rozetli Marka
                </div>
                <div className="mt-1 text-xl font-semibold">{badgedCount}</div>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Link className="w-4 h-4 text-gold" aria-hidden /> Resmi Site Linki
                </div>
                <div className="mt-1 text-xl font-semibold">{externalUrlCount}</div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Masaüstü slider bölümü kaldırıldı */}

        <motion.section id="site-listesi" initial="initial" animate="animate" variants={fadeInUp}>
          <div className="mb-6 flex items-center gap-3">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Bahis sitesi ara…" className="pl-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 w-full justify-items-center">
            {filteredPrimary.map((b, i) => (
              <a key={`p-${i}`} href={b.href} target="_blank" rel="noopener noreferrer" className="relative group rounded-xl border border-border bg-gradient-to-br from-[#111] to-[#1a1a1a] p-5 text-center hover:border-gold hover:shadow-[0_0_22px_rgba(255,215,0,0.25)] transition-all w-full">
                {b.badge && (
                  <span className="absolute top-2 right-2 text-[10px] md:text-xs px-2 py-1 rounded-full bg-gold/20 text-gold border border-gold flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" aria-hidden /> {b.badge}</span>
                )}
                <img src={b.img} alt="logo" className="w-full max-w-[220px] h-[73px] mx-auto opacity-90 group-hover:opacity-100 transition-opacity object-contain" />
              </a>
            ))}
          </div>
        </motion.section>

        <motion.section initial="initial" animate="animate" variants={fadeInUp}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 place-items-center">
            {featuredBrandLogos.map((b, i) => (
              <Card key={`f-${i}`} className="relative w-full md:w-[90%] bg-secondary-bg border-border text-center hover:border-gold transition-colors">
                {b.badge && (
                  <span className="absolute top-3 right-3 text-[10px] md:text-xs px-2 py-1 rounded-full bg-gold/20 text-gold border border-gold flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" aria-hidden /> {b.badge}</span>
                )}
                <CardContent className="py-10">
                  <img src={b.img} alt="featured" className="w-[220px] h-[73px] mx-auto object-contain" />
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        <motion.section initial="initial" animate="animate" variants={fadeInUp}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gold">Sana özel seçilen bonuslar</h2>
            <Button variant="outline" className="hover:border-gold hover:text-gold flex items-center gap-1.5" asChild>
              <a href="/bonuslar">Tüm Bonuslar <ArrowRight className="w-4 h-4" aria-hidden /></a>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bonuses.map((bonus) => (
              <Card key={bonus.id} className={`backdrop-blur-lg bg-opacity-80 bg-card border border-border rounded-2xl hover:shadow-xl transition-all duration-300 hover:border-gold ${isExpired(bonus) ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="mx-auto mb-4 w-full max-w-[240px] h-[72px] sm:h-[80px] bg-muted flex items-center justify-center border rounded-md p-2">
                      {(bonus as any).imageUrl ? (
                        <img src={(bonus as any).imageUrl} alt={String((bonus as any).title || 'Logo')} className="h-full w-auto object-contain" />
                      ) : (
                        <Award className="w-10 h-10 text-gold" />
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg text-center">{bonus.title}</CardTitle>
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
                      <Badge key={index} variant="outline" className="text-xs flex items-center gap-1.5">
                        {badge === 'Süresi Doldu' ? (
                          <AlertTriangle className="w-3 h-3" aria-hidden />
                        ) : (
                          <Gift className="w-3 h-3" aria-hidden />
                        )}
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

                  <Button variant="outline" className="w-full flex items-center justify-center gap-1.5" onClick={() => handleBonusDetails(bonus)}>
                    <Info className="w-4 h-4" aria-hidden /> Detayları Gör <ArrowRight className="w-4 h-4" aria-hidden />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[640px] p-0">
            <div className="flex max-h-[85vh] flex-col">
              <DialogHeader className="p-4">
                <DialogTitle>Bonus Detayı</DialogTitle>
              </DialogHeader>
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
                {selectedBonus && formatValidity(selectedBonus) && (
                  <div className="text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {formatValidity(selectedBonus)}
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
                    target={isExternalUrl((selectedBonus as any).ctaUrl) ? "_blank" : undefined}
                    rel={isExternalUrl((selectedBonus as any).ctaUrl) ? "noopener noreferrer" : undefined}
                    className="block"
                  >
                    <Button className="w-full flex items-center justify-center gap-1.5 flex-wrap text-xs md:text-sm text-center leading-tight"> <Gift className="w-4 h-4" aria-hidden /> Kampanyaya Katıl <ArrowRight className="w-4 h-4" aria-hidden />
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Sosyal bar footer’da zaten mevcut; duplicate alan kaldırıldı */}

      </main>

      <SeoArticle slug="guvenilir-bahis-siteleri-listesi" />
      <Footer />
    </div>
  );
}