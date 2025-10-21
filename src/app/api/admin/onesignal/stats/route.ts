import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const appId = process.env.ONESIGNAL_APP_ID
    const apiKey = process.env.ONESIGNAL_REST_API_KEY
    if (!appId || !apiKey) {
      return NextResponse.json({ ok: true, data: { activeUsers: null, dailyReminderOnRate: null, message: 'ONESIGNAL_APP_ID/REST_API_KEY eksik' } })
    }

    // NOTE: OneSignal API uçları sürüme göre değişebilir.
    // Burada örnek bir çağrı ile aktif kullanıcı tahmini alınır; yoksa null döner.
    const resp = await fetch(`https://api.onesignal.com/apps/${appId}/devices?limit=1`, {
      headers: {
        Authorization: `Basic ${apiKey}`,
      },
    })

    if (!resp.ok) {
      return NextResponse.json({ ok: true, data: { activeUsers: null, dailyReminderOnRate: null, message: 'OneSignal API yanıtı başarısız' } })
    }

    const data = await resp.json()
    // Not: /devices endpoint sayfa bilgisi döner; toplam sayıyı almak için ayrı endpoint gerekebilir.
    // Burada aktif kullanıcı sayısını belirleyemiyorsak null olarak bırakıyoruz.
    const activeUsers = null
    const dailyReminderOnRate = null

    return NextResponse.json({ ok: true, data: { activeUsers, dailyReminderOnRate } })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}