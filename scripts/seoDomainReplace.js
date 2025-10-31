/*
  SEO ayarlarında (SeoSetting) eski domaini yeni domain ile değiştirir.
  Kullanım: DATABASE_URL=... npm run seo:replace-domain
*/
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const FROM_DOMAIN = "hokkabaz.net";
const TO_DOMAIN = "hokkabaz.bet";

function replaceDomain(value) {
  if (!value) return value;
  const pattern = new RegExp(FROM_DOMAIN.replaceAll(".", "\\."), "g");
  return value.replace(pattern, TO_DOMAIN);
}

async function run() {
  const items = await prisma.seoSetting.findMany();
  let changed = 0;

  for (const item of items) {
    const updated = {
      canonicalUrl: replaceDomain(item.canonicalUrl),
      ogImageUrl: replaceDomain(item.ogImageUrl),
      ogLogoUrl: replaceDomain(item.ogLogoUrl),
      twitterImageUrl: replaceDomain(item.twitterImageUrl),
    };

    const hasChange =
      updated.canonicalUrl !== item.canonicalUrl ||
      updated.ogImageUrl !== item.ogImageUrl ||
      updated.ogLogoUrl !== item.ogLogoUrl ||
      updated.twitterImageUrl !== item.twitterImageUrl;

    if (hasChange) {
      await prisma.seoSetting.update({
        where: { id: item.id },
        data: updated,
      });
      changed++;
    }
  }

  console.log(
    `SeoSetting domain değişimi tamamlandı. Güncellenen kayıt sayısı: ${changed}`
  );
}

run()
  .catch((e) => {
    console.error("Hata:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });