"use client"
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function PushPermission() {
  const [supported, setSupported] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ok = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
    setSupported(ok)
    if (ok) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {})
    }
  }, [])

  const requestPermissionAndSubscribe = async () => {
    try {
      setLoading(true)
      setError(null)
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Bildirim izni verilmedi')
      }
      const reg = await navigator.serviceWorker.ready
      const res = await fetch('/api/push/public-key')
      const { publicKey } = await res.json()
      if (!publicKey) throw new Error('Public key alınamadı')
      const applicationServerKey = urlBase64ToUint8Array(publicKey)
      const subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
      const ua = window.navigator.userAgent
      const save = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, userAgent: ua }),
      })
      if (!save.ok) {
        const j = await save.json().catch(() => ({}))
        throw new Error(j?.error || 'Subscribe failed')
      }
      setSubscribed(true)
    } catch (e: any) {
      setError(e?.message ?? 'Abonelik hatası')
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  return (
    <div className="flex items-center gap-2">
      <Button disabled={loading || subscribed} onClick={requestPermissionAndSubscribe}>
        {subscribed ? 'Abone olundu' : loading ? 'Kaydediliyor...' : 'Bildirimlere izin ver'}
      </Button>
      {error && <span className="text-red-600 text-sm">{error}</span>}
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}