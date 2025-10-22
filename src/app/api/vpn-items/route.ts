import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
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