import { unstable_cache, revalidateTag } from 'next/cache'

interface CacheOptions {
  key: string[]
  tags?: string[]
  revalidate?: number
}

export function withCache<T>(fn: () => Promise<T>, options: CacheOptions) {
  const { key, tags = [], revalidate } = options
  return unstable_cache(fn, key, { tags, revalidate })()
}

export function revalidateSiteReviewsTag(brandId: string) {
  revalidateTag(`site-reviews:${brandId}`)
}

export function revalidateReviewBrandTags(slug?: string) {
  revalidateTag('review-brands:list')
  if (slug) revalidateTag(`review-brand:${slug}`)
}