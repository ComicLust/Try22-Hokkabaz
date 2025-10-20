import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

function dicebearAvatar(seed: string) {
  const s = encodeURIComponent(seed)
  return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${s}&size=64&radius=50&backgroundType=gradientLinear`
}

// List approved reviews for a site (by slug) with sorting and pagination
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brandSlug = searchParams.get('brandSlug') || searchParams.get('siteSlug') || undefined
  const sort = (searchParams.get('sort') || 'newest') as 'newest' | 'oldest'
  const page = Number(searchParams.get('page') || '1')
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')))

  if (!brandSlug) return NextResponse.json({ error: 'brandSlug is required' }, { status: 400 })

  const brand = await db.reviewBrand.findUnique({ where: { slug: brandSlug } })
  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

  const orderBy = sort === 'newest' ? { createdAt: 'desc' as const } : { createdAt: 'asc' as const }
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    db.siteReview.findMany({
      where: { brandId: brand.id, isApproved: true },
      orderBy,
      skip,
      take: limit,
    }),
    db.siteReview.count({ where: { brandId: brand.id, isApproved: true } }),
  ])

  // One-time backfill: Assign random avatar to reviews missing avatarUrl
  const toFill = items.filter((i: any) => !i.avatarUrl)
  if (toFill.length > 0) {
    await Promise.all(
      toFill.map((i: any) => {
        const url = dicebearAvatar(randomUUID())
        i.avatarUrl = url // reflect in response immediately
        return db.siteReview.update({ where: { id: i.id }, data: { avatarUrl: url } })
      })
    )
  }

  return NextResponse.json({ items, total, page, limit })
}

// Create a new review (goes into approval queue)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { brandSlug, siteSlug, author, isAnonymous, content, isPositive } = body || {}
    const slug = brandSlug || siteSlug
    if (!slug || !content) return NextResponse.json({ error: 'brandSlug and content are required' }, { status: 400 })

    const brand = await db.reviewBrand.findUnique({ where: { slug } })
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

    const avatarUrl = dicebearAvatar(randomUUID())

    const created = await db.siteReview.create({
      data: {
        brandId: brand.id,
        author: isAnonymous ? null : (author || null),
        isAnonymous: Boolean(isAnonymous),
        rating: null,
        isPositive: typeof isPositive === 'boolean' ? isPositive : null,
        content: String(content),
        isApproved: false,
        avatarUrl,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}