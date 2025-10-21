import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Demo fallback: son 3 gün için örnek statlar
function fallbackStats() {
  const items = [] as Array<{ status: 'WON' | 'LOST' | 'PENDING' }>
  for (let i = 0; i < 3; i++) {
    const status = i === 0 ? 'PENDING' : (i === 1 ? 'WON' : 'LOST')
    items.push({ status })
  }
  const total = items.length
  const won = items.filter(i => i.status === 'WON').length
  const lost = items.filter(i => i.status === 'LOST').length
  const pending = items.filter(i => i.status === 'PENDING').length
  const denom = Math.max(1, won + lost)
  const successRate = Math.round((won / denom) * 100)
  return { total, won, lost, pending, successRate, windowDays: 30 }
}

export async function GET() {
  try {
    const now = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - 30)
    start.setHours(0,0,0,0)

    const items = await (db as any).bankoCoupon.findMany({
      where: { date: { gte: start } },
      select: { id: true, status: true }
    })

    const total = items.length
    const won = items.filter((i: any) => i.status === 'WON').length
    const lost = items.filter((i: any) => i.status === 'LOST').length
    const pending = items.filter((i: any) => i.status === 'PENDING').length
    const denom = Math.max(1, won + lost)
    const successRate = Math.round((won / denom) * 100)

    if (total === 0) {
      // DB boşsa demo fallback kullan
      return NextResponse.json(fallbackStats())
    }

    return NextResponse.json({ total, won, lost, pending, successRate, windowDays: 30 })
  } catch (e) {
    return NextResponse.json(fallbackStats())
  }
}