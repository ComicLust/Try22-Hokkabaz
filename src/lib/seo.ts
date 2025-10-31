import { db } from '@/lib/db'

export interface SeoRecord {
  id?: string
  page?: string | null
  title?: string | null
  description?: string | null
  keywords?: string | null
  canonicalUrl?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImageUrl?: string | null
  ogLogoUrl?: string | null
  twitterTitle?: string | null
  twitterDescription?: string | null
  twitterImageUrl?: string | null
  robotsIndex?: boolean | null
  robotsFollow?: boolean | null
  structuredData?: unknown | null
  ogType?: string | null
}

// Valid OpenGraph types according to the Open Graph protocol
const VALID_OG_TYPES = [
  'website',
  'article',
  'book',
  'profile',
  'music.song',
  'music.album',
  'music.playlist',
  'music.radio_station',
  'video.movie',
  'video.episode',
  'video.tv_show',
  'video.other'
] as const

export type ValidOgType = typeof VALID_OG_TYPES[number]

export function validateOgType(ogType: string | null | undefined): ValidOgType {
  if (!ogType || typeof ogType !== 'string') {
    return 'website'
  }
  
  return VALID_OG_TYPES.includes(ogType as any) ? (ogType as ValidOgType) : 'website'
}

function normalizeVariants(primary: string, aliases: string[] = []): string[] {
  const all = [primary, primary.replace(/^\/+/, ''), ...aliases]
  const cleaned = all
    .filter(Boolean)
    .map((p) => String(p).trim())
    .flatMap((p) => [p, p.replace(/^\/+/, '')])
  return Array.from(new Set(cleaned))
}

export async function getSeoRecord(pageKey: string, aliases: string[] = []): Promise<SeoRecord | null> {
  const variants = normalizeVariants(pageKey, aliases)
  for (const key of variants) {
    const record = await (db as any).seoSetting.findUnique({
      where: { page: key },
      select: {
        id: true,
        page: true,
        title: true,
        description: true,
        keywords: true,
        canonicalUrl: true,
        ogTitle: true,
        ogDescription: true,
        ogImageUrl: true,
        ogLogoUrl: true,
        twitterTitle: true,
        twitterDescription: true,
        twitterImageUrl: true,
        robotsIndex: true,
        robotsFollow: true,
        structuredData: true,
        ogType: true,
      },
    })
    if (record) return record as SeoRecord
  }
  return null
}