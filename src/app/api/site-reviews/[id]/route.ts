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
    const body = await req.json()
    const { action } = body || {}
    if (!['helpful','not_helpful'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Simple per-IP rate limiting to mitigate abuse
    const ip = getIp(req)
    const key = `${ip}:${params.id}`
    const now = Date.now()
    const entry = voteAttempts.get(key) || { count: 0, start: now }
    if (now - entry.start > VOTE_WINDOW_MS) {
      entry.count = 0
      entry.start = now
    }
    if (entry.count >= VOTE_MAX) {
      return NextResponse.json({ error: 'Too many votes, please try later' }, { status: 429 })
    }

    const updated = await prisma.siteReview.update({
      where: { id: params.id },
      data: action === 'helpful' ? { helpfulCount: { increment: 1 } } : { notHelpfulCount: { increment: 1 } },
    })

    entry.count++
    voteAttempts.set(key, entry)

    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}