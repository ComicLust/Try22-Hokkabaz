import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// POST /api/admin/affiliate-links/reset-stats
// Tüm tıklama kayıtlarını siler ve sayaçları sıfırlar
export async function POST(_req: NextRequest) {
  try {
    const [deleted, updated] = await db.$transaction([
      db.affiliateClick.deleteMany({}),
      db.affiliateLink.updateMany({ data: { clicks: 0 } }),
    ])

    // Admin liste sayfasını yeniden doğrula (isteğe bağlı)
    try { revalidatePath('/admin/links') } catch {}

    return NextResponse.json({ ok: true, deleted: deleted?.count ?? 0, resetCount: updated?.count ?? 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Sıfırlama hatası' }, { status: 500 })
  }
}