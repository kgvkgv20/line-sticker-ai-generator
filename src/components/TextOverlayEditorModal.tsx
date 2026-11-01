'use client';

import React, { useState } from 'react';
import { X, Type, Check, Sparkles, Sliders, Palette, MoveVertical } from 'lucide-react';
import { StickerItem, TextOverlayConfig, ThaiStickerFont } from '@/types/sticker';

interface TextOverlayEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sticker: StickerItem | null;
  onSave: (stickerId: number, overlayConfig: TextOverlayConfig, applyStyleToAll?: boolean) => void;
}

const PRESET_FONTS: { id: ThaiStickerFont; name: string; sample: string; className: string }[] = [
  { id: 'Mali', name: 'Mali (มะลิ)', sample: 'น่ารัก กวนๆ', className: 'font-mali' },
  { id: 'Itim', name: 'Itim (ไอติม)', sample: 'หัวกลม ละมุน', className: 'font-itim' },
  { id: 'Kanit', name: 'Kanit (คณิต)', sample: 'ชัดเจน อ่านง่าย', className: 'font-kanit' },
  { id: 'Mitr', name: 'Mitr (มิตร)', sample: 'เป็นกันเอง เรียบหรู', className: 'font-mitr' },
  { id: 'Chonburi', name: 'Chonburi (ชลบุรี)', sample: 'ป๊อปอาร์ต สะดุดตา', className: 'font-chonburi' },
];

const PRESET_COLORS = [
  { label: 'Coral Red', color: '#FF4757' },
  { label: 'Hot Pink', color: '#FF3385' },
  { label: 'Sunny Yellow', color: '#FFA502' },
  { label: 'LINE Green', color: '#06C755' },
  { label: 'Electric Blue', color: '#1E90FF' },
  { label: 'Pure White', color: '#FFFFFF' },
  { label: 'Deep Black', color: '#2F3542' },
];

