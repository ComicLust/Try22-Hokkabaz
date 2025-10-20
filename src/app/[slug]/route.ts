import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

export async function GET(req: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    const link = await (db as any).affiliateLink.findUnique({ where: { slug } })
    if (!link) return NextResponse.json({ error: 'Link bulunamadı' }, { status: 404 })

    const fwd = req.headers.get('x-forwarded-for') || ''
    const ipHeader = fwd.split(',')[0].trim() || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || null
    const ip = (ipHeader || 'unknown')
    const userAgent = req.headers.get('user-agent') || null
    const country = await lookupCountry(ipHeader)

    // 24 saatlik tekillik penceresi
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Tekil IP kontrolü: aynı IP 24 saat içinde bu linke tıkladıysa clicks artmasın
    const existing = await (db as any).affiliateClick.findFirst({ where: { linkId: link.id, ip, createdAt: { gte: since } } })

    const ops: any[] = [
      (db as any).affiliateClick.create({
        data: {
          linkId: link.id,
          ip: ip || undefined,
          country: country || undefined,
          userAgent: userAgent || undefined,
        },
      }),
    ]
    if (!existing) {
      ops.push(
        (db as any).affiliateLink.update({
          where: { id: link.id },
          data: { clicks: { increment: 1 } },
        })
      )
    }

    await (db as any).$transaction(ops)

    return NextResponse.redirect(link.targetUrl, { status: 302 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Redirect error' }, { status: 500 })
  }
}