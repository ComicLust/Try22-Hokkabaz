import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { revalidateTag } from 'next/cache'

export async function GET() {
  const items = await db.marqueeLogo.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Zorunlu alan kontrolü
    if (!body?.imageUrl || typeof body.imageUrl !== 'string' || body.imageUrl.trim() === '') {
      return NextResponse.json({ error: 'imageUrl zorunludur' }, { status: 400 })
    }

    // Order benzersiz olmalı; değilse en büyük + 1
    let desiredOrder = Number(body.order ?? 0)
    const all = await db.marqueeLogo.findMany({ select: { order: true } })
    const maxOrder = all.length ? Math.max(...all.map((i) => Number(i.order ?? 0))) : 0

    if (!Number.isFinite(desiredOrder) || desiredOrder <= 0) {
      desiredOrder = maxOrder + 1
    } else {
      const existing = await db.marqueeLogo.findUnique({ where: { order: desiredOrder } })
      if (existing) desiredOrder = maxOrder + 1
    }

    const created = await db.marqueeLogo.create({
      data: {
        imageUrl: body.imageUrl,
        href: typeof body.href === 'string' ? body.href : undefined,
        isActive: body.isActive ?? true,
        order: desiredOrder,
      },
    })
    // Anasayfa marquee cache'ini temizle
    revalidateTag('home:marquee')
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}