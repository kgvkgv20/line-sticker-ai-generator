'use client';

import React, { useState } from 'react';
import { X, Copy, Check, FileText, Globe, Sparkles, ExternalLink, Download } from 'lucide-react';
import { LineMarketMetadata, StickerItem } from '@/types/sticker';

interface LineMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: LineMarketMetadata;
  stickers: StickerItem[];
}

export const LineMetadataModal: React.FC<LineMetadataModalProps> = ({
  isOpen,
  onClose,
  metadata,
  stickers,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-line-light/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-line flex items-center justify-center text-white shadow-md shadow-line/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
                  LINE Creators Market Copy-Paste Sheet
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-line text-white">
                  3 Languages
                </span>
              </div>
              <p className="text-xs text-gray-500">
                AI-generated Titles, Descriptions & Search Tags ready to paste into creator.line.me
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-gray-700">
          {/* Quick Notice */}
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-line-dark shrink-0" />
              <span className="text-xs font-semibold text-emerald-900">
                Click any copy button to paste directly into the LINE Creators submission form!
              </span>
            </div>
            <a
              href="https://creator.line.me/"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-extrabold text-line-dark hover:underline flex items-center gap-1 shrink-0 ml-2"
            >
              <span>Open Creator</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Section 1: Titles */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-line" />
              <span>1. Sticker Titles (Max 40 chars)</span>
            </h4>

            {/* English Title */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">English (Required)</span>
                <p className="text-xs font-bold text-gray-900 truncate">{metadata.title?.en || 'Sticker Pack'}</p>
              </div>
              <button
                onClick={() => handleCopy(metadata.title?.en || '', 'title_en')}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-xs font-bold flex items-center gap-1 transition shrink-0"
              >
                {copiedKey === 'title_en' ? <Check className="w-3.5 h-3.5 text-line" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'title_en' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Thai Title */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Thai (ภาษาไทย)</span>
                <p className="text-xs font-bold text-gray-900 truncate">{metadata.title?.th || 'ชุดสติกเกอร์น่ารัก'}</p>
              </div>
              <button
                onClick={() => handleCopy(metadata.title?.th || '', 'title_th')}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-xs font-bold flex items-center gap-1 transition shrink-0"
              >
                {copiedKey === 'title_th' ? <Check className="w-3.5 h-3.5 text-line" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'title_th' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Japanese Title */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Japanese (日本語)</span>
                <p className="text-xs font-bold text-gray-900 truncate">{metadata.title?.ja || 'かわいいスタンプ'}</p>
              </div>
              <button
                onClick={() => handleCopy(metadata.title?.ja || '', 'title_ja')}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-xs font-bold flex items-center gap-1 transition shrink-0"
              >
                {copiedKey === 'title_ja' ? <Check className="w-3.5 h-3.5 text-line" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'title_ja' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Descriptions */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-line" />
              <span>2. Sticker Descriptions (Max 160 chars)</span>
            </h4>

            {/* English Desc */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">English (Required)</span>
                <p className="text-xs text-gray-800 line-clamp-2">{metadata.description?.en || 'Cute sticker pack for daily chat!'}</p>
              </div>
              <button
                onClick={() => handleCopy(metadata.description?.en || '', 'desc_en')}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-xs font-bold flex items-center gap-1 transition shrink-0"
              >
                {copiedKey === 'desc_en' ? <Check className="w-3.5 h-3.5 text-line" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'desc_en' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Thai Desc */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Thai (ภาษาไทย)</span>
                <p className="text-xs text-gray-800 line-clamp-2">{metadata.description?.th || 'สติกเกอร์น่ารักสดใส'}</p>
              </div>
              <button
                onClick={() => handleCopy(metadata.description?.th || '', 'desc_th')}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-xs font-bold flex items-center gap-1 transition shrink-0"
              >
                {copiedKey === 'desc_th' ? <Check className="w-3.5 h-3.5 text-line" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'desc_th' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Japanese Desc */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Japanese (日本語)</span>
                <p className="text-xs text-gray-800 line-clamp-2">{metadata.description?.ja || '毎日のトークに大活躍！'}</p>
              </div>
              <button
                onClick={() => handleCopy(metadata.description?.ja || '', 'desc_ja')}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-xs font-bold flex items-center gap-1 transition shrink-0"
              >
                {copiedKey === 'desc_ja' ? <Check className="w-3.5 h-3.5 text-line" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'desc_ja' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Section 3: Sticker Tags & Search Keywords */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h4 className="font-bold text-gray-900 text-sm">
              3. Search Keywords & Tags ({stickers.length} Stickers)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {stickers.map((s) => {
                const tags = metadata.tagsBySticker?.[s.filename] || [s.emotionKey, 'cute'];
                const tagStr = tags.join(', ');

                return (
                  <div key={s.id} className="p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-line-dark">{s.filename}</span>
                    <span className="text-gray-500 truncate max-w-[120px]">{tagStr}</span>
                    <button
                      onClick={() => handleCopy(tagStr, `tag_${s.filename}`)}
                      className="text-[11px] font-bold text-line-dark hover:underline ml-1"
                    >
                      {copiedKey === `tag_${s.filename}` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-line hover:bg-line-dark text-white text-xs font-extrabold shadow-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
