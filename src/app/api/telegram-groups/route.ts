import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { Prisma, TelegramType } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? undefined
  const featured = searchParams.get('featured')
  const typeRaw = searchParams.get('type') ?? undefined

  const where: Prisma.TelegramGroupWhereInput = {}
  if (q) {
    // SQLite'da case-insensitive mod desteklenmediği için sade contains kullanıyoruz
    where.name = { contains: q }
  }
  if (featured === 'true') where.isFeatured = true
  if (featured === 'false') where.isFeatured = false
  if (typeRaw === 'CHANNEL' || typeRaw === 'GROUP') {
    where.type = { equals: typeRaw as TelegramType }
  }

  // Prisma tipleri 'priority' alanını orderBy için tanımamış olabilir.
  // Bu nedenle DB sıralamasını güvenli alanlarla yapıp, ardından öncelik bazlı sıralamayı hafızada uyguluyoruz.
  const items = await db.telegramGroup.findMany({
    where,
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
  })
  const sorted = items.slice().sort((a: any, b: any) => {
    // 1) isFeatured desc
    const f = Number(b.isFeatured) - Number(a.isFeatured)
    if (f !== 0) return f
    // 2) priority desc (tanımsız ise 0)
    const ap = typeof a.priority === 'number' ? a.priority : 0
    const bp = typeof b.priority === 'number' ? b.priority : 0
    const p = bp - ap
    if (p !== 0) return p
    // 3) createdAt desc
    const at = new Date(a.createdAt).getTime()
    const bt = new Date(b.createdAt).getTime()
    return bt - at
  })
  return NextResponse.json(sorted)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const created = await db.telegramGroup.create({ data: body })
    revalidatePath('/guvenilir-telegram')
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}