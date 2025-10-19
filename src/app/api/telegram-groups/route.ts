import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? undefined
  const featured = searchParams.get('featured')
  const type = searchParams.get('type') ?? undefined

  const where: any = {}
  if (q) {
    where.name = { contains: q, mode: 'insensitive' }
  }
  if (featured === 'true') where.isFeatured = true
  if (featured === 'false') where.isFeatured = false
  if (type) where.type = { equals: type }

  const items = await (db as any).telegramGroup.findMany({
    where,
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const created = await (db as any).telegramGroup.create({ data: body })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}