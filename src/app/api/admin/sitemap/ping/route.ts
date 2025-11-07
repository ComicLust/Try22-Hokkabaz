import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { baseUrl } = await req.json()
  if (!baseUrl) return Response.json({ ok: false, error: 'baseUrl gereklidir' }, { status: 400 })

  const sitemap = `${baseUrl.replace(/\/$/, '')}/sitemap.xml`
  try {
    const google = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`, { method: 'GET' })
    const bing = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}`, { method: 'GET' })

    return Response.json({ ok: true, google: google.status, bing: bing.status, sitemap })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message ?? 'Ping başarısız' }, { status: 500 })
  }
}