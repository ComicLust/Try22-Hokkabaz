import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/admin/bonuses/bulk
// Body: { action: 'approve' | 'unapprove', ids: string[] }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { action, ids } = body || {}
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids is required' }, { status: 400 })
    }
    if (!['approve','unapprove'].includes(action)) {
      return NextResponse.json({ error: 'invalid action' }, { status: 400 })
    }

    const data: any = {}
    if (action === 'approve') data.isApproved = true
    if (action === 'unapprove') data.isApproved = false

    const result = await (db as any).bonus.updateMany({ where: { id: { in: ids } }, data })
    return NextResponse.json({ ok: true, count: result?.count ?? 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bulk işlem hatası' }, { status: 500 })
  }
}