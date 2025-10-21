import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const appId = process.env.ONESIGNAL_APP_ID
    const apiKey = process.env.ONESIGNAL_REST_API_KEY
    if (!appId || !apiKey) {
      return NextResponse.json({ ok: false, error: 'ONESIGNAL_APP_ID/REST_API_KEY eksik' }, { status: 400 })
    }

    const body = await req.json()
    const { message = 'Bugünün kuponları hazır!' } = body || {}

    const resp = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        contents: { en: message, tr: message },
        included_segments: ['Subscribed Users'],
      }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      return NextResponse.json({ ok: false, error: text || 'OneSignal API hata' }, { status: 400 })
    }

    const data = await resp.json()
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}