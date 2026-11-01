'use client';

import React, { useState } from 'react';
import {
  Download,
  MessageCircle,
  Sparkles,
  Layers,
  CheckCircle,
  HelpCircle,
  Sliders,
  RefreshCw,
  FolderArchive,
  Share2,
  FileText,
  Type,
} from 'lucide-react';
import { StickerItem } from '@/types/sticker';
import { StickerCard } from './StickerCard';
import { shareStickerWithFriends } from '@/lib/liff';

interface StepGenerationProps {
  stickers: StickerItem[];
  characterName: string;
  isGenerating: boolean;
  imageEngine?: 'flux' | 'gemini';
  whiteStrokeThickness: 'none' | 'thin' | 'medium' | 'thick';
  onChangeStrokeThickness: (thickness: 'none' | 'thin' | 'medium' | 'thick') => void;
  onRegenerateSticker: (id: number) => void;
  onBatchProcessBackgrounds: (threshold: number) => void;
  onDownloadZip: () => void;
  onOpenChatSimulator: (initialSticker?: StickerItem) => void;
  onOpenGuide: () => void;
  onOpenMetadataModal: () => void;
  onEditText: (sticker: StickerItem) => void;
  mainImageBase64?: string;
  tabImageBase64?: string;
}

export const StepGeneration: React.FC<StepGenerationProps> = ({
  stickers,
  characterName,
  isGenerating,
  imageEngine = 'flux',
  whiteStrokeThickness,
  onChangeStrokeThickness,
  onRegenerateSticker,
  onBatchProcessBackgrounds,
  onDownloadZip,
  onOpenChatSimulator,
  onOpenGuide,
  onOpenMetadataModal,
  onEditText,
  mainImageBase64,
  tabImageBase64,
}) => {
  const [viewMode, setViewMode] = useState<'transparent' | 'original'>('transparent');
  const [threshold, setThreshold] = useState<number>(240);
  const [showSlider, setShowSlider] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  const completedCount = stickers.filter((s) => s.status === 'ready' && !!s.transparentImageUrl).length;
  const totalCount = stickers.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = completedCount === totalCount && totalCount > 0;
  const hasFallbackSticker = stickers.some((s) => s.isFallback);

  const handleShare = async () => {
    const firstReady = stickers.find((s) => s.transparentImageUrl || s.rawImageUrl);
    if (!firstReady) return;
    setIsSharing(true);
    await shareStickerWithFriends(
      firstReady.transparentImageUrl || firstReady.rawImageUrl || '',
      characterName || 'My Custom LINE Sticker Pack'
    );
    setIsSharing(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Progress & Controls Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {characterName || 'LINE Sticker Pack'}
              </h2>
              {allCompleted && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Ready to Export
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isGenerating
                ? `Rendering sticker images with ${imageEngine === 'flux' ? '⚡ Free FLUX.1 AI Engine' : '🤖 gemini-2.5-flash-image'}... (${completedCount}/${totalCount})`
                : `All ${totalCount} stickers generated with ${imageEngine === 'flux' ? 'FLUX.1 AI' : 'Gemini 2.5 Flash'}, formatted & ready for LINE Creators Market.`}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenMetadataModal}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition border border-amber-200 shadow-sm"
              title="Copy Titles & Descriptions for LINE Creators Market"
            >
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Copy Creator Info</span>
            </button>

            <button
              onClick={() => onOpenChatSimulator()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-line" />
              <span>LINE Chat Test</span>
            </button>

            <button
              onClick={handleShare}
              disabled={isSharing || !allCompleted}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition border border-gray-200 disabled:opacity-40"
              title="Share via LINE Target Picker"
            >
              <Share2 className="w-4 h-4 text-line" />
              <span>Share to LINE</span>
            </button>

            <button
              onClick={onDownloadZip}
              disabled={completedCount === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-line hover:bg-line-dark text-white text-xs font-extrabold shadow-md shadow-line/20 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download ZIP ({completedCount} PNGs)</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-gray-600">
            <span>Generation & Formatting Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-line transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {hasFallbackSticker && (
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold flex items-center gap-2">
                <span>เชื่อมต่อโมเดล:</span>
                <span className="font-mono text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 font-semibold">
                  gemini-2.5-flash-image (Nano Banana)
                </span>
              </p>
              <p className="text-amber-800 leading-relaxed">
                ระบบได้ส่งคำสั่งไปยัง <strong>gemini-2.5-flash-image</strong> ผ่าน Google AI Studio Interactions เรียบร้อยแล้ว แต่เนื่องจากบัญชี Free Tier กำหนดโควต้าสร้างภาพเป็น <code>0/0 RPD</code> ระบบจึงสลับมาใช้ภาพตัวอย่างพร้อมขอบขาวไดคัทและข้อความไทยให้คุณทดสอบฟังก์ชันได้ครบ 100% หากต้องการให้ AI วาดภาพจริง ให้คลิกปุ่ม <strong>"Set up billing"</strong> ที่มุมบนซ้ายในหน้า <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline font-bold text-amber-950 hover:text-black">Google AI Studio</a> ครับ
              </p>
            </div>
          </div>
        )}

        {/* View & Tuning Toolbar */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Background View Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">View:</span>
            <div className="flex bg-gray-100 p-0.5 rounded-xl">
              <button
                onClick={() => setViewMode('transparent')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  viewMode === 'transparent'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Transparent PNG
              </button>
              <button
                onClick={() => setViewMode('original')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  viewMode === 'original'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Raw Render
              </button>
            </div>
          </div>

          {/* White Stroke Thickness Quick Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">Sticker Border:</span>
            <div className="flex bg-gray-100 p-0.5 rounded-xl">
              {(['none', 'thin', 'medium', 'thick'] as const).map((stroke) => (
                <button
                  key={stroke}
                  onClick={() => onChangeStrokeThickness(stroke)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-bold transition text-[11px] ${
                    whiteStrokeThickness === stroke
                      ? 'bg-line text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {stroke}
                </button>
              ))}
            </div>
          </div>

          {/* Threshold Tuning Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSlider(!showSlider)}
              className="flex items-center gap-1 text-gray-600 hover:text-line font-medium"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Sensitivity ({threshold})</span>
            </button>

            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1 text-gray-500 hover:text-line font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>LINE Rules</span>
            </button>
          </div>
        </div>

        {/* Sensitivity slider drawer */}
        {showSlider && (
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 animate-in fade-in duration-150">
            <div className="flex justify-between text-xs font-semibold text-gray-700">
              <span>White Background Removal Threshold (Default: 240)</span>
              <span className="font-mono text-line-dark font-bold">{threshold}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-gray-400">Strict (220)</span>
              <input
                type="range"
                min="210"
                max="252"
                step="1"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="flex-1 accent-line"
              />
              <span className="text-[10px] text-gray-400">Aggressive (252)</span>
              <button
                onClick={() => onBatchProcessBackgrounds(threshold)}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-line text-white hover:bg-line-dark transition"
              >
                Re-apply All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Required LINE Creators Package Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Cover (main.png) */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center p-2 relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:8px_8px]">
            {mainImageBase64 ? (
              <img
                src={mainImageBase64}
                alt="Main"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-[10px] text-gray-400 font-bold">240×240</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-xs bg-line-light text-line-dark px-1.5 py-0.5 rounded">
                main.png
              </span>
              <span className="text-xs font-bold text-gray-900">Main Cover</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">LINE Store cover thumbnail (240 x 240 px)</p>
            <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-600">✓ Auto-sized</span>
          </div>
        </div>

        {/* Tab Icon (tab.png) */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center p-2 relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:8px_8px]">
            {tabImageBase64 ? (
              <img
                src={tabImageBase64}
                alt="Tab"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-[10px] text-gray-400 font-bold">96×74</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-xs bg-line-light text-line-dark px-1.5 py-0.5 rounded">
                tab.png
              </span>
              <span className="text-xs font-bold text-gray-900">Chat Tab Icon</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">Sticker keyboard tab (96 x 74 px)</p>
            <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-600">✓ Auto-sized</span>
          </div>
        </div>

        {/* LINE Submission Copy Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-100/30 to-line/5 rounded-2xl p-4 border border-amber-300/40 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-extrabold text-gray-900">
              Creator Copy-Paste Sheet
            </span>
          </div>
          <p className="text-[11px] text-gray-600 leading-tight">
            Titles & descriptions in <span className="font-bold text-gray-800">EN, TH, JA</span> + search keywords ready.
          </p>
          <button
            onClick={onOpenMetadataModal}
            className="mt-2 text-xs font-bold text-amber-800 hover:underline text-left flex items-center gap-1"
          >
            <span>Open Copy-Paste Sheet →</span>
          </button>
        </div>
      </div>

      {/* Main Stickers Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="text-sm font-bold text-gray-800">
              Sticker Files ({stickers.length} Items, Max 370 × 320 px)
            </h3>
            <p className="text-[11px] text-gray-400">Hover or tap on any sticker to edit Thai text or test in LINE chat</p>
          </div>
          <span className="text-xs font-bold text-line-dark">Even Dimensions & 10px Margin OK</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {stickers.map((sticker) => (
            <StickerCard
              key={sticker.id}
              sticker={sticker}
              viewMode={viewMode}
              onRegenerate={onRegenerateSticker}
              onPreviewInChat={(item) => onOpenChatSimulator(item)}
              onEditText={(item) => onEditText(item)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
