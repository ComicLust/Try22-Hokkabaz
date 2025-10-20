'use client'
import dynamic from 'next/dynamic'

const ReLineChart = dynamic(() => import('../recharts/Line'), { ssr: false })

export default function ClientChart({ series }: { series: { date: string; count: number }[] }) {
  return <ReLineChart data={series} />
}