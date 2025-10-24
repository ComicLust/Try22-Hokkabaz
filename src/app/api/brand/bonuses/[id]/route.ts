import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const brandId = req.cookies.get('brand_id')?.value
    if (!brandId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const item = await (db as any).bonus.findUnique({ where: { id: params.id } })
    if (!item || item.brandId !== brandId) {
      return NextResponse.json({ error: 'Yetkisiz işlem' }, { status: 403 })
    }
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Yükleme hatası' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const brandId = req.cookies.get('brand_id')?.value
    if (!brandId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const bonus = await (db as any).bonus.findUnique({ where: { id: params.id } })
    if (!bonus || bonus.brandId !== brandId) {
      return NextResponse.json({ error: 'Yetkisiz işlem' }, { status: 403 })
    }

    // Onay beklerken düzenleme yapılamaz
    if (bonus.isApproved === false) {
      return NextResponse.json({ error: 'Onay beklerken düzenleme yapılamaz' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const {
      title,
      description,
      shortDescription,
      bonusType,
      gameCategory,
      amount,
      wager,
      minDeposit,
      imageUrl,
      postImageUrl,
      ctaUrl,
      badges,
      validityText,
      startDate,
      endDate,
      features,
      // ignored: isFeatured, isActive, priority, slug
    } = body || {}

    const data: Prisma.BonusUpdateInput = { isApproved: false }
    if (typeof title === 'string') data.title = title
    if (typeof description !== 'undefined') data.description = description || null
    if (typeof shortDescription !== 'undefined') data.shortDescription = shortDescription || null
    if (typeof bonusType !== 'undefined') data.bonusType = bonusType || null
    if (typeof gameCategory !== 'undefined') data.gameCategory = gameCategory || null
    if (typeof amount !== 'undefined') data.amount = typeof amount === 'number' ? amount : null
    if (typeof wager !== 'undefined') data.wager = typeof wager === 'number' ? wager : null
    if (typeof minDeposit !== 'undefined') data.minDeposit = typeof minDeposit === 'number' ? minDeposit : null
    if (typeof imageUrl !== 'undefined') data.imageUrl = imageUrl || null
    if (typeof postImageUrl !== 'undefined') data.postImageUrl = postImageUrl || null
    if (typeof ctaUrl !== 'undefined') data.ctaUrl = ctaUrl || null
    if (typeof badges !== 'undefined') data.badges = Array.isArray(badges) ? badges : undefined
    if (typeof validityText !== 'undefined') data.validityText = validityText || null
    if (typeof startDate !== 'undefined') data.startDate = startDate ? new Date(startDate) : null
    if (typeof endDate !== 'undefined') data.endDate = endDate ? new Date(endDate) : null
    if (typeof features !== 'undefined') data.features = Array.isArray(features) ? features : undefined

    const updated = await (db as any).bonus.update({ where: { id: params.id }, data })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Güncelleme hatası' }, { status: 500 })
  }
}