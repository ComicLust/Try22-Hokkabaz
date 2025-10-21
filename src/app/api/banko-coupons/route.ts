import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function deriveStatus(matches: { result: string }[]): 'WON' | 'LOST' | 'PENDING' {
  if (!Array.isArray(matches) || matches.length === 0) return 'PENDING'
  const hasLost = matches.some(m => m.result === 'LOST')
  if (hasLost) return 'LOST'
  const allWon = matches.every(m => m.result === 'WON')
  return allWon ? 'WON' : 'PENDING'
}

function productOdds(matches: { odd?: number | null }[]) {
  return matches.reduce((acc, m) => acc * Number(m.odd ?? 1), 1)
}

const fallbackCoupons = () => {
  const date = new Date()
  const dateStr = date.toISOString()
  return [
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
        { homeTeam: 'Beşiktaş', awayTeam: 'Trabzonspor', startTime: dateStr, prediction: '2', odd: 2.20, resultScore: undefined, result: 'PENDING' },
        { homeTeam: 'Leipzig', awayTeam: 'Dortmund', startTime: dateStr, prediction: 'KG Var', odd: 1.65, resultScore: undefined, result: 'PENDING' },
        { homeTeam: 'Napoli', awayTeam: 'Lazio', startTime: dateStr, prediction: '1', odd: 1.90, resultScore: undefined, result: 'PENDING' },
      ],
    },
  ].map(c => ({
    ...c,
    totalOdd: Number(productOdds(c.matches).toFixed(2)),
    status: deriveStatus(c.matches),
  }))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date')
  try {
    // Eğer belirli bir tarih verilirse o günün kuponlarını getir
    let where: any = {}
    if (dateParam) {
      const d = new Date(dateParam)
      const start = new Date(d)
      start.setHours(0, 0, 0, 0)
      const end = new Date(d)
      end.setHours(23, 59, 59, 999)
      where.date = { gte: start, lte: end }
    }

    const coupons = await (db as any).bankoCoupon.findMany({
      where,
      include: { matches: true },
      orderBy: { date: 'desc' },
      take: 3,
    })

    const normalized = (Array.isArray(coupons) ? coupons : []).map((c: any) => ({
      id: c.id,
      title: c.title ?? undefined,
      date: c.date?.toISOString?.() ?? c.date,
      totalOdd: Number((c.totalOdd ?? productOdds(c.matches)).toFixed(2)),
      status: c.status ?? deriveStatus(c.matches || []),
      // voting counts
      upVotes: Number(c.upVotes ?? 0),
      downVotes: Number(c.downVotes ?? 0),
      matches: (c.matches || []).map((m: any) => ({
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        league: m.league ?? undefined,
        startTime: m.startTime?.toISOString?.() ?? m.startTime,
        prediction: m.prediction,
        odd: m.odd,
        resultScore: m.resultScore ?? undefined,
        result: m.result,
      })),
    }))

    // Boşsa fallback örneklerini döndür
    if (!normalized.length) {
      return NextResponse.json(fallbackCoupons(), { status: 200 })
    }

    return NextResponse.json(normalized, { status: 200 })
  } catch (e) {
    // Tablo yoksa veya başka bir hata varsa örnek veri ile dön
    return NextResponse.json(fallbackCoupons(), { status: 200 })
  }
}