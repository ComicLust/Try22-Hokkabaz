'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import ChartSwitcher from './ChartSwitcher'

interface LinkItem { id: string; title: string; slug: string }
interface SeriesItem { date: string; label?: string; count: number }

interface LinksChartClientProps {
  links: LinkItem[]
  initialDaily: SeriesItem[]
  initialMonthly: SeriesItem[]
  initialYearly: SeriesItem[]
}

function formatDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}

export default function LinksChartClient({ links, initialDaily, initialMonthly, initialYearly }: LinksChartClientProps) {
  const [linkId, setLinkId] = useState<string | undefined>(undefined)
  const [range, setRange] = useState<{ from: Date; to: Date } | undefined>(undefined)
  const [daily, setDaily] = useState<SeriesItem[]>(initialDaily)
  const [monthly, setMonthly] = useState<SeriesItem[]>(initialMonthly)
  const [yearly, setYearly] = useState<SeriesItem[]>(initialYearly)

  const ALL_VALUE = 'all'
  const linkOptions = useMemo(() => [{ id: ALL_VALUE, title: 'Tümü', slug: '' }, ...links], [links])

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams()
    if (linkId) params.set('linkId', linkId)
    if (range?.from) params.set('from', formatDateKey(range.from))
    if (range?.to) params.set('to', formatDateKey(range.to))
    const res = await fetch(`/api/affiliate-links${params.toString() ? `?${params.toString()}` : ''}`, { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    const d: SeriesItem[] = data.seriesDaily ?? []
    const m: SeriesItem[] = data.seriesMonthly ?? data.seriesMonthly60 ?? []
    const y: SeriesItem[] = data.seriesYearly ?? data.seriesYearly5 ?? []
    setDaily(d)
    setMonthly(m)
    setYearly(y)
  }, [linkId, range])

  useEffect(() => {
    fetchData().catch(() => {})
  }, [fetchData])

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <div className="w-full md:w-64">
          <Select value={linkId ?? ALL_VALUE} onValueChange={(v) => setLinkId(v === ALL_VALUE ? undefined : v)}>
            <SelectTrigger><SelectValue placeholder="Link seçin" /></SelectTrigger>
            <SelectContent>
              {linkOptions.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.title || l.slug || 'Tümü'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start">
              {range?.from && range?.to ? `${formatDateKey(range.from)} → ${formatDateKey(range.to)}` : 'Tarih aralığı seçin'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Calendar
              mode="range"
              selected={range as any}
              onSelect={(r: any) => {
                if (r?.from && r?.to) setRange({ from: r.from, to: r.to })
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      <ChartSwitcher daily={daily} monthly={monthly} yearly={yearly} />
    </div>
  )
}