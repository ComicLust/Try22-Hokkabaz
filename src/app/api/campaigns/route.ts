import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const items = await db.campaign.findMany({
    // Sıralamayı tek kaynak: admin’deki sürükle-bırak ile belirlenen priority
    orderBy: { priority: 'desc' }
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const created = await db.campaign.create({ data: body })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}