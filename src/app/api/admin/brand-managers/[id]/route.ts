import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { password, name, brandId } = body || {}

    const data: any = {}
    if (typeof name === 'string' && name.trim()) data.name = name.trim()
    if (typeof brandId === 'string' && brandId.trim()) data.brandId = brandId.trim()
    if (typeof password === 'string' && password.length > 0) {
      data.passwordHash = await sha256Hex(password)
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 })
    }

    const updated = await (db as any).brandManager.update({
      where: { id: params.id },
      data,
      include: { brand: { select: { id: true, name: true, slug: true, logoUrl: true } } }
    })

    return NextResponse.json({ ok: true, item: updated })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await (db as any).brandManager.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}