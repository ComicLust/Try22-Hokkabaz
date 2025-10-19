"use client"
import { useEffect, useState } from 'react'

export default function ActiveCounter({ min = 100, max = 850, intervalMs = 2500 }: { min?: number; max?: number; intervalMs?: number }) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  const [val, setVal] = useState(() => clamp(Math.floor(min + Math.random() * (max - min + 1))))
  useEffect(() => {
    const t = setInterval(() => {
      const delta = (Math.random() < 0.5 ? -1 : 1) * Math.floor(2 + Math.random() * 12)
      setVal((v) => clamp(v + delta))
    }, intervalMs)
    return () => clearInterval(t)
  }, [intervalMs, min, max])
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
      </span>
      Aktif {val.toLocaleString('tr-TR')}
    </span>
  )
}