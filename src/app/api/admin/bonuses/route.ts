import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/bonuses?status=pending|approved|all&brandSlug=slug&q=search&page=1&limit=20
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const statusParam = (searchParams.get('status') || 'pending') as 'pending' | 'approved' | 'all'
    const brandSlug = searchParams.get('brandSlug') || undefined
    const q = searchParams.get('q') || undefined
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    const where: any = {}
    if (statusParam === 'pending') where.isApproved = false
    if (statusParam === 'approved') where.isApproved = true
    // 'all' => no filter on isApproved

    if (brandSlug) {
      const brand = await db.reviewBrand.findUnique({ where: { slug: brandSlug } })
      if (!brand) {
        return NextResponse.json({ items: [], total: 0, page, limit })
      }
      where.brandId = brand.id
    }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { slug: { contains: q } },
      ]
    }

    const [items, total] = await Promise.all([
      (db as any).bonus.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
        },
      }),
      (db as any).bonus.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Listeleme hatası' }, { status: 500 })
  }
}