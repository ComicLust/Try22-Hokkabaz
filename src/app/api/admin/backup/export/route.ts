import { NextResponse } from "next/server";
import JSZip from "jszip";
import { promises as fs } from "fs";
import path from "path";
import { db } from "@/lib/db";

export const runtime = 'nodejs'

function nowDateStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET() {
  try {
    // Fetch all tables concurrently
  const [
      users,
      posts,
      campaigns,
      bonuses,
      partnerSites,
      carouselSlides,
      marqueeLogos,
      seoSettings,
      telegramGroups,
      reviewBrands,
      siteReviews,
      telegramSuggestions,
      analyticsCodes,
      affiliateLinks,
      affiliateClicks,
      bankoCoupons,
      bankoMatches,
      pageArticles,
      pageSponsors,
      liveMatches,
      brandManagers,
      specialOdds,
    ] = await Promise.all([
      db.user.findMany(),
      db.post.findMany(),
      db.campaign.findMany(),
      db.bonus.findMany(),
      db.partnerSite.findMany(),
      db.carouselSlide.findMany(),
      db.marqueeLogo.findMany(),
      db.seoSetting.findMany(),
      db.telegramGroup.findMany(),
      db.reviewBrand.findMany(),
      db.siteReview.findMany(),
      db.telegramSuggestion.findMany(),
      db.analyticsCode.findMany(),
      db.affiliateLink.findMany(),
      db.affiliateClick.findMany(),
      (db as any).bankoCoupon.findMany(),
      (db as any).bankoMatch.findMany(),
      db.pageArticle.findMany(),
      db.pageSponsor.findMany(),
      db.liveMatch.findMany(),
      db.brandManager.findMany(),
      (db as any).specialOdd.findMany(),
    ]);

    const backup = {
      meta: {
        version: 1,
        generatedAt: new Date().toISOString(),
        provider: "sqlite",
      },
      tables: {
        users,
        posts,
        campaigns,
        bonuses,
        partnerSites,
        carouselSlides,
        marqueeLogos,
        seoSettings,
        telegramGroups,
        reviewBrands,
        siteReviews,
        telegramSuggestions,
        analyticsCodes,
        affiliateLinks,
        affiliateClicks,
        bankoCoupons,
        bankoMatches,
        pageArticles,
        pageSponsors,
        liveMatches,
        brandManagers,
        specialOdds,
      },
    };

    const jsonStr = JSON.stringify(backup, null, 2);

    const zip = new JSZip();
    zip.file("backup.json", jsonStr);
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "backups");
    await fs.mkdir(uploadsDir, { recursive: true });

    const fileName = `hokkabaz-backup-${nowDateStr()}.zip`;
    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, zipBuffer);

    const url = `/uploads/backups/${fileName}`;
    return NextResponse.json({ url, filename: fileName, size: zipBuffer.length });
  } catch (e: any) {
    console.error("Backup export error:", e);
    return NextResponse.json({ error: e?.message || "Backup export failed" }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}