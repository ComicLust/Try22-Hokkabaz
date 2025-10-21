import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
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

export async function GET() {
  try {
    const today = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(today.getDate() - 6) // include today => 7 days

    const coupons = await (db as any).bankoCoupon.findMany({
      where: { date: { gte: startOfDay(sevenDaysAgo), lte: endOfDay(today) } },
      include: { matches: true },
      orderBy: { date: 'asc' },
    })

    let won = 0
    let lost = 0
    let totalOddSum = 0
    let totalOddCount = 0

    const byDay: Record<string, { won: number; total: number }> = {}

    for (const c of coupons) {
      const d = new Date(c.date)
      const key = d.toISOString().substring(0, 10)
      if (!byDay[key]) byDay[key] = { won: 0, total: 0 }
      byDay[key].total += 1

      if (c.status === 'WON') won += 1
      else if (c.status === 'LOST') lost += 1

      if (c.totalOdd != null) {
        totalOddSum += c.totalOdd
        totalOddCount += 1
      } else {
        const t = computeTotalOdd(c.matches)
        if (t != null) {
          totalOddSum += t
          totalOddCount += 1
        }
      }

      if (c.status === 'WON') byDay[key].won += 1
    }

    const successRate7d = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0
    const avgTotalOdd7d = totalOddCount > 0 ? Math.round((totalOddSum / totalOddCount) * 100) / 100 : null

    const todayVotesAgg = await (db as any).bankoCoupon.findMany({
      where: { date: { gte: startOfDay(today), lte: endOfDay(today) } },
      select: { upVotes: true, downVotes: true },
    })
    const todayVotes = todayVotesAgg.reduce((acc: number, v: any) => acc + (v.upVotes || 0) + (v.downVotes || 0), 0)

    const winSeries = Object.entries(byDay).map(([date, { won, total }]) => ({ date, won, total }))

    return NextResponse.json({ ok: true, data: { successRate7d, avgTotalOdd7d, todayVotes, winSeries } })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}