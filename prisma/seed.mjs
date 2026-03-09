import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const SYSTEM_ACTOR = "system";

const clients = [
  {
    name: "Skincare Brand",
    industry: "skincare",
    defaultStyle: "ugc-selfie",
    defaultLighting: "bathroom-vanity",
    defaultColorGrading: "warm",
    defaultAspectRatio: "4:5",
    brandNotes:
      "Minimalista estetika, čisté pozadia, dôraz na textúru pleti a prirodzený vzhľad. Vždy zobrazuj reálnu ženskú pleť s viditeľnými pórmi. Vyhni sa pretretej pokožke. Produkt musí byť vždy viditeľný v záberé.",
    createdBy: SYSTEM_ACTOR
  },
  {
    name: "Food Brand",
    industry: "food",
    defaultStyle: "flat-lay",
    defaultLighting: "overhead-natural",
    defaultColorGrading: "vibrant",
    defaultAspectRatio: "1:1",
    brandNotes:
      "Živé farby, chutné detaily, čerstvé ingrediencie. Jedlo musí vyzerať apetitívne a dobre nasvietené. Uprednostňuj prírodnú scénu (drevo, mramor, liatina). Vyhni sa plastovým povrchom.",
    createdBy: SYSTEM_ACTOR
  },
  {
    name: "Kids Toys",
    industry: "kids_toys",
    defaultStyle: "lifestyle-in-context",
    defaultLighting: "natural-window",
    defaultColorGrading: "vibrant",
    defaultAspectRatio: "1:1",
    brandNotes:
      "Vždy zahrň jasný komerčný kontext (napr. dieťa v hračkárstve alebo herni). Farby musia byť jasné a radostné. Dieťa musí pôsobiť šťastne a bezpečne. Dôraz na edukáciu a zábavu zároveň.",
    createdBy: SYSTEM_ACTOR
  }
];

async function main() {
  console.log("Seeding creative clients...");

  for (const client of clients) {
    const existing = await db.creativeClient.findFirst({
      where: { name: client.name }
    });

    if (existing) {
      console.log(`  Skipping "${client.name}" – already exists.`);
      continue;
    }

    await db.creativeClient.create({ data: client });
    console.log(`  Created "${client.name}"`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
