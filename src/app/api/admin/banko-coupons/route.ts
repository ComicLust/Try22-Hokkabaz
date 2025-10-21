import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

function parseDateRange(params: URLSearchParams) {
  const start = params.get('start')
  const end = params.get('end')
  let startDate: Date | undefined
  let endDate: Date | undefined
  if (start) {
    const d = new Date(start)
    if (!isNaN(d.getTime())) startDate = d
  }
  if (end) {
    const d = new Date(end)
    if (!isNaN(d.getTime())) endDate = d
  }
  return { startDate, endDate }
}

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

function fallbackAdminCoupons() {
  const dateStr = new Date().toISOString()
  const demos = [
    {
      id: 'demo-1',
      title: 'Banko Kupon #1',
      date: dateStr,
      matches: [
        { homeTeam: 'Fenerbahçe', awayTeam: 'Galatasaray', startTime: dateStr, prediction: '2.5 Üst', odd: 1.80, resultScore: '3-2', result: 'WON' },
        { homeTeam: 'Manchester Utd', awayTeam: 'Chelsea', startTime: dateStr, prediction: 'KG Var', odd: 1.65, resultScore: '1-1', result: 'WON' },
        { homeTeam: 'Real Madrid', awayTeam: 'Barcelona', startTime: dateStr, prediction: '1', odd: 2.10, resultScore: '1-2', result: 'LOST' },
      ],
    },
    {
      id: 'demo-2',
      title: 'Banko Kupon #2',
      date: dateStr,
      matches: [
        { homeTeam: 'Inter', awayTeam: 'Milan', startTime: dateStr, prediction: '1X', odd: 1.50, resultScore: '2-1', result: 'WON' },
        { homeTeam: 'PSG', awayTeam: 'Marseille', startTime: dateStr, prediction: '2.5 Üst', odd: 1.70, resultScore: '3-0', result: 'WON' },
        { homeTeam: 'Ajax', awayTeam: 'Feyenoord', startTime: dateStr, prediction: 'KG Var', odd: 1.60, resultScore: '2-2', result: 'WON' },
      ],
    },
    {
      id: 'demo-3',
      title: 'Banko Kupon #3',
      date: dateStr,
      matches: [
        { homeTeam: 'Beşiktaş', awayTeam: 'Trabzonspor', startTime: dateStr, prediction: '2', odd: 2.20, resultScore: null, result: 'PENDING' },
        { homeTeam: 'Leipzig', awayTeam: 'Dortmund', startTime: dateStr, prediction: 'KG Var', odd: 1.65, resultScore: null, result: 'PENDING' },
        { homeTeam: 'Napoli', awayTeam: 'Lazio', startTime: dateStr, prediction: '1', odd: 1.90, resultScore: null, result: 'PENDING' },
      ],
    },
  ]
  return demos.map((c: any) => {
    const totalOdd = computeTotalOdd(c.matches)
    const status = deriveStatus(c.matches)
    const upVotes = 0
    const downVotes = 0
    const trust = 0
    return {
      id: c.id,
      title: c.title,
      date: c.date,
      totalOdd,
      status,
      matchCount: c.matches.length,
      upVotes,
      downVotes,
      communityTrust: trust,
      isActive: true,
      publishedAt: dateStr,
      createdAt: new Date(dateStr),
      updatedAt: new Date(dateStr),
      matches: c.matches,
    }
  })
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const params = url.searchParams
    const { startDate, endDate } = parseDateRange(params)
    const status = params.get('status') as 'WON' | 'LOST' | 'PENDING' | null
    const winnersOnly = params.get('winnersOnly') === 'true'
    const q = params.get('q')?.trim() || ''
    const take = Math.min(parseInt(params.get('take') || '50'), 200)
    const skip = Math.max(parseInt(params.get('skip') || '0'), 0)

    const where: any = {}
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }
    if (status) where.status = status
    if (winnersOnly) where.status = 'WON'
    if (q) {
      where.matches = {
        some: {
          OR: [
            { homeTeam: { contains: q, mode: 'insensitive' } },
            { awayTeam: { contains: q, mode: 'insensitive' } },
            { prediction: { contains: q, mode: 'insensitive' } },
          ],
        },
      }
    }

    const coupons = await (db as any).bankoCoupon.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip,
      take,
      include: {
        matches: true,
      },
    })

    const data = coupons.map((c: any) => {
      const totalOdd = c.totalOdd ?? computeTotalOdd(c.matches)
      const trust = c.upVotes + c.downVotes > 0 ? Math.round((c.upVotes / (c.upVotes + c.downVotes)) * 100) : 0
      return {
        id: c.id,
        title: c.title,
        date: c.date,
        totalOdd,
        status: c.status,
        matchCount: c.matches.length,
        upVotes: c.upVotes,
        downVotes: c.downVotes,
        communityTrust: trust,
        isActive: c.isActive,
        publishedAt: c.publishedAt,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        matches: c.matches,
      }
    })

    if (data.length === 0) {
      return NextResponse.json({ ok: true, data: fallbackAdminCoupons() })
    }

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, date, isActive = true, publishedAt, matches = [] } = body || {}
    if (!date) {
      return NextResponse.json({ ok: false, error: 'date is required' }, { status: 400 })
    }
    const dt = new Date(date)
    if (isNaN(dt.getTime())) {
      return NextResponse.json({ ok: false, error: 'invalid date' }, { status: 400 })
    }

    const totalOdd = computeTotalOdd(matches)
    const status = deriveStatus(matches)

    const created = await (db as any).bankoCoupon.create({
      data: {
        title: title ?? null,
        date: dt,
        isActive,
        publishedAt: publishedAt ? new Date(publishedAt) : isActive ? new Date() : null,
        totalOdd: totalOdd ?? null,
        status,
        matches: {
          create: matches.map((m: any) => ({
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            league: m.league ?? null,
            startTime: m.startTime ? new Date(m.startTime) : null,
            prediction: m.prediction ?? null,
            odd: typeof m.odd === 'number' ? m.odd : m.odd ? parseFloat(m.odd) : null,
            resultScore: m.resultScore ?? null,
            result: m.result ?? 'PENDING',
          })),
        },
      },
      include: { matches: true },
    })

    const trust = created.upVotes + created.downVotes > 0 ? Math.round((created.upVotes / (created.upVotes + created.downVotes)) * 100) : 0

    return NextResponse.json({
      ok: true,
      data: {
        id: created.id,
        title: created.title,
        date: created.date,
        totalOdd: created.totalOdd,
        status: created.status,
        matchCount: created.matches.length,
        upVotes: created.upVotes,
        downVotes: created.downVotes,
        communityTrust: trust,
        isActive: created.isActive,
        publishedAt: created.publishedAt,
        matches: created.matches,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}