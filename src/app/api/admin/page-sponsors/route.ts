import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isSafeHttpUrl, isSafeLocalUploadPath, sanitizeText } from '@/lib/security'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const pageKey = url.searchParams.get('pageKey') ?? 'canli-mac-izle'
    const items = await (db as any).pageSponsor?.findMany?.({
      where: { pageKey },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ items: items ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Listeleme hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({})) as any
    const pageKey: string = body?.pageKey ?? 'canli-mac-izle'
    const sponsors: any[] = Array.isArray(body?.sponsors) ? body.sponsors : []

    const results: any[] = []
    for (const s of sponsors) {
      const desktopImg = typeof s.desktopImageUrl === 'string' && isSafeLocalUploadPath(s.desktopImageUrl) ? s.desktopImageUrl : null
      const mobileImg = typeof s.mobileImageUrl === 'string' && isSafeLocalUploadPath(s.mobileImageUrl) ? s.mobileImageUrl : null
      const fallbackImage = desktopImg ?? mobileImg
      if (!fallbackImage) {
        throw new Error('En az bir banner görseli (desktop/mobile) gerekiyor ve /uploads/ altında olmalı')
      }

      const clickUrl = s.clickUrl && typeof s.clickUrl === 'string' && isSafeHttpUrl(s.clickUrl, { allowHttp: false }) ? s.clickUrl : null
      const altText = sanitizeText(s.altText ?? '', 200)

      // find existing by pageKey + placement
      const existing = await (db as any).pageSponsor?.findFirst?.({ where: { pageKey, placement: s.placement } })
      if (existing) {
        const updated = await (db as any).pageSponsor?.update?.({
          where: { id: existing.id },
          data: {
            imageUrl: fallbackImage,
            desktopImageUrl: desktopImg,
            mobileImageUrl: mobileImg,
            clickUrl: clickUrl,
            altText: altText || null,
          },
        })
        results.push(updated)
      } else {
        const created = await (db as any).pageSponsor?.create?.({
          data: {
            pageKey,
            placement: s.placement,
            imageUrl: fallbackImage,
            desktopImageUrl: desktopImg,
            mobileImageUrl: mobileImg,
            clickUrl: clickUrl,
            altText: altText || null,
          },
        })
        results.push(created)
      }
    }

    return NextResponse.json({ items: results })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Kaydetme hatası' }, { status: 500 })
  }
}