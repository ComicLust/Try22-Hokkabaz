import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = await db.user.findUnique({ where: { id: params.id } })
  if (!item) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const patch = await req.json()
    const data: Prisma.UserUpdateInput = {}
    if (patch.email) data.email = patch.email
    if (typeof patch.name !== 'undefined') data.name = patch.name

    const updated = await db.user.update({ where: { id: params.id }, data })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Güncelleme hatası' }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.user.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Silme hatası' }, { status: 400 })
  }
}