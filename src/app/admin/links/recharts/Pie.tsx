'use client'
import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

const THEME_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--primary)', 'var(--accent-foreground)', 'var(--destructive)', 'var(--chart-4)', 'var(--chart-5)']

export default function CountryPieChart({ data }: { data: { country: string; count: number }[] }) {
  const formatted = (data || []).map((d) => ({ name: d.country, value: d.count }))
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={formatted}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            label={{ fill: 'var(--foreground)', fontSize: 12 }}
            labelLine={{ stroke: 'var(--border)' }}
          >
            {formatted.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', color: 'var(--popover-foreground)' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}