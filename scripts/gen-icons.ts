import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const srcSvg = path.resolve("public/icons/icon.svg");
const outDir = path.resolve("public/icons");

async function main() {
  await mkdir(outDir, { recursive: true });

  await sharp(srcSvg)
    .resize(192, 192)
    .png()
    .toFile(path.join(outDir, "icon-192.png"));

  await sharp(srcSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(outDir, "icon-512.png"));

  // Maskable: content shrunk to roughly 60 percent, leaving a 20 percent
  // safe-zone margin on every side.
  const inner = await sharp(srcSvg).resize(308, 308).png().toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: "#07080b",
    },
  })
    .composite([{ input: inner, gravity: "center" }])
    .png()
    .toFile(path.join(outDir, "maskable-512.png"));

  console.log("Wrote icon-192.png, icon-512.png, maskable-512.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
