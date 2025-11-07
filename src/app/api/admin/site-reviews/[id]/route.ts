import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { revalidateSiteReviewsTag } from '@/lib/cache'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await req.json().catch(() => ({}))
    const { action, content, author, isAnonymous, isPositive } = body || {}

    if (action === 'approve') {
      const updated = await db.siteReview.update({ where: { id }, data: { isApproved: true }, select: { id: true, brandId: true, isApproved: true } })
      revalidateSiteReviewsTag(updated.brandId)
      return NextResponse.json(updated)
    }
    if (action === 'unapprove') {
      const updated = await db.siteReview.update({ where: { id }, data: { isApproved: false }, select: { id: true, brandId: true, isApproved: true } })
      revalidateSiteReviewsTag(updated.brandId)
      return NextResponse.json(updated)
    }
    if (action === 'reject') {
      const updated = await db.siteReview.update({ where: { id }, data: { isApproved: false, isRejected: true }, select: { id: true, brandId: true, isApproved: true, isRejected: true } })
      revalidateSiteReviewsTag(updated.brandId)
      return NextResponse.json(updated)
    }
    if (action === 'unreject') {
      const updated = await db.siteReview.update({ where: { id }, data: { isRejected: false }, select: { id: true, brandId: true, isRejected: true } })
      revalidateSiteReviewsTag(updated.brandId)
      return NextResponse.json(updated)
    }

    const data: Prisma.SiteReviewUpdateInput = {}
    if (typeof content === 'string') data.content = content
    if (typeof author === 'string') data.author = author.length ? author : null
    if (typeof isAnonymous === 'boolean') data.isAnonymous = isAnonymous
    if (typeof isPositive === 'boolean') data.isPositive = isPositive

    const updated = await db.siteReview.update({ where: { id }, data, select: { id: true, brandId: true, author: true, content: true, isAnonymous: true, isPositive: true } })
    revalidateSiteReviewsTag(updated.brandId)
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Güncelleme hatası' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const existing = await db.siteReview.findUnique({ where: { id }, select: { brandId: true } })
    await db.siteReview.delete({ where: { id } })
    if (existing?.brandId) revalidateSiteReviewsTag(existing.brandId)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Silme hatası' }, { status: 500 })
  }
}