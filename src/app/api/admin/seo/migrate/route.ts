import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const fromSlug = String(body?.fromSlug || '').trim()
    const toSlug = String(body?.toSlug || '').trim()

    if (!fromSlug || !toSlug) {
      return NextResponse.json({ ok: false, error: 'fromSlug ve toSlug zorunlu' }, { status: 400 })
    }
    if (fromSlug === toSlug) {
      return NextResponse.json({ ok: false, error: 'fromSlug ve toSlug farklı olmalı' }, { status: 400 })
    }

    const from = await (db as any).seoSetting.findUnique({ where: { page: fromSlug } })
    const to = await (db as any).seoSetting.findUnique({ where: { page: toSlug } })

    if (!from) {
      return NextResponse.json({ ok: false, error: 'Kaynak slug için kayıt bulunamadı' }, { status: 404 })
    }

    // Eğer hedef yoksa: doğrudan slugı güncelle
    if (!to) {
      const updated = await (db as any).seoSetting.update({ where: { id: from.id }, data: { page: toSlug } })
      return NextResponse.json({ ok: true, action: 'renamed', moved: 1, record: updated })
    }

    // Hedef varsa: hedefte eksik olan alanları kaynakla doldur, sonra kaynağı sil
    const merged = {
      title: from.title ?? to.title,
      description: from.description ?? to.description,
      keywords: from.keywords ?? to.keywords,
      canonicalUrl: from.canonicalUrl ?? to.canonicalUrl,
      ogType: from.ogType ?? to.ogType,
      ogTitle: from.ogTitle ?? to.ogTitle,
      ogDescription: from.ogDescription ?? to.ogDescription,
      ogImageUrl: from.ogImageUrl ?? to.ogImageUrl,
      ogLogoUrl: from.ogLogoUrl ?? to.ogLogoUrl,
      twitterTitle: from.twitterTitle ?? to.twitterTitle,
      twitterDescription: from.twitterDescription ?? to.twitterDescription,
      twitterImageUrl: from.twitterImageUrl ?? to.twitterImageUrl,
      robotsIndex: from.robotsIndex ?? to.robotsIndex,
      robotsFollow: from.robotsFollow ?? to.robotsFollow,
      structuredData: from.structuredData ?? to.structuredData,
    }

    const updatedTo = await (db as any).seoSetting.update({ where: { id: to.id }, data: merged })
    await (db as any).seoSetting.delete({ where: { id: from.id } })

    return NextResponse.json({ ok: true, action: 'merged', moved: 1, record: updatedTo })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Slug taşıma hatası' }, { status: 500 })
  }
}