import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const item = await (db as any).analyticsCode.findUnique({ where: { id } })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(item)
  } catch (e) {
    console.error('GET /api/admin/analytics-codes/[id] error', e)
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const data: any = {}
    if (typeof body.name === 'string') data.name = body.name
    if (typeof body.type === 'string') data.type = body.type
    if (typeof body.code === 'string') data.code = body.code
    if (typeof body.injectTo === 'string') {
      const v = body.injectTo.trim()
      if (v !== 'head' && v !== 'body') {
        return NextResponse.json({ error: 'injectTo must be "head" or "body"' }, { status: 400 })
      }
      data.injectTo = v
    }
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive

    const updated = await (db as any).analyticsCode.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH /api/admin/analytics-codes/[id] error', e)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    await (db as any).analyticsCode.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/admin/analytics-codes/[id] error', e)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}