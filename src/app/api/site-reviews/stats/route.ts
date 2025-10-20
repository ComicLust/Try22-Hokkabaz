import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Returns review stats per site: counts of approved reviews and tone breakdown
export async function GET() {
  const [brands, countGroups, toneGroups, latestItems] = await Promise.all([
    db.reviewBrand.findMany({ select: { id: true, slug: true, name: true, logoUrl: true, createdAt: true, isActive: true } }),
    db.siteReview.groupBy({
      by: ['brandId'],
      where: { isApproved: true },
      _count: { _all: true },
    }),
    db.siteReview.groupBy({
      by: ['brandId', 'isPositive'],
      where: { isApproved: true },
      _count: { _all: true },
    }),
    db.siteReview.findMany({
      where: { isApproved: true },
      select: { brandId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Build lastReviewAt per brand from latestItems in memory to avoid DateTime conversion issues
  const lastMap = new Map<string, string | null>()
  for (const item of latestItems) {
    if (!lastMap.has(item.brandId)) {
      // Normalize to ISO-like format for client-side parsing
      const val: string = typeof item.createdAt === 'string' ? item.createdAt.replace(' ', 'T') : new Date(item.createdAt).toISOString()
      lastMap.set(item.brandId, val)
    }
  }

  const stats = brands.map((b) => {
    const g = countGroups.find((x) => x.brandId === b.id)
    const pos = toneGroups.find((x) => x.brandId === b.id && x.isPositive === true)?._count?._all ?? 0
    const neg = toneGroups.find((x) => x.brandId === b.id && x.isPositive === false)?._count?._all ?? 0
    return {
      brandId: b.id,
      slug: b.slug,
      name: b.name,
      logoUrl: b.logoUrl,
      createdAt: b.createdAt,
      isActive: b.isActive,
      reviewCount: g?._count?._all ?? 0,
      lastReviewAt: lastMap.get(b.id) ?? null,
      positiveCount: pos,
      negativeCount: neg,
    }
  })

  return NextResponse.json(stats)
}