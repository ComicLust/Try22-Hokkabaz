import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/admin/review-brands/:id
// Updates brand details: name, logoUrl, siteUrl (slug stays unchanged)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}))
    const { name, logoUrl, siteUrl } = body || {}

    const data: any = {}
    if (typeof name === 'string') data.name = name
    if (typeof logoUrl !== 'undefined') data.logoUrl = logoUrl || null
    if (typeof siteUrl !== 'undefined') data.siteUrl = siteUrl || null

    if (!Object.keys(data).length) {
      return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 })
    }

    const updated = await db.reviewBrand.update({ where: { id: params.id }, data })
    return NextResponse.json({ ok: true, item: updated })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Update error' }, { status: 500 })
  }
}