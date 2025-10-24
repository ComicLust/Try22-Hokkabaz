import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const brandId = req.cookies.get('brand_id')?.value
    if (!brandId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const prisma: any = db
    const [total, pending, live] = await Promise.all([
      prisma.bonus.count({ where: { brandId } }),
      prisma.bonus.count({ where: { brandId, isApproved: false } }),
      prisma.bonus.count({ where: { brandId, isApproved: true, isActive: true } }),
    ])

    const brand = await db.reviewBrand.findUnique({ where: { id: brandId } })

    return NextResponse.json({
      brand: brand ? { id: brand.id, name: brand.name, logoUrl: brand.logoUrl } : null,
      stats: { total, pending, live },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Yükleme hatası' }, { status: 500 })
  }
}