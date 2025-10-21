"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search, Award, Calendar, Check, Star, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

type Bonus = {
  id: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  bonusType?: string | null;
  gameCategory?: string | null;
  amount?: number | null;
  imageUrl?: string | null;
  postImageUrl?: string | null;
  ctaUrl?: string | null;
  badges?: string[] | null;
  validityText?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  features?: string[] | null;
  isActive?: boolean | null;
  isFeatured?: boolean | null;
};

export default function BonuslarClient() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [bonusType, setBonusType] = useState("all");
  const [bonusAmount, setBonusAmount] = useState("all");
  const [siteCategory, setSiteCategory] = useState("all");
  const [selectedBonus, setSelectedBonus] = useState<Bonus | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<{ img: string; label: string } | null>(null);

  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBonuses = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/bonuses?active=true', { cache: 'no-store' });
        const data = await res.json();
        setBonuses(Array.isArray(data) ? data : []);
      } catch (e) {
        setError('Bonuslar yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    fetchBonuses();
  }, []);

  // URL parametresinden başlangıç filtresini uygula (ör. /bonuslar?type=Deneme%20Bonusu)
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam) {
      setBonusType(typeParam);
    }
  }, [searchParams]);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const isExpired = (b: Bonus) => {
    if (!b?.endDate) return false;
    try {
      return new Date(b.endDate).getTime() < Date.now();
    } catch {
      return false;
    }
  };

  const formatValidity = (b: Bonus) => {
    if (b.validityText) return String(b.validityText);
    const sd = b.startDate, ed = b.endDate;
    if (sd && ed) return `${new Date(sd).toLocaleDateString('tr-TR')} - ${new Date(ed).toLocaleDateString('tr-TR')}`;
    if (sd) return `Başlangıç: ${new Date(sd).toLocaleDateString('tr-TR')}`;
    if (ed) return `Bitiş: ${new Date(ed).toLocaleDateString('tr-TR')}`;
    return '';
  };

  const filtered = useMemo(() => {
    let list = bonuses;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(b => (b.title?.toLowerCase().includes(q) || b.slug?.toLowerCase().includes(q)));
    }
    if (bonusType !== 'all') list = list.filter(b => b.bonusType === bonusType);
    if (siteCategory !== 'all') list = list.filter(b => b.gameCategory === siteCategory);
    if (bonusAmount !== 'all') {
      list = list.filter(b => {
        const amt = Number(b.amount ?? 0);
        if (bonusAmount === '0-100') return amt <= 100;
        if (bonusAmount === '100-200') return amt > 100 && amt <= 200;
        if (bonusAmount === '200+') return amt > 200;
        return true;
      });
    }
    return list;
  }, [bonuses, searchQuery, bonusType, siteCategory, bonusAmount]);

  const featuredBonuses = useMemo(() => filtered.filter(b => b.isFeatured), [filtered]);
  const regularBonuses = useMemo(() => filtered.filter(b => !b.isFeatured), [filtered]);

  // Instagram story tarzı üst şerit için öğeler
  const storyItems = useMemo(() => {
    const base = featuredBonuses.length ? featuredBonuses : filtered
    const items = base.slice(0, 12).map((b) => ({
      id: b.id,
      label: String(b.title ?? ""),
      img: b.postImageUrl || b.imageUrl || "/logo.svg",
    }))
    const MIN_ITEMS = 10
    if (items.length < MIN_ITEMS) {
      const placeholders = Array.from({ length: MIN_ITEMS - items.length }).map((_, i) => ({
        id: `demo-${i}`,
        label: "Demo",
        img: "/logo.svg",
      }))
      return [...items, ...placeholders]
    }
    return items
  }, [featuredBonuses, filtered])

  const storyRef = useRef<HTMLDivElement>(null);
  const scrollLeft = () => storyRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  const scrollRight = () => storyRef.current?.scrollBy({ left: 320, behavior: "smooth" });

  // Drag-to-scroll state and handlers for story rail
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);

  const onPointerDown = (e: any) => {
    const target = e.currentTarget as HTMLElement;
    if (typeof target.setPointerCapture === "function") {
      try { target.setPointerCapture(e.pointerId); } catch {}
    }
    setIsDragging(true);
    setDragStartX(e.clientX);
    setScrollStart(storyRef.current?.scrollLeft ?? 0);
  };

  const onPointerMove = (e: any) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    if (storyRef.current) {
      storyRef.current.scrollLeft = scrollStart - dx;
    }
  };

  const onPointerUp = (e: any) => {
    const target = e.currentTarget as HTMLElement;
    if (typeof target.releasePointerCapture === "function") {
      try { target.releasePointerCapture(e.pointerId); } catch {}
    }
    setIsDragging(false);
  };

  const onPointerLeave = () => {
    setIsDragging(false);
  };
  const openDetails = (b: Bonus) => { setSelectedBonus(b); setIsDialogOpen(true); };

  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/bonuslar" />

      <main className="container mx-auto px-4 py-8 md:pl-72">
        {/* Arama + Filtreler */}
        <motion.section
          className="mb-8 p-6 bg-card rounded-2xl border border-border"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Bonus veya site ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <Select value={bonusType} onValueChange={setBonusType}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Bonus Türü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="Deneme Bonusu">Deneme Bonusu</SelectItem>
                <SelectItem value="Hoşgeldin Bonusu">Hoşgeldin Bonusu</SelectItem>
                <SelectItem value="Yatırım Bonusu">Yatırım Bonusu</SelectItem>
                <SelectItem value="Kayıp Bonusu">Kayıp Bonusu</SelectItem>
              </SelectContent>
            </Select>
            <Select value={bonusAmount} onValueChange={setBonusAmount}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Tutar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="0-100">0-100 TL</SelectItem>
                <SelectItem value="100-200">100-200 TL</SelectItem>
                <SelectItem value="200+">200+ TL</SelectItem>
              </SelectContent>
            </Select>
            <Select value={siteCategory} onValueChange={setSiteCategory}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="Spor">Spor</SelectItem>
                <SelectItem value="Casino">Casino</SelectItem>
                <SelectItem value="Slot">Slot</SelectItem>
                <SelectItem value="Poker">Poker</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.section>

        {/* Story rail: instagram tarzı, öne çıkanların üstünde ve sticky */}
        <motion.section
          // Story rail container – removed sticky so it stays in the normal flow
          className="mb-6 px-0 py-2 z-30"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="relative">
            <button
              onClick={scrollLeft}
              aria-label="Sola kaydır"
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-black/50 hover:bg-black/60 text-white shadow-lg backdrop-blur-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div ref={storyRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerLeave}
              className="overflow-x-auto overflow-y-visible scroll-smooth pl-10 pr-10 py-2 touch-pan-x select-none cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-5">
                {storyItems.map((item) => (
                  <a
                    key={item.id}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveStory({ img: item.img, label: item.label });
                      setIsStoryOpen(true);
                    }}
                    className="group flex flex-col items-center"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-gold ring-2 ring-gold/40 ring-offset-2 ring-offset-background overflow-hidden shadow-sm group-hover:ring-gold/60">
                      <img src={item.img} alt={item.label} className="w-full h-full object-cover" draggable={false} />
                    </div>
                    <div className="mt-2 w-20 sm:w-24 text-center text-xs text-foreground/80 truncate">{item.label}</div>
                  </a>
                ))}
              </div>
            </div>

            <button
              onClick={scrollRight}
              aria-label="Sağa kaydır"
              className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-black/50 hover:bg-black/60 text-white shadow-lg backdrop-blur-md"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="pointer-events-none absolute left-0 top-0 h-full w-10 sm:w-12 bg-gradient-to-r from-background to-transparent"></div>
            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 sm:w-12 bg-gradient-to-l from-background to-transparent"></div>
          </div>
        </motion.section>

        <Dialog open={isStoryOpen} onOpenChange={setIsStoryOpen}>
          <DialogContent className="max-w-[720px] p-0 bg-black">
            <DialogHeader className="sr-only">
              <DialogTitle>Story Görseli</DialogTitle>
            </DialogHeader>
            <div className="relative w-full aspect-[9/16] sm:aspect-[9/16] bg-black">
              {activeStory?.img && (
                <img src={activeStory.img} alt={activeStory.label} className="w-full h-full object-contain" draggable={false} />
              )}
            </div>
          </DialogContent>
        </Dialog>



        {/* Öne çıkanlar */}
        {featuredBonuses.length > 0 && (
          <motion.section className="mb-12" initial="initial" animate="animate" variants={fadeInUp}>
            <h2 className="text-2xl font-bold text-gold mb-6 flex items-center">
              <Star className="w-6 h-6 mr-2" />
              Öne Çıkan Bonuslar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBonuses.map((bonus) => (
                <motion.div key={bonus.id} variants={fadeInUp}>
                  <Card className={`relative overflow-hidden backdrop-blur-lg bg-opacity-80 bg-card border-2 border-gold rounded-2xl hover:shadow-xl transition-all duration-300 ${isExpired(bonus) ? 'opacity-60' : ''}`}>
                    <div className="absolute top-4 right-4">
                      {isExpired(bonus) && (
                        <Badge variant="destructive" className="uppercase tracking-wide shadow-md">Süresi Doldu</Badge>
                      )}
                    </div>
                    <CardHeader>
                      <div className="w-28 h-16 mx-auto mb-4 overflow-hidden bg-muted flex items-center justify-center border">
                        {bonus.imageUrl ? (
                          <img src={bonus.imageUrl} alt={String(bonus.title || 'Logo')} className="w-full h-full object-contain" />
                        ) : (
                          <Award className="w-10 h-10 text-gold" />
                        )}
                      </div>
                      <CardTitle className="text-xl text-center">{bonus.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gold text-center mb-2">{Number(bonus.amount ?? 0)} TL</div>
                      {(bonus.shortDescription || bonus.description) && (
                        <div className="text-muted-foreground text-sm text-center mb-4">
                          {String(bonus.shortDescription || bonus.description)}
                        </div>
                      )}
                      <div className="space-y-2 mb-4">
                        {(Array.isArray(bonus.features) ? bonus.features : ['Çevrim Şartsız','7/24 Destek']).map((f, i) => (
                          <div key={i} className="flex items-center justify-center text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-gold mr-2" /> {f}
                          </div>
                        ))}
                      </div>
                      {!!formatValidity(bonus) && (
                        <div className="text-xs text-muted-foreground text-center mb-4">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatValidity(bonus)}
                        </div>
                      )}
                      <Button variant="outline" className="w-full" onClick={() => openDetails(bonus)}>Detayları Gör</Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Tüm bonuslar */}
        <motion.section initial="initial" animate="animate" variants={fadeInUp}>
          {loading && (
            <div className="text-center text-muted-foreground py-6">Yükleniyor…</div>
          )}
          {error && (
            <div className="text-center text-red-500 py-6">{error}</div>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularBonuses.map((bonus) => (
                <Card key={bonus.id} className={`relative overflow-hidden backdrop-blur-lg bg-opacity-80 bg-card border border-border rounded-2xl hover:shadow-xl transition-all duration-300 ${isExpired(bonus) ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <div className="w-24 h-14 mx-auto mb-4 overflow-hidden bg-muted flex items-center justify-center border">
                      {bonus.imageUrl ? (
                        <img src={bonus.imageUrl} alt={String(bonus.title || 'Logo')} className="w-full h-full object-contain" />
                      ) : (
                        <Award className="w-8 h-8 text-gold" />
                      )}
                    </div>
                    <CardTitle className="text-lg text-center">{bonus.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gold text-center mb-2">{Number(bonus.amount ?? 0)} TL</div>
                    {(bonus.shortDescription || bonus.description) && (
                      <div className="text-muted-foreground text-sm text-center mb-4">
                        {String(bonus.shortDescription || bonus.description)}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      {(Array.isArray(bonus.badges) ? bonus.badges! : [])
                        .concat(isExpired(bonus) ? ['Süresi Doldu'] : [])
                        .map((badge, i) => {
                          const isExpiredBadge = String(badge).toLowerCase() === 'süresi doldu';
                          return (
                            <Badge
                              key={i}
                              variant={isExpiredBadge ? 'destructive' : 'outline'}
                              className={`text-xs ${isExpiredBadge ? 'uppercase tracking-wide shadow-md' : ''}`}
                            >
                              {badge}
                            </Badge>
                          );
                        })}
                    </div>
                    {!!formatValidity(bonus) && (
                      <div className="text-xs text-muted-foreground text-center mb-4">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatValidity(bonus)}
                      </div>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => openDetails(bonus)}>Detayları Gör</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.section>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[640px] p-0">
            <div className="flex max-h-[85vh] flex-col">
              <DialogHeader className="p-4">
                <DialogTitle>Bonus Detayı</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto p-4 space-y-4">
                {!!selectedBonus?.postImageUrl && (
                  <div className="relative w-full aspect-square overflow-hidden rounded-md border bg-muted mb-4">
                    <Image
                      src={selectedBonus.postImageUrl}
                      alt="Bonus Post Görseli"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 90vw, 560px"
                      draggable={false}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="font-semibold">Özellikler:</h4>
                  {(Array.isArray(selectedBonus?.features) ? selectedBonus!.features! : ['Çevrim Şartsız', 'Anında Çekim']).map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-gold mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
                {!!selectedBonus && !!formatValidity(selectedBonus) && (
                  <div className="text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {formatValidity(selectedBonus)}
                  </div>
                )}
                {!!selectedBonus?.description && (
                  <div className="text-sm text-muted-foreground">
                    {selectedBonus.description}
                  </div>
                )}
              </div>
              {!!selectedBonus?.ctaUrl && (
                <div className="p-4 border-t bg-background">
                  <Button className="w-full" asChild>
                    <a href={selectedBonus.ctaUrl} target="_blank" rel="noopener noreferrer">Kampanyaya Katıl</a>
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </main>

      <Footer />
    </div>
  );
}