import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug
    if (!slug) return NextResponse.json({ error: 'Slug gerekli' }, { status: 400 })
    const item = await (db as any).pageArticle.findUnique({ where: { slug } })
    if (!item) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Yükleme hatası' }, { status: 400 })
  }
}