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

  const items = await db.telegramGroup.findMany({
    where,
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(items)
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