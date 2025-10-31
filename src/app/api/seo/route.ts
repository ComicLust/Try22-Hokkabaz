import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = searchParams.get('page') ?? undefined
  if (page) {
    // Sayfa anahtarı hem "/path" hem de "path" biçiminde gelebilir.
    // DB'de geçmiş kayıtlar çoğunlukla slash'sız tutulduğu için iki varyantı da dene.
    const variants = Array.from(new Set([page, page.replace(/^\/+/,'')].filter(Boolean)))
    let item: any = null
    for (const key of variants) {
      const found = await (db as any).seoSetting.findUnique({ where: { page: key }, select: {
        id: true, page: true, title: true, description: true, keywords: true, canonicalUrl: true, ogTitle: true, ogDescription: true, ogImageUrl: true, ogLogoUrl: true, twitterTitle: true, twitterDescription: true, twitterImageUrl: true, robotsIndex: true, robotsFollow: true, structuredData: true,
      } })
      if (found) { item = found; break }
    }
    return NextResponse.json(item ?? null)
  }
  const items = await (db as any).seoSetting.findMany({ orderBy: { page: 'asc' }, select: {
    id: true, page: true, title: true, description: true, keywords: true, canonicalUrl: true, ogTitle: true, ogDescription: true, ogImageUrl: true, ogLogoUrl: true, twitterTitle: true, twitterDescription: true, twitterImageUrl: true, robotsIndex: true, robotsFollow: true, structuredData: true,
  } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Tutarlılık: DB'de slug'ı slash'sız sakla
    const normalizedPage = String(body?.page ?? '').trim().replace(/^\/+/,'')
    if (!normalizedPage) {
      return NextResponse.json({ error: 'page alanı zorunlu' }, { status: 400 })
    }
    body.page = normalizedPage
    
    // Unique constraint kontrolü - aynı page değerine sahip kayıt var mı?
    const existingRecord = await (db as any).seoSetting.findUnique({ 
      where: { page: normalizedPage },
      select: { id: true }
    })
    
    if (existingRecord) {
      return NextResponse.json({ 
        error: `Bu sayfa için zaten bir SEO kaydı mevcut: ${normalizedPage}` 
      }, { status: 409 })
    }
    
    const created = await (db as any).seoSetting.create({ data: body })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}