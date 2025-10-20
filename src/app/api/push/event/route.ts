import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
const prisma: any = db

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const type: 'received' | 'clicked' = body?.type
    const notificationId: string = body?.notificationId
    const uuid: string = body?.uuid
    if (!type || !notificationId || !uuid) {
      return NextResponse.json({ error: 'type, notificationId and uuid required' }, { status: 400 })
    }

    const subscriber = await prisma.pushSubscriber.findFirst({ where: { uuid } })
    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
    }

    const existing = await prisma.pushLog.findFirst({ where: { notificationId, subscriberId: subscriber.id } })
    const now = new Date()
    let status = type
    let update: any = {}
    if (type === 'received') update = { receivedAt: now }
    if (type === 'clicked') update = { clickedAt: now }

    if (existing) {
      await prisma.pushLog.update({ where: { id: existing.id }, data: { status, ...update } })
    } else {
      await prisma.pushLog.create({ data: { notificationId, subscriberId: subscriber.id, status, ...update } })
    }

    // Increment counters on notification
    if (type === 'received') {
      await prisma.pushNotification.update({ where: { id: notificationId }, data: { receivedCount: { increment: 1 } } })
    } else if (type === 'clicked') {
      await prisma.pushNotification.update({ where: { id: notificationId }, data: { clickCount: { increment: 1 } } })
    }

    // Update subscriber lastActive
    await prisma.pushSubscriber.update({ where: { id: subscriber.id }, data: { lastActiveAt: now } })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Event error' }, { status: 400 })
  }
}