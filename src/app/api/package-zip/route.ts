import { NextRequest, NextResponse } from 'next/server';
import { createStickerPackZip } from '@/lib/zipGenerator';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { characterName, stickers, mainImageBase64, tabImageBase64 } = body;

    if (!stickers || !Array.isArray(stickers) || stickers.length === 0) {
      return NextResponse.json({ error: 'No stickers provided to package' }, { status: 400 });
    }

    const blob = await createStickerPackZip({
      characterName: characterName || 'LINE_Sticker_Pack',
      stickers,
      mainImageBase64,
      tabImageBase64,
    });

    const arrayBuffer = await blob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(characterName || 'line_stickers')}.zip"`,
      },
    });
  } catch (error: any) {
    console.error('API Error in /api/package-zip:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate ZIP file' },
      { status: 500 }
    );
  }
}
