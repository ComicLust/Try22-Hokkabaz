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
      // Upsert by unique 'email' to avoid duplicate id conflicts
      results.users = await upsertManyByUniqueField(db.user, data as any, 'email');
    }
    if (tables.posts?.length) {
      const data = stripUpdatedAt(tables.posts);
      results.posts = await upsertMany(db.post, data as any);
    }

    // ReviewBrand then SiteReview
    if (tables.reviewBrands?.length) {
      const data = stripUpdatedAt(tables.reviewBrands);
      // Upsert by unique 'slug' to avoid duplicate id conflicts
      results.reviewBrands = await upsertManyByUniqueField(db.reviewBrand, data as any, 'slug');
    }
    if (tables.siteReviews?.length) {
      // Remap brandId based on brand slug mapping to prevent FK issues
      const backupBrands = stripUpdatedAt(tables.reviewBrands || []);
      const allBrands = await db.reviewBrand.findMany({ select: { id: true, slug: true } });
      const slugToId = new Map(allBrands.map((b: any) => [b.slug, b.id]));
      const backupIdToSlug = new Map(backupBrands.map((b: any) => [b.id, b.slug]));
      const data = stripUpdatedAt(tables.siteReviews).map((r: any) => {
        const slug = backupIdToSlug.get(r.brandId);
        const actualId = slug ? slugToId.get(slug) : undefined;
        return { ...r, brandId: actualId ?? r.brandId };
      });
      results.siteReviews = await upsertMany(db.siteReview, data as any);
    }

    // BrandManager (depends on ReviewBrand)
    if (tables.brandManagers?.length) {
      // Remap brandId to actual ReviewBrand id by slug
      const backupBrands = stripUpdatedAt(tables.reviewBrands || []);
      const allBrands = await db.reviewBrand.findMany({ select: { id: true, slug: true } });
      const slugToId = new Map(allBrands.map((b: any) => [b.slug, b.id]));
      const backupIdToSlug = new Map(backupBrands.map((b: any) => [b.id, b.slug]));
      const data = stripUpdatedAt(tables.brandManagers).map((m: any) => {
        const slug = backupIdToSlug.get(m.brandId);
        const actualId = slug ? slugToId.get(slug) : undefined;
        return { ...m, brandId: actualId ?? m.brandId };
      });
      // Upsert by unique loginId to avoid duplicate id conflicts
      results.brandManagers = await upsertManyByUniqueField(db.brandManager, data as any, 'loginId');
    }

    // AffiliateLink then AffiliateClick
    if (tables.affiliateLinks?.length) {
      const data = stripUpdatedAt(tables.affiliateLinks);
      // Upsert by unique 'slug' to avoid duplicate conflicts
      results.affiliateLinks = await upsertManyByUniqueField(db.affiliateLink, data as any, 'slug');
    }
    if (tables.affiliateClicks?.length) {
      // Remap linkId to actual AffiliateLink id by slug
      const backupLinks = stripUpdatedAt(tables.affiliateLinks || []);
      const allLinks = await db.affiliateLink.findMany({ select: { id: true, slug: true } });
      const slugToId = new Map(allLinks.map((l: any) => [l.slug, l.id]));
      const backupIdToSlug = new Map(backupLinks.map((l: any) => [l.id, l.slug]));
      const data = stripUpdatedAt(tables.affiliateClicks).map((c: any) => {
        const slug = backupIdToSlug.get(c.linkId);
        const actualId = slug ? slugToId.get(slug) : undefined;
        return { ...c, linkId: actualId ?? c.linkId };
      });
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
      // Upsert by unique 'slug' to avoid duplicate conflicts
      results.campaigns = await upsertManyByUniqueField(db.campaign, data as any, 'slug');
    }
    if (tables.bonuses?.length) {
      // Remap brandId to actual ReviewBrand id by slug
      const backupBrands = stripUpdatedAt(tables.reviewBrands || []);
      const allBrands = await db.reviewBrand.findMany({ select: { id: true, slug: true } });
      const slugToId = new Map(allBrands.map((b: any) => [b.slug, b.id]));
      const backupIdToSlug = new Map(backupBrands.map((b: any) => [b.id, b.slug]));
      const data = stripUpdatedAt(tables.bonuses).map((b: any) => {
        const slug = b.brandId ? backupIdToSlug.get(b.brandId) : undefined;
        const actualId = slug ? slugToId.get(slug) : undefined;
        return { ...b, brandId: actualId ?? b.brandId };
      });
      // Upsert by unique 'slug' to avoid duplicate conflicts
      results.bonuses = await upsertManyByUniqueField(db.bonus, data as any, 'slug');
    }
    if (tables.partnerSites?.length) {
      const data = stripUpdatedAt(tables.partnerSites);
      // Upsert by unique 'slug' for deterministic merging
      results.partnerSites = await upsertManyByUniqueField(db.partnerSite, data as any, 'slug');
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
      // Remap brandId to actual ReviewBrand id by slug
      const backupBrands = stripUpdatedAt(tables.reviewBrands || []);
      const allBrands = await db.reviewBrand.findMany({ select: { id: true, slug: true } });
      const slugToId = new Map(allBrands.map((b: any) => [b.slug, b.id]));
      const backupIdToSlug = new Map(backupBrands.map((b: any) => [b.id, b.slug]));
      const data = stripUpdatedAt(tables.telegramSuggestions).map((t: any) => {
        const slug = t.brandId ? backupIdToSlug.get(t.brandId) : undefined;
        const actualId = slug ? slugToId.get(slug) : undefined;
        return { ...t, brandId: actualId ?? t.brandId };
      });
      results.telegramSuggestions = await upsertMany(db.telegramSuggestion, data as any);
    }
    if (tables.analyticsCodes?.length) {
      const data = stripUpdatedAt(tables.analyticsCodes);
      results.analyticsCodes = await upsertMany(db.analyticsCode, data as any);
    }

    // PageArticle (unique slug)
    if (tables.pageArticles?.length) {
      const data = stripUpdatedAt(tables.pageArticles);
      results.pageArticles = await upsertManyByUniqueField(db.pageArticle, data as any, 'slug');
    }

    // PageSponsor
    if (tables.pageSponsors?.length) {
      const data = stripUpdatedAt(tables.pageSponsors);
      results.pageSponsors = await upsertMany(db.pageSponsor, data as any);
    }

    // LiveMatch
    if (tables.liveMatches?.length) {
      const data = stripUpdatedAt(tables.liveMatches);
      results.liveMatches = await upsertMany(db.liveMatch, data as any);
    }

    return NextResponse.json({ ok: true, inserted: results });
  } catch (e: any) {
    console.error("Backup import error:", e);
    return NextResponse.json({ error: e?.message || "Backup import failed" }, { status: 500 });
  }
}