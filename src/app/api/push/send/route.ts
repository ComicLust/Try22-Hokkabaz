import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { webPush } from '@/lib/push'

const prisma: any = db

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const title: string = body?.title
    const message: string = body?.body
    const clickAction: string | undefined = body?.click_action
    const icon: string | undefined = body?.icon
    const image: string | undefined = body?.image
    const target: 'all' | 'segment' | 'manual' = body?.target ?? 'all'
    const segment: string | undefined = body?.segment // e.g. 'active_7d'
    const manualIds: string[] = Array.isArray(body?.manualIds) ? body.manualIds : []

    if (!title || !message) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
    }

    // Select subscribers according to target
    let subscribers: any[] = []
    if (target === 'all') {
      subscribers = await prisma.pushSubscriber.findMany({ where: { isActive: true } })
    } else if (target === 'segment') {
      const days = segment === 'active_30d' ? 30 : 7
      const after = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      subscribers = await prisma.pushSubscriber.findMany({ where: { isActive: true, lastActiveAt: { gte: after } } })
    } else if (target === 'manual') {
      subscribers = manualIds.length
        ? await prisma.pushSubscriber.findMany({ where: { id: { in: manualIds }, isActive: true } })
        : []
    }

    // Create notification record
    const notification = await prisma.pushNotification.create({
      data: {
        title,
        body: message,
        clickAction,
        icon,
        image,
        segment: target,
        targetCount: subscribers.length,
      },
    })

    let sentCount = 0

    for (const s of subscribers) {
      const payload = JSON.stringify({
        title,
        body: message,
        clickAction,
        icon,
        image,
        notificationId: notification.id,
        subscriberUUID: s.uuid,
      })

      const subscription = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      }

      try {
        await webPush.sendNotification(subscription as any, payload)
        await prisma.pushLog.create({
          data: {
            notificationId: notification.id,
            subscriberId: s.id,
            status: 'sent',
            sentAt: new Date(),
          },
        })
        sentCount += 1
      } catch (err: any) {
        const statusCode = err?.statusCode
        const isGone = statusCode === 404 || statusCode === 410
        if (isGone) {
          try {
            await prisma.pushSubscriber.update({
              where: { id: s.id },
              data: { isActive: false, unsubscribedAt: new Date() },
            })
          } catch {}
        }
        await prisma.pushLog.create({
          data: {
            notificationId: notification.id,
            subscriberId: s.id,
            status: 'failed',
            error: err?.message ?? 'send error',
          },
        })
      }
    }

    await prisma.pushNotification.update({
      where: { id: notification.id },
      data: { sentCount },
    })

    return NextResponse.json({ ok: true, id: notification.id, targetCount: subscribers.length, sentCount })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Send error' }, { status: 400 })
  }
}