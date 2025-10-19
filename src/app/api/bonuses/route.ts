import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? undefined
  const active = searchParams.get('active')
  const featured = searchParams.get('featured')
  const minAmount = searchParams.get('minAmount')
  const maxAmount = searchParams.get('maxAmount')
  const bonusType = searchParams.get('bonusType') ?? undefined
  const gameCategory = searchParams.get('gameCategory') ?? undefined

  const where: any = {}
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (active === 'true') where.isActive = true
  if (active === 'false') where.isActive = false
  if (featured === 'true') where.isFeatured = true
  if (featured === 'false') where.isFeatured = false
  if (minAmount) where.amount = { ...(where.amount || {}), gte: Number(minAmount) }
  if (maxAmount) where.amount = { ...(where.amount || {}), lte: Number(maxAmount) }
  if (bonusType) where.bonusType = { equals: bonusType }
  if (gameCategory) where.gameCategory = { equals: gameCategory }

  const items = await db.bonus.findMany({
    where,
    orderBy: [
      { isFeatured: 'desc' },
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const created = await db.bonus.create({ data: body })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}