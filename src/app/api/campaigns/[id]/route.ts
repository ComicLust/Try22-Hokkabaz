import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { revalidateTag } from 'next/cache'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const item = await db.campaign.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json()
    const { id } = await context.params
    const updated = await db.campaign.update({ where: { id }, data: body })
    // Anasayfa kampanyalar cache'ini temizle
    revalidateTag('home:campaigns')
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await db.campaign.delete({ where: { id } })
    // Anasayfa kampanyalar cache'ini temizle
    revalidateTag('home:campaigns')
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}