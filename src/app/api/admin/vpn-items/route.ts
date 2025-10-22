import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

const filePath = path.join(process.cwd(), 'src', 'data', 'vpn-items.json')

export async function GET() {
  try {
    const content = await readFile(filePath, 'utf-8')
    const items = JSON.parse(content)
    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ items: [] }, { status: 200 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ error: 'items array required' }, { status: 400 })
    }
    // Basit doğrulama
    const items = body.items.map((it: any) => ({
      name: String(it.name || ''),
      plan: it.plan === 'paid' ? 'paid' : 'free',
      locations: Array.isArray(it.locations) ? it.locations.map((x: any) => String(x)) : [],
      description: String(it.description || ''),
      href: String(it.href || ''),
      features: Array.isArray(it.features) ? it.features.map((x: any) => String(x)) : [],
      imageUrl: String(it.imageUrl || '')
    }))
    await writeFile(filePath, JSON.stringify(items, null, 2), 'utf-8')
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'write_failed' }, { status: 500 })
  }
}