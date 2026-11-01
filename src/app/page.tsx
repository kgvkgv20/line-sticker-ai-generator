'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { StepCharacterInput } from '@/components/StepCharacterInput';
import { PromptReviewModal } from '@/components/PromptReviewModal';
import { StepGeneration } from '@/components/StepGeneration';
import { ChatSimulator } from '@/components/ChatSimulator';
import { LineMarketGuideModal } from '@/components/LineMarketGuideModal';
import { LineMetadataModal } from '@/components/LineMetadataModal';
import { TextOverlayEditorModal } from '@/components/TextOverlayEditorModal';
import { useLiff } from '@/hooks/useLiff';
import { CharacterConfig, StickerItem, LineMarketMetadata, TextOverlayConfig } from '@/types/sticker';
import { EMOTION_PRESETS, PACK_PRESETS } from '@/lib/lineStickerPresets';
import { downloadStickerZip } from '@/lib/zipGenerator';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function Home() {
  const liff = useLiff();

  // Step state
  const [currentStep, setCurrentStep] = useState<'input' | 'generation'>('input');

  // Character Configuration State
  const [config, setConfig] = useState<CharacterConfig>({
    concept: 'A hilarious golden labrador retriever with derpy meme expressions and funny faces',
    artStyle: 'realistic-meme',
    customDetails: '',
    language: 'th',
    selectedEmotionIds: PACK_PRESETS.meme16,
    includeTextBubbles: true,
    whiteStrokeThickness: 'medium', // Default 7px white die-cut stroke
    packSize: 16,
    imageEngine: 'flux', // Default to Free FLUX.1 Engine
  });

  // Prompt generation results
  const [masterDescription, setMasterDescription] = useState<string>('');
  const [metadata, setMetadata] = useState<LineMarketMetadata>({
    title: { en: 'Cute Cat Stickers', th: 'สติกเกอร์แมวส้มสุดน่ารัก', ja: 'かわいい猫のスタンプ' },
    description: { en: 'Daily cute cat stickers for chatting!', th: 'สติกเกอร์แมวส้มส่งต่อความสุขทุกวัน', ja: '毎日の会話に使えるかわいい猫スタンプ' },
    copyright: `© ${new Date().getFullYear()} AI Sticker Studio`,
    category: 'Characters',
    tagsBySticker: {},
  });
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [mainImageBase64, setMainImageBase64] = useState<string | undefined>(undefined);
  const [tabImageBase64, setTabImageBase64] = useState<string | undefined>(undefined);

  // Loading & Modal states
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isChatSimulatorOpen, setIsChatSimulatorOpen] = useState(false);
  const [chatInitialSticker, setChatInitialSticker] = useState<StickerItem | undefined>(undefined);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [editingTextSticker, setEditingTextSticker] = useState<StickerItem | null>(null);

  const handleUpdateConfig = (updates: Partial<CharacterConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  // Step 1: Call Gemini to generate prompts + auto-generate 3-language LINE metadata
  const handleGeneratePrompts = async () => {
    if (!config.concept.trim()) return;

    setIsGeneratingPrompts(true);
    try {
      const selectedEmotions = config.selectedEmotionIds.map((id) => {
        const found = EMOTION_PRESETS.find((e) => e.id === id);
        return {
          id,
          label: found?.label || id,
          defaultText: found?.textByLang[config.language] || '',
          poseDescription: found?.poseDescription || '',
        };
      });

      const res = await fetch('/api/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: config.concept,
          artStyle: config.artStyle,
          customDetails: config.customDetails,
          language: config.language,
          includeTextBubbles: config.includeTextBubbles,
          selectedEmotions,
          referenceImageBase64: config.referenceImageBase64,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate prompts');
      }

      const data = await res.json();
      setMasterDescription(data.masterCharacterDescription || '');
      if (data.metadata) {
        setMetadata(data.metadata);
      }

      const initialStickers: StickerItem[] = data.stickers.map((item: any) => ({
        id: item.id,
        filename: item.filename,
        label: item.label,
        emotionKey: item.emotionKey,
        textBubble: item.textBubble,
        prompt: item.prompt,
        status: 'idle',
        textOverlay: item.textOverlay || {
          enabled: config.includeTextBubbles && !!item.textBubble,
          text: item.textBubble,
          font: 'Mali',
          fontSize: 34,
          textColor: '#FF4757',
          strokeColor: '#FFFFFF',
          strokeWidth: 8,
          position: 'bottom',
        },
      }));

      setStickers(initialStickers);
      setIsPromptModalOpen(true);
    } catch (err: any) {
      console.error('Prompt generation failed:', err);
      alert(`Error generating sticker prompts: ${err.message}`);
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const handleUpdateSticker = (id: number, updates: Partial<StickerItem>) => {
    setStickers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Step 2 & 3: Generate images with Smart Rate-Limit Queue & post-process for LINE specs
  const handleStartGeneration = async () => {
    setCurrentStep('generation');
    setIsGeneratingImages(true);

    const updatedStickers = [...stickers];

    for (let i = 0; i < updatedStickers.length; i++) {
      const current = updatedStickers[i];
      let success = false;
      let attempts = 0;

      while (!success && attempts < 3) {
        attempts++;
        setStickers((prev) =>
          prev.map((s) => (s.id === current.id ? { ...s, status: 'generating', error: undefined } : s))
        );

        try {
          const genRes = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: current.prompt,
              id: current.id,
              filename: current.filename,
              label: current.label,
              textBubble: current.textBubble,
              emotionKey: current.emotionKey,
              engine: config.imageEngine,
            }),
          });

          // Handle 45s cooldown from free FLUX tier gracefully
          if (genRes.status === 429) {
            const errJson = await genRes.json().catch(() => ({}));
            const waitSec = errJson.retrySeconds || 45;
            for (let c = waitSec; c >= 1; c--) {
              setStickers((prev) =>
                prev.map((s) =>
                  s.id === current.id
                    ? { ...s, status: 'cooldown', cooldownSeconds: c }
                    : s
                )
              );
              await sleep(1000);
            }
            continue; // Retry after countdown
          }

          if (!genRes.ok) {
            const errJson = await genRes.json().catch(() => ({}));
            throw new Error(errJson.error || 'Image generation failed');
          }

          const genData = await genRes.json();
          const rawBase64 = genData.imageBase64;

          setStickers((prev) =>
            prev.map((s) =>
              s.id === current.id
                ? { ...s, status: 'processing', rawImageUrl: rawBase64 }
                : s
            )
          );

          // Process with White Stroke & Text Overlay
          const procRes = await fetch('/api/process-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: rawBase64,
              type: 'sticker',
              threshold: 240,
              strokeThickness: config.whiteStrokeThickness,
              textOverlay: current.textOverlay,
            }),
          });

          let transparentUrl = rawBase64;
          if (procRes.ok) {
            const procData = await procRes.json();
            transparentUrl = procData.transparentImageUrl;
          }

          setStickers((prev) =>
            prev.map((s) =>
              s.id === current.id
                ? {
                    ...s,
                    status: 'ready',
                    rawImageUrl: rawBase64,
                    transparentImageUrl: transparentUrl,
                    modelUsed: genData.modelUsed,
                  }
                : s
            )
          );

          if (i === 0) {
            processMainAndTab(rawBase64);
          }
          success = true;
        } catch (err: any) {
          console.error(`Sticker ${current.id} error:`, err);
          setStickers((prev) =>
            prev.map((s) =>
              s.id === current.id
                ? { ...s, status: 'error', error: err.message || 'Failed' }
                : s
            )
          );
          break;
        }
      }
    }

    setIsGeneratingImages(false);
  };

  const processMainAndTab = async (rawBase64: string) => {
    try {
      const [mainRes, tabRes] = await Promise.all([
        fetch('/api/process-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: rawBase64,
            type: 'main',
            threshold: 240,
            strokeThickness: config.whiteStrokeThickness,
          }),
        }),
        fetch('/api/process-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: rawBase64,
            type: 'tab',
            threshold: 240,
            strokeThickness: 'none', // Tab icon is small (96x74), no thick stroke needed
          }),
        }),
      ]);

      if (mainRes.ok) {
        const mData = await mainRes.json();
        setMainImageBase64(mData.transparentImageUrl);
      }
      if (tabRes.ok) {
        const tData = await tabRes.json();
        setTabImageBase64(tData.transparentImageUrl);
      }
    } catch (e) {
      console.warn('Could not generate main/tab images:', e);
    }
  };

  // Save Text Overlay for single sticker or apply style to all
  const handleSaveTextOverlay = async (
    stickerId: number,
    overlayConfig: TextOverlayConfig,
    applyStyleToAll?: boolean
  ) => {
    const updated = stickers.map((s) => {
      if (s.id === stickerId) {
        return { ...s, textOverlay: overlayConfig };
      }
      if (applyStyleToAll) {
        // Keep existing text, but apply font, color, stroke & position
        return {
          ...s,
          textOverlay: {
            ...s.textOverlay,
            font: overlayConfig.font,
            textColor: overlayConfig.textColor,
            strokeColor: overlayConfig.strokeColor,
            strokeWidth: overlayConfig.strokeWidth,
            position: overlayConfig.position,
            fontSize: overlayConfig.fontSize,
            enabled: s.textOverlay?.enabled ?? true,
            text: s.textOverlay?.text || s.textBubble || '',
          },
        };
      }
      return s;
    });

    setStickers(updated);

    // Re-process image with updated text overlay
    const targetStickers = applyStyleToAll
      ? updated
      : updated.filter((s) => s.id === stickerId);

    for (const st of targetStickers) {
      if (!st.rawImageUrl) continue;
      try {
        const procRes = await fetch('/api/process-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: st.rawImageUrl,
            type: 'sticker',
            threshold: 240,
            strokeThickness: config.whiteStrokeThickness,
            textOverlay: st.textOverlay,
          }),
        });

        if (procRes.ok) {
          const procData = await procRes.json();
          setStickers((prev) =>
            prev.map((item) =>
              item.id === st.id
                ? { ...item, transparentImageUrl: procData.transparentImageUrl }
                : item
            )
          );
        }
      } catch (err) {
        console.error('Error updating text on sticker:', err);
      }
    }
  };

  // Change White Stroke Thickness across all stickers
  const handleChangeStrokeThickness = async (
    thickness: 'none' | 'thin' | 'medium' | 'thick'
  ) => {
    setConfig((prev) => ({ ...prev, whiteStrokeThickness: thickness }));

    for (const sticker of stickers) {
      if (!sticker.rawImageUrl) continue;

      try {
        const procRes = await fetch('/api/process-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: sticker.rawImageUrl,
            type: 'sticker',
            threshold: 240,
            strokeThickness: thickness,
            textOverlay: sticker.textOverlay,
          }),
        });

        if (procRes.ok) {
          const procData = await procRes.json();
          setStickers((prev) =>
            prev.map((s) =>
              s.id === sticker.id
                ? { ...s, transparentImageUrl: procData.transparentImageUrl }
                : s
            )
          );
        }
      } catch (e) {
        console.error('Error re-applying stroke:', e);
      }
    }
  };

  // Regenerate a single sticker
  const handleRegenerateSticker = async (id: number) => {
    const target = stickers.find((s) => s.id === id);
    if (!target) return;

    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'generating', error: undefined } : s))
    );

    try {
      const genRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: target.prompt,
          id: target.id,
          filename: target.filename,
          label: target.label,
          textBubble: target.textBubble,
          emotionKey: target.emotionKey,
          engine: config.imageEngine,
        }),
      });

      if (genRes.status === 429) {
        const errJson = await genRes.json().catch(() => ({}));
        const waitSec = errJson.retrySeconds || 45;
        for (let c = waitSec; c >= 1; c--) {
          setStickers((prev) =>
            prev.map((s) => (s.id === id ? { ...s, status: 'cooldown', cooldownSeconds: c } : s))
          );
          await sleep(1000);
        }
        return handleRegenerateSticker(id); // auto-retry after countdown
      }

      if (!genRes.ok) {
        const errJson = await genRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Regeneration failed');
      }

      const genData = await genRes.json();
      const rawBase64 = genData.imageBase64;

      setStickers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'processing', rawImageUrl: rawBase64 } : s))
      );

      const procRes = await fetch('/api/process-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: rawBase64,
          type: 'sticker',
          threshold: 240,
          strokeThickness: config.whiteStrokeThickness,
          textOverlay: target.textOverlay,
        }),
      });

      let transparentUrl = rawBase64;
      if (procRes.ok) {
        const procData = await procRes.json();
        transparentUrl = procData.transparentImageUrl;
      }

      setStickers((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: 'ready',
                rawImageUrl: rawBase64,
                transparentImageUrl: transparentUrl,
                isFallback: genData.isFallback,
                modelUsed: genData.modelUsed,
              }
            : s
        )
      );
    } catch (err: any) {
      setStickers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'error', error: err.message } : s))
      );
    }
  };

  // Re-apply background removal with adjusted threshold across all stickers
  const handleBatchProcessBackgrounds = async (threshold: number) => {
    for (const sticker of stickers) {
      if (!sticker.rawImageUrl) continue;

      setStickers((prev) =>
        prev.map((s) => (s.id === sticker.id ? { ...s, status: 'processing' } : s))
      );

      try {
        const procRes = await fetch('/api/process-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: sticker.rawImageUrl,
            type: 'sticker',
            threshold,
            strokeThickness: config.whiteStrokeThickness,
            textOverlay: sticker.textOverlay,
          }),
        });

        if (procRes.ok) {
          const procData = await procRes.json();
          setStickers((prev) =>
            prev.map((s) =>
              s.id === sticker.id
                ? { ...s, status: 'ready', transparentImageUrl: procData.transparentImageUrl }
                : s
            )
          );
        }
      } catch (e) {
        console.error('Error re-processing sticker:', e);
      }
    }
  };

  // Download ZIP with complete metadata manifest & JSON
  const handleDownloadZip = async () => {
    try {
      const sanitizedName = (config.concept.slice(0, 24) || 'LINE_Sticker_Pack')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadStickerZip(
        {
          characterName: sanitizedName,
          stickers,
          metadata,
          mainImageBase64,
          tabImageBase64,
        },
        `${sanitizedName}_line_stickers.zip`
      );
    } catch (err: any) {
      console.error('ZIP download error:', err);
      alert('Failed to generate ZIP. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FA]">
      {/* App Header */}
      <Header
        liffState={liff}
        onOpenGuide={() => setIsGuideModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8">
        {/* Step Navigation Bar */}
        <div className="mb-6 flex items-center justify-between">
          {currentStep === 'generation' ? (
            <button
              onClick={() => setCurrentStep('input')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-line transition px-3 py-1.5 rounded-xl hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Character Form</span>
            </button>
          ) : (
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Step 1 of 2: Character Conception
            </div>
          )}

          {currentStep === 'generation' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-line-dark bg-line-light px-3 py-1 rounded-full border border-line/20">
                Step 2 of 2: Rendering & Customization
              </span>
            </div>
          )}
        </div>

        {/* Step Views */}
        {currentStep === 'input' ? (
          <StepCharacterInput
            config={config}
            onChangeConfig={handleUpdateConfig}
            onSubmit={handleGeneratePrompts}
            isLoading={isGeneratingPrompts}
          />
        ) : (
          <StepGeneration
            stickers={stickers}
            characterName={config.concept.slice(0, 30)}
            isGenerating={isGeneratingImages}
            imageEngine={config.imageEngine}
            whiteStrokeThickness={config.whiteStrokeThickness}
            onChangeStrokeThickness={handleChangeStrokeThickness}
            onRegenerateSticker={handleRegenerateSticker}
            onBatchProcessBackgrounds={handleBatchProcessBackgrounds}
            onDownloadZip={handleDownloadZip}
            onOpenChatSimulator={(stk) => {
              setChatInitialSticker(stk);
              setIsChatSimulatorOpen(true);
            }}
            onOpenGuide={() => setIsGuideModalOpen(true)}
            onOpenMetadataModal={() => setIsMetadataModalOpen(true)}
            onEditText={(stk) => setEditingTextSticker(stk)}
            mainImageBase64={mainImageBase64}
            tabImageBase64={tabImageBase64}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 bg-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} LINE Sticker AI Generator. Built with Google AI Studio (Gemini & Imagen) + LINE LIFF.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="hover:text-line font-medium transition"
            >
              LINE Creators Rules
            </button>
            <button
              onClick={() => setIsMetadataModalOpen(true)}
              className="hover:text-line font-medium transition"
            >
              Creator Copy Sheet
            </button>
            <a
              href="https://creator.line.me/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-line font-medium transition"
            >
              LINE Creators Market
            </a>
          </div>
        </div>
      </footer>

      {/* Prompt Review Modal */}
      <PromptReviewModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        masterDescription={masterDescription}
        stickers={stickers}
        onUpdateSticker={handleUpdateSticker}
        onStartGeneration={handleStartGeneration}
      />

      {/* Realistic LINE Chat Simulator */}
      <ChatSimulator
        isOpen={isChatSimulatorOpen}
        onClose={() => setIsChatSimulatorOpen(false)}
        stickers={stickers}
        initialSticker={chatInitialSticker}
        characterName={config.concept.slice(0, 20)}
      />

      {/* LINE Creators Market Submission Guide Modal */}
      <LineMarketGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* LINE Metadata Copy-Paste Sheet Modal */}
      <LineMetadataModal
        isOpen={isMetadataModalOpen}
        onClose={() => setIsMetadataModalOpen(false)}
        metadata={metadata}
        stickers={stickers}
      />

      {/* Typography & Thai Text Overlay Editor Modal */}
      <TextOverlayEditorModal
        isOpen={!!editingTextSticker}
        onClose={() => setEditingTextSticker(null)}
        sticker={editingTextSticker}
        onSave={handleSaveTextOverlay}
      />
    </div>
  );
}
