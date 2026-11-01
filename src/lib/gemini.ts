import { GoogleGenAI, Type } from '@google/genai';
import { ART_STYLES } from './lineStickerPresets';
import { LineMarketMetadata, TextOverlayConfig } from '@/types/sticker';

export interface GeneratePromptsInput {
  concept: string;
  artStyle: string;
  customDetails?: string;
  language?: string;
  includeTextBubbles?: boolean;
  selectedEmotions: {
    id: string;
    label: string;
    defaultText?: string;
    poseDescription?: string;
  }[];
  referenceImageBase64?: string;
}

export interface PromptResultItem {
  id: number;
  filename: string;
  emotionKey: string;
  label: string;
  textBubble: string;
  prompt: string;
  textOverlay?: TextOverlayConfig;
}

export interface GeneratePromptsResponse {
  masterCharacterDescription: string;
  metadata: LineMarketMetadata;
  stickers: PromptResultItem[];
}

export function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please add it to .env.local');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Step 1: Use Gemini to expand the character concept into a visually consistent character anchor,
 * generate specific cohesive prompts for all sticker emotions, AND auto-generate LINE Creators Market metadata (EN, TH, JA).
 */
export async function generateStickerPrompts(input: GeneratePromptsInput): Promise<GeneratePromptsResponse> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  
  const styleObj = ART_STYLES.find((s) => s.id === input.artStyle) || ART_STYLES[0];
  const emotionsListText = input.selectedEmotions
    .map((e, idx) => `${idx + 1}. [${e.id}] ${e.label} | Default text: "${e.defaultText || ''}" | Suggested action: ${e.poseDescription || ''}`)
    .join('\n');

  const systemInstruction = `You are a world-class LINE Sticker Art Director and AI Prompt Engineer specializing in Google Imagen prompts and LINE Creators Market submissions.
Your mission is to turn user character ideas into a cohesive set of ${input.selectedEmotions.length} production-ready LINE Sticker prompts and generate official submission metadata.

Critical LINE Sticker Requirements:
1. CHARACTER VISUAL CONSISTENCY: All stickers MUST depict the EXACT same character (same creature, fur/hair color, eye style, costume, signature accessories).
2. STICKER FORMAT: Every image prompt must specify:
   - "isolated sticker illustration on a solid plain pure white background (#FFFFFF)"
   - "no background scenery, no shadows on floor, clean bold silhouette, die-cut sticker border"
   - Specific art style keywords: ${styleObj.promptModifier}
   - Pure character focus without complex floating text (typography is overlaid in app).
3. METADATA: Provide catchy titles and descriptions for LINE Creators Market in English, Thai (ภาษาไทย), and Japanese (日本語), along with search keywords for each sticker.`;

  const userPrompt = `Create a complete LINE Sticker pack for:
Character Concept: ${input.concept}
Art Style: ${styleObj.name} (${styleObj.promptModifier})
${input.customDetails ? `Extra Details: ${input.customDetails}` : ''}
Language: ${input.language || 'Thai/English'}

Emotions to generate:
${emotionsListText}

Return a valid JSON object matching this schema:
{
  "masterCharacterDescription": "A concise 2-3 sentence visual description of the character anchor ensuring consistent features (colors, accessories, clothing, eye style).",
  "metadata": {
    "title": {
      "en": "Catchy English Title (Max 40 chars)",
      "th": "ชื่อชุดสติกเกอร์ภาษาไทยน่ารักๆ (ไม่เกิน 40 ตัวอักษร)",
      "ja": "かわいい日本語タイトル (40文字以内)"
    },
    "description": {
      "en": "Short description of the sticker pack for LINE Store (Max 160 chars).",
      "th": "คำอธิบายชุดสติกเกอร์ภาษาไทย (ไม่เกิน 160 ตัวอักษร)",
      "ja": "LINEストア用日本語説明文 (160文字以内)"
    },
    "category": "Cute / Characters",
    "copyright": "© ${new Date().getFullYear()} AI Sticker Studio",
    "tagsBySticker": {
      "01.png": ["hello", "greeting", "cute", "cat"]
    }
  },
  "stickers": [
    {
      "id": 1,
      "filename": "01.png",
      "emotionKey": "hello",
      "label": "Hello",
      "textBubble": "สวัสดี!",
      "prompt": "Detailed English Imagen prompt including character anchor, pose, emotion, and sticker format instructions."
    }
  ]
}`;

  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not configured. Returning deterministic fallback prompts for development.');
    return generateDeterministicFallback(input, styleObj.promptModifier);
  }

  try {
    const ai = getGenAIClient();
    const candidateTextModels = [
      process.env.GEMINI_MODEL,
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-3.8-flash',
    ].filter(Boolean) as string[];

    const parts: any[] = [{ text: userPrompt }];

    if (input.referenceImageBase64) {
      const base64Data = input.referenceImageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      parts.unshift({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data,
        },
      });
      parts.unshift({
        text: 'Analyze this reference image and extract the exact character features, color palette, and visual signature to maintain 100% consistency in all generated stickers.',
      });
    }

    let responseText = '';
    for (const model of candidateTextModels) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: parts,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
          },
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (modelErr: any) {
        console.warn(`Text model ${model} failed, trying next candidate:`, modelErr.message);
      }
    }

    if (!responseText) {
      throw new Error('All text model candidates failed to return content');
    }

    const parsed = JSON.parse(responseText);

    const masterAnchor = parsed.masterCharacterDescription || `A cute ${input.concept} in ${styleObj.name} style`;

    const stickers: PromptResultItem[] = input.selectedEmotions.map((emotion, idx) => {
      const found = parsed.stickers?.find((s: any) => s.emotionKey === emotion.id || s.id === idx + 1);
      const filename = `${String(idx + 1).padStart(2, '0')}.png`;
      const textVal = found?.textBubble || emotion.defaultText || '';
      const basePrompt = found?.prompt || `A cute LINE sticker of ${input.concept}, ${emotion.poseDescription || emotion.label}, ${styleObj.promptModifier}, isolated on pure solid white background, die-cut sticker edge, no shadow`;
      const cohesivePrompt = basePrompt.toLowerCase().includes(masterAnchor.toLowerCase().slice(0, 20))
        ? basePrompt
        : `${masterAnchor}. ${basePrompt}`;

      return {
        id: idx + 1,
        filename,
        emotionKey: emotion.id,
        label: emotion.label,
        textBubble: textVal,
        prompt: cohesivePrompt,
        textOverlay: {
          enabled: Boolean(input.includeTextBubbles && textVal),
          text: textVal,
          font: 'Mali',
          fontSize: 34,
          textColor: '#FF4757',
          strokeColor: '#FFFFFF',
          strokeWidth: 8,
          position: 'bottom',
        },
      };
    });

    const metadata: LineMarketMetadata = {
      title: parsed.metadata?.title || {
        en: `${input.concept.slice(0, 30)} Stickers`,
        th: `สติกเกอร์ ${input.concept.slice(0, 25)} สุดน่ารัก`,
        ja: `${input.concept.slice(0, 20)} スタンプ`,
      },
      description: parsed.metadata?.description || {
        en: `Enjoy daily chatting with this cute ${input.concept} sticker set!`,
        th: `ส่งความน่ารักสดใสกับสติกเกอร์ ${input.concept.slice(0, 30)} ได้ทุกวัน!`,
        ja: `毎日のトークを楽しく彩るかわいいスタンプセットです！`,
      },
      category: parsed.metadata?.category || 'Characters',
      copyright: parsed.metadata?.copyright || `© ${new Date().getFullYear()} AI Sticker Studio`,
      tagsBySticker: parsed.metadata?.tagsBySticker || {},
    };

    return {
      masterCharacterDescription: parsed.masterCharacterDescription || `Character: ${input.concept} in ${styleObj.name} style.`,
      metadata,
      stickers,
    };
  } catch (error: any) {
    console.error('Gemini prompt generation failed:', error);
    return generateDeterministicFallback(input, styleObj.promptModifier);
  }
}

