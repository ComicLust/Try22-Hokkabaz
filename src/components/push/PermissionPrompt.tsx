"use client"
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

type PermConfig = {
  title?: string
  description?: string
  allowText?: string
  laterText?: string
  bgColor?: string
  textColor?: string
  imageUrl?: string
  position?: 'top' | 'middle' | 'bottom'
  radiusClass?: string
  shadowClass?: string
}

const DEFAULTS: PermConfig = {
  title: 'Bildirimlere izin ver',
  description: 'Yeni kampanyaları, bonusları ve özel fırsatları anında öğren!',
  allowText: 'İzin Ver',
  laterText: 'Daha Sonra',
  bgColor: '#111827',
  textColor: '#FFFFFF',
  imageUrl: '',
  position: 'bottom',
  radiusClass: 'rounded-xl',
  shadowClass: 'shadow-lg',
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PermissionPrompt() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [config, setConfig] = useState<PermConfig>(DEFAULTS)
  const [supported, setSupported] = useState(false)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = useMemo(() => pathname?.startsWith('/admin') ?? false, [pathname])

  // Force flag via URL (?forcePushPrompt=1) or localStorage("forcePushPrompt" === "1")
  const forced = useMemo(() => {
    try {
      const urlForced = searchParams?.get('forcePushPrompt') === '1'
      const lsForced = typeof window !== 'undefined' && localStorage.getItem('forcePushPrompt') === '1'
      return Boolean(urlForced || lsForced)
    } catch {
      return false
    }
  }, [searchParams])

  useEffect(() => {
    const ok = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setSupported(ok)
    if (ok) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (isAdmin) return
    let cancelled = false

    const shouldShow = () => {
      if (!supported) return false
      if (typeof window === 'undefined') return false
      // If permission already decided, don't show unless forced
      const perm = Notification.permission
      if (!forced && (perm === 'granted' || perm === 'denied')) return false
      // Dismissed within last 24h?
      const dismissedAt = localStorage.getItem('pushPromptDismissedAt')
      if (!forced && dismissedAt) {
        const ts = Number(dismissedAt)
        const twentyFourHours = 24 * 60 * 60 * 1000
        if (!Number.isNaN(ts) && Date.now() - ts < twentyFourHours) return false
      }
      return true
    }

    const sanitize = (x: any): PermConfig => ({
      title: x?.title ?? DEFAULTS.title,
      description: x?.description ?? DEFAULTS.description,
      allowText: x?.allowText ?? DEFAULTS.allowText,
      laterText: x?.laterText ?? DEFAULTS.laterText,
      bgColor: x?.bgColor ?? DEFAULTS.bgColor,
      textColor: x?.textColor ?? DEFAULTS.textColor,
      imageUrl: x?.imageUrl ?? DEFAULTS.imageUrl,
      position: (x?.position === 'top' || x?.position === 'middle' || x?.position === 'bottom') ? x.position : DEFAULTS.position,
      radiusClass: x?.radiusClass ?? DEFAULTS.radiusClass,
      shadowClass: x?.shadowClass ?? DEFAULTS.shadowClass,
    })

    const loadConfig = async () => {
      try {
        const res = await fetch('/api/push/permission-screen')
        const data = await res.json()
        if (!cancelled && data) setConfig(sanitize(data))
      } catch {
        // fall back to defaults
      } finally {
        if (!cancelled) setVisible(shouldShow())
      }
    }

    loadConfig()
    return () => { cancelled = true }
  }, [isAdmin, supported, forced])

  const handleAllow = async () => {
    try {
      setLoading(true)
      setError(null)
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        // User denied or dismissed the browser prompt; hide and do not nag
        setVisible(false)
        return
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
      setVisible(false)
    } catch (e: any) {
      setError(e?.message ?? 'Abonelik hatası')
    } finally {
      setLoading(false)
    }
  }

  const handleLater = () => {
    try {
      localStorage.setItem('pushPromptDismissedAt', String(Date.now()))
    } catch {}
    setVisible(false)
  }

  if (!supported || isAdmin || !visible) return null

  const top = config.position === 'top'
  const middle = config.position === 'middle'
  const bottom = config.position === 'bottom' || !config.position

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <div
        className={
          `absolute left-0 right-0 mx-auto w-[94%] sm:w-[80%] md:w-[60%] max-w-[720px] p-4 flex items-center gap-3 pointer-events-auto ${config.radiusClass ?? ''} ${config.shadowClass ?? ''}`
        }
        style={{
          backgroundColor: config.bgColor ?? DEFAULTS.bgColor,
          color: config.textColor ?? DEFAULTS.textColor,
          top: top ? '6%' : middle ? '50%' : 'auto',
          bottom: bottom ? '6%' : 'auto',
          transform: middle ? 'translateY(-50%)' : 'none',
        }}
      >
        {config.imageUrl && (
          <img src={config.imageUrl} alt="logo" className="w-10 h-10 object-cover rounded" />
        )}
        <div className="flex-1">
          <div className="font-medium text-sm sm:text-base">{config.title ?? DEFAULTS.title}</div>
          <div className="text-[11px] sm:text-xs opacity-80">{config.description ?? DEFAULTS.description}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleAllow} disabled={loading} style={{ backgroundColor: config.textColor ?? DEFAULTS.textColor, color: config.bgColor ?? DEFAULTS.bgColor }}>
            {loading ? 'Kaydediliyor...' : (config.allowText ?? DEFAULTS.allowText)}
          </Button>
          <Button size="sm" variant="outline" className="bg-transparent border border-white/40" onClick={handleLater} style={{ color: config.textColor ?? DEFAULTS.textColor }}>
            {config.laterText ?? DEFAULTS.laterText}
          </Button>
        </div>
        {error && (
          <div className="ml-3 text-[11px] sm:text-xs text-red-600">{error}</div>
        )}
      </div>
    </div>
  )
}