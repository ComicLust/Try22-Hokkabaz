import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
const prisma: any = db

export async function GET() {
  const [totalNotifications, totalClicks, activeSubscribers, byBrowser, byDevice] = await Promise.all([
    prisma.pushNotification.count(),
    prisma.pushLog.count({ where: { status: 'clicked' } }),
    prisma.pushSubscriber.count({ where: { isActive: true } }),
    prisma.pushSubscriber.groupBy({ by: ['browser'], _count: { browser: true } }),
    prisma.pushSubscriber.groupBy({ by: ['device'], _count: { device: true } }),
  ])

  // Daily stats for last 30 days
  const days = 30
  const today = new Date()
  const daily: any[] = []
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(today)
    dayStart.setHours(0, 0, 0, 0)
    dayStart.setDate(dayStart.getDate() - i)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)

    /* eslint-disable no-await-in-loop */
    const [sent, clicked, subs] = await Promise.all([
      prisma.pushLog.count({ where: { status: 'sent', createdAt: { gte: dayStart, lte: dayEnd } } }),
      prisma.pushLog.count({ where: { status: 'clicked', createdAt: { gte: dayStart, lte: dayEnd } } }),
      prisma.pushSubscriber.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
    ])
    daily.push({ date: dayStart.toISOString().slice(0, 10), sent, clicked, newSubscribers: subs })
  }

  return NextResponse.json({
    totals: { notifications: totalNotifications, clicks: totalClicks, activeSubscribers },
    distribution: {
      browser: byBrowser.map((b: any) => ({ name: b.browser ?? 'Unknown', count: b._count.browser })),
      device: byDevice.map((d: any) => ({ name: d.device ?? 'Unknown', count: d._count.device })),
    },
    daily,
  })
}