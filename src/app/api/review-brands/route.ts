import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const slugify = (str: string) => str
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)+/g, '')

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const active = searchParams.get('active')
  const where = active === 'true' ? { isActive: true } : {}
  const items = await db.reviewBrand.findMany({ where, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, logoUrl, editorialSummary, siteUrl, slug: rawSlug } = body || {}
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Marka adı gerekli' }, { status: 400 })
    }
    const slug = (rawSlug && typeof rawSlug === 'string' ? rawSlug : slugify(name)) || slugify(name)
    const exists = await db.reviewBrand.findUnique({ where: { slug } })
    if (exists) return NextResponse.json({ error: 'Slug zaten mevcut' }, { status: 400 })
    const created = await db.reviewBrand.create({
      data: { name, slug, logoUrl: logoUrl ?? null, editorialSummary: editorialSummary ?? null, siteUrl: siteUrl ?? null, isActive: true },
    })
    return NextResponse.json(created)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Oluşturma hatası' }, { status: 400 })
  }
}