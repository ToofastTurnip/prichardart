// Builds the starting catalog from the photographs in /art.
// Produces optimized WebP files in public/gallery and writes content/artworks.json.
// Run with: npm run seed   (add --force to overwrite an existing catalog)

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const artDir = path.join(root, "art");
const uploadDir = path.join(root, "public", "gallery");
const dataFile = path.join(root, "content", "artworks.json");
const studioDir = path.join(root, "public", "studio");

const PASTEL = "Soft pastel";
const OIL = "Oil";

// Listed oldest to newest (matches the order the photos were posted).
// Titles and mediums come from the artist's Facebook posts. Prices and availability live in
// content/artworks.json and are managed in /admin.
const pieces = [
  ["469003683_122165602694265686_7722942121839368140_n.jpg", "Blue Heron on Log", "Wildlife & Nature", PASTEL],
  ["469003691_122165603474265686_2721880104931812380_n.jpg", "Blue Heron in Flight", "Wildlife & Nature", PASTEL],
  ["469051138_122165602712265686_5766051456408466405_n.jpg", "Rainbow Lorikeet", "Wildlife & Nature", PASTEL],
  ["469073490_122165603222265686_1003610439476251944_n.jpg", "Red Nobles Mill", "Historic & Rustic", OIL],
  ["469073780_122165602682265686_6680616216116597985_n.jpg", "Pittenweem, Scotland", "Historic & Rustic", OIL],
  ["469073798_122165603258265686_7056659283362580351_n.jpg", "Blue Heron on Boat", "Maritime & Watercraft", OIL, { featured: true }],
  ["469092483_122165602784265686_2952022503768706785_n.jpg", "Old Farm Truck", "Historic & Rustic", PASTEL],
  ["469092703_122165603264265686_3653786580780085407_n.jpg", "Osprey Lunch", "Wildlife & Nature", PASTEL],
  ["469103522_122165603444265686_4420161928286217931_n.jpg", "1940 Chevy", "Historic & Rustic", PASTEL],
  ["469116983_122165602664265686_2266051272629519418_n.jpg", "Work Boots", "Historic & Rustic", PASTEL],
  ["469118484_122165602544265686_5363544567025551628_n.jpg", "Paper Birch Trees in Fall", "Wildlife & Nature", OIL],
  ["469155610_122165603414265686_7338733393837275813_n.jpg", "Wood Duck Flight", "Wildlife & Nature", PASTEL],
  ["469190376_122165602754265686_4502690953326936089_n.jpg", "Old Bridge in Fall", "Historic & Rustic", OIL, { featured: true }],
  ["469242516_122165602808265686_588442272861901017_n.jpg", "Pooles Island Lighthouse at Dawn", "Maritime & Watercraft", PASTEL],
  ["469254782_122165602688265686_5612369235059686890_n.jpg", "1939 Nash", "Historic & Rustic", PASTEL],
  ["469260467_122165603378265686_5612742431468875876_n.jpg", "Work Boat", "Maritime & Watercraft", PASTEL],
  ["469303830_122165603420265686_933412720999554766_n.jpg", "Miller Island Lighthouse", "Maritime & Watercraft", PASTEL],
  ["469308918_122165603432265686_2372201937082032997_n.jpg", "Blue Crab", "Wildlife & Nature", PASTEL, { featured: true }],
  ["469310022_122165603462265686_7959245307534571359_n.jpg", "Mandarin Duck", "Wildlife & Nature", PASTEL],
  ["469316022_122165602598265686_2190704510999329372_n.jpg", "Galloway Girl", "Maritime & Watercraft", PASTEL],
  ["469346769_122165603294265686_7794698819901583318_n.jpg", "Eagle in Flight", "Wildlife & Nature", PASTEL, { featured: true }],
  ["469361776_122165603348265686_7373928637646874359_n.jpg", "Rehoboth Beach", "Wildlife & Nature", OIL],
  ["469361793_122165603228265686_4728133186652641380_n.jpg", "Yellow Farm", "Historic & Rustic", OIL],
  ["469387163_122165603528265686_6714589868894656444_n.jpg", "Mallard Duck Flight", "Wildlife & Nature", PASTEL],
  ["472390146_122170310024265686_7264240745962215892_n.jpg", "Old Stone Farmhouse", "Historic & Rustic", OIL],
  ["481947906_122180867726265686_2793352142252226576_n.jpg", "Brigadoon Marina", "Historic & Rustic", OIL],
  ["489960007_122190242834265686_2568891107933188487_n.jpg", "Crab Boat at Dawn", "Maritime & Watercraft", OIL],
  ["490584013_2795922343904469_6969183252228948512_n.jpg", "Bay Workboat", "Maritime & Watercraft", PASTEL],
  ["604647841_122229705800265686_1266030749128409811_n.jpg", "Row Boat at Old Pier", "Maritime & Watercraft", OIL, { featured: true }],
  ["638778052_122237472650265686_2153022813174069097_n.jpg", "Portrait of Carroll", "Portraits & Commissions", PASTEL, { status: "NFS" }],
  ["653710114_122240609168265686_8248325340482265273_n.jpg", "Steamed Stacked Crabs", "Wildlife & Nature", PASTEL],
  ["719636130_122251059938265686_8116500671935050706_n.jpg", "Pooles Island Beach", "Maritime & Watercraft", OIL, { featured: true }],
];

// In-progress easel shots used in the bio section rather than the gallery.
const studioShots = [
  ["469662702_122166459596265686_5456074122424075472_n.jpg", "stone-house-in-progress.webp"],
  ["475377372_122174256362265686_4264526150179339730_n.jpg", "house-on-pilings-in-progress.webp"],
];

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const force = process.argv.includes("--force");
  if ((await exists(dataFile)) && !force) {
    console.log("content/artworks.json already exists. Re-run with --force to rebuild it.");
    return;
  }
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.mkdir(studioDir, { recursive: true });

  const start = Date.parse("2024-11-20T12:00:00Z");
  const day = 86_400_000;
  const artworks = [];

  for (const [i, [file, title, category, medium, opts = {}]] of pieces.entries()) {
    const id = crypto.randomUUID();
    const src = path.join(artDir, file);
    const base = sharp(src).rotate();
    const full = await base
      .clone()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(path.join(uploadDir, `${id}.webp`));
    await base
      .clone()
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(path.join(uploadDir, `${id}-thumb.webp`));

    artworks.push({
      id,
      title,
      slug: slugify(title),
      imageUrl: `gallery/${id}.webp`,
      thumbnailUrl: `gallery/${id}-thumb.webp`,
      width: full.width,
      height: full.height,
      category,
      medium,
      dimensions: "",
      status: opts.status ?? "Available",
      price: "",
      isFeatured: Boolean(opts.featured),
      createdAt: new Date(start + i * 9 * day).toISOString(),
    });
    process.stdout.write(".");
  }

  for (const [file, out] of studioShots) {
    await sharp(path.join(artDir, file))
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(studioDir, out));
  }

  await fs.writeFile(dataFile, JSON.stringify(artworks.reverse(), null, 2) + "\n");
  console.log(`\nSeeded ${artworks.length} artworks.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
