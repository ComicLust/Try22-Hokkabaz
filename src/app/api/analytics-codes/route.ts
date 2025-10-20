import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const injectToParam = searchParams.get('injectTo') // optional filter: 'head' | 'body'
  const injectTo = injectToParam === 'head' || injectToParam === 'body' ? injectToParam : undefined
  try {
    const items = await db.analyticsCode.findMany({
      where: {
        isActive: true,
        ...(injectTo ? { injectTo } : {}),
      },
      select: { id: true, name: true, type: true, code: true, injectTo: true },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (e) {
    console.error('GET /api/analytics-codes error', e)
    return NextResponse.json({ error: 'Failed to load active analytics codes' }, { status: 500 })
  }
}