import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/telegram-suggestions?status=pending|approved|rejected|all&q=&page=1&limit=20&sortBy=createdAt&order=desc
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = (searchParams.get('status') || 'pending') as 'pending' | 'approved' | 'rejected' | 'all'
    const q = searchParams.get('q') || undefined
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit
    const sortByRaw = (searchParams.get('sortBy') || 'createdAt')
    const orderRaw = (searchParams.get('order') || 'desc')
    const sortBy = ['createdAt','name','members'].includes(sortByRaw!) ? (sortByRaw as 'createdAt'|'name'|'members') : 'createdAt'
    const order = orderRaw === 'asc' ? 'asc' : 'desc'

    const where: any = {}
    if (status === 'pending') { where.isApproved = false; where.isRejected = false }
    if (status === 'approved') where.isApproved = true
    if (status === 'rejected') where.isRejected = true
    if (q) where.name = { contains: q, mode: 'insensitive' }

    const [items, total] = await Promise.all([
      (db as any).telegramSuggestion.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip,
        take: limit,
      }),
      (db as any).telegramSuggestion.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Listeleme hatası' }, { status: 500 })
  }
}