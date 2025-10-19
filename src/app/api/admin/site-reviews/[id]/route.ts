import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const prisma: any = db

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await req.json().catch(() => ({}))
    const { action, content, author, isAnonymous, isPositive } = body || {}

    if (action === 'approve') {
      const updated = await prisma.siteReview.update({ where: { id }, data: { isApproved: true } })
      return NextResponse.json(updated)
    }
    if (action === 'unapprove') {
      const updated = await prisma.siteReview.update({ where: { id }, data: { isApproved: false } })
      return NextResponse.json(updated)
    }
    if (action === 'reject') {
      const updated = await prisma.siteReview.update({ where: { id }, data: { isApproved: false, isRejected: true } })
      return NextResponse.json(updated)
    }
    if (action === 'unreject') {
      const updated = await prisma.siteReview.update({ where: { id }, data: { isRejected: false } })
      return NextResponse.json(updated)
    }

    const data: any = {}
    if (typeof content === 'string') data.content = content
    if (typeof author === 'string') data.author = author.length ? author : null
    if (typeof isAnonymous === 'boolean') data.isAnonymous = isAnonymous
    if (typeof isPositive === 'boolean') data.isPositive = isPositive

    const updated = await prisma.siteReview.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Güncelleme hatası' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    await prisma.siteReview.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Silme hatası' }, { status: 500 })
  }
}