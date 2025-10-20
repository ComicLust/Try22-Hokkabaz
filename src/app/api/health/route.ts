import { NextResponse } from "next/server";
import { access, writeFile } from 'fs/promises'
import path from 'path'

export async function GET() {
  const cwd = process.cwd()
  const candidates = [
    path.join(cwd, 'public', 'uploads'),
    '/app/public/uploads',
    '/workspace/public/uploads',
    '/srv/app/public/uploads',
    '/usr/src/app/public/uploads',
  ]

  const checks: { path: string; ok: boolean }[] = []
  for (const p of candidates) {
    try {
      await access(p)
      checks.push({ path: p, ok: true })
    } catch {
      checks.push({ path: p, ok: false })
    }
  }

  // Try write test file into the first accessible uploads dir
  let writeTest: { path?: string; ok: boolean; error?: string } = { ok: false }
  const target = checks.find(c => c.ok)?.path
  if (target) {
    try {
      const testFile = path.join(target, `health-${Date.now()}.txt`)
      await writeFile(testFile, Buffer.from('ok'))
      writeTest = { path: testFile, ok: true }
    } catch (e: any) {
      writeTest = { path: target, ok: false, error: e?.message }
    }
  }

  const healthy = checks.some(c => c.ok)

  return NextResponse.json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    cwd,
    uploadsPaths: checks,
    writeTest,
  }, { status: healthy ? 200 : 500 })
}