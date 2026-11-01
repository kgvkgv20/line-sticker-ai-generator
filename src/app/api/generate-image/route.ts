import { NextRequest, NextResponse } from 'next/server';
import { generateStickerImage } from '@/lib/gemini';
import sharp from 'sharp';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, id, filename, label, textBubble, emotionKey } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    let imageBase64: string;

    if (!apiKey) {
      imageBase64 = await generateMockStickerImage(label || 'Sticker', textBubble, emotionKey);
    } else {
      try {
        imageBase64 = await generateStickerImage(prompt);
      } catch (genError: any) {
        console.warn('Imagen API generation failed, falling back to mock sticker:', genError.message);
        return NextResponse.json(
          { 
            error: genError.message || 'Image generation failed',
            details: 'Check your Google AI Studio API key and quota in .env.local'
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
    });
  } catch (error: any) {
    console.error('API Error in /api/generate-image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}

/**
 * Generate a charming SVG-based sticker on solid white background as a fallback for local testing without API key
 */
async function generateMockStickerImage(label: string, textBubble?: string, emotionKey?: string): Promise<string> {
  const emojis: Record<string, string> = {
    fisheye_nose: '👃',
    balaclava: '🥷',
    thug_life: '🕶️',
    headphones: '🎧',
    screaming_yawn: '😱',
    teeth_grin: '😬',
    derp_tongue: '🤪',
    wiggle_butt: '🍑',
    side_eye: '😒',
    motion_blur: '🌪️',
    bath_tub: '🍊',
    skateboard: '🛹',
    backward_cap: '🧢',
    eating_watermelon: '🍉',
    duck_hood: '🦆',
    eating_shoe: '👟',
    drinking_bottle: '🍾',
    poker_face: '🗿',
    dead_inside: '🫠',
    fire_rush: '🔥',
    money_gone: '💸',
    hello: '👋',
    thank_you: '🙏',
    ok: '👍',
    laughing: '😆',
    crying: '😭',
    love: '❤️',
    shocked: '😲',
    sleepy: '😴',
    cheer: '💪',
    sorry: '🙇',
    bye: '🚪',
    angry: '😤',
  };
  const emoji = (emotionKey && emojis[emotionKey]) || '✨';

  // Customize mock sticker accessories based on emotion
  let accessorySvg = '';
  if (emotionKey === 'thug_life' || emotionKey === 'backward_cap') {
    accessorySvg += `
      <!-- Thug life sunglasses -->
      <polygon points="175,200 235,200 225,235 185,235" fill="#1E272E" />
      <polygon points="277,200 337,200 327,235 287,235" fill="#1E272E" />
      <line x1="235" y1="210" x2="277" y2="210" stroke="#1E272E" stroke-width="6" />
    `;
  }
  if (emotionKey === 'balaclava') {
    accessorySvg += `
      <!-- Black ski mask balaclava -->
      <circle cx="256" cy="240" r="145" fill="#2F3542" />
      <ellipse cx="210" cy="225" rx="22" ry="16" fill="#FFA502" />
      <ellipse cx="302" cy="225" rx="22" ry="16" fill="#FFA502" />
      <ellipse cx="256" cy="285" rx="35" ry="18" fill="#FFA502" />
    `;
  }
  if (emotionKey === 'headphones') {
    accessorySvg += `
      <!-- Gaming headphones -->
      <path d="M 120 220 A 136 136 0 0 1 392 220" fill="none" stroke="#2F3542" stroke-width="18" stroke-linecap="round"/>
      <rect x="95" y="195" width="35" height="65" rx="16" fill="#06C755" stroke="#2F3542" stroke-width="6" />
      <rect x="382" y="195" width="35" height="65" rx="16" fill="#06C755" stroke="#2F3542" stroke-width="6" />
    `;
  }
  if (emotionKey === 'bath_tub') {
    accessorySvg += `
      <!-- Orange on head -->
      <circle cx="256" cy="110" r="32" fill="#FFA502" stroke="#2D3436" stroke-width="6" />
      <polygon points="256,78 268,65 264,78" fill="#2ED573" />
    `;
  }
  if (emotionKey === 'duck_hood') {
    accessorySvg += `
      <!-- Duck hood -->
      <path d="M 160 170 Q 256 90 352 170" fill="#FED330" stroke="#2D3436" stroke-width="10" />
      <ellipse cx="256" cy="145" rx="35" ry="16" fill="#FA8231" stroke="#2D3436" stroke-width="5" />
    `;
  }
  if (emotionKey === 'fisheye_nose') {
    accessorySvg += `
      <!-- Massive 0.5x Fisheye Snout -->
      <ellipse cx="256" cy="275" rx="75" ry="55" fill="#2F3542" stroke="#1E272E" stroke-width="8" />
      <ellipse cx="230" cy="285" rx="18" ry="14" fill="#000000" />
      <ellipse cx="282" cy="285" rx="18" ry="14" fill="#000000" />
      <ellipse cx="245" cy="260" rx="14" ry="8" fill="#FFFFFF" opacity="0.6" />
    `;
  }

  const svg = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#FFFFFF"/>
    <!-- Outer sticker border -->
    <circle cx="256" cy="240" r="160" fill="#FFEAA7" stroke="#2D3436" stroke-width="12"/>
    <!-- Face / Body -->
    <ellipse cx="256" cy="240" rx="130" ry="120" fill="#ECCC68" stroke="#2D3436" stroke-width="8"/>
    <!-- Ears -->
    <polygon points="170,140 130,80 200,120" fill="#DDA059" stroke="#2D3436" stroke-width="8"/>
    <polygon points="342,140 382,80 312,120" fill="#DDA059" stroke="#2D3436" stroke-width="8"/>
    <!-- Eyes -->
    <circle cx="205" cy="225" r="14" fill="#2D3436"/>
    <circle cx="307" cy="225" r="14" fill="#2D3436"/>
    <circle cx="210" cy="220" r="4" fill="#FFFFFF"/>
    <circle cx="312" cy="220" r="4" fill="#FFFFFF"/>
    <!-- Blush -->
    <ellipse cx="180" cy="250" rx="18" ry="10" fill="#FF6B81" opacity="0.8"/>
    <ellipse cx="332" cy="250" rx="18" ry="10" fill="#FF6B81" opacity="0.8"/>
    <!-- Nose & Mouth -->
    <ellipse cx="256" cy="250" rx="22" ry="15" fill="#2D3436" />
    <path d="M 235 265 Q 256 280 277 265" fill="none" stroke="#2D3436" stroke-width="6" stroke-linecap="round"/>
    
    <!-- Accessories & Custom Memes -->
    ${accessorySvg}

    <!-- Emoji badge -->
    <text x="256" y="165" font-size="44" text-anchor="middle">${emoji}</text>

    <!-- Label/Text Banner -->
    ${
      textBubble
        ? `
      <g transform="translate(256, 385)">
        <rect x="-140" y="-28" width="280" height="56" rx="28" fill="#06C755" stroke="#FFFFFF" stroke-width="5" />
        <text x="0" y="10" font-family="'Mali', 'Itim', sans-serif" font-size="26" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${textBubble}</text>
      </g>`
        : `
      <text x="256" y="385" font-family="'Mali', sans-serif" font-size="22" font-weight="bold" fill="#2D3436" text-anchor="middle">${label}</text>
      `
    }
  </svg>
  `;

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${pngBuffer.toString('base64')}`;
}
