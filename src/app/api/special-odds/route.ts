import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 1), 200) : 100;

    const nowDB = new Date();
    const items = await (db as any).specialOdd.findMany({
      // Aktif olanlar her zaman görünür; ayrıca süresi geçmiş olanları da dahil et
      where: {
        OR: [{ isActive: true }, { expiresAt: { lt: nowDB } }],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: { brand: { select: { id: true, name: true, slug: true, logoUrl: true } } },
    });

    // Süresi dolanları en alta indirecek sıralama (priority desc, createdAt desc korunur)
    const now = new Date();
    const sorted = (Array.isArray(items) ? items : []).slice().sort((a: any, b: any) => {
      const aExpired = Boolean(a?.expiresAt && new Date(a.expiresAt) < now);
      const bExpired = Boolean(b?.expiresAt && new Date(b.expiresAt) < now);
      if (aExpired !== bExpired) return aExpired ? 1 : -1;
      const ap = typeof a?.priority === "number" ? a.priority : 0;
      const bp = typeof b?.priority === "number" ? b.priority : 0;
      if (ap !== bp) return bp - ap;
      const ac = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bc = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bc - ac;
    });

    return NextResponse.json({ items: sorted });
  } catch (error) {
    console.error("[PUBLIC_SPECIAL_ODDS_GET]", error);
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 });
  }
}