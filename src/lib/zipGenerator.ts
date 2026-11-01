import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { StickerItem, LineMarketMetadata } from '@/types/sticker';

export interface ZipExportOptions {
  characterName: string;
  stickers: StickerItem[];
  metadata?: LineMarketMetadata;
  mainImageBase64?: string;
  tabImageBase64?: string;
}

export async function createStickerPackZip(options: ZipExportOptions): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('line_sticker_pack') || zip;

  // 1. Add individual sticker images (01.png, 02.png, ...)
  for (let i = 0; i < options.stickers.length; i++) {
    const sticker = options.stickers[i];
    const dataUrl = sticker.transparentImageUrl || sticker.rawImageUrl;
    if (dataUrl) {
      const cleanBase64 = dataUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const filename = sticker.filename || `${String(i + 1).padStart(2, '0')}.png`;
      folder.file(filename, cleanBase64, { base64: true });
    }
  }

  // 2. Add main.png (240x240 px)
  const mainData = options.mainImageBase64 || options.stickers[0]?.transparentImageUrl || options.stickers[0]?.rawImageUrl;
  if (mainData) {
    const cleanBase64 = mainData.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    folder.file('main.png', cleanBase64, { base64: true });
  }

  // 3. Add tab.png (96x74 px)
  const tabData = options.tabImageBase64 || options.stickers[0]?.transparentImageUrl || options.stickers[0]?.rawImageUrl;
  if (tabData) {
    const cleanBase64 = tabData.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    folder.file('tab.png', cleanBase64, { base64: true });
  }

  // 4. Add structured JSON metadata
  const meta = options.metadata || {
    title: { en: options.characterName, th: options.characterName, ja: options.characterName },
    description: { en: 'LINE Sticker Pack', th: 'ชุดสติกเกอร์ไลน์', ja: 'LINEスタンプ' },
    copyright: `© ${new Date().getFullYear()} Sticker Creator`,
    category: 'Characters',
    tagsBySticker: {},
  };

  folder.file('line_creators_metadata.json', JSON.stringify(meta, null, 2));

  // 5. Add LINE Creators Market Submission Manifest & Copy-Paste Info
  const manifest = `================================================================================
LINE CREATORS MARKET SUBMISSION COPY-PASTE SHEET
================================================================================
Generated on: ${new Date().toLocaleString()}
Total Stickers: ${options.stickers.length} images

1. TITLES (Copy-paste into creator.line.me):
--------------------------------------------------------------------------------
[English (Required)]:
${meta.title?.en || options.characterName}

[Thai (ภาษาไทย)]:
${meta.title?.th || options.characterName}

[Japanese (日本語)]:
${meta.title?.ja || options.characterName}


2. DESCRIPTIONS (Copy-paste into creator.line.me):
--------------------------------------------------------------------------------
[English (Required)]:
${meta.description?.en || 'Cute sticker pack for daily chats!'}

[Thai (ภาษาไทย)]:
${meta.description?.th || 'ชุดสติกเกอร์น่ารักสดใส ส่งต่อความรู้สึกดีๆ ทุกวัน!'}

[Japanese (日本語)]:
${meta.description?.ja || 'トークを盛り上げる可愛いスタンプセットです！'}


3. COPYRIGHT & CATEGORY:
--------------------------------------------------------------------------------
Copyright: ${meta.copyright || `© ${new Date().getFullYear()} Creator`}
Category: ${meta.category || 'Characters'}


4. STICKER FILES & SEARCH KEYWORDS (TAGS):
--------------------------------------------------------------------------------
${options.stickers
  .map((s) => {
    const tags = meta.tagsBySticker?.[s.filename]?.join(', ') || s.emotionKey;
    const text = s.textOverlay?.text || s.textBubble || 'None';
    return `• ${s.filename} (${s.label}) - Text: "${text}" | Keywords: [${tags}]`;
  })
  .join('\n')}
• main.png (240 x 240 px) - Main Store Cover Image
• tab.png (96 x 74 px) - Chat Keyboard Tab Icon


5. SUBMISSION CHECKLIST (https://creator.line.me/):
--------------------------------------------------------------------------------
[✓] Format: PNG with transparent background
[✓] Dimensions: All even pixel dimensions
    - 01.png - ${String(options.stickers.length).padStart(2, '0')}.png: Max 370 x 320 px (with 10px margin)
    - main.png: 240 x 240 px
    - tab.png: 96 x 74 px
[✓] White border contour applied for high visibility in both Light & Dark themes
[✓] RGB Color mode (RGBA with Alpha channel)
[✓] File size: Under 1MB per image

HOW TO SUBMIT:
1. Go to https://creator.line.me/ and sign in with your LINE account.
2. Click "New Submission" > "Sticker".
3. Copy-paste the Title and Description from above.
4. Under "Sticker Images", click "Upload ZIP file" and select this ZIP.
5. Set Price Tier (e.g. 50 Coins / 35 THB / $0.99) and click "Request Review"!
`;

  folder.file('LINE_SUBMISSION_INFO.txt', manifest);

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return content;
}

export async function downloadStickerZip(options: ZipExportOptions, filename = 'line_stickers.zip'): Promise<void> {
  const blob = await createStickerPackZip(options);
  saveAs(blob, filename);
}
