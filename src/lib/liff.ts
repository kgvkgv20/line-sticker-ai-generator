import type { Liff } from '@line/liff';
import { LiffState, UserProfile } from '@/types/sticker';

let liffInstance: Liff | null = null;

export async function getLiffInstance(): Promise<Liff | null> {
  if (typeof window === 'undefined') return null;
  if (liffInstance) return liffInstance;

  try {
    const liffModule = await import('@line/liff');
    liffInstance = liffModule.default;
    return liffInstance;
  } catch (error) {
    console.warn('Failed to load @line/liff:', error);
    return null;
  }
}

export async function initializeLiff(liffId?: string): Promise<LiffState> {
  if (typeof window === 'undefined') {
    return {
      isInitialized: false,
      isInClient: false,
      isLoggedIn: false,
      profile: null,
      error: 'Running on server',
      isMock: false,
    };
  }

  const effectiveLiffId = liffId || process.env.NEXT_PUBLIC_LIFF_ID;

  // If no LIFF ID provided, run in Mock / Browser Sandbox Mode
  if (!effectiveLiffId || effectiveLiffId.includes('your_line_liff_id')) {
    console.info('[LIFF] No NEXT_PUBLIC_LIFF_ID configured. Running in Browser Preview Mode.');
    return {
      isInitialized: true,
      isInClient: false,
      isLoggedIn: true,
      profile: {
        userId: 'U_mock_user_12345',
        displayName: 'LINE Creator (Demo)',
        pictureUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        statusMessage: 'Creating awesome stickers with Google AI Studio',
      },
      error: null,
      isMock: true,
    };
  }

  try {
    const liff = await getLiffInstance();
    if (!liff) {
      throw new Error('LIFF SDK failed to load');
    }

    await liff.init({ liffId: effectiveLiffId });

    const isInClient = liff.isInClient();
    const isLoggedIn = liff.isLoggedIn();

    let profile: UserProfile | null = null;
    if (isLoggedIn) {
      try {
        const rawProfile = await liff.getProfile();
        profile = {
          userId: rawProfile.userId,
          displayName: rawProfile.displayName,
          pictureUrl: rawProfile.pictureUrl,
          statusMessage: rawProfile.statusMessage,
        };
      } catch (profileErr) {
        console.warn('Could not fetch user profile:', profileErr);
      }
    }

    return {
      isInitialized: true,
      isInClient,
      isLoggedIn,
      profile,
      error: null,
      isMock: false,
    };
  } catch (err: any) {
    console.error('LIFF initialization error:', err);
    return {
      isInitialized: false,
      isInClient: false,
      isLoggedIn: false,
      profile: null,
      error: err?.message || 'Failed to initialize LIFF',
      isMock: false,
    };
  }
}

export async function loginLiff(): Promise<void> {
  const liff = await getLiffInstance();
  if (liff && !liff.isLoggedIn()) {
    liff.login();
  }
}

export async function logoutLiff(): Promise<void> {
  const liff = await getLiffInstance();
  if (liff && liff.isLoggedIn()) {
    liff.logout();
    window.location.reload();
  }
}

export async function closeLiffWindow(): Promise<void> {
  const liff = await getLiffInstance();
  if (liff && liff.isInClient()) {
    liff.closeWindow();
  }
}

export async function shareStickerWithFriends(imageUrl: string, stickerTitle: string): Promise<boolean> {
  const liff = await getLiffInstance();
  if (!liff) return false;

  if (liff.isApiAvailable('shareTargetPicker')) {
    try {
      await liff.shareTargetPicker([
        {
          type: 'text',
          text: `Check out my new AI-generated LINE Sticker: "${stickerTitle}"! Created with Google AI Studio & LINE LIFF.`,
        },
        {
          type: 'image',
          originalContentUrl: imageUrl,
          previewImageUrl: imageUrl,
        },
      ]);
      return true;
    } catch (err) {
      console.error('Target picker error:', err);
      return false;
    }
  } else {
    alert('LINE Share Target Picker is not supported in this browser window. Please open inside LINE app.');
    return false;
  }
}
