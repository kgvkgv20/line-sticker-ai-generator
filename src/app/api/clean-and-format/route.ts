import { NextRequest, NextResponse } from 'next/server';
import { extractDieCutSticker, TargetImageType } from '@/lib/dieCutExtractor';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      imageBase64,
      type = 'sticker',
      threshold = 220,
      colorTolerance = 28,
      addExtraStroke = 'none',
    } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
    }

    const result = await extractDieCutSticker(imageBase64, {
      type: type as TargetImageType,
      threshold: Number(threshold) || 220,
      colorTolerance: Number(colorTolerance) || 28,
      addExtraStroke: addExtraStroke as any,
    });

    return NextResponse.json({
      success: true,
      transparentImageUrl: result.dataUrl,
      width: result.width,
      height: result.height,
      format: result.format,
      byteSize: result.byteSize,
      type,
    });
  } catch (error: any) {
    console.error('Error in /api/clean-and-format:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to clean and format sticker image',
      },
      { status: 500 }
    );
  }
}
