import sharp from 'sharp';
import { TextOverlayConfig } from '@/types/sticker';

export type TargetImageType = 'sticker' | 'main' | 'tab' | 'raw';

export interface ProcessImageOptions {
  type: TargetImageType;
  threshold?: number; // 200 - 254 (default ~240)
  strokeThickness?: 'none' | 'thin' | 'medium' | 'thick'; // 0, 4, 8, 12 px
  textOverlay?: TextOverlayConfig;
}

export interface ProcessImageResult {
  dataUrl: string;
  width: number;
  height: number;
  format: 'png';
}

/**
 * Remove solid/near-white backgrounds, apply white die-cut contour outline,
 * overlay custom Thai/English typography, and resize to exact LINE specifications.
 */
export async function removeBackgroundAndResize(
  inputBase64OrBuffer: string | Buffer,
  options: ProcessImageOptions = { type: 'sticker', threshold: 240, strokeThickness: 'medium' }
): Promise<ProcessImageResult> {
  const threshold = options.threshold ?? 240;
  const strokeThickness = options.strokeThickness ?? 'medium';

  let buffer: Buffer;
  if (typeof inputBase64OrBuffer === 'string') {
    const cleanBase64 = inputBase64OrBuffer.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    buffer = Buffer.from(cleanBase64, 'base64');
  } else {
    buffer = inputBase64OrBuffer;
  }

  // 1. Convert to raw RGBA pixels to perform chroma-keying on white background
  const image = sharp(buffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const pixelData = Buffer.from(data);
  const channels = info.channels; // 4 for RGBA

  // Iterate over pixels to remove white/near-white background with anti-aliased edge falloff
  for (let i = 0; i < pixelData.length; i += channels) {
    const r = pixelData[i];
    const g = pixelData[i + 1];
    const b = pixelData[i + 2];

    const minChannel = Math.min(r, g, b);
    const maxChannel = Math.max(r, g, b);
    const colorSaturation = maxChannel - minChannel;

    // High brightness and low color saturation means pure/near white background
    if (minChannel >= threshold && colorSaturation < 15) {
      pixelData[i + 3] = 0; // Fully transparent
    } else if (minChannel >= threshold - 25 && colorSaturation < 20) {
      // Soft transition zone for clean anti-aliased outlines
      const alphaFactor = (minChannel - (threshold - 25)) / 25;
      pixelData[i + 3] = Math.round(pixelData[i + 3] * (1 - alphaFactor * 0.9));
    }
  }

  // 2. Create intermediate transparent PNG and trim bounding box
  const transparentPngBuffer = await sharp(pixelData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();

  // Trim transparent pixels around the subject to center it accurately
  let trimmedBuffer = await sharp(transparentPngBuffer)
    .trim({ threshold: 10 })
    .png()
    .toBuffer()
    .catch(() => transparentPngBuffer);

  // 3. Apply White Die-Cut Stroke (Sticker Outline) if enabled
  const strokePixelsMap = {
    none: 0,
    thin: 4,
    medium: 7,
    thick: 11,
  };
  const strokePx = strokePixelsMap[strokeThickness] || 0;

  if (strokePx > 0 && options.type !== 'tab') {
    try {
      const padding = strokePx * 3;
      // Pad to prevent edge clipping during dilation
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

      // Dilate alpha mask with Gaussian blur and threshold
      const sigma = strokePx / 2.2;
      const dilatedAlpha = await sharp(alphaChannel)
        .blur(sigma)
        .threshold(20)
        .toBuffer();

      // Solid white layer with dilated alpha
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

      // Composite original image on top of white outline
      trimmedBuffer = await sharp(whiteSilhouette)
        .composite([{ input: paddedBuffer, gravity: 'center' }])
        .trim({ threshold: 10 })
        .png()
        .toBuffer();
    } catch (strokeErr) {
      console.warn('Could not apply white stroke:', strokeErr);
    }
  }

  // 4. Resize and place on LINE compliant canvas
  let targetWidth = 370;
  let targetHeight = 320;
  let contentMaxWidth = 350; // 10px margin on each side
  let contentMaxHeight = 300;

  if (options.type === 'main') {
    targetWidth = 240;
    targetHeight = 240;
    contentMaxWidth = 220;
    contentMaxHeight = 220;
  } else if (options.type === 'tab') {
    targetWidth = 96;
    targetHeight = 74;
    contentMaxWidth = 88;
    contentMaxHeight = 66;
  } else if (options.type === 'raw') {
    const trimmedInfo = await sharp(trimmedBuffer).metadata();
    return {
      dataUrl: `data:image/png;base64,${trimmedBuffer.toString('base64')}`,
      width: trimmedInfo.width || info.width,
      height: trimmedInfo.height || info.height,
      format: 'png',
    };
  }

  // If text overlay is enabled on stickers, adjust content height to make room for banner
  const hasText = !!(options.textOverlay?.enabled && options.textOverlay?.text?.trim());
  if (hasText && options.type === 'sticker') {
    contentMaxHeight = 255; // Leave room for top or bottom text
  }

  // Resize trimmed character to fit within content dimensions preserving aspect ratio
  const resizedContent = await sharp(trimmedBuffer)
    .resize({
      width: contentMaxWidth,
      height: contentMaxHeight,
      fit: 'inside',
      withoutEnlargement: false,
    })
    .toBuffer();

  const composites: sharp.OverlayOptions[] = [
    {
      input: resizedContent,
      gravity: hasText && options.textOverlay?.position === 'bottom' ? 'north' : hasText && options.textOverlay?.position === 'top' ? 'south' : 'center',
    },
  ];

  // 5. Add Custom Text Overlay (Thai / English)
  if (hasText && options.type === 'sticker') {
    const txt = options.textOverlay!;
    const fontName = txt.font || 'Mali';
    const textColor = txt.textColor || '#FF4757';
    const strokeColor = txt.strokeColor || '#FFFFFF';
    const strokeWidth = txt.strokeWidth || 8;
    const fontSize = txt.fontSize || 34;

    let yPos = 295;
    if (txt.position === 'top') yPos = 48;
    if (txt.position === 'center') yPos = 170;

    const escapedText = txt.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const textSvg = `
    <svg width="${targetWidth}" height="${targetHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <style>
        .sticker-typography {
          font-family: '${fontName}', 'Mali', 'Itim', 'Kanit', Arial, sans-serif;
          font-size: ${fontSize}px;
          font-weight: 800;
          fill: ${textColor};
          stroke: ${strokeColor};
          stroke-width: ${strokeWidth}px;
          paint-order: stroke fill;
          stroke-linejoin: round;
          stroke-linecap: round;
        }
      </style>
      <text x="${targetWidth / 2}" y="${yPos}" text-anchor="middle" class="sticker-typography" filter="url(#shadow)">${escapedText}</text>
    </svg>
    `;

    composites.push({
      input: Buffer.from(textSvg),
      gravity: 'center',
    });
  }

  // Composite centered onto transparent canvas of target dimensions
  const finalImage = await sharp({
    create: {
      width: targetWidth,
      height: targetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    })
    .toBuffer();

  return {
    dataUrl: `data:image/png;base64,${finalImage.toString('base64')}`,
    width: targetWidth,
    height: targetHeight,
    format: 'png',
  };
}
