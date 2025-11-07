import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const staticCount = 8 // static paths listed in src/app/sitemap.ts
    let brandCount = 0
    try {
      brandCount = await db.reviewBrand.count({ where: { isActive: true } })
    } catch {
      brandCount = 0
    }
    const totalUrls = staticCount + brandCount
    return NextResponse.json({ ok: true, totalUrls, staticCount, brandCount, generatedAt: new Date().toISOString() })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Status hesaplanamadı' }, { status: 500 })
  }
}