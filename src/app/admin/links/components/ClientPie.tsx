'use client'
import dynamic from 'next/dynamic'

const RePieChart = dynamic(() => import('../recharts/Pie'), { ssr: false })

export default function ClientPie({ data }: { data: { country: string; count: number }[] }) {
  return <RePieChart data={data} />
}