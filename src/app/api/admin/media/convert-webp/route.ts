import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { readdir, stat, readFile, writeFile, access, unlink } from 'fs/promises'
import sharp from 'sharp'

export const runtime = 'nodejs'

interface ConvertRequestBody {
  names?: string[]
  quality?: number // optional override
  deleteSource?: boolean
  reportId?: string
}

function isImageExt(name: string) {
  const ext = path.extname(name).toLowerCase()
  return ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp'
}

function sanitizeName(name: string) {
  if (!name || name.includes('/') || name.includes('..')) return null
  return name
}

async function listConvertibleFiles(uploadsDir: string) {
  const entries = await readdir(uploadsDir, { withFileTypes: true })
  return entries
    .filter((e) => e.isFile() && isImageExt(e.name))
    .map((e) => e.name)
}

export async function POST(req: NextRequest) {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const body = (await req.json().catch(() => ({}))) as ConvertRequestBody
    const quality = Number(body.quality ?? 70)
    const deleteSource = Boolean(body.deleteSource ?? false)
    const reportId = String(body.reportId ?? Date.now())

    let targets: string[]
    if (Array.isArray(body.names) && body.names.length > 0) {
      targets = body.names.map((n) => sanitizeName(n)).filter((n): n is string => !!n)
    } else {
      targets = await listConvertibleFiles(uploadsDir)
    }

    let converted = 0
    let skipped = 0
    const errors: { name: string; error: string }[] = []

    // progress file store
    const progressFile = path.join(process.cwd(), 'db', 'convert-webp-progress.json')
    const updateProgress = async (update: any) => {
      try {
        let map: Record<string, any> = {}
        try {
          const prev = await readFile(progressFile).catch(() => null)
          if (prev) map = JSON.parse(prev.toString('utf-8'))
        } catch {}
        map[reportId] = {
          reportId,
          deleteSource,
          quality,
          ...(map[reportId] || {}),
          ...update,
          updatedAt: new Date().toISOString(),
        }
        await writeFile(progressFile, Buffer.from(JSON.stringify(map, null, 2)))
      } catch {}
    }

    await updateProgress({ status: 'running', total: targets.length, converted: 0, skipped: 0, errors: [], startedAt: new Date().toISOString() })

    for (const name of targets) {
      try {
        const ext = path.extname(name).toLowerCase()
        if (ext === '.webp') { skipped++; continue }

        const full = path.join(uploadsDir, name)
        const s = await stat(full).catch(() => null)
        if (!s || !s.isFile()) { skipped++; continue }

        const base = name.slice(0, name.length - ext.length)
        const outName = `${base}.webp`
        const outFull = path.join(uploadsDir, outName)

        // If webp already exists, skip
        const exists = await access(outFull).then(() => true).catch(() => false)
        if (exists) { skipped++; continue }

        const buf = await readFile(full)
        const outBuf = await sharp(buf).webp({ quality, effort: 4 }).toBuffer()
        await writeFile(outFull, outBuf)
        converted++
        if (deleteSource) {
          try { await unlink(full) } catch {}
        }
        await updateProgress({ converted, skipped, processed: converted + skipped })
      } catch (e: any) {
        errors.push({ name, error: e?.message ?? 'convert_failed' })
        await updateProgress({ converted, skipped, processed: converted + skipped, errors })
      }
    }

    await updateProgress({ status: 'done', converted, skipped, processed: converted + skipped, errors })
    return NextResponse.json({ ok: true, reportId, converted, skipped, total: targets.length, errors })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'convert_error' }, { status: 500 })
  }
}