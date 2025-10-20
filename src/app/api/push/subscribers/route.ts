import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
const prisma: any = db

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const browser = searchParams.get('browser')
  const device = searchParams.get('device')
  const where: any = { }
  if (browser) where.browser = browser
  if (device) where.device = device
  const list = await prisma.pushSubscriber.findMany({ where, orderBy: { createdAt: 'desc' } })
  const total = await prisma.pushSubscriber.count()
  const active = await prisma.pushSubscriber.count({ where: { isActive: true } })
  return NextResponse.json({ total, active, items: list })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all')
  if (all === 'true') {
    await prisma.pushSubscriber.deleteMany({})
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Set ?all=true to clear all' }, { status: 400 })
}