/**
 * Step 2: Generate an individual sticker image using Google AI Studio
 * Uses the official Google AI Studio image model:
 * 'gemini-2.5-flash-image' (Nano Banana) via the Interactions API endpoint
 */
export async function generateStickerImage(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required to generate images.');
  }

  const enhancedPrompt = `${prompt}, isolated sticker illustration on pure solid white background (#FFFFFF), centered, die-cut sticker border, no drop shadow, clean sharp edges, high resolution`;

  const model = process.env.IMAGEN_MODEL && !process.env.IMAGEN_MODEL.startsWith('imagen-')
    ? process.env.IMAGEN_MODEL
    : 'gemini-2.5-flash-image';

  console.log(`[Google AI Studio] Generating image with model: ${model}`);

  const url = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      input: enhancedPrompt,
    }),
  });

  const resJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = resJson?.error?.message || `HTTP ${response.status} ${response.statusText}`;
    console.warn(`[Google AI Studio] ${model} response status ${response.status}:`, errorMsg);
    if (
      response.status === 429 ||
      errorMsg.includes('limit: 0') ||
      errorMsg.includes('Rate limit exceeded') ||
      errorMsg.includes('Quota exceeded')
    ) {
      throw new Error(`QUOTA_EXCEEDED: ${errorMsg}`);
    }
    throw new Error(`API_ERROR: ${errorMsg}`);
  }

  const b64 = resJson?.output_image?.data;
  if (b64) {
    return `data:image/png;base64,${b64}`;
  }

  throw new Error(`No output image returned by model ${model}`);
}

