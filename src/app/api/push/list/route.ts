import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
const prisma: any = db

export async function GET() {
  const items = await prisma.pushNotification.findMany({ orderBy: { createdAt: 'desc' } })
  const enriched = items.map((n: any) => ({
    ...n,
    successRate: n.targetCount > 0 ? Math.round((n.sentCount / n.targetCount) * 100) : 0,
  }))
  return NextResponse.json(enriched)
}