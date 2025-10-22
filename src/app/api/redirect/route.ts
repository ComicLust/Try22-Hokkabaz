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

async function lookupCountry(ip: string | null): Promise<string | null> {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return null
  try {
    const res = await fetch(`https://ipwho.is/${ip}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()
    if (data?.success === false) return null
    return data?.country || null
  } catch {
    return null
  }
}

function getIp(req: Request) {
  const fwd = req.headers.get('x-forwarded-for') || ''
  const ip = fwd.split(',')[0].trim() || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || ''
  return ip || 'unknown'
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const u = searchParams.get('u') || searchParams.get('url')
    if (!u) return NextResponse.json({ error: 'url parametresi gerekli' }, { status: 400 })

    let target: URL
    try {
      target = new URL(u)
    } catch {
      return NextResponse.json({ error: 'Geçersiz URL' }, { status: 400 })
    }
    if (!(target.protocol === 'http:' || target.protocol === 'https:')) {
      return NextResponse.json({ error: 'Yalnızca http/https desteklenir' }, { status: 400 })
    }

    let link = await db.affiliateLink.findFirst({ where: { targetUrl: u } })
    if (!link) {
      const base = slugify(`${target.hostname}-${target.pathname}`) || slugify(target.hostname)
      let slug = base || 'link'
      let counter = 1
      while (counter < 50) {
        const exists = await db.affiliateLink.findUnique({ where: { slug } })
        if (!exists) break
        slug = `${base}-${counter++}`
      }
      link = await db.affiliateLink.create({ data: { title: target.hostname, slug, targetUrl: u, isManual: false } })
    }

    const ipHeader = getIp(req)
    const ip = ipHeader || 'unknown'
    const userAgent = req.headers.get('user-agent') || null
    const country = await lookupCountry(ipHeader === 'unknown' ? null : ipHeader)

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const existing = await db.affiliateClick.findFirst({ where: { linkId: link.id, ip, createdAt: { gte: since } } })

    const ops: import('@prisma/client').Prisma.PrismaPromise<unknown>[] = [
      db.affiliateClick.create({
        data: { linkId: link.id, ip: ip || undefined, country: country || undefined, userAgent: userAgent || undefined },
      }),
    ]
    if (!existing) {
      ops.push(db.affiliateLink.update({ where: { id: link.id }, data: { clicks: { increment: 1 } } }))
    }

    await db.$transaction(ops)

    return NextResponse.json({ targetUrl: u, slug: link.slug, linkId: link.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Redirect API error' }, { status: 500 })
  }
}