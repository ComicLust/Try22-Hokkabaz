import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { revalidateSiteReviewsTag } from '@/lib/cache'

const prisma: any = db

// PATCH /api/admin/site-reviews/bulk
// Body: { action: 'approve' | 'unapprove' | 'reject' | 'unreject', ids: string[] }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { action, ids } = body || {}
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids is required' }, { status: 400 })
    }
    if (!['approve','unapprove','reject','unreject'].includes(action)) {
      return NextResponse.json({ error: 'invalid action' }, { status: 400 })
    }

    let data: any = {}
    if (action === 'approve') data = { isApproved: true, isRejected: false }
    if (action === 'unapprove') data = { isApproved: false }
    if (action === 'reject') data = { isApproved: false, isRejected: true }
    if (action === 'unreject') data = { isRejected: false }

    const result = await prisma.siteReview.updateMany({ where: { id: { in: ids } }, data })
    // Revalidate affected brands' review lists with explicit typing
    const affected = await prisma.siteReview.findMany({ where: { id: { in: ids } }, select: { brandId: true } })
    const seen = new Set<string>()
    for (const r of affected as Array<{ brandId?: string | null }>) {
      const bid = r.brandId
      if (typeof bid === 'string' && bid.length && !seen.has(bid)) {
        seen.add(bid)
        revalidateSiteReviewsTag(bid)
      }
    }
    return NextResponse.json({ ok: true, count: result?.count ?? 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bulk işlem hatası' }, { status: 500 })
  }
}