import { NextRequest, NextResponse } from 'next/server';
import { generateStickerPrompts } from '@/lib/gemini';

export const maxDuration = 60; // 60 seconds max for AI thinking

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      concept,
      artStyle,
      customDetails,
      language,
      includeTextBubbles,
      selectedEmotions,
      referenceImageBase64,
    } = body;

    if (!concept || typeof concept !== 'string') {
      return NextResponse.json(
        { error: 'Character concept is required.' },
        { status: 400 }
      );
    }

    if (!selectedEmotions || !Array.isArray(selectedEmotions) || selectedEmotions.length === 0) {
      return NextResponse.json(
        { error: 'At least one emotion must be selected.' },
        { status: 400 }
      );
    }

    const result = await generateStickerPrompts({
      concept,
      artStyle: artStyle || 'kawaii-chibi',
      customDetails,
      language,
      includeTextBubbles: includeTextBubbles !== false,
      selectedEmotions,
      referenceImageBase64,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error in /api/generate-prompts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate sticker prompts.' },
      { status: 500 }
    );
  }
}
