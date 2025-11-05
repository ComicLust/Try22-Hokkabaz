'use client'
import React, { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function DailyLineChart({ data }: { data: { date: string; label?: string; count: number }[] }) {
  const formatted = useMemo(
    () => (data || []).map((d) => ({ ...d, dateLabel: d.label ?? (d.date.length >= 10 ? d.date.slice(5) : d.date) })),
    [data]
  )
  const maxY = useMemo(() => {
    const m = Math.max(0, ...formatted.map((d) => d.count))
    return m === 0 ? 1 : m
  }, [formatted])

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={formatted} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} stroke="var(--border)" />
          <YAxis domain={[0, maxY]} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} stroke="var(--border)" allowDecimals={false} />
          <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', color: 'var(--popover-foreground)' }} />
          <Line type="monotone" dataKey="count" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}