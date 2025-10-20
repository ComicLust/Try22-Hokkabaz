import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
const prisma: any = db

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    await prisma.pushSubscriber.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}