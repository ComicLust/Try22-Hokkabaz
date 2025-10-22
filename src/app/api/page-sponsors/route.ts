import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const pageKey = url.searchParams.get('pageKey') ?? 'canli-mac-izle'
    const items = await (db as any).pageSponsor?.findMany?.({
      where: { pageKey },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ items: items ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Listeleme hatası' }, { status: 500 })
  }
}