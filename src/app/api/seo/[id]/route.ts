import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = await db.seoSetting.findUnique({ where: { id: params.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    // Mevcut kaydı al (sayfa varyantını karşılaştırmak için)
    const current = await db.seoSetting.findUnique({
      where: { id: params.id },
      select: { id: true, page: true },
    })
    if (!current) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    // page sağlandıysa, slash varyantlarını göz önünde bulundur
    if (typeof body?.page === 'string') {
      const incomingRaw = String(body.page).trim()
      const normalizedIncoming = incomingRaw.replace(/^\/+/, '')
      const normalizedCurrent = String(current.page ?? '').trim().replace(/^\/+/, '')
      // Aynı mantıksal sayfa ise, mevcut varyantı koru (unique çakışmayı tetikleme)
      if (normalizedIncoming === normalizedCurrent) {
        body.page = current.page
      } else {
        const variants = Array.from(new Set([incomingRaw, normalizedIncoming].filter(Boolean)))
        const existingRecord = await db.seoSetting.findFirst({
          where: { page: { in: variants } },
          select: { id: true },
        })
        if (existingRecord && existingRecord.id !== params.id) {
          return NextResponse.json(
            { error: `Bu sayfa için zaten bir SEO kaydı mevcut: ${incomingRaw}` },
            { status: 409 }
          )
        }
        body.page = incomingRaw
      }
    }
    
    const updated = await db.seoSetting.update({ where: { id: params.id }, data: body })
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
    await db.seoSetting.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}