import sharp from 'sharp';

export type TargetImageType = 'sticker' | 'main' | 'tab';

export interface DieCutOptions {
  type?: TargetImageType;
  threshold?: number; // 200 - 245 (default 220). Higher = removes fainter shadows
  colorTolerance?: number; // color saturation delta (default ~28)
  addExtraStroke?: 'none' | 'thin' | 'medium' | 'thick'; // 0, 4, 7, 11 px
}

export interface DieCutResult {
  dataUrl: string;
  width: number;
  height: number;
  format: 'png';
  byteSize: number;
}

/**
 * High-Precision Die-Cut Background & Shadow Removal:
 * Uses boundary flood-fill (BFS) from outer borders inward, eliminating solid white backgrounds
 * and soft drop shadows while 100% preserving white die-cut borders, fine text, and character artwork.
 * Resamples with Sharp's Lanczos3 filter for maximum sharpness and formats to exact LINE specs.
 */
export async function extractDieCutSticker(
  inputBase64OrBuffer: string | Buffer,
  options: DieCutOptions = {}
): Promise<DieCutResult> {
  const type = options.type || 'sticker';
  const threshold = options.threshold ?? 220;
  const colorTolerance = options.colorTolerance ?? 28;
  const strokeOption = options.addExtraStroke || 'none';

  let buffer: Buffer;
  if (typeof inputBase64OrBuffer === 'string') {
    const clean = inputBase64OrBuffer.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    buffer = Buffer.from(clean, 'base64');
  } else {
    buffer = inputBase64OrBuffer;
  }

  // 1. Ensure RGBA image and extract raw pixel buffer
  const img = sharp(buffer).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // 2. Perform BFS Flood-Fill from the 4 outer image borders inward
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let tail = 0;

  // Background criterion: High brightness (>= threshold) AND low saturation (neutral grey/white)
  function isBackground(byteIdx: number): boolean {
    const r = data[byteIdx];
    const g = data[byteIdx + 1];
    const b = data[byteIdx + 2];
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    return min >= threshold && (max - min) <= colorTolerance;
  }

  // Seed boundary pixels (Top & Bottom rows)
  for (let x = 0; x < w; x++) {
    const topIdx = 0 * w + x;
    const btmIdx = (h - 1) * w + x;
    queue[tail++] = topIdx;
    queue[tail++] = btmIdx;
    visited[topIdx] = 1;
    visited[btmIdx] = 1;
  }

  // Seed boundary pixels (Left & Right columns)
  for (let y = 0; y < h; y++) {
    const leftIdx = y * w + 0;
    const rightIdx = y * w + (w - 1);
    if (!visited[leftIdx]) {
      queue[tail++] = leftIdx;
      visited[leftIdx] = 1;
    }
    if (!visited[rightIdx]) {
      queue[tail++] = rightIdx;
      visited[rightIdx] = 1;
    }
  }

  // Process flood fill queue
  let head = 0;
  while (head < tail) {
    const pIdx = queue[head++];
    const px = pIdx % w;
    const py = Math.floor(pIdx / w);
    const byteIdx = pIdx * 4;

    if (isBackground(byteIdx)) {
      data[byteIdx + 3] = 0; // Make pixel fully transparent

      // Traverse 4-connected neighbors
      if (px + 1 < w) {
        const nIdx = pIdx + 1;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          if (isBackground(nIdx * 4)) queue[tail++] = nIdx;
        }
      }
      if (px - 1 >= 0) {
        const nIdx = pIdx - 1;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          if (isBackground(nIdx * 4)) queue[tail++] = nIdx;
        }
      }
      if (py + 1 < h) {
        const nIdx = pIdx + w;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          if (isBackground(nIdx * 4)) queue[tail++] = nIdx;
        }
      }
      if (py - 1 >= 0) {
        const nIdx = pIdx - w;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          if (isBackground(nIdx * 4)) queue[tail++] = nIdx;
        }
      }
    }
  }

  // 3. Trim outer transparent margins to get the tight bounding box of the sticker
  let trimmedBuffer = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 5 })
    .png()
    .toBuffer();

  // 4. Optional: Re-apply or intensify Die-Cut White Outline
  const strokePixelsMap = { none: 0, thin: 4, medium: 7, thick: 11 };
  const strokePx = strokePixelsMap[strokeOption] || 0;

  if (strokePx > 0 && type !== 'tab') {
    try {
      const padding = strokePx * 3;
      const paddedBuffer = await sharp(trimmedBuffer)
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      const paddedMeta = await sharp(paddedBuffer).metadata();
      const alphaChannel = await sharp(paddedBuffer).extractChannel(3).toBuffer();

      const sigma = strokePx / 2.2;
      const dilatedAlpha = await sharp(alphaChannel)
        .blur(sigma)
        .threshold(20)
        .resize(paddedMeta.width, paddedMeta.height)
        .toBuffer();

      const whiteSilhouette = await sharp({
        create: {
          width: paddedMeta.width || 300,
          height: paddedMeta.height || 300,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .joinChannel(dilatedAlpha)
        .png()
        .toBuffer();

      trimmedBuffer = await sharp(whiteSilhouette)
        .composite([{ input: paddedBuffer, gravity: 'center' }])
        .trim({ threshold: 5 })
        .png()
        .toBuffer();
    } catch (e) {
      console.warn('Could not apply extra stroke:', e);
    }
  }

  // 5. Target dimensions according to Official LINE Creators Market rules
  let maxW = 350; // Sticker content max width (leaving 10px margin on each side for 370 max)
  let maxH = 300; // Sticker content max height (leaving 10px margin on top/bottom for 320 max)
  let finalCanvasW = 370;
  let finalCanvasH = 320;

  if (type === 'main') {
    maxW = 220;
    maxH = 220;
    finalCanvasW = 240;
    finalCanvasH = 240;
  } else if (type === 'tab') {
    maxW = 88;
    maxH = 66;
    finalCanvasW = 96;
    finalCanvasH = 74;
  }

  // High-fidelity Lanczos3 Resampling
  const resizedContent = await sharp(trimmedBuffer)
    .resize({
      width: maxW,
      height: maxH,
      fit: 'inside',
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: false,
    })
    .toBuffer();

  const contentMeta = await sharp(resizedContent).metadata();
  const cW = contentMeta.width || maxW;
  const cH = contentMeta.height || maxH;

  // Compute final even dimensions with minimum 10px margin
  let computedW: number;
  let computedH: number;

  if (type === 'main') {
    computedW = 240;
    computedH = 240;
  } else if (type === 'tab') {
    computedW = 96;
    computedH = 74;
  } else {
    // For standard stickers: Content + 20px margin (10px each side), constrained to max 370x320 and MUST be even
    let rawW = cW + 20;
    let rawH = cH + 20;
    if (rawW > 370) rawW = 370;
    if (rawH > 320) rawH = 320;
    computedW = rawW % 2 === 0 ? rawW : rawW - 1;
    computedH = rawH % 2 === 0 ? rawH : rawH - 1;
  }

  // Center resized sticker inside the transparent canvas
  const finalPngBuffer = await sharp({
    create: {
      width: computedW,
      height: computedH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedContent, gravity: 'center' }])
    .png({ compressionLevel: 9, effort: 7 })
    .toBuffer();

  return {
    dataUrl: `data:image/png;base64,${finalPngBuffer.toString('base64')}`,
    width: computedW,
    height: computedH,
    format: 'png',
    byteSize: finalPngBuffer.length,
  };
}
