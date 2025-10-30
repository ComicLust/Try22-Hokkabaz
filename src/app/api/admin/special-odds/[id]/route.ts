import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = await (db as any).specialOdd.findUnique({ where: { id: params.id }, include: { brand: { select: { id: true, name: true, slug: true } } } })
  if (!item) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const patch = await req.json()
    const data: any = {}
    if (typeof patch.brandName !== 'undefined') data.brandName = String(patch.brandName)
    if (typeof patch.matchTitle !== 'undefined') data.matchTitle = String(patch.matchTitle)
    if (typeof patch.oddsLabel !== 'undefined') data.oddsLabel = String(patch.oddsLabel)
    if (typeof patch.conditions !== 'undefined') data.conditions = patch.conditions ? String(patch.conditions) : null
    if (typeof patch.imageUrl !== 'undefined') data.imageUrl = patch.imageUrl ? String(patch.imageUrl) : null
    if (typeof patch.ctaUrl !== 'undefined') data.ctaUrl = patch.ctaUrl ? String(patch.ctaUrl) : null
    if (typeof patch.expiresAt !== 'undefined') data.expiresAt = patch.expiresAt ? new Date(patch.expiresAt) : null
    if (typeof patch.isActive !== 'undefined') data.isActive = !!patch.isActive
    if (typeof patch.priority === 'number') data.priority = patch.priority
    // Marka bağlama/çözme
    if (typeof patch.brandId !== 'undefined') {
      data.brandId = patch.brandId ? String(patch.brandId) : null
    } else if (typeof patch.brandSlug !== 'undefined') {
      if (patch.brandSlug) {
        const b = await (db as any).reviewBrand.findUnique({ where: { slug: String(patch.brandSlug) }, select: { id: true } })
        data.brandId = b?.id ?? null
      } else {
        data.brandId = null
      }
    }

    const updated = await (db as any).specialOdd.update({ where: { id: params.id }, data })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Güncelleme hatası' }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await (db as any).specialOdd.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Silme hatası' }, { status: 400 })
  }
}