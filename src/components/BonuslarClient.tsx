"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search, Award, Calendar, Check, Star, ChevronLeft, ChevronRight, XCircle, ArrowRight, Info, Gift, AlertTriangle } from "lucide-react";
import Image from "next/image";
import SeoArticle from "@/components/SeoArticle";
import { slugifyTr } from "@/lib/slugify";
import { TopBrandTicker } from "@/components/top-brand-ticker/TopBrandTicker";
import { Skeleton } from "@/components/ui/skeleton";

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

type StorySlide = {
  id: string;
  title?: string | null;
  mobileImageUrl?: string | null;
  ctaUrl?: string | null;
  isActive?: boolean | null;
  order?: number | null;
};

export default function BonuslarClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [bonusType, setBonusType] = useState("all");
  const [bonusAmount, setBonusAmount] = useState("all");
  const [siteCategory, setSiteCategory] = useState("all");
  const [selectedBonus, setSelectedBonus] = useState<Bonus | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<{ img: string; label: string; cta?: string } | null>(null);

  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [stories, setStories] = useState<StorySlide[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  // Story slides (Carousel) çek
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await fetch('/api/carousel', { cache: 'no-store' });
        const data = await res.json();
        const items: StorySlide[] = (Array.isArray(data) ? data : []).filter((s: any) => s.isActive !== false);
        setStories(items);
      } catch (e) {
        // sessiz geç
      }
    };
    fetchStories();
  }, []);

  // URL parametresinden başlangıç filtresini uygula ve slug'ı etikete çevir
  // URL parametresinden başlangıç filtresini uygula ve slug'ı etikete çevir
  // bonusTypeOptions üretildikten sonra çalışmalı
  useEffect(() => {
    const qParam = searchParams.get("q");
    if (qParam) setSearchQuery(qParam);
    const amountParam = searchParams.get("amount");
    if (amountParam) setBonusAmount(amountParam);
  }, [searchParams]);

  // URL arama parametresini güncelleyen yardımcı (Türkçe için slugify)
  function setUrlParam(key: string, value: string | null) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (!value || value === "" || value === "all") {
      params.delete(key);
    } else {
      const v = (key === "type" || key === "category")
        ? slugifyTr(value, { withHyphens: true })
        : value;
      params.set(key, v);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : `${pathname}`, { scroll: false });
  }

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

  // Tür seçeneklerini mevcut veriden dinamik üret
  const bonusTypeOptions = useMemo(() => {
    const set = new Set<string>();
    bonuses.forEach(b => { if (b.bonusType) set.add(b.bonusType); });
    return Array.from(set).sort();
  }, [bonuses]);

  useEffect(() => {
    function resolveFromSlug(slug: string | null, options: string[]): string | null {
      if (!slug) return null;
      const s = slug.toLowerCase();
      for (const opt of options) {
        if (slugifyTr(opt, { withHyphens: true }) === s) return opt;
      }
      return null;
    }

    const typeParam = searchParams.get("type");
    const resolvedType = resolveFromSlug(typeParam, bonusTypeOptions);
    if (resolvedType) setBonusType(resolvedType);

    const categoryParam = searchParams.get("category");
    const categoryOptions = ["Spor", "Casino", "Slot", "Poker"];
    const resolvedCategory = resolveFromSlug(categoryParam, categoryOptions);
    if (resolvedCategory) setSiteCategory(resolvedCategory);
  }, [searchParams, bonusTypeOptions]);

  const featuredBonuses = useMemo(() => filtered.filter(b => b.isFeatured), [filtered]);
  const regularBonuses = useMemo(() => filtered.filter(b => !b.isFeatured), [filtered]);

  // Instagram story tarzı üst şerit için öğeler
  const storyItems = useMemo(() => {
    // Önce admin panelinden gelen Story (Carousel) öğelerini kullan
    const storySlides = stories.filter(s => !!s.mobileImageUrl).sort((a, b) => ((a.order ?? 999) - (b.order ?? 999)));
    if (storySlides.length > 0) {
      return storySlides.slice(0, 12).map((s) => ({
        id: s.id,
        label: String(s.title ?? "Story"),
        img: s.mobileImageUrl!,
        cta: s.ctaUrl || undefined,
      }));
    }
    // Aksi halde featured bonuslardan türet
    const base = featuredBonuses.length ? featuredBonuses : filtered
    const items = base.slice(0, 12).map((b) => ({
      id: b.id,
      label: String(b.title ?? ""),
      img: b.postImageUrl || b.imageUrl || "/logo.svg",
      cta: b.ctaUrl || undefined,
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
  }, [stories, featuredBonuses, filtered])

  const storyRef = useRef<HTMLDivElement>(null);
  const scrollLeft = () => storyRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  const scrollRight = () => storyRef.current?.scrollBy({ left: 320, behavior: "smooth" });

  // Drag-to-scroll state and handlers for story rail
  const draggingRef = useRef(false);
  const pointerDownRef = useRef(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);

  const onPointerDown = (e: any) => {
    pointerDownRef.current = true;
    draggingRef.current = false;
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
    setScrollStart(storyRef.current?.scrollLeft ?? 0);
  };
  const onPointerMove = (e: any) => {
    if (!pointerDownRef.current) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    // Yatay sürüklemeyi, dikey hareketten belirgin olduğunda etkinleştir
    if (!draggingRef.current && absDx > 6 && absDx > absDy) {
      draggingRef.current = true;
    }
    if (draggingRef.current && storyRef.current) {
      storyRef.current.scrollLeft = scrollStart - dx;
      // Sadece yatay sürüklemede varsayılanı engelle; dikey hareket sayfa scroll’una bırakılır
      e.preventDefault();
    }
  };
  const onPointerUp = (_e: any) => {
    // Allow click handler to read current drag state, then reset.
    setTimeout(() => { pointerDownRef.current = false; draggingRef.current = false; }, 0);
  };

  const onPointerLeave = () => {
    pointerDownRef.current = false;
    draggingRef.current = false;
  };
  const openDetails = (b: Bonus) => { setSelectedBonus(b); setIsDialogOpen(true); };

  // Story dialog için swipe-down kapatma ve swipe-up link açma
  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);

  const onStoryPointerDown = (e: any) => {
    startYRef.current = e.clientY ?? e.touches?.[0]?.clientY ?? null;
    startXRef.current = e.clientX ?? e.touches?.[0]?.clientX ?? null;
    setSwipeDirection(null);
    setSwipeDistance(0);
  };

  const onStoryPointerMove = (e: any) => {
    const y = e.clientY ?? e.touches?.[0]?.clientY;
    const x = e.clientX ?? e.touches?.[0]?.clientX;
    if (startYRef.current == null || startXRef.current == null) return;
    
    const dy = (y ?? 0) - startYRef.current;
    const dx = (x ?? 0) - startXRef.current;
    const absDy = Math.abs(dy);
    const absDx = Math.abs(dx);
    
    // Only process vertical swipes (ignore horizontal)
    if (absDy > 10 && absDx < 80) {
      setSwipeDistance(absDy);
      
      if (dy > 0) {
        // Swiping down
        setSwipeDirection('down');
        if (dy > 80) {
          // Close story on sufficient downward swipe
          setIsStoryOpen(false);
          setSwipeDirection(null);
          setSwipeDistance(0);
          startYRef.current = null;
          startXRef.current = null;
        }
      } else {
        // Swiping up
        setSwipeDirection('up');
        if (dy < -80 && activeStory?.cta) {
          // Navigate to CTA on sufficient upward swipe
          window.open(activeStory.cta, '_blank');
          setIsStoryOpen(false);
          setSwipeDirection(null);
          setSwipeDistance(0);
          startYRef.current = null;
          startXRef.current = null;
        }
      }
    }
  };

  const onStoryPointerUp = () => {
    // Reset swipe state after a short delay to allow visual feedback
    setTimeout(() => {
      setSwipeDirection(null);
      setSwipeDistance(0);
    }, 200);
    startYRef.current = null;
    startXRef.current = null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/bonuslar" />

      {marqueeItems.length > 0 && (
        <TopBrandTicker
          items={marqueeItems.map((m) => ({ imageUrl: m.imageUrl, href: m.href }))}
          className="md:pl-72"
        />
      )}

      <main className="container mx-auto px-4 py-8 md:pl-72">
        {/* Arama + Filtreler */}
        <motion.section
          className="mb-8 p-6 bg-card rounded-2xl border border-border"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="flex flex-col lg:flex-row gap-3 items-stretch">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Bonus veya site ara..."
                value={searchQuery}
                onChange={(e) => { const v = e.target.value; setSearchQuery(v); setUrlParam('q', v || null); }}
                className="pl-10 bg-background border-border h-11"
              />
            </div>
            <Select value={bonusType} onValueChange={(val) => { setBonusType(val); setUrlParam('type', val); }}>
              <SelectTrigger className="w-full lg:w-56 h-11" aria-label="Bonus türü filtresi">
                <div className="flex items-center gap-2 w-full">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Tür</span>
                  <span className="ml-auto text-right truncate"><SelectValue placeholder="Bonus Türü" /></span>
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-auto">
                <SelectItem value="all">Tümü</SelectItem>
                {bonusTypeOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={bonusAmount} onValueChange={(val) => { setBonusAmount(val); setUrlParam('amount', val); }}>
              <SelectTrigger className="w-full lg:w-56 h-11" aria-label="Tutar filtresi">
                <div className="flex items-center gap-2 w-full">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Tutar</span>
                  <span className="ml-auto text-right truncate"><SelectValue placeholder="Tutar" /></span>
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-auto">
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="0-100">0-100 TL</SelectItem>
                <SelectItem value="100-200">100-200 TL</SelectItem>
                <SelectItem value="200+">200+ TL</SelectItem>
              </SelectContent>
            </Select>
            <Select value={siteCategory} onValueChange={(val) => { setSiteCategory(val); setUrlParam('category', val); }}>
              <SelectTrigger className="w-full lg:w-56 h-11" aria-label="Kategori filtresi">
                <div className="flex items-center gap-2 w-full">
                  <Star className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Kategori</span>
                  <span className="ml-auto text-right truncate"><SelectValue placeholder="Kategori" /></span>
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-auto">
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="Spor">Spor</SelectItem>
                <SelectItem value="Casino">Casino</SelectItem>
                <SelectItem value="Slot">Slot</SelectItem>
                <SelectItem value="Poker">Poker</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full lg:w-auto h-11 flex items-center gap-1.5" onClick={() => {
              setSearchQuery("");
              setBonusType("all");
              setBonusAmount("all");
              setSiteCategory("all");
              const params = new URLSearchParams(Array.from(searchParams.entries()));
              ["q", "type", "amount", "category"].forEach((k) => params.delete(k));
              const qs = params.toString();
              router.replace(qs ? `${pathname}?${qs}` : `${pathname}`, { scroll: false });
            }}>
              <XCircle className="w-4 h-4" aria-hidden />
              <span>Filtreleri Temizle</span>
            </Button>
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
              className="absolute left-0 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-black/50 hover:bg-black/60 text-white shadow-lg backdrop-blur-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div ref={storyRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerLeave}
              className="overflow-x-auto overflow-y-visible scroll-smooth pl-4 sm:pl-10 pr-4 sm:pr-10 py-2 touch-auto select-none cursor-grab active:cursor-grabbing snap-x snap-mandatory"
            >
              <div className="flex items-center gap-5">
                {storyItems.map((item) => (
                  <a
                    key={item.id}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (draggingRef.current) return;
                      setActiveStory({ img: item.img, label: item.label, cta: (item as any).cta });
                      setIsStoryOpen(true);
                    }}
                    className="group flex flex-col items-center snap-start"
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
              className="absolute right-0 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-black/50 hover:bg-black/60 text-white shadow-lg backdrop-blur-md"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="pointer-events-none absolute left-0 top-0 h-full w-8 sm:w-12 bg-gradient-to-r from-background to-transparent"></div>
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 sm:w-12 bg-gradient-to-l from-background to-transparent"></div>
          </div>
        </motion.section>

        <Dialog open={isStoryOpen} onOpenChange={setIsStoryOpen}>
          <DialogContent className="max-w-[720px] p-0 bg-black"
            onPointerDown={onStoryPointerDown}
            onPointerMove={onStoryPointerMove}
            onPointerUp={onStoryPointerUp}
            onTouchStart={onStoryPointerDown}
            onTouchMove={onStoryPointerMove}
            onTouchEnd={onStoryPointerUp}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Story Görseli</DialogTitle>
            </DialogHeader>
            <div className="relative w-full aspect-[9/16] sm:aspect-[9/16] bg-black overflow-hidden">
              {activeStory?.img && (
                <img src={activeStory.img} alt={activeStory.label} className="w-full h-full object-contain" draggable={false} />
              )}
              
              {/* Swipe Instructions Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Top instruction - Swipe up */}
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full backdrop-blur-md transition-all duration-300 ${
                  swipeDirection === 'up' 
                    ? 'bg-green-500/80 text-white scale-110' 
                    : 'bg-black/60 text-white/80'
                }`}>
                  <div className="text-center">
                    <div className="text-sm font-medium">↑ Yukarı Kaydırarak Bonusu Al</div>
                    {swipeDirection === 'up' && (
                      <div className="text-xs mt-1 opacity-90">
                        {swipeDistance > 60 ? 'Bırakın!' : 'Devam edin...'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom instruction - Swipe down */}
                <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full backdrop-blur-md transition-all duration-300 ${
                  swipeDirection === 'down' 
                    ? 'bg-red-500/80 text-white scale-110' 
                    : 'bg-black/60 text-white/80'
                }`}>
                  <div className="text-center">
                    <div className="text-sm font-medium">↓ Aşağı Kaydırarak Kapat</div>
                    {swipeDirection === 'down' && (
                      <div className="text-xs mt-1 opacity-90">
                        {swipeDistance > 60 ? 'Bırakın!' : 'Devam edin...'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual swipe indicator */}
                {swipeDirection && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-16 h-16 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 ${
                      swipeDirection === 'up' 
                        ? 'bg-green-500/40 text-green-200' 
                        : 'bg-red-500/40 text-red-200'
                    }`}>
                      <div className={`text-2xl transition-transform duration-200 ${
                        swipeDistance > 60 ? 'scale-125' : 'scale-100'
                      }`}>
                        {swipeDirection === 'up' ? '↑' : '↓'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Bottom CTA Button */}
            <div className="p-4 border-t border-border bg-card/40">
              <Button 
                className="w-full flex items-center justify-center gap-1.5" 
                onClick={() => { 
                  if (activeStory?.cta) {
                    window.open(activeStory.cta, '_blank');
                  }
                }}
                disabled={!activeStory?.cta}
              >
                {activeStory?.cta ? (
                  <>
                    <Gift className="w-4 h-4" aria-hidden />
                    <span>Bonusu Al</span>
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </>
                ) : (
                  <span>Link Mevcut Değil</span>
                )}
              </Button>
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
            <div className="content-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBonuses.map((bonus) => (
                <motion.div key={bonus.id} variants={fadeInUp}>
                  <Card className={`relative overflow-hidden md:backdrop-blur-sm bg-opacity-80 bg-card border-2 border-gold rounded-2xl hover:shadow-lg transition-colors duration-200 shadow-smooth ${isExpired(bonus) ? 'opacity-60' : ''}`}>
                    <div className="absolute top-4 right-4">
                      {isExpired(bonus) && (
                        <Badge variant="destructive" className="uppercase tracking-wide shadow-md flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" aria-hidden />
                          Süresi Doldu
                        </Badge>
                      )}
                    </div>
                    <CardHeader>
                      <div className="mx-auto mb-4 w-full max-w-[220px] h-[64px] sm:h-[72px] bg-muted flex items-center justify-center border rounded-md p-2">
                        {bonus.imageUrl ? (
                          <img src={bonus.imageUrl} alt={String(bonus.title || 'Logo')} className="h-full w-auto object-contain" />
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
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        {(Array.isArray(bonus.badges) ? bonus.badges! : [])
                          .concat(isExpired(bonus) ? ['Süresi Doldu'] : [])
                          .map((badge, i) => {
                            const isExpiredBadge = String(badge).toLowerCase() === 'süresi doldu';
                            return (
                              <Badge
                                key={i}
                                variant={isExpiredBadge ? 'destructive' : 'default'}
                                className={`text-xs font-semibold px-3 py-1 flex items-center gap-1.5 ${
                                  isExpiredBadge 
                                    ? 'uppercase tracking-wide shadow-md bg-red-500 text-white' 
                                    : 'bg-gold/20 text-gold border-gold/30 hover:bg-gold/30 shadow-sm'
                                }`}
                              >
                                {isExpiredBadge ? (
                                  <AlertTriangle className="w-3 h-3" aria-hidden />
                                ) : (
                                  <Gift className="w-3 h-3" aria-hidden />
                                )}
                                <span>{badge}</span>
                              </Badge>
                            );
                          })}
                      </div>
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
                      <Button variant="outline" className="w-full flex items-center justify-center gap-1.5" onClick={() => openDetails(bonus)}>
                        <Info className="w-4 h-4" aria-hidden />
                        <span>Detayları Gör</span>
                        <ArrowRight className="w-4 h-4" aria-hidden />
                      </Button>
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
            <>
              <h2 className="text-xl font-bold text-gold mb-4 text-center">Bonuslar yükleniyor…</h2>
              <div className="content-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="relative overflow-hidden bg-card border border-border rounded-2xl">
                    <CardHeader>
                      <div className="mx-auto mb-4 w-full max-w-[200px] h-[64px] bg-muted flex items-center justify-center border rounded-md p-2">
                        <Skeleton className="h-10 w-32" />
                      </div>
                      <Skeleton className="h-6 w-40 mx-auto" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-7 w-24 mx-auto mb-2" />
                      <Skeleton className="h-4 w-64 mx-auto mb-4" />
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-14" />
                      </div>
                      <Skeleton className="h-4 w-40 mx-auto mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
          {error && (
            <div className="text-center text-red-500 py-6">{error}</div>
          )}
          {!loading && !error && (
            <div className="content-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularBonuses.map((bonus) => (
                <Card key={bonus.id} className={`relative overflow-hidden md:backdrop-blur-sm bg-opacity-80 bg-card border border-border rounded-2xl hover:shadow-lg transition-colors duration-200 shadow-smooth ${isExpired(bonus) ? 'opacity-60' : ''}`}>
                  <div className="absolute top-4 right-4">
                    {isExpired(bonus) && (
                      <Badge variant="destructive" className="bg-red-600 text-white flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" aria-hidden />
                        Süresi Doldu
                      </Badge>
                    )}
                    {!isExpired(bonus) && 'isFavourite' in (bonus as any) && (bonus as any)['isFavourite'] && (
                       <Badge variant="outline" className="border-yellow-400 text-yellow-400">Favori</Badge>
                     )}
                   </div>
                  <CardHeader>
                    <div className="mx-auto mb-4 w-full max-w-[200px] h-[56px] sm:h-[64px] bg-muted flex items-center justify-center border rounded-md p-2">
                      {bonus.imageUrl ? (
                        <img src={bonus.imageUrl} alt={String(bonus.title || 'Logo')} className="max-h-full max-w-full object-contain" />
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
                              variant={isExpiredBadge ? 'destructive' : 'default'}
                              className={`text-xs font-semibold px-3 py-1 flex items-center gap-1.5 ${
                                isExpiredBadge 
                                  ? 'uppercase tracking-wide shadow-md bg-red-500 text-white' 
                                  : 'bg-gold/20 text-gold border-gold/30 hover:bg-gold/30 shadow-sm'
                              }`}
                            >
                              {isExpiredBadge ? (
                                <AlertTriangle className="w-3 h-3" aria-hidden />
                              ) : (
                                <Gift className="w-3 h-3" aria-hidden />
                              )}
                              <span>{badge}</span>
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
                    <Button variant="outline" className="w-full flex items-center justify-center gap-1.5" onClick={() => openDetails(bonus)}>
                      <Info className="w-4 h-4" aria-hidden />
                      <span>Detayları Gör</span>
                      <ArrowRight className="w-4 h-4" aria-hidden />
                    </Button>
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
                      alt={selectedBonus.title}
                      fill
                      className="object-cover"
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
                  <Button className="w-full flex items-center justify-center gap-1.5" asChild>
                    <a href={selectedBonus.ctaUrl} target="_blank" rel="noopener noreferrer">
                      <Gift className="w-4 h-4" aria-hidden />
                      <span>Bonusu Al</span>
                      <ArrowRight className="w-4 h-4" aria-hidden />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </main>

      <SeoArticle slug="bonuslar" />
      <Footer />
    </div>
  );
}