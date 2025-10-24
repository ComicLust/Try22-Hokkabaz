import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

export async function GET(req: NextRequest) {
  try {
    const brandId = req.cookies.get('brand_id')?.value
    if (!brandId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const items = await (db as any).bonus.findMany({
      where: { brandId },
      orderBy: [{ createdAt: 'desc' }],
    })
    return NextResponse.json(items)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Listeleme hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const brandId = req.cookies.get('brand_id')?.value
    if (!brandId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
      slug,
    } = body || {}

    if (typeof title !== 'string' || !title.length) {
      return NextResponse.json({ error: 'Başlık gerekli' }, { status: 400 })
    }

    // Try to resolve current brand manager from cookies
    const token = req.cookies.get('brand_token')?.value
    const secret = process.env.BRAND_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'dev-secret'
    let createdByLoginId: string | undefined
    let createdByName: string | undefined
    if (token) {
      const managers = await (db as any).brandManager.findMany({ where: { brandId } })
      for (const m of managers) {
        const expected = await sha256Hex(`${m.loginId}:${m.passwordHash}:${secret}`)
        if (expected === token) {
          createdByLoginId = m.loginId
          createdByName = m.name || undefined
          break
        }
      }
    }

    // Generate unique slug if not provided
    async function generateUniqueSlug(rawSlug?: string, titleForSlug?: string): Promise<string> {
      const baseCandidate = (rawSlug && typeof rawSlug === 'string' && rawSlug.trim()) ? rawSlug.trim() : (titleForSlug || '')
      // Basic slugify: lower-case, spaces to hyphens, remove non-word
      let base = baseCandidate
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-ıiöüğç]/g, '')
      if (!base) base = 'bonus'
      let slugCandidate = base
      let counter = 2
      while (true) {
        const exists = await (db as any).bonus.findUnique({ where: { slug: slugCandidate } })
        if (!exists) break
        slugCandidate = `${base}-${counter++}`
        if (counter > 100) break
      }
      return slugCandidate
    }

    const finalSlug = await generateUniqueSlug(slug, title)

    const data: Prisma.BonusCreateInput = {
      title,
      slug: finalSlug,
      description: description || null,
      shortDescription: shortDescription || null,
      bonusType: bonusType || null,
      gameCategory: gameCategory || null,
      amount: typeof amount === 'number' ? amount : null,
      wager: typeof wager === 'number' ? wager : null,
      minDeposit: typeof minDeposit === 'number' ? minDeposit : null,
      imageUrl: imageUrl || null,
      postImageUrl: postImageUrl || null,
      ctaUrl: ctaUrl || null,
      badges: badges || undefined,
      validityText: validityText || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      features: features || undefined,
      isActive: true,
      isFeatured: false,
      priority: 0,
      isApproved: false,
      createdByLoginId: createdByLoginId,
      createdByName: createdByName,
      brand: brandId ? { connect: { id: brandId } } : undefined,
    }

    const created = await (db as any).bonus.create({ data })
    return NextResponse.json(created)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Oluşturma hatası' }, { status: 500 })
  }
}