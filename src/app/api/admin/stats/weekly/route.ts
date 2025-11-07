import { db } from '@/lib/db'

function getDateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function GET() {
  const now = new Date()
  const since = new Date(now)
  since.setDate(now.getDate() - 29) // son 30 gün

  const [reviews, clicks] = await Promise.all([
    db.siteReview.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    db.affiliateClick.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
  ])

  const days: { date: string; reviews: number; clicks: number }[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    days.push({ date: getDateKey(d), reviews: 0, clicks: 0 })
  }

  const map = new Map(days.map((d) => [d.date, d]))

  for (const r of reviews) {
    const key = getDateKey(new Date(r.createdAt))
    const row = map.get(key)
    if (row) row.reviews += 1
  }
  for (const c of clicks) {
    const key = getDateKey(new Date(c.createdAt))
    const row = map.get(key)
    if (row) row.clicks += 1
  }

  return Response.json({ ok: true, data: Array.from(map.values()) })
}