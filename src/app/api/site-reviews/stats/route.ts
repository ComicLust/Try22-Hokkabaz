import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
const prisma: any = db

// Returns review stats per site: counts of approved reviews, last review date,
// and tone breakdown (positive/negative) among approved reviews.
export async function GET() {
  const [brands, basicGroups, toneGroups] = await Promise.all([
    prisma.reviewBrand.findMany({ select: { id: true, slug: true, name: true, logoUrl: true, createdAt: true, isActive: true } }),
    prisma.siteReview.groupBy({
      by: ['brandId'],
      where: { isApproved: true },
      _count: { _all: true },
      _max: { createdAt: true },
    }),
    prisma.siteReview.groupBy({
      by: ['brandId', 'isPositive'],
      where: { isApproved: true },
      _count: { _all: true },
    }),
  ])

  const stats = brands.map((b) => {
    const g = basicGroups.find((x: any) => x.brandId === b.id)
    const pos = toneGroups.find((x: any) => x.brandId === b.id && x.isPositive === true)?._count?._all ?? 0
    const neg = toneGroups.find((x: any) => x.brandId === b.id && x.isPositive === false)?._count?._all ?? 0
    return {
      brandId: b.id,
      slug: b.slug,
      name: b.name,
      logoUrl: b.logoUrl,
      createdAt: b.createdAt,
      isActive: b.isActive,
      reviewCount: g?._count?._all ?? 0,
      lastReviewAt: g?._max?.createdAt ?? null,
      positiveCount: pos,
      negativeCount: neg,
    }
  })

  return NextResponse.json(stats)
}