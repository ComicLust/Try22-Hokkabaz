import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Raw clickleri uzun vadede küçültmek için günlük özet tabloya aktarma
// - Tekil (date, linkId) bazında günlük unique tıklama sayısı
// - Varsayılan eşik: 365 günden eski kayıtlar
export async function POST() {
  try {
    const threshold = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 365)

    // Özet tabloyu oluştur
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AffiliateDailyStat" (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        linkId TEXT NOT NULL,
        uniqueCount INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_ads_date_link ON "AffiliateDailyStat" (date, linkId);`)

    // 365 günden eski günlük tekil sayımları üret
    const rows = await db.$queryRaw<any[]>`
      SELECT d AS date, linkId, COUNT(*) AS uniq
      FROM (
        SELECT date(createdAt) AS d, linkId, ip
        FROM "AffiliateClick"
        WHERE createdAt < ${threshold}
        GROUP BY d, linkId, ip
      ) AS sub
      GROUP BY d, linkId
      ORDER BY d ASC
    `

    // Insert-ignore benzeri davranış: mevcutsa geç
    for (const r of rows) {
      const id = `${r.date}-${r.linkId}`
      await db.$executeRawUnsafe(
        `INSERT OR IGNORE INTO "AffiliateDailyStat" (id, date, linkId, uniqueCount) VALUES (?, ?, ?, ?);`,
        id,
        String(r.date),
        String(r.linkId),
        Number(r.uniq ?? 0)
      )
    }

    // Raw clicklerden 365 günden eskileri temizle
    await db.$executeRaw`DELETE FROM "AffiliateClick" WHERE createdAt < ${threshold}`

    return NextResponse.json({ ok: true, inserted: rows.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Rollup error' }, { status: 500 })
  }
}