import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/admin/special-odds/reorder
// body: { orderedIds: string[] } - en yüksek öncelik listedeki ilk elemana atanır
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const orderedIds: string[] = Array.isArray(body?.orderedIds) ? body.orderedIds : []
    if (!orderedIds.length) {
      return NextResponse.json({ error: 'orderedIds gerekli' }, { status: 400 })
    }

    // Mevcut tüm id'lerin varlığını doğrula ve duplicate'leri temizle
    const uniqueIds = Array.from(new Set(orderedIds))
    const existing = await (db as any).specialOdd.findMany({ where: { id: { in: uniqueIds } }, select: { id: true } })
    const existingSet = new Set(existing.map((e) => e.id))
    const validOrder = uniqueIds.filter((id) => existingSet.has(id))
    if (!validOrder.length) {
      return NextResponse.json({ error: 'Geçerli id bulunamadı' }, { status: 400 })
    }

    // En üstten en alta doğru azalan priority verelim (büyük sayı üstte)
    const startPriority = validOrder.length
    const ops = validOrder.map((id, idx) => (db as any).specialOdd.update({ where: { id }, data: { priority: startPriority - idx } }))
    await db.$transaction(ops)

    return NextResponse.json({ ok: true, count: validOrder.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Sıralama hatası' }, { status: 500 })
  }
}