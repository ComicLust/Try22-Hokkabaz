import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function safeHasPageTsx(dir: string) {
  try {
    return fs.existsSync(path.join(dir, 'page.tsx'))
  } catch {
    return false
  }
}

export async function GET() {
  const appDir = path.join(process.cwd(), 'src', 'app')
  const pages: string[] = []

  // Root page
  if (safeHasPageTsx(appDir)) {
    pages.push('/')
  }

  const exclude = new Set(['api', 'admin'])

  let entries: fs.Dirent[] = []
  try {
    entries = fs.readdirSync(appDir, { withFileTypes: true })
  } catch (e) {
    // If reading fails, return at least root
    return NextResponse.json(pages)
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const name = entry.name
    if (exclude.has(name)) continue
    if (name.startsWith('(')) continue // route groups
    if (name.startsWith('_')) continue // special folders
    if (name.includes('[')) continue // dynamic segments
    const subDir = path.join(appDir, name)
    if (safeHasPageTsx(subDir)) {
      pages.push(`/${name}`)
    }
  }

  pages.sort((a, b) => a.localeCompare(b))

  return NextResponse.json(pages)
}