export const TextOverlayEditorModal: React.FC<TextOverlayEditorModalProps> = ({
  isOpen,
  onClose,
  sticker,
  onSave,
}) => {
  if (!isOpen || !sticker) return null;

  const currentOverlay: TextOverlayConfig = sticker.textOverlay || {
    enabled: true,
    text: sticker.textBubble || 'สวัสดี!',
    font: 'Mali',
    fontSize: 34,
    textColor: '#FF4757',
    strokeColor: '#FFFFFF',
    strokeWidth: 8,
    position: 'bottom',
  };

  const [enabled, setEnabled] = useState(currentOverlay.enabled);
  const [text, setText] = useState(currentOverlay.text);
  const [font, setFont] = useState<ThaiStickerFont>(currentOverlay.font);
  const [fontSize, setFontSize] = useState(currentOverlay.fontSize || 34);
  const [textColor, setTextColor] = useState(currentOverlay.textColor || '#FF4757');
  const [strokeColor, setStrokeColor] = useState(currentOverlay.strokeColor || '#FFFFFF');
  const [strokeWidth, setStrokeWidth] = useState(currentOverlay.strokeWidth || 8);
  const [position, setPosition] = useState<'top' | 'bottom' | 'center'>(currentOverlay.position || 'bottom');
  const [applyToAll, setApplyToAll] = useState(false);

  const handleSave = () => {
    onSave(
      sticker.id,
      {
        enabled,
        text,
        font,
        fontSize,
        textColor,
        strokeColor,
        strokeWidth,
        position,
      },
      applyToAll
    );
    onClose();
  };

  const fontClass = PRESET_FONTS.find((f) => f.id === font)?.className || 'font-mali';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-line-light/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-line flex items-center justify-center text-white shadow-md shadow-line/20">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
                Thai & English Typography Editor ({sticker.filename})
              </h3>
              <p className="text-xs text-gray-500">
                Custom cartoon fonts with thick outlines for extreme clarity in LINE chat.
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Live Preview Card */}
          <div className="bg-[#849EB0] rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-[220px] shadow-inner overflow-hidden">
            <span className="absolute top-2 left-3 text-[10px] font-bold text-white/80 bg-black/20 px-2 py-0.5 rounded-full">
              Live Preview in LINE Chat
            </span>

            {/* Sticker Image */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              {sticker.rawImageUrl || sticker.transparentImageUrl ? (
                <img
                  src={sticker.transparentImageUrl || sticker.rawImageUrl}
                  alt={sticker.label}
                  className="max-h-full max-w-full object-contain filter drop-shadow-md"
                />
              ) : (
                <div className="w-28 h-28 bg-white/30 rounded-2xl animate-pulse" />
              )}

              {/* Live Overlay Text */}
              {enabled && text.trim() && (
                <div
                  className={`absolute left-0 right-0 text-center pointer-events-none select-none ${
                    position === 'top' ? 'top-1' : position === 'center' ? 'top-1/2 -translate-y-1/2' : 'bottom-0'
                  }`}
                >
                  <span
                    className={`inline-block font-extrabold tracking-tight px-3 py-1 ${fontClass}`}
                    style={{
                      fontSize: `${fontSize * 0.75}px`,
                      color: textColor,
                      WebkitTextStroke: `${strokeWidth * 0.75}px ${strokeColor}`,
                      paintOrder: 'stroke fill',
                      filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
                    }}
                  >
                    {text}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Toggle Enable Text */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
            <div>
              <p className="text-xs font-bold text-gray-800">Display Text on Sticker</p>
              <p className="text-[11px] text-gray-500">Add cute Thai words, emotions, or greetings.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-line"></div>
            </label>
          </div>

          {enabled && (
            <div className="space-y-4">
              {/* Text Input */}
              <div>
                <label className="text-xs font-bold text-gray-800 block mb-1.5">
                  Sticker Text (พิมพ์ข้อความภาษาไทย/อังกฤษ):
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. สวัสดี, ขอบคุณนะ, 555+, สู้ๆ, ฝันดี"
                  className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-line focus:ring-2 focus:ring-line/20 outline-none text-base font-bold text-gray-800 ${fontClass}`}
                />
              </div>

              {/* Font Selector */}
              <div>
                <label className="text-xs font-bold text-gray-800 block mb-2">
                  Select Cartoon Font (เลือกฟอนต์การ์ตูน):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_FONTS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFont(f.id)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        font === f.id
                          ? 'border-line bg-line-light text-gray-900 ring-2 ring-line/20'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <p className={`text-sm font-bold ${f.className}`}>{f.name}</p>
                      <p className={`text-xs text-gray-500 mt-0.5 ${f.className}`}>{f.sample}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color & Stroke */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Text Color */}
                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-line" />
                    <span>Text Fill Color</span>
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => setTextColor(c.color)}
                        className={`w-7 h-7 rounded-full border-2 transition ${
                          textColor === c.color ? 'border-line scale-110 shadow-sm' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={c.label}
                      />
                    ))}
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-7 h-7 rounded-full cursor-pointer border border-gray-200"
                    />
                  </div>
                </div>

                {/* Stroke Color */}
                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-1.5">
                    Outline Stroke Color
                  </label>
                  <div className="flex gap-2">
                    {[
                      { label: 'White Stroke', color: '#FFFFFF' },
                      { label: 'Dark Stroke', color: '#1E272E' },
                    ].map((st) => (
                      <button
                        key={st.color}
                        type="button"
                        onClick={() => setStrokeColor(st.color)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition ${
                          strokeColor === st.color
                            ? 'bg-line text-white border-line shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Position & Size */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-1.5 flex items-center gap-1">
                    <MoveVertical className="w-3.5 h-3.5 text-line" />
                    <span>Position</span>
                  </label>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    {(['top', 'center', 'bottom'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setPosition(pos)}
                        className={`flex-1 py-1 text-xs font-bold rounded-lg capitalize transition ${
                          position === pos ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-800 mb-1.5">
                    <span>Font Size</span>
                    <span>{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="46"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-line"
                  />
                </div>
              </div>

              {/* Apply to all stickers checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <input
                    type="checkbox"
                    checked={applyToAll}
                    onChange={(e) => setApplyToAll(e.target.checked)}
                    className="w-4 h-4 text-line rounded focus:ring-line"
                  />
                  <span className="text-xs font-bold text-amber-900">
                    Apply this Font, Color & Style to ALL stickers in the pack
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-line hover:bg-line-dark text-white text-xs font-extrabold shadow-md shadow-line/20 transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Text Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
