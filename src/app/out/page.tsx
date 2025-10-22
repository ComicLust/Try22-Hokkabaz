"use client"

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function RedirectInterstitialQuery() {
  const search = useSearchParams()
  const [step, setStep] = useState<1 | 2>(1)
  const [error, setError] = useState<string | null>(null)
  const [targetUrl, setTargetUrl] = useState<string | null>(null)

  const title = '🔒 Hokkabaz Aracılığıyla Yönlendiriliyorsunuz'
  const subtitle = useMemo(() => (step === 1 ? 'Hızlıca link güvenliği kontrol ediliyor…' : 'Güncel link adresi bulunuyor…'), [step])

  useEffect(() => {
    const u = search.get('u') || search.get('url')
    if (!u) {
      setError('Geçersiz veya eksik bağlantı parametresi.')
      return
    }
    const run = async () => {
      try {
        const qs = new URLSearchParams({ u })
        const res = await fetch(`/api/redirect?${qs}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Yönlendirme hazırlanırken hata oluştu.')
        setTargetUrl(data?.targetUrl)
      } catch (e: any) {
        setError(e?.message || 'Yönlendirme hazırlanırken bilinmeyen bir hata oluştu.')
      }
    }
    run()
  }, [search])

  useEffect(() => {
    const t1 = setTimeout(() => setStep(2), 1000)
    const t2 = setTimeout(() => {
      if (targetUrl) {
        window.location.href = targetUrl
      }
    }, 2000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [targetUrl])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white text-gray-900 p-6">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-sm p-8 relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100 text-green-600 text-2xl">🔒</div>
          <h1 className="text-xl sm:text-2xl font-semibold">{title}</h1>
        </div>

        <div className="mt-6">
          {error ? (
            <p className="text-red-600 text-sm">{error}</p>
          ) : (
            <p className="text-gray-700 text-base sm:text-lg">{subtitle}</p>
          )}
        </div>

        <div className="mt-2">
          <p className="text-gray-500 text-xs sm:text-sm">Lütfen bekleyin, güvenliğiniz için kontrol ediliyor.</p>
        </div>

        <div className="mt-8 flex items-center gap-3 text-gray-500">
          <span className="inline-block h-2 w-2 rounded-full bg-gray-300 animate-pulse" />
          <span className="inline-block h-2 w-2 rounded-full bg-gray-300 animate-pulse [animation-delay:200ms]" />
          <span className="inline-block h-2 w-2 rounded-full bg-gray-300 animate-pulse [animation-delay:400ms]" />
        </div>

        <div className="absolute right-4 bottom-4 opacity-70">
          <Image src="/logo.svg" alt="Hokkabaz" width={64} height={16} className="h-6 w-auto" />
        </div>
      </div>
    </div>
  )
}