import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slugifyTr } from '@/lib/slugify'
import { withCache, revalidateReviewBrandTags } from '@/lib/cache'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const active = searchParams.get('active')
  const where = active === 'true' ? { isActive: true } : {}
  const items = await withCache(
    () => db.reviewBrand.findMany({ where, orderBy: { createdAt: 'desc' } }),
    { key: ['review-brands-list', active ?? 'all'], tags: ['review-brands:list'], revalidate: 300 }
  )
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, logoUrl, editorialSummary, siteUrl, slug: rawSlug } = body || {}
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Marka adı gerekli' }, { status: 400 })
    }
    const slugBase = (rawSlug && typeof rawSlug === 'string' ? rawSlug : name)
    const slug = slugifyTr(slugBase)
    const exists = await db.reviewBrand.findUnique({ where: { slug } })
    if (exists) return NextResponse.json({ error: 'Slug zaten mevcut' }, { status: 400 })
    const created = await db.reviewBrand.create({
      data: { name, slug, logoUrl: logoUrl ?? null, editorialSummary: editorialSummary ?? null, siteUrl: siteUrl ?? null, isActive: true },
    })
    revalidateReviewBrandTags(slug)
    return NextResponse.json(created)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Oluşturma hatası' }, { status: 400 })
  }
}