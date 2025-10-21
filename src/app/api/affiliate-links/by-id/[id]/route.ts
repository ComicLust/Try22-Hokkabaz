import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await (db as any).affiliateLink.findUnique({ where: { id: params.id } })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const existing = await (db as any).affiliateLink.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Otomatik oluşturulan linkler düzenlenemez
    if (!existing.isManual) {
      return NextResponse.json({ error: 'Otomatik oluşturulan linkler düzenlenemez' }, { status: 400 })
    }

    const data: any = {}
    if (typeof body.title === 'string') data.title = body.title
    if (typeof body.targetUrl === 'string') data.targetUrl = body.targetUrl
    if (typeof body.slug === 'string') data.slug = body.slug

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
    }

    const updated = await (db as any).affiliateLink.update({ where: { id: params.id }, data })
    return NextResponse.json(updated)
  } catch (e: any) {
    const msg = e?.code === 'P2002' ? 'Slug zaten mevcut' : (e?.message ?? 'Error')
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await (db as any).affiliateLink.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Otomatik linkler silinemez (güvenlik)
    if (!existing.isManual) {
      return NextResponse.json({ error: 'Otomatik oluşturulan linkler silinemez' }, { status: 400 })
    }

    // Önce tıklama loglarını sil, sonra linki sil
    const trx = await db.$transaction([
      (db as any).affiliateClick.deleteMany({ where: { linkId: params.id } }),
      (db as any).affiliateLink.delete({ where: { id: params.id } }),
    ])

    return NextResponse.json({ ok: true, deletedClicks: trx?.[0]?.count ?? 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Silme hatası' }, { status: 500 })
  }
}