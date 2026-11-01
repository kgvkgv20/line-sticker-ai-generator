/**
 * Free AI Image Generation Engine powered by FLUX.1 (via Pollinations API)
 * 100% Free, no API key required, no credit card required.
 * Generates high quality real AI illustrations with commercial friendly Apache 2.0 weights.
 */

export async function generateImageWithFlux(prompt: string, seed?: number): Promise<string> {
  const stickerPrompt = `${prompt}, isolated sticker on pure solid white background, die-cut sticker border, centered, high quality, vivid colors, no shadows, no background scenery`;
  
  const randomSeed = seed ?? Math.floor(Math.random() * 1000000);
  const encodedPrompt = encodeURIComponent(stickerPrompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&model=flux&nologo=true&seed=${randomSeed}`;

  console.log(`[FLUX Engine] Generating image via FLUX.1 (seed: ${randomSeed})...`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LineStickerAIGenerator/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 402) {
        const errorJson = await res.json().catch(() => ({}));
        const rawMsg = errorJson?.error?.message || '';
        const match = rawMsg.match(/Retry after (\d+)s/i);
        const retrySeconds = match ? parseInt(match[1], 10) : 45;
        const rateLimitErr: any = new Error(`RATE_LIMIT_COOLDOWN:${retrySeconds}`);
        rateLimitErr.retrySeconds = retrySeconds;
        rateLimitErr.rawMessage = rawMsg;
        throw rateLimitErr;
      }
      throw new Error(`FLUX Engine returned status ${res.status}: ${res.statusText}`);
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    
    if (arrayBuffer.byteLength < 1000) {
      throw new Error('FLUX returned invalid or empty image data');
    }

    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    return `data:${contentType};base64,${base64Data}`;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('FLUX Engine generation timed out (35s). Please try again.');
    }
    throw error;
  }
}
