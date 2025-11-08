import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
const prisma: any = db

const voteAttempts = new Map<string, { count: number; start: number }>()
const VOTE_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const VOTE_MAX = 30

function getIp(req: NextRequest) {
  const fwd = req.headers.get('x-forwarded-for') || ''
  const ip = fwd.split(',')[0].trim() || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || ''
  return ip || 'unknown'
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.siteReview.findUnique({ where: { id: params.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}))
    const { action } = body || {}
    const valid = ['helpful','not_helpful','undo_helpful','undo_not_helpful']
    if (!valid.includes(action)) {
      return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
    }

    // IP bazlı rate limit
    const ip = getIp(req)
    const key = `${ip}:${params.id}`
    const now = Date.now()
    const entry = voteAttempts.get(key) || { count: 0, start: now }
    if (now - entry.start > VOTE_WINDOW_MS) {
      entry.count = 0
      entry.start = now
    }
    if (entry.count >= VOTE_MAX) {
      return NextResponse.json({ error: 'Oy hakkınız doldu. Lütfen daha sonra deneyin.' }, { status: 429 })
    }

    // Cookie ile tekil oy kontrolü
    const cookieName = `sr_vote_${params.id}`
    const cookieHeader = req.headers.get('cookie') || ''
    const existing = cookieHeader.split(';').map((s)=>s.trim()).find((c)=>c.startsWith(`${cookieName}=`))
    const existingVal = existing ? existing.split('=')[1] : null

    if (action === 'helpful' || action === 'not_helpful') {
      if (existingVal) {
        return NextResponse.json({ error: 'Bu yoruma zaten oy verdiniz.' }, { status: 409 })
      }
      const updated = await prisma.siteReview.update({
        where: { id: params.id },
        data: action === 'helpful' ? { helpfulCount: { increment: 1 } } : { notHelpfulCount: { increment: 1 } },
      })
      entry.count++
      voteAttempts.set(key, entry)
      const res = NextResponse.json(updated)
      res.headers.append('Set-Cookie', `${cookieName}=${action}; Path=/; Max-Age=${60*60*24*30}; SameSite=Lax`)
      return res
    }

    // Undo
    if (action === 'undo_helpful' || action === 'undo_not_helpful') {
      if (!existingVal) {
        return NextResponse.json({ error: 'Geri alınacak bir oy bulunamadı.' }, { status: 409 })
      }
      const isMatch = (action === 'undo_helpful' && existingVal === 'helpful') || (action === 'undo_not_helpful' && existingVal === 'not_helpful')
      if (!isMatch) {
        return NextResponse.json({ error: 'Önce mevcut oyu geri alın.' }, { status: 409 })
      }
      const current = await prisma.siteReview.findUnique({ where: { id: params.id }, select: { helpfulCount: true, notHelpfulCount: true } })
      if (!current) return NextResponse.json({ error: 'Yorum bulunamadı' }, { status: 404 })
      const updated = await prisma.siteReview.update({
        where: { id: params.id },
        data: action === 'undo_helpful'
          ? { helpfulCount: { decrement: current.helpfulCount > 0 ? 1 : 0 } }
          : { notHelpfulCount: { decrement: current.notHelpfulCount > 0 ? 1 : 0 } },
      })
      const res = NextResponse.json(updated)
      res.headers.append('Set-Cookie', `${cookieName}=; Path=/; Max-Age=0; SameSite=Lax`)
      return res
    }

    return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'İşlem hatası' }, { status: 400 })
  }
}