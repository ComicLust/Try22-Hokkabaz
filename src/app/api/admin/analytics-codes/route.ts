import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const isActiveParam = searchParams.get('isActive')
  const isActive = isActiveParam === null ? undefined : isActiveParam === 'true'

  try {
    const items = await (db as any).analyticsCode.findMany({
      where: {
        AND: [
          q ? { OR: [{ name: { contains: q } }, { type: { contains: q } }] } : {},
          typeof isActive === 'boolean' ? { isActive } : {},
        ],
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (e) {
    console.error('GET /api/admin/analytics-codes error', e)
    return NextResponse.json({ error: 'Failed to load analytics codes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = (body.name ?? '').trim()
    const type = (body.type ?? 'custom').trim() || 'custom'
    const code = (body.code ?? '').trim()
    const injectTo = (body.injectTo ?? 'head').trim() || 'head'
    const isActive = !!body.isActive

    if (!name || !code) {
      return NextResponse.json({ error: 'name and code are required' }, { status: 400 })
    }

    if (injectTo !== 'head' && injectTo !== 'body') {
      return NextResponse.json({ error: 'injectTo must be "head" or "body"' }, { status: 400 })
    }

    const created = await (db as any).analyticsCode.create({
      data: { name, type, code, injectTo, isActive },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    console.error('POST /api/admin/analytics-codes error', e)
    return NextResponse.json({ error: 'Failed to create analytics code' }, { status: 500 })
  }
}