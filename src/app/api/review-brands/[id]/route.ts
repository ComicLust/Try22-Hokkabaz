import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slugifyTr } from '@/lib/slugify'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = await db.reviewBrand.findUnique({ where: { id: params.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const patch = await req.json()
    const data: any = { ...patch }

    // İsim veya manuel slug değiştiyse, slug'ı Türkçe uyumlu şekilde güncelle
    const willUpdateSlug = (typeof patch?.name === 'string' && patch.name.trim().length > 0) || (typeof patch?.slug === 'string')
    if (willUpdateSlug) {
      const base = (typeof patch?.slug === 'string' && patch.slug.trim()) ? patch.slug : patch.name
      let candidate = slugifyTr(base || '')
      // Benzersizliği garanti et (farklı id'ler için çakışmayı önle)
      const existing = await db.reviewBrand.findUnique({ where: { slug: candidate } })
      if (existing && existing.id !== params.id) {
        let i = 2
        while (true) {
          const next = `${candidate}${i}`
          const ex = await db.reviewBrand.findUnique({ where: { slug: next } })
          if (!ex || ex.id === params.id) { candidate = next; break }
          i++
          if (i > 100) break // Güvenlik için üst sınır
        }
      }
      data.slug = candidate
    }

    const updated = await db.reviewBrand.update({ where: { id: params.id }, data })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Güncelleme hatası' }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.reviewBrand.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Silme hatası' }, { status: 400 })
  }
}