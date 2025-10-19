import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = searchParams.get('page') ?? undefined
  if (page) {
    const item = await (db as any).seoSetting.findUnique({ where: { page } })
    return NextResponse.json(item ?? null)
  }
  const items = await (db as any).seoSetting.findMany({ orderBy: { page: 'asc' } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const created = await (db as any).seoSetting.create({ data: body })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 400 })
  }
}