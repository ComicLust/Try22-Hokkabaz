import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withCache } from '@/lib/cache'

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const item = await withCache(
    () => db.reviewBrand.findUnique({ where: { slug: params.slug } }),
    { key: ['review-brand-by-slug', params.slug], tags: [`review-brand:${params.slug}`], revalidate: 300 }
  )
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}