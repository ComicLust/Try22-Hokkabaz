import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/special-odds?q=search&page=1&limit=20&active=true|false|all
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || undefined
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const activeParam = (searchParams.get('active') || 'all') as 'true' | 'false' | 'all'
    const skip = (page - 1) * limit

    const where: any = {}
    if (activeParam !== 'all') where.isActive = activeParam === 'true'
    if (q) {
      where.OR = [
        { brandName: { contains: q, mode: 'insensitive' } },
        { matchTitle: { contains: q, mode: 'insensitive' } },
        { oddsLabel: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      (db as any).specialOdd.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: { brand: { select: { id: true, name: true, slug: true } } },
      }),
      (db as any).specialOdd.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Listeleme hatası' }, { status: 500 })
  }
}

// POST /api/admin/special-odds
// body: { brandName, matchTitle, oddsLabel, conditions?, imageUrl?, ctaUrl?, expiresAt?, isActive?, brandId?, brandSlug? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      brandName,
      matchTitle,
      oddsLabel,
      conditions,
      imageUrl,
      ctaUrl,
      expiresAt,
      isActive,
      brandId,
      brandSlug,
    } = body || {}

    if (!brandName || !matchTitle || !oddsLabel) {
      return NextResponse.json({ error: 'brandName, matchTitle ve oddsLabel zorunludur' }, { status: 400 })
    }

    // Opsiyonel marka bağlama
    let connectBrandId: string | null = null
    if (brandId && typeof brandId === 'string') {
      connectBrandId = brandId
    } else if (brandSlug && typeof brandSlug === 'string') {
      const b = await (db as any).reviewBrand.findUnique({ where: { slug: String(brandSlug) }, select: { id: true } })
      connectBrandId = b?.id ?? null
    }

    const created = await (db as any).specialOdd.create({
      data: {
        brandName: String(brandName),
        matchTitle: String(matchTitle),
        oddsLabel: String(oddsLabel),
        conditions: conditions ? String(conditions) : null,
        imageUrl: imageUrl ? String(imageUrl) : null,
        ctaUrl: ctaUrl ? String(ctaUrl) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        // expiresAt verilmiş ve geçmişse otomatik inaktif kabul et; aksi halde aktif
        isActive:
          typeof isActive === 'boolean'
            ? isActive
            : (expiresAt ? new Date(expiresAt) : null)?.getTime?.() && new Date(expiresAt).getTime() < Date.now()
              ? false
              : true,
        // priority: en sona eklenir
        priority: 0,
        brandId: connectBrandId,
      },
    })

    return NextResponse.json(created)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Oluşturma hatası' }, { status: 500 })
  }
}