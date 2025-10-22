import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const live = await (db as any).liveMatch?.findFirst?.({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ live: live ?? null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Listeleme hatası' }, { status: 500 })
  }
}