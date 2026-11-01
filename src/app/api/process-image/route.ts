import { NextRequest, NextResponse } from 'next/server';
import { removeBackgroundAndResize, TargetImageType } from '@/lib/imageProcessor';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      imageBase64,
      type = 'sticker',
      threshold = 240,
      strokeThickness = 'medium',
      textOverlay,
    } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
    }

    const result = await removeBackgroundAndResize(imageBase64, {
      type: type as TargetImageType,
      threshold: Number(threshold) || 240,
      strokeThickness: strokeThickness || 'medium',
      textOverlay,
    });

    return NextResponse.json({
      transparentImageUrl: result.dataUrl,
      width: result.width,
      height: result.height,
      type,
    });
  } catch (error: any) {
    console.error('API Error in /api/process-image:', error);
    return NextResponse.json(
      { error: error.message || 'Background removal & resizing failed' },
      { status: 500 }
    );
  }
}
