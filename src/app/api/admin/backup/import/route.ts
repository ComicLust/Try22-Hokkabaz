import { NextResponse } from "next/server";
import JSZip from "jszip";
import { db } from "@/lib/db";

export const runtime = 'nodejs'

function stripUpdatedAt<T extends Record<string, any>>(rows: T[] | undefined | null): T[] {
  if (!rows) return [] as T[];
  return rows.map((r) => {
    const { updatedAt, ...rest } = r as any;
    return rest as T;
  });
}

// Upsert helper: upserts by primary key `id`, skips duplicates without errors
async function upsertMany(model: any, rows: any[]) {
  if (!rows?.length) return 0;
  const ops = rows.map((row) => {
    const createData = row;
    const updateData = { ...row };
    // Do not override createdAt on updates; updatedAt is handled by Prisma
    delete (updateData as any).createdAt;
    return model.upsert({
      where: { id: row.id },
      create: createData,
      update: updateData,
    });
  });
  const res = await db.$transaction(ops);
  return res.length;
}

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const file = fd.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    const arrayBuffer = await (file as File).arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const entry = zip.file("backup.json");
    if (!entry) {
      return NextResponse.json({ error: "backup.json bulunamadı" }, { status: 400 });
    }

    const jsonStr = await entry.async("string");
    const parsed = JSON.parse(jsonStr);
    const tables = parsed?.tables || {};

    // Insert in an order that respects basic FK relations
    const results: Record<string, number> = {};

    // Users, Posts
    if (tables.users?.length) {
      const data = stripUpdatedAt(tables.users);
      results.users = await upsertMany(db.user, data as any);
    }
    if (tables.posts?.length) {
      const data = stripUpdatedAt(tables.posts);
      results.posts = await upsertMany(db.post, data as any);
    }

    // ReviewBrand then SiteReview
    if (tables.reviewBrands?.length) {
      const data = stripUpdatedAt(tables.reviewBrands);
      results.reviewBrands = await upsertMany(db.reviewBrand, data as any);
    }
    if (tables.siteReviews?.length) {
      const data = stripUpdatedAt(tables.siteReviews);
      results.siteReviews = await upsertMany(db.siteReview, data as any);
    }

    // AffiliateLink then AffiliateClick
    if (tables.affiliateLinks?.length) {
      const data = stripUpdatedAt(tables.affiliateLinks);
      results.affiliateLinks = await upsertMany(db.affiliateLink, data as any);
    }
    if (tables.affiliateClicks?.length) {
      const data = stripUpdatedAt(tables.affiliateClicks);
      results.affiliateClicks = await upsertMany(db.affiliateClick, data as any);
    }

    // BankoCoupon then BankoMatch
    if (tables.bankoCoupons?.length) {
      const data = stripUpdatedAt(tables.bankoCoupons);
      results.bankoCoupons = await upsertMany((db as any).bankoCoupon, data as any);
    }
    if (tables.bankoMatches?.length) {
      const data = stripUpdatedAt(tables.bankoMatches);
      results.bankoMatches = await upsertMany((db as any).bankoMatch, data as any);
    }

    // Core content tables
    if (tables.campaigns?.length) {
      const data = stripUpdatedAt(tables.campaigns);
      results.campaigns = await upsertMany(db.campaign, data as any);
    }
    if (tables.bonuses?.length) {
      const data = stripUpdatedAt(tables.bonuses);
      results.bonuses = await upsertMany(db.bonus, data as any);
    }
    if (tables.partnerSites?.length) {
      const data = stripUpdatedAt(tables.partnerSites);
      results.partnerSites = await upsertMany(db.partnerSite, data as any);
    }
    if (tables.carouselSlides?.length) {
      const data = stripUpdatedAt(tables.carouselSlides);
      results.carouselSlides = await upsertMany(db.carouselSlide, data as any);
    }
    if (tables.marqueeLogos?.length) {
      const data = stripUpdatedAt(tables.marqueeLogos);
      results.marqueeLogos = await upsertMany(db.marqueeLogo, data as any);
    }
    if (tables.seoSettings?.length) {
      const data = stripUpdatedAt(tables.seoSettings);
      results.seoSettings = await upsertMany(db.seoSetting, data as any);
    }
    if (tables.telegramGroups?.length) {
      const data = stripUpdatedAt(tables.telegramGroups);
      results.telegramGroups = await upsertMany(db.telegramGroup, data as any);
    }
    if (tables.telegramSuggestions?.length) {
      const data = stripUpdatedAt(tables.telegramSuggestions);
      results.telegramSuggestions = await upsertMany(db.telegramSuggestion, data as any);
    }
    if (tables.analyticsCodes?.length) {
      const data = stripUpdatedAt(tables.analyticsCodes);
      results.analyticsCodes = await upsertMany(db.analyticsCode, data as any);
    }

    return NextResponse.json({ ok: true, inserted: results });
  } catch (e: any) {
    console.error("Backup import error:", e);
    return NextResponse.json({ error: e?.message || "Backup import failed" }, { status: 500 });
  }
}