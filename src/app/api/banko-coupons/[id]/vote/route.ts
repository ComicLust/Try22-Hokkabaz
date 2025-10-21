import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
const prisma: any = db

// Per-IP per-coupon rate limit: max 1 vote per 24 hours
const voteAttempts = new Map<string, { count: number; start: number }>()
const VOTE_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours
const VOTE_MAX = 1

// Demo kuponlar için geçici oy saklama
const demoVotes = new Map<string, { up: number; down: number }>()

function getIp(req: NextRequest) {
  const fwd = req.headers.get('x-forwarded-for') || ''
  const ip = fwd.split(',')[0].trim() || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || ''
  return ip || 'unknown'
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  // Demo veri için geçici oyları döndür
  if (params.id?.startsWith('demo-')) {
    const dv = demoVotes.get(params.id) || { up: 0, down: 0 }
    const up = Number(dv.up ?? 0)
    const down = Number(dv.down ?? 0)
    const total = Math.max(0, up + down)
    const trust = total > 0 ? Math.round((up / total) * 100) : 0
    return NextResponse.json({ id: params.id, upVotes: up, downVotes: down, trust })
  }
  const item = await prisma.bankoCoupon.findUnique({ where: { id: params.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const up = Number(item.upVotes ?? 0)
  const down = Number(item.downVotes ?? 0)
  const total = Math.max(0, up + down)
  const trust = total > 0 ? Math.round((up / total) * 100) : 0
  return NextResponse.json({ id: item.id, upVotes: up, downVotes: down, trust })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { action } = body || {}
    if (!['up','down'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const ip = getIp(req)
    const key = `${ip}:${params.id}`
    const now = Date.now()
    const entry = voteAttempts.get(key) || { count: 0, start: now }
    if (now - entry.start > VOTE_WINDOW_MS) {
      entry.count = 0
      entry.start = now
    }
    if (entry.count >= VOTE_MAX) {
      return NextResponse.json({ error: 'Bu kupon için oy hakkınız doldu. Lütfen daha sonra deneyin.' }, { status: 429 })
    }

    // Demo veri için geçici oy arttırma
    if (params.id?.startsWith('demo-')) {
      const dv = demoVotes.get(params.id) || { up: 0, down: 0 }
      if (action === 'up') dv.up++
      else dv.down++
      demoVotes.set(params.id, dv)

      entry.count++
      voteAttempts.set(key, entry)

      const up = Number(dv.up ?? 0)
      const down = Number(dv.down ?? 0)
      const total = Math.max(0, up + down)
      const trust = total > 0 ? Math.round((up / total) * 100) : 0
      return NextResponse.json({ id: params.id, upVotes: up, downVotes: down, trust })
    }

    const updated = await prisma.bankoCoupon.update({
      where: { id: params.id },
      data: action === 'up' ? { upVotes: { increment: 1 } } : { downVotes: { increment: 1 } },
      select: { id: true, upVotes: true, downVotes: true }
    })

    entry.count++
    voteAttempts.set(key, entry)

    const up = Number(updated.upVotes ?? 0)
    const down = Number(updated.downVotes ?? 0)
    const total = Math.max(0, up + down)
    const trust = total > 0 ? Math.round((up / total) * 100) : 0

    return NextResponse.json({ id: updated.id, upVotes: up, downVotes: down, trust })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}