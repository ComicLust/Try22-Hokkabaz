import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { revalidateReviewBrandTags, revalidateSiteReviewsTag } from '@/lib/cache'

import { db } from '@/lib/db'

interface CacheRequestBody {
  action: 'review-brands' | 'review-brand-by-slug' | 'site-reviews' | 'home-bonuses' | 'home-campaigns' | 'home-reviews-stats' | 'all'
  slug?: string
  brandId?: string
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<CacheRequestBody>

  try {
    switch (body.action) {
      case 'review-brands': {
        revalidateReviewBrandTags()
        break
      }
      case 'review-brand-by-slug': {
        if (!body.slug) return Response.json({ ok: false, error: 'slug gereklidir' }, { status: 400 })
        revalidateReviewBrandTags(body.slug)
        break
      }
      case 'site-reviews': {
        if (!body.brandId) return Response.json({ ok: false, error: 'brandId gereklidir' }, { status: 400 })
        revalidateSiteReviewsTag(body.brandId)
        break
      }
      case 'home-bonuses': {
        revalidateTag('home:bonuses')
        break
      }
      case 'home-campaigns': {
        revalidateTag('home:campaigns')
        break
      }
      case 'home-reviews-stats': {
        revalidateTag('home:reviews-stats')
        break
      }
      case 'all': {
        // Review brands list and any specific brand page
        revalidateReviewBrandTags()
        // Home caches
        revalidateTag('home:bonuses')
        revalidateTag('home:campaigns')
        revalidateTag('home:reviews-stats')
        // Site reviews per brand
        try {
          const brands = await db.reviewBrand.findMany({ select: { id: true } })
          for (const b of brands) {
            revalidateSiteReviewsTag(b.id)
          }
        } catch {
          // ignore
        }
        break
      }
      default: {
        return Response.json({ ok: false, error: 'Geçersiz action' }, { status: 400 })
      }
    }
    return Response.json({ ok: true })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message ?? 'Cache temizlenemedi' }, { status: 500 })
  }
}