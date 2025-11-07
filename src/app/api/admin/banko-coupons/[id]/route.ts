import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { revalidateTag } from 'next/cache'

export const runtime = 'nodejs'

function computeTotalOdd(matches: any[]): number | null {
  if (!matches || matches.length === 0) return null
  let total = 1
  for (const m of matches) {
    const odd = typeof m.odd === 'number' ? m.odd : parseFloat(m.odd)
    if (!isNaN(odd)) total *= odd
  }
  return Math.round(total * 100) / 100
}

function deriveStatus(matches: any[]): 'WON' | 'LOST' | 'PENDING' {
  if (!matches || matches.length === 0) return 'PENDING'
  const anyLost = matches.some((m) => m.result === 'LOST')
  if (anyLost) return 'LOST'
  const allWon = matches.length > 0 && matches.every((m) => m.result === 'WON')
  if (allWon) return 'WON'
  return 'PENDING'
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const coupon = await (db as any).bankoCoupon.findUnique({
      where: { id },
      include: { matches: true },
    })
    if (!coupon) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })

    const totalOdd = coupon.totalOdd ?? computeTotalOdd(coupon.matches)
    const trust = coupon.upVotes + coupon.downVotes > 0 ? Math.round((coupon.upVotes / (coupon.upVotes + coupon.downVotes)) * 100) : 0

    return NextResponse.json({
      ok: true,
      data: {
        id: coupon.id,
        title: coupon.title,
        date: coupon.date,
        totalOdd,
        status: coupon.status,
        upVotes: coupon.upVotes,
        downVotes: coupon.downVotes,
        communityTrust: trust,
        isActive: coupon.isActive,
        publishedAt: coupon.publishedAt,
        createdAt: coupon.createdAt,
        updatedAt: coupon.updatedAt,
        matches: coupon.matches,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await req.json()
    const { title, date, isActive, publishedAt, status, matches, recalculate = true } = body || {}

    // Update coupon base fields first
    const updatedCoupon = await (db as any).bankoCoupon.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(date !== undefined ? { date: new Date(date) } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(publishedAt !== undefined ? { publishedAt: publishedAt ? new Date(publishedAt) : null } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    })

    // Handle matches upsert/delete if provided
    if (Array.isArray(matches)) {
      const existing = await (db as any).bankoMatch.findMany({ where: { couponId: id } })
      const incomingIds = matches.filter((m: any) => m.id).map((m: any) => m.id)
      const toDelete = existing.filter((e: any) => !incomingIds.includes(e.id)).map((e: any) => e.id)

      if (toDelete.length > 0) {
        await (db as any).bankoMatch.deleteMany({ where: { id: { in: toDelete } } })
      }

      // Upsert/update/create incoming
      for (const m of matches) {
        const data = {
          couponId: id,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league ?? null,
          startTime: m.startTime ? new Date(m.startTime) : null,
          prediction: m.prediction ?? null,
          odd: typeof m.odd === 'number' ? m.odd : m.odd ? parseFloat(m.odd) : null,
          resultScore: m.resultScore ?? null,
          result: m.result ?? 'PENDING',
        }
        if (m.id) {
          await (db as any).bankoMatch.update({ where: { id: m.id }, data })
        } else {
          await (db as any).bankoMatch.create({ data })
        }
      }
    }

    // Recompute totalOdd & status if requested
    let final = updatedCoupon
    if (recalculate) {
      const matchesNow = await (db as any).bankoMatch.findMany({ where: { couponId: id } })
      const totalOdd = computeTotalOdd(matchesNow)
      const derivedStatus = status ?? deriveStatus(matchesNow)
      final = await (db as any).bankoCoupon.update({ where: { id }, data: { totalOdd, status: derivedStatus } })
    }

    const trust = final.upVotes + final.downVotes > 0 ? Math.round((final.upVotes / (final.upVotes + final.downVotes)) * 100) : 0

    // Anasayfa banko istatistikleri tag'ini temizle
    revalidateTag('home:banko-stats')

    return NextResponse.json({
      ok: true,
      data: {
        id: final.id,
        title: final.title,
        date: final.date,
        totalOdd: final.totalOdd,
        status: final.status,
        upVotes: final.upVotes,
        downVotes: final.downVotes,
        communityTrust: trust,
        isActive: final.isActive,
        publishedAt: final.publishedAt,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    // Delete matches first, then coupon
    await (db as any).bankoMatch.deleteMany({ where: { couponId: id } })
    await (db as any).bankoCoupon.delete({ where: { id } })
    // Anasayfa banko istatistikleri tag'ini temizle
    revalidateTag('home:banko-stats')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}