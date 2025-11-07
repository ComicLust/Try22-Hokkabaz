import { NextRequest } from 'next/server'

function extractMeta(html: string) {
  const get = (name: string) => {
    const re = new RegExp(`<meta[^>]*(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i')
    const m = html.match(re)
    return m?.[1] || null
  }
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || null
  return {
    title,
    'og:title': get('og:title'),
    'og:description': get('og:description'),
    'og:image': get('og:image'),
    'twitter:title': get('twitter:title'),
    'twitter:description': get('twitter:description'),
    'twitter:image': get('twitter:image'),
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  if (!url) return Response.json({ ok: false, error: 'url gereklidir' }, { status: 400 })

  try {
    const res = await fetch(url, { method: 'GET' })
    const html = await res.text()
    const meta = extractMeta(html)
    return Response.json({ ok: true, meta })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message ?? 'Meta alınamadı' }, { status: 500 })
  }
}