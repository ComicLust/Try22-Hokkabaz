import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    const link = await db.affiliateLink.findUnique({ where: { slug } })
    if (!link) return NextResponse.json({ error: 'Link bulunamadı' }, { status: 404 })

    const clicks = await db.affiliateClick.findMany({
      where: { linkId: link.id },
      orderBy: { createdAt: 'desc' },
      take: 500, // fetch recent clicks for stats
    })

    const last50 = clicks.slice(0, 50)

    const countryCounts: Record<string, number> = {}
    const dailyCounts: Record<string, number> = {}

    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - 29)

    for (let i = 0; i < 30; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      dailyCounts[toDateKey(d)] = 0
    }

    for (const c of clicks) {
      const key = toDateKey(new Date(c.createdAt))
      if (key in dailyCounts) dailyCounts[key]++
      const country = c.country || 'Unknown'
      countryCounts[country] = (countryCounts[country] || 0) + 1
    }

    const seriesDaily = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }))

    return NextResponse.json({ link, last50, countryCounts, seriesDaily })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Detail error' }, { status: 500 })
  }
}