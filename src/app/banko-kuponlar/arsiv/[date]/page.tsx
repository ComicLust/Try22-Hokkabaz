import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, XCircle, Hourglass, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
// removed: import { headers } from "next/headers";

function formatDateTR(dateIso?: string) {
  if (!dateIso) return "";
  try {
    const d = new Date(dateIso);
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return dateIso ?? "";
  }
}

function statusClasses(status: "WON" | "LOST" | "PENDING") {
  if (status === "WON") return "bg-emerald-900/30 border-emerald-700";
  if (status === "LOST") return "bg-red-900/30 border-red-700";
  return "bg-card border-border";
}

export async function generateMetadata({ params }: { params: { date: string } }): Promise<Metadata> {
  const dateLabel = formatDateTR(params.date);
  const title = `Banko Kuponlar Arşiv – ${dateLabel}`;
  const description = `Günün banko kuponları (${dateLabel}). Kazandı / Kaybetti / Beklemede sonuçlarıyla geçmiş kayıt.`;
  const url = `/banko-kuponlar/arsiv/${params.date}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      locale: "tr_TR",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function Page({ params }: { params: { date: string } }) {
  const date = params.date;
  // Gün gün geçiş için önceki/sonraki tarihleri hesapla
  const base = new Date(date);
  const prev = new Date(base); prev.setDate(base.getDate() - 1);
  const next = new Date(base); next.setDate(base.getDate() + 1);
  const fmt = (d: Date) => d.toISOString().slice(0,10);

  // Mutlak origin: env yoksa dev için 0.0.0.0:3000 kullan
  const origin = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://0.0.0.0:3000'

  const res = await fetch(`${origin}/api/banko-coupons?date=${date}&limit=3`, { cache: "no-store" });
  const data = await res.json();
  const coupons: Array<{ id: string; title?: string | null; date: string; totalOdd: number; status: "WON" | "LOST" | "PENDING"; matches: any[] }> = Array.isArray(data) ? data : [];

  return (
    <div className="min-h-screen bg-background">
      <Header currentPath={`/banko-kuponlar/arsiv/${date}`} />
      <main className="container mx-auto px-4 py-8 md:pl-72">
        <section className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gold flex items-center gap-2"><BookOpen className="w-6 h-6" /> {formatDateTR(date)} – Günün Kuponları</h1>
          <p className="text-muted-foreground mt-2">O güne ait banko kuponları ve sonuçlarını inceleyin.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button asChild variant="outline"><a href={`/banko-kuponlar/arsiv/${fmt(prev)}`}>Önceki Gün</a></Button>
            <Button asChild variant="outline"><a href={`/banko-kuponlar/arsiv/${fmt(next)}`}>Sonraki Gün</a></Button>
            <Button asChild variant="outline"><a href={`/banko-kuponlar/arsiv`}>Tarih Seç</a></Button>
          </div>
        </section>

        {coupons.length === 0 && (
          <div className="text-center text-muted-foreground py-10">Bu tarihte kupon bulunamadı.</div>
        )}

        {coupons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon, idx) => (
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
                    {coupon.matches.map((m: any, i: number) => (
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
      </main>
      <Footer />
    </div>
  );
}