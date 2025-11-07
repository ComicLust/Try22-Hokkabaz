import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { revalidateTag } from 'next/cache'

// PATCH /api/admin/bonuses/:id
// Body: { action: 'approve' | 'unapprove' } or general bonus updates (limited)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await req.json().catch(() => ({}))
    const { action } = body || {}

    if (action === 'approve') {
      const updated = await (db as any).bonus.update({ where: { id }, data: { isApproved: true } })
      // Anasayfa bonus listesi cache'ini temizle
      revalidateTag('home:bonuses')
      return NextResponse.json(updated)
    }
    if (action === 'unapprove') {
      const updated = await (db as any).bonus.update({ where: { id }, data: { isApproved: false } })
      // Anasayfa bonus listesi cache'ini temizle
      revalidateTag('home:bonuses')
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Güncelleme hatası' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    await (db as any).bonus.delete({ where: { id } })
    // Anasayfa bonus listesi cache'ini temizle
    revalidateTag('home:bonuses')
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Silme hatası' }, { status: 500 })
  }
}