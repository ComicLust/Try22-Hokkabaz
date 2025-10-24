import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const attempts = new Map<string, { count: number; start: number }>()
const WINDOW_MS = 5 * 60 * 1000 // 5 minutes
const MAX_ATTEMPTS = 20

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

function getIp(req: NextRequest) {
  const fwd = req.headers.get('x-forwarded-for') || ''
  const ip = fwd.split(',')[0].trim() || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || ''
  return ip || 'unknown'
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIp(req)
    const now = Date.now()
    const entry = attempts.get(ip) || { count: 0, start: now }
    if (now - entry.start > WINDOW_MS) {
      entry.count = 0
      entry.start = now
    }
    if (entry.count >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Çok fazla giriş denemesi, lütfen sonra tekrar deneyin' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const { brandId, password } = body || {}
    const secret = process.env.BRAND_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'dev-secret'

    if (typeof brandId !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Marka ID ve şifre gerekli' }, { status: 400 })
    }

    // Lookup brand manager
    const manager = await (db as any).brandManager.findUnique({ where: { loginId: brandId } })
    if (!manager) {
      entry.count++
      attempts.set(ip, entry)
      return NextResponse.json({ error: 'Geçersiz kimlik bilgileri' }, { status: 401 })
    }

    const incomingHash = await sha256Hex(password)
    if (incomingHash !== manager.passwordHash) {
      entry.count++
      attempts.set(ip, entry)
      return NextResponse.json({ error: 'Geçersiz kimlik bilgileri' }, { status: 401 })
    }

    const token = await sha256Hex(`${manager.loginId}:${manager.passwordHash}:${secret}`)

    const res = NextResponse.json({ ok: true })
    res.cookies.set('brand_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })
    res.cookies.set('brand_id', manager.brandId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    attempts.delete(ip)
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Giriş hatası' }, { status: 500 })
  }
}