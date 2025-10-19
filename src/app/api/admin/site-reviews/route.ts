import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Use a permissive alias to avoid Prisma delegate typing issues in editors
const prisma: any = db

// GET /api/admin/site-reviews?status=pending|approved|all&brandSlug=slug&q=search&page=1&limit=20
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const statusParam = (searchParams.get('status') || 'pending') as 'pending' | 'approved' | 'rejected' | 'all'
    const brandSlug = searchParams.get('brandSlug') || undefined
    const q = searchParams.get('q') || undefined
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    const where: any = {}
    if (statusParam === 'pending') { where.isApproved = false; where.isRejected = false }
    if (statusParam === 'approved') where.isApproved = true
    if (statusParam === 'rejected') where.isRejected = true

    if (brandSlug) {
      const brand = await prisma.reviewBrand.findUnique({ where: { slug: brandSlug } })
      if (!brand) {
        return NextResponse.json({ items: [], total: 0, page, limit })
      }
      where.brandId = brand.id
    }

    if (q) {
      where.content = { contains: q }
    }

    const [items, total] = await Promise.all([
      prisma.siteReview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
        },
      }),
      prisma.siteReview.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Listeleme hatası' }, { status: 500 })
  }
}