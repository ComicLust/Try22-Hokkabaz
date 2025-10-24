import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/carousel/reorder
// Body: { updates: Array<{ id: string; order: number }> }
// Performs a two-phase update to avoid unique constraint collisions on `order`
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const updates: Array<{ id: string; order: number }> = Array.isArray(body?.updates) ? body.updates : []
    if (!updates.length) {
      return NextResponse.json({ error: 'updates is required' }, { status: 400 })
    }

    // Validate IDs exist (optional but helpful)
    const ids = updates.map(u => u.id)
    const existing = await db.carouselSlide.findMany({ where: { id: { in: ids } }, select: { id: true } })
    const existingIds = new Set(existing.map(e => e.id))
    const missing = ids.filter(id => !existingIds.has(id))
    if (missing.length) {
      return NextResponse.json({ error: `Missing ids: ${missing.join(', ')}` }, { status: 400 })
    }

    // Two-phase update: first set temporary orders to avoid collisions, then finalize
    const TEMP_OFFSET = 1000
    const phase1 = updates.map(u => db.carouselSlide.update({ where: { id: u.id }, data: { order: u.order + TEMP_OFFSET } }))
    const phase2 = updates.map(u => db.carouselSlide.update({ where: { id: u.id }, data: { order: u.order } }))

    await db.$transaction([...phase1, ...phase2])

    return NextResponse.json({ ok: true, count: updates.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Reorder error' }, { status: 400 })
  }
}