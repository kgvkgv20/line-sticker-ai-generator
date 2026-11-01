'use client';

import React, { useState } from 'react';
import { X, Sparkles, Edit3, Check, ArrowRight, Palette, Layers } from 'lucide-react';
import { StickerItem } from '@/types/sticker';

interface PromptReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterDescription: string;
  stickers: StickerItem[];
  onUpdateSticker: (id: number, updates: Partial<StickerItem>) => void;
  onStartGeneration: () => void;
}

export const PromptReviewModal: React.FC<PromptReviewModalProps> = ({
  isOpen,
  onClose,
  masterDescription,
  stickers,
  onUpdateSticker,
  onStartGeneration,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-line-light/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-line flex items-center justify-center text-white shadow-md shadow-line/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg">
                Review & Customize Sticker Prompts
              </h3>
              <p className="text-xs text-gray-500">
                Gemini generated {stickers.length} consistent sticker prompts. Verify or edit them before rendering.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Master Character Anchor */}
          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
              <Palette className="w-4 h-4 text-line-dark" />
              <span>Master Character Visual Anchor (Consistency Blueprint)</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed font-medium">
              {masterDescription}
            </p>
          </div>

          {/* Stickers Prompts List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 px-1">
              <span>Sticker Prompts ({stickers.length} items)</span>
              <span>Click edit icon to tweak prompt</span>
            </div>

            {stickers.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-line-dark bg-line-light px-2 py-0.5 rounded-lg border border-line/20">
                        {item.filename}
                      </span>
                      <span className="text-xs font-bold text-gray-800">{item.label}</span>
                      {item.textBubble && (
                        <span className="text-[11px] font-semibold text-gray-600 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                          Text: "{item.textBubble}"
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingId(isEditing ? null : item.id)}
                      className="text-xs font-semibold text-gray-500 hover:text-line flex items-center gap-1"
                    >
                      {isEditing ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-line" />
                          <span>Done</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 mt-2">
                      <textarea
                        value={item.prompt}
                        onChange={(e) => onUpdateSticker(item.id, { prompt: e.target.value })}
                        rows={3}
                        className="w-full text-xs p-3 rounded-xl border border-line bg-white outline-none focus:ring-2 focus:ring-line/20"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold text-gray-600">Text Banner:</label>
                        <input
                          type="text"
                          value={item.textBubble}
                          onChange={(e) => onUpdateSticker(item.id, { textBubble: e.target.value })}
                          className="flex-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 bg-white"
                          placeholder="e.g. Hello!, ขอบคุณ, OK!"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-100 transition"
          >
            Back to Edit
          </button>
          <button
            onClick={() => {
              onClose();
              onStartGeneration();
            }}
            className="px-6 py-2.5 rounded-xl bg-line hover:bg-line-dark text-white text-xs font-extrabold shadow-md shadow-line/20 transition flex items-center gap-2"
          >
            <span>Generate {stickers.length} Images with Google Imagen</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
