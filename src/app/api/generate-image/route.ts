import { NextRequest, NextResponse } from 'next/server';
import { generateStickerImage } from '@/lib/gemini';
import { generateImageWithFlux } from '@/lib/flux';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, id, filename, label, textBubble, emotionKey, engine = 'flux' } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let imageBase64: string = '';
    const modelUsed = engine === 'flux' ? 'flux-1-schnell' : 'gemini-2.5-flash-image';

    if (engine === 'flux') {
      // 1. Free FLUX.1 Engine (No API Key or Billing needed)
      try {
        imageBase64 = await generateImageWithFlux(prompt, id ? id * 1234 : undefined);
      } catch (fluxError: any) {
        if (fluxError.retrySeconds) {
          console.log(`[FLUX Engine] Free tier cooldown: retry in ${fluxError.retrySeconds}s`);
          return NextResponse.json(
            {
              id,
              filename,
              label,
              rateLimited: true,
              retrySeconds: fluxError.retrySeconds,
              error: `เซิร์ฟเวอร์ฟรีจำกัด 1 รูปต่อ 45 วินาที (รอคิวอีก ${fluxError.retrySeconds} วินาที...)`,
            },
            { status: 429 }
          );
        }
        console.warn('FLUX Engine failed:', fluxError.message);
        return NextResponse.json(
          {
            id,
            filename,
            label,
            error: fluxError.message || 'FLUX Engine failed to generate image',
          },
          { status: 500 }
        );
      }
    } else {
      // 2. Google AI Studio Gemini 2.5 Flash Image (Requires Billing on AI Studio)
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

      if (!apiKey) {
        return NextResponse.json(
          {
            id,
            filename,
            label,
            error: 'GEMINI_API_KEY is not configured in .env.local',
          },
          { status: 400 }
        );
      }

      try {
        imageBase64 = await generateStickerImage(prompt);
      } catch (genError: any) {
        console.warn('Gemini Flash Image failed:', genError.message);
        return NextResponse.json(
          {
            id,
            filename,
            label,
            error: genError.message?.includes('limit: 0') || genError.message?.includes('QUOTA')
              ? 'Google AI Studio Quota 0/0 RPD: ต้องกด "Set up billing" ในหน้า AI Studio เพื่อเปิดโควต้าสร้างภาพ'
              : genError.message || 'Image generation failed',
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      id,
      filename,
      label,
      imageBase64,
      modelUsed,
    });
  } catch (error: any) {
    console.error('API Error in /api/generate-image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
