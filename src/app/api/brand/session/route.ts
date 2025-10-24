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

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('brand_token')?.value
    const brandId = req.cookies.get('brand_id')?.value
    if (!token || !brandId) {
      return NextResponse.json({ ok: false, error: 'No session' }, { status: 401 })
    }
    const secret = process.env.BRAND_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'dev-secret'
    const managers = await (db as any).brandManager.findMany({ where: { brandId } })
    for (const m of managers) {
      const expected = await sha256Hex(`${m.loginId}:${m.passwordHash}:${secret}`)
      if (expected === token) {
        return NextResponse.json({ ok: true })
      }
    }
    return NextResponse.json({ ok: false, error: 'Invalidated' }, { status: 401 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Session check error' }, { status: 500 })
  }
}