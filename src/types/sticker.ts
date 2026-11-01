export type ArtStyle = 
  | 'realistic-meme'
  | 'kawaii-chibi'
  | '3d-cute'
  | 'anime-manga'
  | 'pixel-art'
  | 'watercolor'
  | 'retro-comic';

export interface ArtStyleOption {
  id: ArtStyle;
  name: string;
  description: string;
  badge: string;
  promptModifier: string;
}

export type StickerLanguage = 'en' | 'th' | 'ja' | 'none';

export type EmotionCategory = 'meme' | 'daily' | 'sarcastic' | 'positive' | 'negative' | 'greeting' | 'reaction';

export interface EmotionPreset {
  id: string;
  label: string;
  emoji: string;
  category: EmotionCategory;
  textByLang: Record<StickerLanguage, string>;
  poseDescription: string;
}

export type ThaiStickerFont = 'Mali' | 'Itim' | 'Mitr' | 'Chonburi' | 'Kanit';

export type ImageEngine = 'flux' | 'gemini';

export interface TextOverlayConfig {
  enabled: boolean;
  text: string;
  font: ThaiStickerFont;
  fontSize: number; // 24 to 48
  textColor: string; // hex
  strokeColor: string; // hex (default white)
  strokeWidth: number; // 4 to 12
  position: 'top' | 'bottom' | 'center';
  yOffset?: number;
}

export interface StickerItem {
  id: number;
  filename: string; // "01.png", "02.png", etc.
  label: string;
  emotionKey: string;
  textBubble: string;
  prompt: string;
  status: 'idle' | 'generating' | 'generated' | 'processing' | 'ready' | 'cooldown' | 'error';
  cooldownSeconds?: number;
  rawImageUrl?: string; // base64 or URL with white background
  transparentImageUrl?: string; // base64 PNG with transparent background and optional white stroke/text
  thumbnailUrl?: string; // scaled for preview
  error?: string;
  width?: number;
  height?: number;
  textOverlay?: TextOverlayConfig;
  modelUsed?: string;
  isFallback?: boolean;
  imageEngine?: ImageEngine;
}

export interface LineMarketMetadata {
  title: {
    en: string;
    th: string;
    ja: string;
  };
  description: {
    en: string;
    th: string;
    ja: string;
  };
  copyright: string;
  category: string;
  tagsBySticker: Record<string, string[]>; // e.g. { "01.png": ["hello", "greeting", "cat"] }
}

export interface CharacterConfig {
  concept: string;
  artStyle: ArtStyle;
  customDetails: string;
  language: StickerLanguage;
  referenceImageBase64?: string;
  selectedEmotionIds: string[];
  includeTextBubbles: boolean;
  whiteStrokeThickness: 'none' | 'thin' | 'medium' | 'thick'; // 0, 4, 8, 12 px
  packSize: 8 | 16 | 24 | 32 | 40;
  imageEngine: ImageEngine;
  masterCharacterDescription?: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LiffState {
  isInitialized: boolean;
  isInClient: boolean;
  isLoggedIn: boolean;
  profile: UserProfile | null;
  error: string | null;
  isMock: boolean;
}
