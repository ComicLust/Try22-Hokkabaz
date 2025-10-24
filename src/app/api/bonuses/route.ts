import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slugifyTr } from '@/lib/slugify'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? undefined
  const active = searchParams.get('active')
  const featured = searchParams.get('featured')
  const minAmount = searchParams.get('minAmount')
  const maxAmount = searchParams.get('maxAmount')
  const bonusType = searchParams.get('bonusType') ?? undefined
  const gameCategory = searchParams.get('gameCategory') ?? undefined
  const approved = searchParams.get('approved')

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
  if (approved === 'true') where.isApproved = true
  if (approved === 'false') where.isApproved = false
  if (!approved) where.isApproved = true

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
    const title: string | undefined = body?.title
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Başlık (title) gerekli' }, { status: 400 })
    }

    // Slug üret ve benzersiz kıl
    let base = (typeof body.slug === 'string' && body.slug.trim())
      ? slugifyTr(body.slug.trim(), { withHyphens: true, maxLen: 64 })
      : slugifyTr(title, { withHyphens: true, maxLen: 64 })
    if (!base) base = 'bonus'

    let slug = base
    let counter = 2
    // Benzersizlik kontrolü
    while (true) {
      const exists = await db.bonus.findUnique({ where: { slug } })
      if (!exists) break
      slug = `${base}-${counter++}`
      if (counter > 100) {
        return NextResponse.json({ error: 'Slug benzersizleşmedi' }, { status: 400 })
      }
    }

    const created = await db.bonus.create({ data: { ...body, slug } })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}