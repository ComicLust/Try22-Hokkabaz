import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
const prisma: any = db

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const subscription = body?.subscription
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 })
    }

    const userAgent = body?.userAgent ?? ''
    const browser = body?.browser ?? parseBrowser(userAgent)
    const device = body?.device ?? parseDevice(userAgent)

    const existing = await prisma.pushSubscriber.findUnique({ where: { endpoint: subscription.endpoint } })
    const data = {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      browser,
      device,
      lastActiveAt: new Date(),
      isActive: true,
      unsubscribedAt: null,
    }

    let saved
    if (existing) {
      saved = await prisma.pushSubscriber.update({ where: { endpoint: subscription.endpoint }, data })
    } else {
      saved = await prisma.pushSubscriber.create({ data })
    }

    return NextResponse.json({ ok: true, id: saved.id, uuid: saved.uuid })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Subscribe error' }, { status: 400 })
  }
}

function parseBrowser(ua: string): string | undefined {
  if (!ua) return undefined
  const lower = ua.toLowerCase()
  if (lower.includes('chrome')) return 'Chrome'
  if (lower.includes('safari') && !lower.includes('chrome')) return 'Safari'
  if (lower.includes('firefox')) return 'Firefox'
  if (lower.includes('edg')) return 'Edge'
  return undefined
}

function parseDevice(ua: string): string | undefined {
  if (!ua) return undefined
  const lower = ua.toLowerCase()
  if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('ios')) return 'iOS'
  if (lower.includes('android')) return 'Android'
  if (lower.includes('mac os') || lower.includes('macintosh')) return 'macOS'
  if (lower.includes('windows')) return 'Windows'
  return undefined
}