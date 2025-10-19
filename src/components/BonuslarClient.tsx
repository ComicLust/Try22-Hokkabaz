"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Search, Award, Calendar, Check, Star } from "lucide-react";
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
          <DialogContent className={`sm:max-w-[425px] ${selectedBonus?.postImageUrl ? 'md:max-w-[560px]' : ''}`}>
            <DialogHeader>
              <DialogTitle>Bonus Detayı</DialogTitle>
            </DialogHeader>
            {!!selectedBonus?.postImageUrl && (
              <div className="relative w-full aspect-square overflow-hidden rounded-md border bg-muted mb-4">
                <Image
                  src={selectedBonus.postImageUrl}
                  alt="Bonus Post Görseli"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, 560px"
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
            {!!selectedBonus?.ctaUrl && (
              <Button className="w-full" asChild>
                <a href={selectedBonus.ctaUrl} target="_blank" rel="noopener noreferrer">Kampanyaya Katıl</a>
              </Button>
            )}
          </DialogContent>
        </Dialog>

      </main>

      <Footer />
    </div>
  );
}