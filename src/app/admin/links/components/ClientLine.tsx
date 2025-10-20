'use client'
import dynamic from 'next/dynamic'

const ReLineChart = dynamic(() => import('../recharts/Line'), { ssr: false })

export default function ClientLine({ data }: { data: { date: string; count: number }[] }) {
  return <ReLineChart data={data} />
}