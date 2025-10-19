import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
const prisma: any = db

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const item = await prisma.reviewBrand.findUnique({ where: { slug: params.slug } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}