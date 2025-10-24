import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slugifyTr } from '@/lib/slugify'

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
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || undefined
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    const where: any = {}
    if (q) {
      // SQLite doesn't support mode: 'insensitive', so we'll use contains without it
      // SQLite's LIKE is case-insensitive by default for ASCII characters
      where.OR = [
        { loginId: { contains: q } },
        { name: { contains: q } },
        { brand: { name: { contains: q } } },
        { brand: { slug: { contains: q } } },
      ]
    }

    const [items, total] = await Promise.all([
      (db as any).brandManager.findMany({
        where,
        include: {
          brand: {
            select: { id: true, name: true, slug: true, logoUrl: true, siteUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (db as any).brandManager.count({ where }),
    ])

    return NextResponse.json({ ok: true, items, total, page, limit })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      brandName,
      brandLogoUrl,
      brandSiteUrl,
      managerLoginId,
      password,
      managerName,
    } = body || {}

    if (!brandName) return NextResponse.json({ ok: false, error: 'brandName required' }, { status: 400 })
    if (!managerLoginId) return NextResponse.json({ ok: false, error: 'managerLoginId required' }, { status: 400 })
    if (!password) return NextResponse.json({ ok: false, error: 'password required' }, { status: 400 })

    const slug = slugifyTr(brandName)

    const brand = await (db as any).reviewBrand.upsert({
      where: { slug },
      update: {
        name: brandName,
        logoUrl: brandLogoUrl ?? undefined,
        siteUrl: brandSiteUrl ?? undefined,
      },
      create: {
        name: brandName,
        slug,
        logoUrl: brandLogoUrl ?? undefined,
        siteUrl: brandSiteUrl ?? undefined,
      },
    })

    const existing = await (db as any).brandManager.findUnique({ where: { loginId: managerLoginId } })
    if (existing) {
      return NextResponse.json({ ok: false, error: 'loginId already exists' }, { status: 409 })
    }

    const passwordHash = await sha256Hex(password)

    const manager = await (db as any).brandManager.create({
      data: {
        brandId: brand.id,
        loginId: managerLoginId,
        passwordHash,
        name: managerName || brandName,
      },
      include: {
        brand: { select: { id: true, name: true, slug: true, logoUrl: true, siteUrl: true } },
      },
    })

    return NextResponse.json({ ok: true, item: manager })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}