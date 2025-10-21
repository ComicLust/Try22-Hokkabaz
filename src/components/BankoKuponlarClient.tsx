"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Trophy, Info, BookOpen, Clock, Target, Percent, CheckCircle2, XCircle, Hourglass, Award, Check, Star, ThumbsUp, ThumbsDown, Bell, Edit, Trash2, Archive } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

type Match = {
  homeTeam: string;
  awayTeam: string;
  league?: string | null;
  startTime?: string | null;
  prediction?: string | null;
  odd?: number | null;
  resultScore?: string | null;
  result: "WON" | "LOST" | "PENDING";
};

type Coupon = {
  id: string;
  title?: string | null;
  date: string;
  totalOdd: number;
  status: "WON" | "LOST" | "PENDING";
  matches: Match[];
  upVotes?: number;
  downVotes?: number;
};

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

type Stats = { total: number; won: number; lost: number; pending: number; successRate: number }

function formatDateTR(dateIso?: string) {
  if (!dateIso) return "";
  try {
    const d = new Date(dateIso);
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return dateIso;
  }
}

function formatTimeTR(dateIso?: string) {
  if (!dateIso) return "";
  try {
    const d = new Date(dateIso);
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function statusClasses(status: Coupon["status"]) {
  if (status === "WON") return "bg-emerald-900/30 border-emerald-700";
  if (status === "LOST") return "bg-red-900/30 border-red-700";
  return "bg-card border-border";
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

export default function BankoKuponlarClient() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stakeMap, setStakeMap] = useState<Record<string, number>>({});
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [selectedBonus, setSelectedBonus] = useState<Bonus | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [voting, setVoting] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/banko-coupons", { cache: "no-store" });
        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : []);
      } catch (e) {
        setError("Kuponlar yüklenemedi. Lütfen daha sonra tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  useEffect(() => {
    const fetchBonuses = async () => {
      try {
        const res = await fetch("/api/bonuses?active=true&featured=true", { cache: "no-store" });
        const data = await res.json();
        const items = Array.isArray(data) ? data : [];
        setBonuses(items);
      } catch (e) {
        // bonuslar isteğe bağlı; hata durumunda sessiz geç
      }
    };
    fetchBonuses();
  }, []);

  useEffect(() => {
    // Son 30 gün başarı oranı
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/banko-coupons/archive/stats', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch {}
    }
    fetchStats()
  }, []);

  useEffect(() => {
    // Admin kontrolü - localStorage'dan kontrol et
    const checkAdmin = () => {
      try {
        const adminStatus = localStorage.getItem('isAdmin');
        setIsAdmin(adminStatus === 'true');
      } catch {
        setIsAdmin(false);
      }
    }
    checkAdmin();
  }, []);

  const stakeValue = (id: string) => stakeMap[id] ?? 100;
  const setStakeValue = (id: string, v: number) => setStakeMap(s => ({ ...s, [id]: v }));

  const trustPercent = (c: Coupon) => {
    const up = Number(c.upVotes ?? 0);
    const down = Number(c.downVotes ?? 0);
    const total = Math.max(0, up + down);
    return total > 0 ? Math.round((up / total) * 100) : 0;
  };

  const castVote = async (couponId: string, action: 'up' | 'down') => {
    try {
      setVoting(v => ({ ...v, [couponId]: true }));
      const res = await fetch(`/api/banko-coupons/${couponId}/vote`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, upVotes: data.upVotes, downVotes: data.downVotes } : c));
        const trust = typeof data?.trust === 'number' ? Math.round(data.trust) : undefined;
        toast({
          title: "Oy kaydedildi",
          description: trust != null ? `Topluluk güveni: %${trust}` : "Teşekkürler! Oy limitiniz günlük 1’dir."
        });
      } else if (res.status === 429) {
        toast({
          title: "Oy limitine takıldın (429)",
          description: "Aynı kupona günde en fazla 1 oy verilebilir. Lütfen yarın tekrar deneyin.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Oy kullanılamadı",
          description: "Lütfen daha sonra tekrar deneyin.",
          variant: "destructive"
        });
      }
    } catch (e) {
      toast({
        title: "Bağlantı hatası",
        description: "İstek başarısız oldu. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive"
      });
    } finally {
      setVoting(v => ({ ...v, [couponId]: false }));
    }
  };

  const requestReminder = async () => {
    try {
      const w = typeof window !== 'undefined' ? (window as any) : undefined;
      const OneSignal = w?.OneSignal;
      if (!OneSignal) {
        alert('Bildirim servisi yüklenemedi. Lütfen daha sonra deneyin.');
        return;
      }
      OneSignal.push(async function() {
        await OneSignal.registerForPushNotifications();
        await OneSignal.sendTag('banko_reminder', 'true');
      });
      alert('Hatırlatma açıldı: Her gün 18:00 bildirim gönderilecek.');
    } catch {
      alert('Bildirim izni alınamadı. Lütfen daha sonra deneyin.');
    }
  };

  const editCoupon = (couponId: string) => {
    // Admin paneline yönlendir
    window.open(`/admin/banko-kuponlar?edit=${couponId}`, '_blank');
  };

  const deleteCoupon = async (couponId: string) => {
    if (!confirm('Bu kuponu silmek istediğinizden emin misiniz?')) return;
    
    try {
      const res = await fetch(`/api/admin/banko-coupons/${couponId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.id !== couponId));
        toast({
          title: "Başarılı",
          description: "Kupon silindi."
        });
      } else {
        throw new Error('Silme işlemi başarısız');
      }
    } catch (e) {
      toast({
        title: "Hata",
        description: "Kupon silinemedi. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    }
  };

  const archiveCoupon = async (couponId: string) => {
    if (!confirm('Bu kuponu arşivlemek istediğinizden emin misiniz?')) return;
    
    try {
      const res = await fetch(`/api/admin/banko-coupons/${couponId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false })
      });
      
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.id !== couponId));
        toast({
          title: "Başarılı",
          description: "Kupon arşivlendi."
        });
      } else {
        throw new Error('Arşivleme işlemi başarısız');
      }
    } catch (e) {
      toast({
        title: "Hata",
        description: "Kupon arşivlenemedi. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    }
  };

  const header = (
    <section className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gold flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gold text-background"><Trophy className="w-5 h-5" /></span>
        Banko Kuponlar – Günün En Güçlü 3 Tahmini
      </h1>
      <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm md:text-base text-foreground font-medium">
        <Info className="w-4 h-4 text-gold" />
        <span>Her gün saat 18:00’de güncellenir. Maç bitimlerinde sonuçlar otomatik olarak işlenir.</span>
      </div>
      <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm md:text-base text-foreground font-medium">
        <Percent className="w-4 h-4 text-gold" />
        <span>Son 30 gün başarı oranı: <span className="ml-1 font-semibold">%{stats ? Math.round(stats.successRate) : 0}</span></span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button asChild size="sm" variant="outline" className="inline-flex items-center gap-2">
          <a href="/banko-kuponlar/arsiv"><BookOpen className="w-4 h-4" /> Önceki Günlerin Kuponları</a>
        </Button>
        <Button size="sm" variant="outline" onClick={requestReminder} className="inline-flex items-center gap-2"><Bell className="w-4 h-4" /> Hatırlat</Button>
      </div>
    </section>
  );

  const contentGrid = (
    <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6">
      {coupons.map((coupon, idx) => (
        <Card key={coupon.id} className={`overflow-hidden ${statusClasses(coupon.status)} rounded-2xl shadow-md`}>
          <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><Trophy className="w-4 h-4 text-gold" /> {coupon.title || `Banko Kupon #${idx + 1}`}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {formatDateTR(coupon.date ?? undefined)}
                  </span>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editCoupon(coupon.id)}
                        className="h-8 w-8 p-0"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => archiveCoupon(coupon.id)}
                        className="h-8 w-8 p-0"
                        title="Arşivle"
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteCoupon(coupon.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
          <CardContent className="py-4">
            <div className="space-y-4">
              {coupon.matches.map((m, i) => (
                <div key={i} className="p-3 rounded-lg border bg-background/50">
                  <div className="font-medium">{m.homeTeam} vs {m.awayTeam}</div>
                  <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-3 mt-1">
                    <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" /> {formatTimeTR(m.startTime ?? undefined)}</span>
                    <span className="inline-flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span className="px-2 py-0.5 rounded bg-gold/10 border border-gold/40 text-foreground font-semibold">{m.prediction}</span>
                    </span>
                    <span className="inline-flex items-center gap-1"><Percent className="w-4 h-4" /> {Number(m.odd ?? 0).toFixed(2)}</span>
                  </div>
                  {m.resultScore && (
                    <div className="text-sm mt-1 inline-flex items-center gap-3">
                      <span>Sonuç: {m.resultScore}</span>
                      {m.result === 'WON' ? (
                        <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 className="w-4 h-4" /> Kazandı</span>
                      ) : m.result === 'LOST' ? (
                        <span className="inline-flex items-center gap-1 text-red-600"><XCircle className="w-4 h-4" /> Kaybetti</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-foreground"><Hourglass className="w-4 h-4" /> Beklemede</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div className="grid items-center gap-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="inline-flex items-center gap-2 font-medium">
                    <span>Topluluk Güveni</span>
                    <span className="px-2 py-0.5 rounded bg-muted text-foreground">%{trustPercent(coupon)}</span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={!!voting[coupon.id]} onClick={() => castVote(coupon.id, 'up')} className="inline-flex items-center gap-1"><Check className="w-4 h-4" /> Evet</Button>
                    <Button variant="outline" size="sm" disabled={!!voting[coupon.id]} onClick={() => castVote(coupon.id, 'down')} className="inline-flex items-center gap-1"><XCircle className="w-4 h-4" /> Hayır</Button>
                  </div>
                </div>
                <Progress value={trustPercent(coupon)} />
              </div>
              <div className="mt-3 p-3 rounded-lg border bg-background/50">
                <div className="text-sm mb-2">Hızlı hesaplayıcı</div>
                <div className="flex items-center gap-3">
                  <Input type="number" min={0} value={stakeValue(coupon.id)} onChange={e => setStakeValue(coupon.id, Number(e.target.value || 0))} className="w-24 md:w-32" />
                  <div className="text-sm text-muted-foreground">₺ yatırırsan → <span className="font-semibold text-foreground">₺{(stakeValue(coupon.id) * coupon.totalOdd).toFixed(2)}</span> kazanırsın</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const contentCarousel = (
    <Carousel opts={{ align: "start" }}>
      <CarouselContent className="gap-4 px-4">
        {coupons.map((coupon, idx) => (
          <CarouselItem key={coupon.id} className="basis-full">
            <Card className={`overflow-hidden ${statusClasses(coupon.status)} rounded-2xl shadow-md`}>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2"><Trophy className="w-4 h-4 text-gold" /> {coupon.title || `Banko Kupon #${idx + 1}`}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {formatDateTR(coupon.date ?? undefined)}
                    </span>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editCoupon(coupon.id)}
                          className="h-8 w-8 p-0"
                          title="Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => archiveCoupon(coupon.id)}
                          className="h-8 w-8 p-0"
                          title="Arşivle"
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCoupon(coupon.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <div className="space-y-4">
                  {coupon.matches.map((m, i) => (
                    <div key={i} className="p-3 rounded-lg border bg-background/50">
                      <div className="font-medium">{m.homeTeam} vs {m.awayTeam}</div>
                      <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" /> {formatTimeTR(m.startTime ?? undefined)}</span>
                        <span className="inline-flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          <span className="px-2 py-0.5 rounded bg-gold/10 border border-gold/40 text-foreground font-semibold">{m.prediction}</span>
                        </span>
                        <span className="inline-flex items-center gap-1"><Percent className="w-4 h-4" /> {Number(m.odd ?? 0).toFixed(2)}</span>
                      </div>
                      {m.resultScore && (
                        <div className="text-sm mt-1 inline-flex items-center gap-3">
                          <span>Sonuç: {m.resultScore}</span>
                          {m.result === 'WON' ? (
                            <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 className="w-4 h-4" /> Kazandı</span>
                          ) : m.result === 'LOST' ? (
                            <span className="inline-flex items-center gap-1 text-red-600"><XCircle className="w-4 h-4" /> Kaybetti</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground"><Hourglass className="w-4 h-4" /> Beklemede</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="grid items-center gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="inline-flex items-center gap-2 font-medium">
                        <span>Topluluk Güveni</span>
                        <span className="px-2 py-0.5 rounded bg-muted text-foreground">%{trustPercent(coupon)}</span>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={!!voting[coupon.id]} onClick={() => castVote(coupon.id, 'up')} className="inline-flex items-center gap-1"><Check className="w-4 h-4" /> Evet</Button>
                        <Button variant="outline" size="sm" disabled={!!voting[coupon.id]} onClick={() => castVote(coupon.id, 'down')} className="inline-flex items-center gap-1"><XCircle className="w-4 h-4" /> Hayır</Button>
                      </div>
                    </div>
                    <Progress value={trustPercent(coupon)} />
                  </div>
                  <div className="font-semibold">Toplam Oran: {Number(coupon.totalOdd).toFixed(2)}</div>
                  <Badge variant={coupon.status === 'WON' ? 'default' : coupon.status === 'LOST' ? 'destructive' : 'outline'} className="inline-flex items-center gap-1">
                    {coupon.status === 'WON' ? <CheckCircle2 className="w-4 h-4" /> : coupon.status === 'LOST' ? <XCircle className="w-4 h-4" /> : <Hourglass className="w-4 h-4" />}
                    <span>Durum: {coupon.status === 'WON' ? 'Kazandı' : coupon.status === 'LOST' ? 'Kaybetti' : 'Beklemede'}</span>
                  </Badge>
                </div>
                <div className="mt-3 p-3 rounded-lg border bg-background/50">
                  <div className="text-sm mb-2">Hızlı hesaplayıcı</div>
                  <div className="flex items-center gap-3">
                    <Input type="number" min={0} value={stakeValue(coupon.id)} onChange={e => setStakeValue(coupon.id, Number(e.target.value || 0))} className="w-24 md:w-32" />
                    <div className="text-sm text-muted-foreground">₺ yatırırsan → <span className="font-semibold text-foreground">₺{(stakeValue(coupon.id) * coupon.totalOdd).toFixed(2)}</span> kazanırsın</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="px-4 flex items-center justify-between mt-2">
        <CarouselPrevious />
        <CarouselNext />
      </div>
    </Carousel>
  );

  const bonusRow = (
    <motion.section className="mt-8" initial="initial" animate="animate" variants={fadeInUp}>
      <h2 className="text-2xl font-bold text-gold mb-6 flex items-center">
        <Star className="w-6 h-6 mr-2" />
        Öne Çıkan Bonuslar
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bonuses.map((bonus) => (
          <motion.div key={bonus.id} variants={fadeInUp}>
            <Card className={`relative overflow-hidden backdrop-blur-lg bg-opacity-80 bg-card border-2 border-gold rounded-2xl hover:shadow-xl transition-all duration-300 ${isExpired(bonus) ? 'opacity-60' : ''}`}>
              <div className="absolute top-4 right-4">
                {isExpired(bonus) && (
                  <Badge variant="destructive" className="uppercase tracking-wide shadow-md">Süresi Doldu</Badge>
                )}
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="mx-auto mb-4 w-full max-w-[240px] h-[72px] sm:h-[80px] bg-muted flex items-center justify-center border rounded-md p-2">
                    {bonus.imageUrl ? (
                      <img src={bonus.imageUrl} alt={String(bonus.title || 'Logo')} className="h-full w-auto object-contain" />
                    ) : (
                      <Award className="w-10 h-10 text-gold" />
                    )}
                  </div>
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
                <Button variant="outline" className="w-full" onClick={() => { setSelectedBonus(bonus); setIsDialogOpen(true); }}>Detayları Gör</Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/banko-kuponlar" />
      <main className="container mx-auto px-4 py-8 md:pl-72">
        {header}
        {loading && <div className="text-center text-muted-foreground py-10">Yükleniyor…</div>}
        {error && <div className="text-center text-red-500 py-10">{error}</div>}
        {!loading && !error && (
          <>
            {/* Desktop grid */}
            {contentGrid}
            {/* Mobile carousel */}
            <div className="md:hidden">
              {contentCarousel}
            </div>

            {bonusRow}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="sm:max-w-[640px] p-0">
                <DialogHeader className="p-4">
                  <DialogTitle>Bonus Detayı</DialogTitle>
                </DialogHeader>
                {selectedBonus && (
                  <div className="flex max-h-[85vh] flex-col">
                    <div className="overflow-y-auto p-4 space-y-4">
                      {!!selectedBonus.postImageUrl && (
                        <div className="relative w-full aspect-square overflow-hidden rounded-md border bg-muted">
                          <Image
                            src={selectedBonus.postImageUrl}
                            alt="Bonus Post Görseli"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 90vw, 700px"
                          />
                        </div>
                      )}

                      {/* Özellikler */}
                      <div className="space-y-2">
                        <h4 className="font-semibold">Özellikler:</h4>
                        {(Array.isArray(selectedBonus.features) ? selectedBonus.features : ['Çevrim Şartsız', 'Anında Çekim']).map((feature, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <Check className="w-4 h-4 text-gold mr-2" />
                            {feature}
                          </div>
                        ))}
                      </div>

                      {/* Geçerlilik */}
                      {formatValidity(selectedBonus) && (
                        <div className="text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatValidity(selectedBonus)}
                        </div>
                      )}

                      {/* Açıklama */}
                      {selectedBonus.description && (
                        <div className="text-sm text-muted-foreground">
                          {selectedBonus.description}
                        </div>
                      )}
                    </div>

                    {/* CTA Button (sticky) */}
                    {selectedBonus.ctaUrl && (
                      <div className="p-4 border-t bg-background">
                        <a href={selectedBonus.ctaUrl} target="_blank" rel="noopener noreferrer" className="block">
                          <Button className="w-full">Kampanyaya Katıl</Button>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <div className="mt-6 flex justify-end">
              <Button asChild variant="outline">
                <a href="/banko-kuponlar/arsiv" className="inline-flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Önceki Günlerin Kuponları
                </a>
              </Button>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}