function generateDeterministicFallback(input: GeneratePromptsInput, styleModifier: string): GeneratePromptsResponse {
  const masterDescription = `A cute stylized ${input.concept}, featuring signature vibrant colors, expressive features, and charming proportions in ${input.artStyle} style.`;
  const tagsBySticker: Record<string, string[]> = {};

  const stickers: PromptResultItem[] = input.selectedEmotions.map((emotion, idx) => {
    const filename = `${String(idx + 1).padStart(2, '0')}.png`;
    const prompt = `${masterDescription}. A charming LINE sticker of ${input.concept}, ${emotion.poseDescription || emotion.label}, showing joyful expression, ${styleModifier}, isolated on a solid pure white background, crisp sticker borders, no clutter`;
    const textVal = emotion.defaultText || emotion.label;

    tagsBySticker[filename] = [emotion.id, emotion.label.toLowerCase(), 'cute', 'character'];

    return {
      id: idx + 1,
      filename,
      emotionKey: emotion.id,
      label: emotion.label,
      textBubble: textVal,
      prompt,
      textOverlay: {
        enabled: Boolean(input.includeTextBubbles && textVal),
        text: textVal,
        font: 'Mali',
        fontSize: 34,
        textColor: '#FF4757',
        strokeColor: '#FFFFFF',
        strokeWidth: 8,
        position: 'bottom',
      },
    };
  });

  const metadata: LineMarketMetadata = {
    title: {
      en: `${input.concept.slice(0, 30)} Cute Stickers`,
      th: `สติกเกอร์ ${input.concept.slice(0, 25)} น่ารักดุ๊กดิ๊ก`,
      ja: `${input.concept.slice(0, 20)} かわいいスタンプ`,
    },
    description: {
      en: `Brighten up your conversations with ${input.concept} sticker collection!`,
      th: `เพิ่มความสดใสให้ทุกบทสนทนาด้วยสติกเกอร์ ${input.concept.slice(0, 30)} ใช้งานง่ายทุกวัน`,
      ja: `${input.concept.slice(0, 20)}の可愛いスタンプセット。毎日のトークで大活躍！`,
    },
    category: 'Characters',
    copyright: `© ${new Date().getFullYear()} AI Sticker Studio`,
    tagsBySticker,
  };

  return {
    masterCharacterDescription: masterDescription,
    metadata,
    stickers,
  };
}
