import { db } from '@/lib/db'

function getDateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function clampDays(days?: number) {
  if (!days || Number.isNaN(days)) return 30
  return Math.max(1, Math.min(180, days))
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const daysParam = url.searchParams.get('days')
  const fromParam = url.searchParams.get('from')
  const toParam = url.searchParams.get('to')

  const now = new Date()
  let since = new Date(now)
  let until = new Date(now)

  if (fromParam && toParam) {
    const from = new Date(fromParam)
    const to = new Date(toParam)
    if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
      // normalize to midnight boundaries
      from.setHours(0, 0, 0, 0)
      to.setHours(0, 0, 0, 0)
      since = from
      until = to
    }
  } else {
    const days = clampDays(daysParam ? Number(daysParam) : undefined)
    since.setDate(now.getDate() - (days - 1))
  }

  const [reviews, clicks] = await Promise.all([
    db.siteReview.findMany({ where: { createdAt: { gte: since, lte: until } }, select: { createdAt: true } }),
    db.affiliateClick.findMany({ where: { createdAt: { gte: since, lte: until } }, select: { createdAt: true } }),
  ])

  // build day buckets
  const days: { date: string; reviews: number; clicks: number }[] = []
  const start = new Date(since)
  start.setHours(0, 0, 0, 0)
  const end = new Date(until)
  end.setHours(0, 0, 0, 0)

  const totalDays = Math.floor((end.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
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