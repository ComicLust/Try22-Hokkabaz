import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug
    if (!slug) return NextResponse.json({ error: 'Slug gerekli' }, { status: 400 })
    const item = await (db as any).pageArticle.findUnique({ where: { slug } })
    return NextResponse.json(item ?? null)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Yükleme hatası' }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug
    if (!slug) return NextResponse.json({ error: 'Slug gerekli' }, { status: 400 })
    const body = await req.json()
    const { title, content } = body || {}
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'İçerik (HTML) gerekli' }, { status: 400 })
    }

    const saved = await (db as any).pageArticle.upsert({
      where: { slug },
      create: { slug, title: title ?? null, content },
      update: { title: title ?? null, content },
    })
    return NextResponse.json(saved)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Kaydetme hatası' }, { status: 400 })
  }
}