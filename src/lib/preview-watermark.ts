import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import sharp from "sharp";

const MAX_IMAGE_WIDTH = 1600;

function safeWatermarkLabel(clientId: string) {
  return `STHELP PREVIEW - PAYMENT REQUIRED - ${clientId}`
    .replace(/[^A-Za-z0-9 -]/g, "")
    .slice(0, 90);
}

async function watermarkPdf(input: Uint8Array, clientId: string) {
  const document = await PDFDocument.load(input);
  const font = await document.embedFont(StandardFonts.HelveticaBold);
  const label = safeWatermarkLabel(clientId);

  for (const page of document.getPages()) {
    const { width, height } = page.getSize();
    const fontSize = Math.max(13, Math.min(24, width / 24));
    const textWidth = font.widthOfTextAtSize(label, fontSize);
    const horizontalStep = Math.max(330, textWidth + 95);
    const verticalStep = Math.max(135, height / 5);

    for (let y = 45; y < height + 80; y += verticalStep) {
      for (let x = -width * 0.35; x < width + textWidth; x += horizontalStep) {
        page.drawText(label, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.72, 0.12, 0.18),
          rotate: degrees(28),
          opacity: 0.19
        });
      }
    }

    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height: 27,
      color: rgb(0.06, 0.16, 0.27),
      opacity: 0.93
    });
    page.drawText("PROTECTED REVISION PREVIEW - FINAL FILE RELEASED AFTER VERIFIED PAYMENT", {
      x: 12,
      y: 9,
      size: Math.max(7, Math.min(9, width / 70)),
      font,
      color: rgb(1, 1, 1)
    });
  }

  document.setTitle("Protected StHelp revision preview");
  document.setProducer("StHelp protected preview service");
  return Buffer.from(await document.save());
}

function watermarkSvg(width: number, height: number, clientId: string) {
  const label = safeWatermarkLabel(clientId);
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="watermark" width="520" height="190" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
          <text x="15" y="96" fill="#b51f32" fill-opacity="0.24" font-family="Arial, sans-serif" font-size="27" font-weight="700">${label}</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#watermark)"/>
      <rect x="0" y="${Math.max(0, height - 42)}" width="100%" height="42" fill="#102945" fill-opacity="0.94"/>
      <text x="18" y="${Math.max(26, height - 14)}" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="700">PROTECTED REVISION PREVIEW - PAYMENT REQUIRED</text>
    </svg>
  `);
}

async function watermarkImage(input: Uint8Array, clientId: string) {
  const resized = await sharp(input, { failOn: "error" })
    .rotate()
    .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer({ resolveWithObject: true });
  const width = resized.info.width;
  const height = resized.info.height;
  const output = await sharp(resized.data)
    .composite([{ input: watermarkSvg(width, height, clientId), blend: "over" }])
    .webp({ quality: 78 })
    .toBuffer();
  return Buffer.from(output);
}

export async function createProtectedPreview(input: Uint8Array, mimeType: string, clientId: string) {
  if (mimeType === "application/pdf") {
    return { bytes: await watermarkPdf(input, clientId), contentType: "application/pdf", extension: "pdf" };
  }
  if (mimeType.startsWith("image/")) {
    return { bytes: await watermarkImage(input, clientId), contentType: "image/webp", extension: "webp" };
  }
  throw new Error("This preview format is not supported.");
}

export function isProtectedPreviewPath(storagePath: string) {
  return storagePath.includes("/preview-protected/");
}

export async function storeProtectedPreview(
  db: SupabaseClient,
  file: { storagePath: string; mimeType: string },
  clientId: string
) {
  if (isProtectedPreviewPath(file.storagePath)) {
    return { storagePath: file.storagePath, mimeType: file.mimeType, sizeBytes: 0 };
  }

  const { data: storedFile, error: downloadError } = await db.storage
    .from("assignment-files")
    .download(file.storagePath);
  if (downloadError || !storedFile) throw downloadError || new Error("Unable to prepare the protected preview.");

  const protectedFile = await createProtectedPreview(
    new Uint8Array(await storedFile.arrayBuffer()),
    file.mimeType || storedFile.type,
    clientId
  );
  const originalBase = file.storagePath.replace(/\.[^/.]+$/, "");
  const protectedPath = `${originalBase.replace("/preview/", "/preview-protected/")}.protected.${protectedFile.extension}`;
  const { error: uploadError } = await db.storage.from("assignment-files").upload(
    protectedPath,
    protectedFile.bytes,
    { contentType: protectedFile.contentType, upsert: true }
  );
  if (uploadError) throw uploadError;

  return {
    storagePath: protectedPath,
    mimeType: protectedFile.contentType,
    sizeBytes: protectedFile.bytes.byteLength
  };
}
