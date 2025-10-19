import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
const prisma: any = db

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.reviewBrand.findUnique({ where: { id: params.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const patch = await req.json()
    const updated = await prisma.reviewBrand.update({ where: { id: params.id }, data: patch })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Güncelleme hatası' }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.reviewBrand.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Silme hatası' }, { status: 400 })
  }
}