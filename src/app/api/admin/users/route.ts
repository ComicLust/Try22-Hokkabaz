import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Alias to avoid Prisma delegate typing noise in editors
const prisma: any = db

// GET /api/admin/users?q=search&page=1&limit=20&sort=desc|asc
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || undefined
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const sort = (searchParams.get('sort') || 'desc') as 'desc' | 'asc'
    const skip = (page - 1) * limit

    // Ensure admin user exists in listing by syncing from env username
    const envUser = process.env.ADMIN_USERNAME || 'admin'
    if (envUser && typeof envUser === 'string') {
      try {
        await prisma.user.upsert({
          where: { email: envUser },
          update: {},
          create: { email: envUser, name: 'Yönetici' },
        })
      } catch {}
    }

    const where: any = {}
    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: sort },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Listeleme hatası' }, { status: 500 })
  }
}

// POST /api/admin/users { email, name }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name } = body || {}

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'E-posta gerekli' }, { status: 400 })
    }

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'E-posta zaten kayıtlı' }, { status: 400 })
    }

    const created = await prisma.user.create({ data: { email, name: name ?? null } })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Oluşturma hatası' }, { status: 400 })
  }
}