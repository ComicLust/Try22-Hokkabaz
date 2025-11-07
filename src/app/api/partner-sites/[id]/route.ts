import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { revalidateTag } from 'next/cache'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = await db.partnerSite.findUnique({ where: { id: params.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const updated = await db.partnerSite.update({ where: { id: params.id }, data: body })
    // Anasayfa partner-sites cache'ini temizle
    revalidateTag('home:partner-sites')
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.partnerSite.delete({ where: { id: params.id } })
    // Anasayfa partner-sites cache'ini temizle
    revalidateTag('home:partner-sites')
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}