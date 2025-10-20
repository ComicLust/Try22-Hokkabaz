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
  'hakkimizda', 'iletisim', 'kampanyalar', 'bonuslar', 'anlasmali-siteler', 'guvenilir-telegram', 'vpn-onerileri', 'yorumlar',
  'sitemap.xml', 'favicon.ico', 'robots.txt'
])

export async function GET() {
  try {
    const [links, topLinks, recentLinks] = await Promise.all([
      db.affiliateLink.findMany({ orderBy: { createdAt: 'desc' } }),
      db.affiliateLink.findMany({ orderBy: { clicks: 'desc' }, take: 10 }),
      db.affiliateLink.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
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

    const [todayClicks, weekClicks, monthClicks, yearClicks, recentClicks] = await Promise.all([
      db.affiliateClick.count({ where: { createdAt: { gte: todayStart } } }),
      db.affiliateClick.count({ where: { createdAt: { gte: weekStart } } }),
      db.affiliateClick.count({ where: { createdAt: { gte: monthStart } } }),
      db.affiliateClick.count({ where: { createdAt: { gte: yearStart } } }),
      db.affiliateClick.findMany({ where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29) } }, orderBy: { createdAt: 'desc' } }),
    ])

    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    const dailyCounts: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      dailyCounts[d.toISOString().slice(0, 10)] = 0
    }
    for (const c of recentClicks) {
      const key = new Date(c.createdAt).toISOString().slice(0, 10)
      if (key in dailyCounts) dailyCounts[key]++
    }
    const seriesDaily = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }))

    return NextResponse.json({
      links,
      totalClicks,
      totalLinks: links.length,
      todayClicks,
      weekClicks,
      monthClicks,
      yearClicks,
      topLinks,
      recentLinks,
      seriesDaily,
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