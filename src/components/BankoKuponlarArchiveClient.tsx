"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, BookOpen, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import SeoArticle from "@/components/SeoArticle";

function formatDateTR(dateIso?: string) {
  if (!dateIso) return "";
  try {
    const d = new Date(dateIso);
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return dateIso;
  }
}

function statusClasses(status: "WON" | "LOST" | "PENDING") {
  if (status === "WON") return "bg-emerald-900/30 border-emerald-700";
  if (status === "LOST") return "bg-red-900/30 border-red-700";
  return "bg-card border-border";
}

type Match = {
  homeTeam: string;
  awayTeam: string;
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
};

type Stats = {
  total: number;
  won: number;
  lost: number;
  pending: number;
};

export default function BankoKuponlarArchiveClient() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [stats, setStats] = useState<Stats | null>(null);
  const [showWinnersOnly, setShowWinnersOnly] = useState(false);

  // Gün linkleri için kısa yardımcılar
  const formatDay = (d: Date) => d.toISOString().slice(0,10);
  const dayNow = formatDay(new Date());
  const dayPrev = formatDay(new Date(Date.now() - 86400000));
  const dayPrev2 = formatDay(new Date(Date.now() - 2 * 86400000));

  useEffect(() => {
    const fetchArchive = async () => {
      try {
        setLoading(true);
        setError(null);
        const statusParam = showWinnersOnly ? "&status=WON" : "";
        const res = await fetch(`/api/banko-coupons/archive?page=${page}&limit=${limit}${statusParam}`, { cache: "no-store" });
        const data = await res.json();
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (e) {
        setError("Arşiv verileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    fetchArchive();
  }, [page, limit, showWinnersOnly]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/banko-coupons/archive/stats`, { cache: "no-store" });
        const data = await res.json();
        if (data && typeof data.won === 'number') setStats(data);
      } catch {
        // ignore
      }
    };
    fetchStats();
  }, []);

  const successRate = (() => {
    if (!stats) return 0;
    const denom = Math.max(1, stats.won + stats.lost);
    return Math.round((stats.won / denom) * 100);
  })();

  return (
    <div className="min-h-screen bg-background">
      <Header currentPath="/banko-kuponlar/arsiv" />
      <main className="container mx-auto px-4 py-8 md:pl-72">
        <section className="mb-6">
          <h1 className="text-2xl md:3xl font-bold text-gold flex items-center gap-2"><BookOpen className="w-6 h-6" /> Önceki Günlerin Kuponları</h1>
          <p className="text-muted-foreground mt-2">Geçmiş kuponları ve başarı oranlarını inceleyin.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm md:text-base text-foreground font-medium">
              Son 30 günde başarı oranı: <span className="font-semibold text-gold">%{successRate}</span>
            </div>
            <Button variant={showWinnersOnly ? "default" : "outline"} onClick={() => setShowWinnersOnly(v => !v)} className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Sadece Kazanan Günleri Göster {showWinnersOnly ? "✔" : ""}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input type="date" onChange={(e) => { const v = e.target.value; if (v) window.location.href = `/banko-kuponlar/arsiv/${v}` }} className="w-44" />
            <span className="text-sm text-muted-foreground">Hızlı: </span>
            <Button asChild variant="outline"><a href={`/banko-kuponlar/arsiv/${dayPrev2}`}>2 gün önce</a></Button>
            <Button asChild variant="outline"><a href={`/banko-kuponlar/arsiv/${dayPrev}`}>Dün</a></Button>
            <Button asChild variant="outline"><a href={`/banko-kuponlar/arsiv/${dayNow}`}>Bugün</a></Button>
          </div>
        </section>

        {loading && <div className="text-center text-muted-foreground py-10">Yükleniyor…</div>}
        {error && <div className="text-center text-red-500 py-10">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((coupon, idx) => (
              <Card key={coupon.id} className={`overflow-hidden ${statusClasses(coupon.status)} rounded-2xl`}>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center justify-between">
                    <span>🏅 {coupon.title || `Banko Kupon`}</span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {formatDateTR(coupon.date ?? undefined)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="space-y-3">
                    {coupon.matches.map((m, i) => (
                      <div key={i} className="p-3 rounded-lg border bg-background/50">
                        <div className="font-medium">⚽ {m.homeTeam} vs {m.awayTeam}</div>
                        <div className="text-sm text-muted-foreground mt-1">Tahmin: {m.prediction} • Oran: {Number(m.odd ?? 0).toFixed(2)}</div>
                        {m.resultScore && (
                          <div className="text-xs mt-1">Sonuç: {m.resultScore} {m.result === 'WON' ? '✅' : m.result === 'LOST' ? '❌' : ''}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 border-t flex items-center justify-between">
                    <div className="font-semibold">Toplam Oran: {Number(coupon.totalOdd).toFixed(2)}</div>
                    <Badge variant={coupon.status === 'WON' ? 'default' : coupon.status === 'LOST' ? 'destructive' : 'outline'} className="inline-flex items-center gap-1">
                      {coupon.status === 'WON' ? <CheckCircle2 className="w-4 h-4" /> : coupon.status === 'LOST' ? <XCircle className="w-4 h-4" /> : <Hourglass className="w-4 h-4" />}
                      <span>Durum: {coupon.status === 'WON' ? 'Kazandı' : coupon.status === 'LOST' ? 'Kaybetti' : 'Beklemede'}</span>
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Önceki</Button>
          <span className="text-sm text-muted-foreground">Sayfa {page}</span>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)}>Sonraki</Button>
        </div>
      </main>
      <SeoArticle slug="banko-kuponlar" />
      <Footer />
    </div>
  );
}