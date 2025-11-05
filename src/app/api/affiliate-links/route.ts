import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function slugify(input: string) {
  return (input || '')
    .toLowerCase()
    .replace(/https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64)
}

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'out',
  'hakkimizda', 'iletisim', 'kampanyalar', 'bonuslar', 'anlasmali-siteler', 'guvenilir-bahis-siteleri-listesi', 'guvenilir-telegram', 'vpn-onerileri', 'yorumlar',
  'sitemap.xml', 'favicon.ico', 'robots.txt'
])

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const qLinkId = url.searchParams.get('linkId') || undefined
    const qFrom = url.searchParams.get('from') || undefined
    const qTo = url.searchParams.get('to') || undefined

    const [links, topLinks, recentClicksRaw] = await Promise.all([
      db.affiliateLink.findMany({ orderBy: { createdAt: 'desc' } }),
      db.affiliateLink.findMany({ orderBy: { clicks: 'desc' }, take: 10 }),
      // Son 30 güne ait raw click'leri seriyi üretmek için alıyoruz
      db.affiliateClick.findMany({
        where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 29) } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0)

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const sixtyMonthsStart = new Date(now.getFullYear(), now.getMonth() - 59, 1)
    const fiveYearsStart = new Date(now.getFullYear() - 4, 0, 1)

    // Tekil gün + IP + link eşleşmesi ile sayım — clicks sayaç mantığıyla uyumlu
    const [{ cnt: todayClicksRaw } = { cnt: 0 }] = await db.$queryRaw<any[]>`
      SELECT COUNT(*) AS cnt FROM (
        SELECT linkId, ip, date(createdAt) AS d
        FROM "AffiliateClick"
        WHERE createdAt >= ${todayStart}
        GROUP BY linkId, ip, d
      ) AS sub
    `
    const [{ cnt: weekClicksRaw } = { cnt: 0 }] = await db.$queryRaw<any[]>`
      SELECT COUNT(*) AS cnt FROM (
        SELECT linkId, ip, date(createdAt) AS d
        FROM "AffiliateClick"
        WHERE createdAt >= ${weekStart}
        GROUP BY linkId, ip, d
      ) AS sub
    `
    const [{ cnt: monthClicksRaw } = { cnt: 0 }] = await db.$queryRaw<any[]>`
      SELECT COUNT(*) AS cnt FROM (
        SELECT linkId, ip, date(createdAt) AS d
        FROM "AffiliateClick"
        WHERE createdAt >= ${monthStart}
        GROUP BY linkId, ip, d
      ) AS sub
    `
    const [{ cnt: yearClicksRaw } = { cnt: 0 }] = await db.$queryRaw<any[]>`
      SELECT COUNT(*) AS cnt FROM (
        SELECT linkId, ip, date(createdAt) AS d
        FROM "AffiliateClick"
        WHERE createdAt >= ${yearStart}
        GROUP BY linkId, ip, d
      ) AS sub
    `
    const todayClicks = Number(todayClicksRaw ?? 0)
    const weekClicks = Number(weekClicksRaw ?? 0)
    const monthClicks = Number(monthClicksRaw ?? 0)
    const yearClicks = Number(yearClicksRaw ?? 0)

    // Günlük seri: local gün anahtarı + tekil linkId+ip
    function toDateKeyLocal(d: Date) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const da = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${da}`
    }

    // Varsayılan günlük seri (Son 30 gün)
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    const dailyCounts30: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      dailyCounts30[toDateKeyLocal(d)] = 0
    }
    const perDayUnique30 = new Map<string, Set<string>>()
    for (const c of recentClicksRaw) {
      const keyDate = toDateKeyLocal(new Date(c.createdAt))
      const uniqKey = `${c.linkId}-${c.ip ?? 'unknown'}`
      const set = perDayUnique30.get(keyDate) ?? new Set<string>()
      set.add(uniqKey)
      perDayUnique30.set(keyDate, set)
    }
    for (const [date, set] of perDayUnique30.entries()) {
      dailyCounts30[date] = set.size
    }
    let seriesDaily = Object.entries(dailyCounts30)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, count]) => ({ date, count }))

    // 5 yıllık raw click'leri al ve JS tarafında tekil günlük -> aylık/yıllık toplamları üret
    const clicks5y = await db.affiliateClick.findMany({
      where: { createdAt: { gte: fiveYearsStart } },
      orderBy: { createdAt: 'asc' },
    })
    const perDayUniq5y = new Map<string, Set<string>>()
    for (const c of clicks5y) {
      const dkey = toDateKeyLocal(new Date(c.createdAt))
      const ukey = `${c.linkId}-${c.ip ?? 'unknown'}`
      const set = perDayUniq5y.get(dkey) ?? new Set<string>()
      set.add(ukey)
      perDayUniq5y.set(dkey, set)
    }
    const monthCounts: Record<string, number> = {}
    const yearCounts: Record<string, number> = {}
    for (const [dkey, set] of perDayUniq5y.entries()) {
      const monthKey = dkey.slice(0, 7) // YYYY-MM
      const yearKey = dkey.slice(0, 4) // YYYY
      monthCounts[monthKey] = (monthCounts[monthKey] ?? 0) + set.size
      yearCounts[yearKey] = (yearCounts[yearKey] ?? 0) + set.size
    }
    // Ay serisini son 60 ay ile sınırla
    const seriesMonthly60 = Object.entries(monthCounts)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .slice(Math.max(0, Object.keys(monthCounts).length - 60))
      .map(([m, count]) => ({ date: m, label: m, count }))
    const seriesYearly5 = Object.entries(yearCounts)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .slice(Math.max(0, Object.keys(yearCounts).length - 5))
      .map(([y, count]) => ({ date: y, label: y, count }))

    // Eğer tarih aralığı veya link filtresi verildiyse hibrit okuma ile seri üret
    let seriesMonthly: { date: string; label?: string; count: number }[] | undefined
    let seriesYearly: { date: string; label?: string; count: number }[] | undefined
    if (qFrom || qTo || qLinkId) {
      const rangeFrom = qFrom ? new Date(qFrom) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
      const rangeTo = qTo ? new Date(qTo) : now
      rangeFrom.setHours(0, 0, 0, 0)
      rangeTo.setHours(23, 59, 59, 999)

      // Hibrit: son 180 gün raw, daha eski AffiliateDailyStat
      const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 179)
      cutoff.setHours(0, 0, 0, 0)

      // Günlük veri konteyneri (tüm tarih aralığı)
      const dailyAll: Record<string, number> = {}
      const daysDiff = Math.ceil((rangeTo.getTime() - rangeFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1
      for (let i = 0; i < daysDiff; i++) {
        const d = new Date(rangeFrom)
        d.setDate(rangeFrom.getDate() + i)
        dailyAll[toDateKeyLocal(d)] = 0
      }

      // 1) Eski bölüm: rollup tablosundan oku
      const oldStart = rangeFrom < cutoff ? rangeFrom : undefined
      const oldEnd = rangeTo < cutoff ? rangeTo : new Date(cutoff.getTime() - 24 * 3600 * 1000)
      if (oldStart && oldEnd && oldStart <= oldEnd) {
        await ensureDailyStatTable()
        const oldFromKey = toDateKeyLocal(oldStart)
        const oldToKey = toDateKeyLocal(oldEnd)
        const whereLink = qLinkId ? `AND linkId = ?` : ''
        const rows: any[] = await db.$queryRawUnsafe(
          `SELECT date AS d, SUM(uniqueCount) AS cnt FROM "AffiliateDailyStat" WHERE date >= ? AND date <= ? ${whereLink} GROUP BY d ORDER BY d ASC;`,
          oldFromKey,
          oldToKey,
          ...(qLinkId ? [qLinkId] : [])
        )
        for (const r of rows) {
          const dkey = String(r.d)
          const cnt = Number(r.cnt ?? 0)
          if (dailyAll[dkey] !== undefined) dailyAll[dkey] += cnt
        }
      }

      // 2) Yeni bölüm: raw tablodan tekil günlük sayım
      const newStart = rangeTo >= cutoff ? (rangeFrom >= cutoff ? rangeFrom : cutoff) : undefined
      const newEnd = rangeTo >= cutoff ? rangeTo : undefined
      if (newStart && newEnd) {
        const clicksRaw = await db.affiliateClick.findMany({
          where: {
            createdAt: { gte: newStart, lte: newEnd },
            ...(qLinkId ? { linkId: qLinkId } : {}),
          },
          orderBy: { createdAt: 'asc' },
        })
        const perDayUnique = new Map<string, Set<string>>()
        for (const c of clicksRaw) {
          const dkey = toDateKeyLocal(new Date(c.createdAt))
          const ukey = `${c.linkId}-${c.ip ?? 'unknown'}`
          const set = perDayUnique.get(dkey) ?? new Set<string>()
          set.add(ukey)
          perDayUnique.set(dkey, set)
        }
        for (const [dkey, set] of perDayUnique.entries()) {
          if (dailyAll[dkey] !== undefined) dailyAll[dkey] += set.size
        }
      }

      // Günlük seri (seçili aralık)
      seriesDaily = Object.entries(dailyAll)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([date, count]) => ({ date, count }))

      // Aylık/yıllık seri (seçili aralık)
      const monthCounts: Record<string, number> = {}
      const yearCounts: Record<string, number> = {}
      for (const [dkey, cnt] of Object.entries(dailyAll)) {
        const monthKey = dkey.slice(0, 7)
        const yearKey = dkey.slice(0, 4)
        monthCounts[monthKey] = (monthCounts[monthKey] ?? 0) + cnt
        yearCounts[yearKey] = (yearCounts[yearKey] ?? 0) + cnt
      }
      seriesMonthly = Object.entries(monthCounts)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([m, count]) => ({ date: m, label: m, count }))
      seriesYearly = Object.entries(yearCounts)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([y, count]) => ({ date: y, label: y, count }))
    }

    return NextResponse.json({
      links,
      totalClicks,
      totalLinks: links.length,
      todayClicks,
      weekClicks,
      monthClicks,
      yearClicks,
      topLinks,
      recentLinks: links.slice(0, 10),
      seriesDaily,
      seriesMonthly60,
      seriesYearly5,
      ...(seriesMonthly ? { seriesMonthly } : {}),
      ...(seriesYearly ? { seriesYearly } : {}),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'List error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const title: string = (body?.title ?? '').trim()
    const targetUrl: string = (body?.targetUrl ?? '').trim()
    const requestedSlugRaw: string = (body?.slug ?? '').trim()
    if (!title || !targetUrl) {
      return NextResponse.json({ error: 'title ve targetUrl gereklidir' }, { status: 400 })
    }

    // If user provided a slug, validate and use it as-is
    if (requestedSlugRaw) {
      const candidate = slugify(requestedSlugRaw)
      if (!candidate) {
        return NextResponse.json({ error: 'Geçerli bir slug giriniz' }, { status: 400 })
      }
      if (RESERVED_SLUGS.has(candidate)) {
        return NextResponse.json({ error: 'Bu slug kullanılamaz (rezerve)' }, { status: 400 })
      }
      const exists = await db.affiliateLink.findUnique({ where: { slug: candidate } })
      if (exists) {
        return NextResponse.json({ error: 'Slug kullanımda, lütfen farklı bir değer giriniz' }, { status: 409 })
      }

      const created = await db.affiliateLink.create({
        data: { title, targetUrl, slug: candidate },
      })
      return NextResponse.json(created)
    }

    // Otherwise, generate a slug from title or targetUrl and ensure uniqueness
    let base = slugify(title)
    if (!base) {
      try {
        const url = new URL(targetUrl)
        base = slugify(url.hostname)
      } catch {
        base = slugify(targetUrl)
      }
    }

    // Ensure uniqueness by appending counter if needed
    let slug = base
    let counter = 1
    // Try up to 50 variants
    while (counter < 50) {
      const exists = await db.affiliateLink.findUnique({ where: { slug } })
      if (!exists) break
      slug = `${base}-${counter++}`
    }

    const created = await db.affiliateLink.create({
      data: {
        title,
        targetUrl,
        slug,
      },
    })
    return NextResponse.json(created)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Create error' }, { status: 500 })
  }
}
async function ensureDailyStatTable() {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AffiliateDailyStat" (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        linkId TEXT NOT NULL,
        uniqueCount INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_ads_date_link ON "AffiliateDailyStat" (date, linkId);`)
  } catch {
    // ignore
  }
}