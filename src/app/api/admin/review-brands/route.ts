import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const brands = await (db as any).reviewBrand.findMany({
      where: { isActive: true },
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
    return NextResponse.json({ brands });
  } catch (error) {
    console.error("[ADMIN_REVIEW_BRANDS_GET]", error);
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 });
  }
}