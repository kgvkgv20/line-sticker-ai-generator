'use client';

import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Eye, Sparkles, Type, Clock, Play } from 'lucide-react';
import { StickerItem } from '@/types/sticker';

interface StickerCardProps {
  sticker: StickerItem;
  viewMode: 'transparent' | 'original';
  onRegenerate: (id: number) => void;
  onPreviewInChat: (sticker: StickerItem) => void;
  onEditText: (sticker: StickerItem) => void;
}

export const StickerCard: React.FC<StickerCardProps> = ({
  sticker,
  viewMode,
  onRegenerate,
  onPreviewInChat,
  onEditText,
}) => {
  const displayImage =
    viewMode === 'transparent'
      ? sticker.transparentImageUrl || sticker.rawImageUrl
      : sticker.rawImageUrl || sticker.transparentImageUrl;

  const isCompleted = sticker.status === 'ready' && !!displayImage;
  const isGenerating = sticker.status === 'generating';
  const isProcessing = sticker.status === 'processing';
  const isError = sticker.status === 'error';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition">
      {/* Card Header */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold text-gray-700 bg-white px-1.5 py-0.5 rounded border border-gray-200">
            {sticker.filename}
          </span>
          <span className="font-bold text-gray-800 truncate max-w-[80px]">
            {sticker.label}
          </span>
        </div>

        {/* Status Pill */}
        <div>
          {isCompleted && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                sticker.isFallback
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}
              title={sticker.modelUsed || 'AI Generated'}
            >
              <CheckCircle2 className={`w-3 h-3 ${sticker.isFallback ? 'text-amber-600' : 'text-emerald-600'}`} />
              {sticker.isFallback
                ? 'Preview'
                : sticker.modelUsed === 'flux-1-schnell'
                ? 'FLUX.1 AI'
                : 'Gemini AI'}
            </span>
          )}
          {sticker.status === 'cooldown' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
              <Clock className="w-3 h-3 text-amber-600" />
              รอคิว {sticker.cooldownSeconds || 45}s
            </span>
          )}
          {isGenerating && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
              <div className="w-2.5 h-2.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Rendering
            </span>
          )}
          {isProcessing && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              <div className="w-2.5 h-2.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              Processing
            </span>
          )}
          {isError && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
              <AlertCircle className="w-3 h-3 text-red-600" />
              Failed
            </span>
          )}
          {sticker.status === 'idle' && (
            <span className="text-[10px] font-semibold text-gray-400">
              Queued
            </span>
          )}
        </div>
      </div>

      {/* Image Display Area with Checkered Pattern for Transparency */}
      <div className="relative aspect-square w-full flex items-center justify-center p-3 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] bg-slate-50/60 overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={sticker.label}
            className="max-h-full max-w-full object-contain filter drop-shadow-sm transition group-hover:scale-105 duration-300"
          />
        ) : (
          <div className="text-center p-4">
            {sticker.status === 'cooldown' ? (
              <div className="space-y-2 text-center">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm mx-auto animate-bounce">
                  ⏳
                </div>
                <p className="text-xs font-bold text-amber-800">
                  รอคิวเซิร์ฟเวอร์ฟรี
                </p>
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100/90 rounded-full text-amber-900 font-mono font-bold text-xs border border-amber-300/60">
                  <span>เหลืออีก</span>
                  <span className="text-amber-700 font-black text-sm">{sticker.cooldownSeconds || 45}</span>
                  <span>วินาที</span>
                </div>
                <p className="text-[10px] text-gray-400">
                  ระบบจะสร้างภาพ AI ให้อัตโนมัติเมื่อครบเวลา
                </p>
              </div>
            ) : isGenerating ? (
              <div className="space-y-2">
                <div className="w-8 h-8 border-3 border-line border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[11px] text-gray-500 font-medium">Generating with AI...</p>
              </div>
            ) : isError ? (
              <div className="space-y-2 text-center">
                <AlertCircle className="w-7 h-7 text-red-400 mx-auto" />
                <p className="text-[11px] text-red-600 font-medium px-2">
                  {sticker.error || 'Generation failed'}
                </p>
                <button
                  onClick={() => onRegenerate(sticker.id)}
                  className="text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-center">
                <Sparkles className="w-8 h-8 mx-auto text-gray-300 stroke-1" />
                <p className="text-[11px] font-medium text-gray-400">Waiting for generation</p>
                <button
                  onClick={() => onRegenerate(sticker.id)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-line bg-line/10 hover:bg-line hover:text-white px-2.5 py-1 rounded-lg transition border border-line/20"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>สร้างรูปนี้ทันที</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Hover overlay actions */}
        {isCompleted && (
          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 backdrop-blur-[2px] p-2">
            <button
              onClick={() => onEditText(sticker)}
              className="p-1.5 px-2 bg-white text-gray-800 rounded-xl hover:bg-emerald-500 hover:text-white transition shadow-lg text-[11px] font-bold flex items-center gap-1"
              title="Edit Thai/English Text"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text</span>
            </button>
            <button
              onClick={() => onPreviewInChat(sticker)}
              className="p-1.5 px-2 bg-white text-gray-800 rounded-xl hover:bg-line hover:text-white transition shadow-lg text-[11px] font-bold flex items-center gap-1"
              title="Test in LINE Chat"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
            <button
              onClick={() => onRegenerate(sticker.id)}
              className="p-1.5 px-2 bg-white text-gray-800 rounded-xl hover:bg-blue-600 hover:text-white transition shadow-lg text-[11px] font-bold flex items-center gap-1"
              title="Regenerate this sticker"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1 min-w-0">
          {sticker.textOverlay?.enabled && sticker.textOverlay.text ? (
            <span className="font-bold text-gray-800 truncate font-mali">
              "{sticker.textOverlay.text}"
            </span>
          ) : (
            <span className="text-gray-500 truncate">
              {sticker.label}
            </span>
          )}
        </div>
        <button
          onClick={() => onEditText(sticker)}
          className="text-[10px] text-line-dark font-bold hover:underline shrink-0 ml-1"
        >
          Edit Text
        </button>
      </div>
    </div>
  );
};
