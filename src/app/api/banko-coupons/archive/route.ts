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

// Demo arşiv verisi (son 3 gün)
function fallbackArchive(page: number, limit: number) {
  const items: any[] = []
  for (let i = 0; i < 3; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString()
    items.push({
      id: `demo-${i+1}`,
      title: `Banko Kupon #${i+1}`,
      date: dateStr,
      totalOdd: Number((1.8 * 1.65 * 2.1).toFixed(2)),
      status: i === 0 ? 'PENDING' : (i === 1 ? 'WON' : 'LOST'),
      upVotes: 0,
      downVotes: 0,
      matches: [
        { homeTeam: 'Fenerbahçe', awayTeam: 'Galatasaray', prediction: '2.5 Üst', odd: 1.80, resultScore: i===2 ? '3-2' : undefined, result: i===2 ? 'WON' : 'PENDING' },
        { homeTeam: 'Manchester Utd', awayTeam: 'Chelsea', prediction: 'KG Var', odd: 1.65, resultScore: i===1 ? '1-1' : undefined, result: i===1 ? 'WON' : 'PENDING' },
        { homeTeam: 'Real Madrid', awayTeam: 'Barcelona', prediction: '1', odd: 2.10, resultScore: i===1 ? '1-2' : undefined, result: i===1 ? 'LOST' : 'PENDING' },
      ],
    })
  }
  return { page, limit, items }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)))
  const skip = (page - 1) * limit
  const statusParam = searchParams.get('status') // WON | LOST | PENDING

  try {
    const coupons = await (db as any).bankoCoupon.findMany({
      where: statusParam ? { status: statusParam } : undefined,
      include: { matches: true },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
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

    if (!normalized.length) {
      return NextResponse.json(fallbackArchive(page, limit), { status: 200 })
    }

    return NextResponse.json({ page, limit, items: normalized }, { status: 200 })
  } catch (e) {
    // Hata durumunda demo arşiv döndür
    return NextResponse.json(fallbackArchive(page, limit), { status: 200 })
  }
}