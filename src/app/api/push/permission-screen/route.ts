import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const defaultConfig = {
  title: 'Bildirimlere izin ver',
  description: 'Yeni kampanyaları, bonusları ve özel fırsatları anında öğren!',
  allowText: 'İzin Ver',
  laterText: 'Daha Sonra',
  bgColor: '#111827',
  textColor: '#FFFFFF',
  imageUrl: '',
  position: 'bottom', // top | middle | bottom
  radiusClass: 'rounded-xl',
  shadowClass: 'shadow-lg',
}

export async function GET() {
  try {
    const item = await db.pushPermissionScreen.findFirst()
    return NextResponse.json(item ?? defaultConfig)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Fetch error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const payload = {
      title: typeof body.title === 'string' ? body.title : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      allowText: typeof body.allowText === 'string' ? body.allowText : undefined,
      laterText: typeof body.laterText === 'string' ? body.laterText : undefined,
      bgColor: typeof body.bgColor === 'string' ? body.bgColor : undefined,
      textColor: typeof body.textColor === 'string' ? body.textColor : undefined,
      imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : undefined,
      position: ['top','middle','bottom'].includes(body.position) ? body.position : undefined,
      radiusClass: typeof body.radiusClass === 'string' ? body.radiusClass : undefined,
      shadowClass: typeof body.shadowClass === 'string' ? body.shadowClass : undefined,
    }

    const existing = await db.pushPermissionScreen.findFirst()
    let item
    if (existing) {
      item = await db.pushPermissionScreen.update({ where: { id: existing.id }, data: payload })
    } else {
      item = await db.pushPermissionScreen.create({ data: { ...defaultConfig, ...payload } })
    }
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Save error' }, { status: 500 })
  }
}