'use client'
import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import dynamic from 'next/dynamic'

const ClientChart = dynamic(() => import('./ClientChart'), { ssr: false })

interface SeriesItem { date: string; label?: string; count: number }

interface ChartSwitcherProps {
  daily: SeriesItem[]
  monthly: SeriesItem[]
  yearly: SeriesItem[]
}

export default function ChartSwitcher({ daily, monthly, yearly }: ChartSwitcherProps) {
  return (
    <Tabs defaultValue="daily" className="w-full">
      <TabsList className="mb-2">
        <TabsTrigger value="daily">30 Gün</TabsTrigger>
        <TabsTrigger value="monthly">60 Ay</TabsTrigger>
        <TabsTrigger value="yearly">5 Yıl</TabsTrigger>
      </TabsList>
      <TabsContent value="daily">
        <ClientChart series={daily} />
      </TabsContent>
      <TabsContent value="monthly">
        <ClientChart series={monthly} />
      </TabsContent>
      <TabsContent value="yearly">
        <ClientChart series={yearly} />
      </TabsContent>
    </Tabs>
  )
}