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

// Upsert helper by a unique field (e.g., 'page', 'slug')
async function upsertManyByUniqueField(model: any, rows: any[], uniqueField: string) {
  if (!rows?.length) return 0;
  let count = 0;
  for (const row of rows) {
    const keyVal = row?.[uniqueField];
    if (keyVal === undefined || keyVal === null || keyVal === '') continue;
    const createData = { ...row };
    const updateData = { ...row };
    // Avoid changing primary key on update and preserve createdAt
    delete (updateData as any).id;
    delete (updateData as any).createdAt;
    await model.upsert({
      where: { [uniqueField]: keyVal },
      create: createData,
      update: updateData,
    });
    count += 1;
  }
  return count;
}

// Special upsert for tables with unique `order` field (e.g., MarqueeLogo, CarouselSlide)
async function upsertManyEnsureUniqueOrder(model: any, rows: any[], orderField: string = 'order') {
  if (!rows?.length) return 0;

  // Fetch existing ids and orders
  const existing: Array<{ id: string; [key: string]: any }> = await model.findMany({
    select: { id: true, [orderField]: true },
  });

  const used = new Set<number>();
  let maxOrder = 0;
  const idToOrder = new Map<string, number>();

  for (const e of existing) {
    const o = Number(e[orderField] ?? 0);
    if (Number.isFinite(o)) {
      used.add(o);
      if (o > maxOrder) maxOrder = o;
      idToOrder.set(e.id, o);
    }
  }

  const getNextAvailable = () => {
    maxOrder += 1;
    used.add(maxOrder);
    return maxOrder;
  };

  let count = 0;
  for (const row of rows) {
    // Resolve desired order, ensure uniqueness
    let desired = Number(row[orderField] ?? 0);
    if (!Number.isFinite(desired) || desired <= 0) {
      desired = getNextAvailable();
    }

    const existingOrderForId = idToOrder.get(row.id);
    if (used.has(desired) && existingOrderForId !== desired) {
      desired = getNextAvailable();
    }

    const createData = { ...row, [orderField]: desired };
    const updateData = { ...row, [orderField]: desired };
    delete (updateData as any).createdAt;

    const exists = await model.findUnique({ where: { id: row.id }, select: { id: true } });
    if (exists) {
      await model.update({ where: { id: row.id }, data: updateData });
    } else {
      await model.create({ data: createData });
    }

    used.add(desired);
    idToOrder.set(row.id, desired);
    count += 1;
  }

  return count;
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
      // Ensure unique order on import
      results.carouselSlides = await upsertManyEnsureUniqueOrder(db.carouselSlide, data as any, 'order');
    }
    if (tables.marqueeLogos?.length) {
      const data = stripUpdatedAt(tables.marqueeLogos);
      // Ensure unique order on import
      results.marqueeLogos = await upsertManyEnsureUniqueOrder(db.marqueeLogo, data as any, 'order');
    }
    if (tables.seoSettings?.length) {
      const data = stripUpdatedAt(tables.seoSettings);
      // Upsert by unique 'page' instead of 'id' to avoid duplicates
      results.seoSettings = await upsertManyByUniqueField(db.seoSetting, data as any, 'page');
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