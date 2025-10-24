import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slugifyTr } from '@/lib/slugify'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = await db.bonus.findUnique({ where: { id: params.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    // Varolan item'ı al
    const existing = await db.bonus.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Slug boşsa başlıktan üret ve benzersiz kıl
    const providedSlug = typeof body.slug === 'string' ? body.slug.trim() : ''
    if (!providedSlug) {
      const titleForSlug = (typeof body.title === 'string' && body.title.trim()) ? body.title.trim() : existing.title
      let base = slugifyTr(titleForSlug, { withHyphens: true, maxLen: 64 })
      if (!base) base = 'bonus'

      let slug = base
      let counter = 2
      while (true) {
        const exists = await db.bonus.findUnique({ where: { slug } })
        if (!exists || exists.id === params.id) break
        slug = `${base}-${counter++}`
        if (counter > 100) {
          return NextResponse.json({ error: 'Slug benzersizleşmedi' }, { status: 400 })
        }
      }
      body.slug = slug
    } else {
      // Sağlanan slug varsa, olduğu gibi bırak (talebe göre)
    }

    const updated = await db.bonus.update({ where: { id: params.id }, data: body })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.bonus.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}