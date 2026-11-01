'use client';

import React, { useState, useRef } from 'react';
import { Sparkles, Image as ImageIcon, X, Shuffle, Check, Languages, Smile, Flame, Laugh, HeartHandshake, Briefcase, ThumbsUp } from 'lucide-react';
import { ArtStyle, CharacterConfig, StickerLanguage, EmotionCategory } from '@/types/sticker';
import { ART_STYLES, EMOTION_PRESETS, SAMPLE_IDEAS, PACK_PRESETS } from '@/lib/lineStickerPresets';

interface StepCharacterInputProps {
  config: CharacterConfig;
  onChangeConfig: (newConfig: Partial<CharacterConfig>) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const StepCharacterInput: React.FC<StepCharacterInputProps> = ({
  config,
  onChangeConfig,
  onSubmit,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'meme' | 'greeting' | 'daily' | 'sarcastic'>('meme');

  const handleRandomize = () => {
    const randomIndex = Math.floor(Math.random() * SAMPLE_IDEAS.length);
    onChangeConfig({ concept: SAMPLE_IDEAS[randomIndex] });
  };

  const handleSelectStyle = (styleId: ArtStyle) => {
    onChangeConfig({ artStyle: styleId });
    if (styleId === 'realistic-meme' && (!config.concept || config.concept.includes('cat wearing glasses'))) {
      onChangeConfig({
        concept: 'A hilarious golden labrador retriever with derpy meme expressions and funny faces',
        selectedEmotionIds: PACK_PRESETS.meme16,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be under 5MB.');
      return;
    }

    setImageError(null);
    const reader = new FileReader();
    reader.onload = () => {
      onChangeConfig({ referenceImageBase64: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    onChangeConfig({ referenceImageBase64: undefined });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleEmotion = (id: string) => {
    const current = config.selectedEmotionIds;
    if (current.includes(id)) {
      if (current.length <= 4) {
        alert('You must select at least 4 emotions for a sticker pack.');
        return;
      }
      onChangeConfig({ selectedEmotionIds: current.filter((item) => item !== id) });
    } else {
      if (current.length >= 32) {
        alert('Maximum 32 stickers per generation batch.');
        return;
      }
      onChangeConfig({ selectedEmotionIds: [...current, id] });
    }
  };

  const filteredEmotions = EMOTION_PRESETS.filter((e) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'meme') return e.category === 'meme';
    if (activeCategory === 'greeting') return e.category === 'greeting' || e.category === 'positive';
    if (activeCategory === 'daily') return e.category === 'daily';
    if (activeCategory === 'sarcastic') return e.category === 'sarcastic' || e.category === 'reaction';
    return true;
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-line-light via-emerald-50 to-white rounded-3xl p-6 sm:p-8 border border-line/20 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-line text-white text-xs font-bold uppercase tracking-wider mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            AI LINE Sticker Creator & Meme Studio
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Create Your Custom LINE Sticker Set in Minutes
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mt-2 leading-relaxed">
            Generate viral <span className="font-bold text-gray-900">สัตว์หน้ามีม สติหลุด (Realistic Pet Memes)</span> หรือการ์ตูน Chibi น่ารัก พร้อมระบบไดคัทขอบขาว ใส่ข้อความภาษาไทย และส่งขายบน LINE Creators Market ได้ทันที!
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        {/* Character Concept Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span>1. Character Concept (ระบุตัวละครที่ต้องการ)</span>
              <span className="text-line text-xs font-medium bg-line-light px-2 py-0.5 rounded-full">Required</span>
            </label>
            <button
              type="button"
              onClick={handleRandomize}
              className="text-xs font-semibold text-line-dark hover:text-line flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-line-light transition"
            >
              <Shuffle className="w-3.5 h-3.5" />
              สุ่มไอเดีย (Surprise Me)
            </button>
          </div>
          <textarea
            value={config.concept}
            onChange={(e) => onChangeConfig({ concept: e.target.value })}
            placeholder="e.g. เจ้าหมาลาบราดอร์สีครีมหน้ามีมกวนๆ สติหลุด, คาปิบาร่าหน้าชิลล์, แมวส้มอ้วนใส่แว่น..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-line focus:ring-4 focus:ring-line/10 outline-none text-gray-800 text-sm transition placeholder:text-gray-400 font-medium"
          />
        </div>

        {/* Reference Image Upload */}
        <div>
          <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
            <span>2. Reference Image (รูปต้นฉบับสัตว์เลี้ยง / รูปจริง)</span>
            <span className="text-gray-400 text-xs font-normal">(อัปโหลดเพื่อล็อกหน้าตา & สีขนให้เหมือนจริง)</span>
          </label>

          {config.referenceImageBase64 ? (
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-200">
              <img
                src={config.referenceImageBase64}
                alt="Reference"
                className="w-16 h-16 rounded-xl object-cover border border-gray-300"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">Custom Reference Image Uploaded</p>
                <p className="text-[11px] text-gray-500">Gemini & Imagen จะล็อกหน้าตา สีขน และจุดเด่นของสัตว์เลี้ยงตัวนี้ให้ตรงกันทุกรูป</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 hover:border-line/60 rounded-2xl p-5 text-center cursor-pointer transition hover:bg-line-light/30 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-line-light flex items-center justify-center mx-auto mb-2 text-gray-500 group-hover:text-line transition">
                <ImageIcon className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-gray-700">คลิกเพื่ออัปโหลดรูปหมา แมว หรือสัตว์เลี้ยงของคุณ</p>
              <p className="text-[11px] text-gray-400 mt-0.5">รองรับ PNG, JPG, WebP สูงสุด 5MB</p>
            </div>
          )}
          {imageError && <p className="text-xs text-red-500 mt-1">{imageError}</p>}
        </div>

        {/* Art Style Selector */}
        <div>
          <label className="text-sm font-bold text-gray-800 block mb-3">
            3. Choose Art Style (เลือกสไตล์สติกเกอร์)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ART_STYLES.map((style) => {
              const isSelected = config.artStyle === style.id;
              return (
                <div
                  key={style.id}
                  onClick={() => handleSelectStyle(style.id)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition relative ${
                    isSelected
                      ? 'border-line bg-line-light/40 shadow-sm ring-2 ring-line/20'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-900">{style.name}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600">
                      {style.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight line-clamp-2">
                    {style.description}
                  </p>
                  {isSelected && (
                    <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-line text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticker Language & White Stroke Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-2">
              <Languages className="w-4 h-4 text-line" />
              <span>Sticker Text Language (ภาษาข้อความ)</span>
            </label>
            <div className="flex gap-2">
              {[
                { id: 'th', label: 'Thai (ไทย)' },
                { id: 'en', label: 'English' },
                { id: 'ja', label: 'Japanese (日本語)' },
                { id: 'none', label: 'No Text' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => onChangeConfig({ language: lang.id as StickerLanguage })}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition ${
                    config.language === lang.id
                      ? 'bg-line text-white border-line shadow-sm font-bold'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-2">
              <Smile className="w-4 h-4 text-line" />
              <span>Die-Cut White Border (ขอบขาวสติกเกอร์)</span>
            </label>
            <div className="flex gap-2">
              {[
                { id: 'none', label: 'None' },
                { id: 'thin', label: 'Thin (4px)' },
                { id: 'medium', label: 'Medium (7px)' },
                { id: 'thick', label: 'Thick (11px)' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onChangeConfig({ whiteStrokeThickness: st.id as any })}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition ${
                    config.whiteStrokeThickness === st.id
                      ? 'bg-line text-white border-line shadow-sm font-bold'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">ช่วยให้สติกเกอร์เด่นชัดทั้งใน LINE Light Mode และ Dark Mode</p>
          </div>
        </div>

        {/* Emotion Preset Selection with Category Tabs */}
        <div className="pt-2 border-t border-gray-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span>4. Select Expressions (เลือกแอคชั่น & อารมณ์)</span>
                <span className="text-xs font-bold text-line-dark bg-line-light px-2.5 py-0.5 rounded-full border border-line/20">
                  เลือกแล้ว: {config.selectedEmotionIds.length} รูป
                </span>
              </label>
              <p className="text-xs text-gray-500">
                LINE Creators Market อนุญาตให้ส่งชุดละ 8, 16, 24, 32 หรือ 40 รูป
              </p>
            </div>

            {/* Quick Package Presets */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onChangeConfig({ selectedEmotionIds: PACK_PRESETS.meme16 })}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/60 transition shadow-xs flex items-center gap-1"
              >
                <span>🤪 ชุดมีมสติหลุด (16 ตัว)</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeConfig({ selectedEmotionIds: PACK_PRESETS.full24 })}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300/60 transition shadow-xs flex items-center gap-1"
              >
                <span>🔥 ขายดี (24 ตัว)</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeConfig({ selectedEmotionIds: PACK_PRESETS.standard8 })}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                มาตรฐาน (8)
              </button>
              <button
                type="button"
                onClick={() => onChangeConfig({ selectedEmotionIds: EMOTION_PRESETS.map((e) => e.id) })}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                ทั้งหมด ({EMOTION_PRESETS.length})
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'meme', label: '🤪 สายมีม สติหลุด', count: EMOTION_PRESETS.filter((e) => e.category === 'meme').length },
              { id: 'greeting', label: '👋 ทักทาย & เชียร์อัพ', count: EMOTION_PRESETS.filter((e) => e.category === 'greeting' || e.category === 'positive').length },
              { id: 'daily', label: '💼 ชีวิตประจำวัน & ทำงาน', count: EMOTION_PRESETS.filter((e) => e.category === 'daily').length },
              { id: 'sarcastic', label: '😒 กวนๆ ปั่นประสาท', count: EMOTION_PRESETS.filter((e) => e.category === 'sarcastic' || e.category === 'reaction').length },
              { id: 'all', label: '✨ ทั้งหมด', count: EMOTION_PRESETS.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeCategory === tab.id
                    ? 'bg-line text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === tab.id ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Emotions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto p-1">
            {filteredEmotions.map((emotion) => {
              const isSelected = config.selectedEmotionIds.includes(emotion.id);
              const previewText = emotion.textByLang[config.language] || emotion.label;

              return (
                <div
                  key={emotion.id}
                  onClick={() => toggleEmotion(emotion.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-2 ${
                    isSelected
                      ? 'border-line bg-line-light/50 text-gray-900 shadow-sm ring-1 ring-line/20'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600 opacity-60'
                  }`}
                >
                  <span className="text-xl shrink-0">{emotion.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{emotion.label}</p>
                    <p className="text-[10px] text-gray-500 truncate">{previewText}</p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded shrink-0 flex items-center justify-center text-[10px] ${
                      isSelected ? 'bg-line text-white' : 'border border-gray-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading || !config.concept.trim() || config.selectedEmotionIds.length === 0}
            className="w-full py-4 rounded-2xl bg-line hover:bg-line-dark active:scale-[0.99] text-white font-extrabold text-base shadow-lg shadow-line/25 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังออกแบบชุดสติกเกอร์และวิเคราะห์ Character Anchor...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>สร้างสติกเกอร์ {config.selectedEmotionIds.length} ท่าด้วย Google AI Studio</span>
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-gray-400 mt-2">
            Gemini จะออกแบบ Prompt ภาษาอังกฤษที่แม่นยำ พร้อมล็อกจุดเด่นของตัวละครให้เหมือนกันทั้งชุด {config.selectedEmotionIds.length} รูป
          </p>
        </div>
      </div>
    </div>
  );
};
