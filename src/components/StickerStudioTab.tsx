'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Scissors,
  Download,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Eye,
  Settings2,
  Star,
  Bookmark,
  FileCheck,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { StickerItem, LineMarketMetadata } from '@/types/sticker';
import { downloadStickerZip } from '@/lib/zipGenerator';

export interface StudioSticker {
  id: string;
  filename: string; // e.g. "01.png"
  label: string;
  rawUrl: string; // original uploaded image
  processedUrl?: string; // transparent die-cut PNG
  status: 'idle' | 'processing' | 'ready' | 'error';
  error?: string;
  width?: number;
  height?: number;
  byteSize?: number;
  isMain?: boolean;
  isTab?: boolean;
  showOriginal?: boolean;
}

interface StickerStudioTabProps {
  onOpenChatSimulator: (stickers: StickerItem[]) => void;
  onOpenGuide: () => void;
}

export const StickerStudioTab: React.FC<StickerStudioTabProps> = ({
  onOpenChatSimulator,
  onOpenGuide,
}) => {
  // Main list of stickers
  const [stickers, setStickers] = useState<StudioSticker[]>([]);
  const [mainStickerId, setMainStickerId] = useState<string | null>(null);
  const [tabStickerId, setTabStickerId] = useState<string | null>(null);

  // Settings
  const [threshold, setThreshold] = useState<number>(220); // 200 - 245
  const [extraStroke, setExtraStroke] = useState<'none' | 'thin' | 'medium' | 'thick'>('none');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Pack Metadata
  const [packTitleTh, setPackTitleTh] = useState<string>('นากน้อยจอมป่วน (Otter Meme)');
  const [packTitleEn, setPackTitleEn] = useState<string>('Derpy Otter Daily Life');
  const [authorName, setAuthorName] = useState<string>('LINE Sticker Studio');

  // Processing & UI state
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [isPackaging, setIsPackaging] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process a single image through /api/clean-and-format
  const processImage = async (
    rawBase64: string,
    type: 'sticker' | 'main' | 'tab' = 'sticker',
    customThreshold = threshold,
    customStroke = extraStroke
  ) => {
    const res = await fetch('/api/clean-and-format', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: rawBase64,
        type,
        threshold: customThreshold,
        addExtraStroke: customStroke,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to process image');
    }

    return await res.json();
  };

  // Handle uploading files from device
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith('image/') || f.name.match(/\.(png|jpe?g|webp)$/i)
    );

    if (fileArray.length === 0) return;

    const newItems: StudioSticker[] = [];
    const startIndex = stickers.length;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const filename = `${String(startIndex + i + 1).padStart(2, '0')}.png`;
      const base64 = await readFileAsBase64(file);

      newItems.push({
        id: `stk-${Date.now()}-${startIndex + i}`,
        filename,
        label: file.name.replace(/\.[^/.]+$/, ''),
        rawUrl: base64,
        status: 'idle',
      });
    }

    const updated = [...stickers, ...newItems];
    setStickers(updated);

    // Auto-select first sticker as main and tab if none set
    if (!mainStickerId && updated.length > 0) setMainStickerId(updated[0].id);
    if (!tabStickerId && updated.length > 0) setTabStickerId(updated[0].id);

    // Automatically trigger processing for newly added stickers
    processBatchStickers(newItems, updated);
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Quick-load the 3 sample Otter Stickers uploaded by user
  const handleLoadOtterSamples = async () => {
    const samples = [
      { name: 'ปั่นงานอยู่ (Otter Work)', path: '/samples/otter_01_work.jpg' },
      { name: 'สาธุ (Otter Pray)', path: '/samples/otter_02_pray.jpg' },
      { name: 'กำลังไป! (Otter Run)', path: '/samples/otter_03_run.jpg' },
    ];

    const newItems: StudioSticker[] = [];
    const startIndex = stickers.length;

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      try {
        const res = await fetch(s.path);
        const blob = await res.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        newItems.push({
          id: `sample-${Date.now()}-${i}`,
          filename: `${String(startIndex + i + 1).padStart(2, '0')}.png`,
          label: s.name,
          rawUrl: base64,
          status: 'idle',
        });
      } catch (e) {
        console.error('Failed to load sample:', s.name, e);
      }
    }

    if (newItems.length > 0) {
      const updated = [...stickers, ...newItems];
      setStickers(updated);
      if (!mainStickerId) setMainStickerId(updated[0].id);
      if (!tabStickerId) setTabStickerId(updated[0].id);

      processBatchStickers(newItems, updated);
    }
  };

  // Batch process list of stickers
  const processBatchStickers = async (
    targetItems: StudioSticker[],
    allStickers = stickers
  ) => {
    setIsProcessingBatch(true);
    setProcessedCount(0);

    let currentList = [...allStickers];

    for (let i = 0; i < targetItems.length; i++) {
      const item = targetItems[i];

      // Set to processing
      currentList = currentList.map((s) =>
        s.id === item.id ? { ...s, status: 'processing', error: undefined } : s
      );
      setStickers(currentList);

      try {
        const res = await processImage(item.rawUrl, 'sticker', threshold, extraStroke);
        currentList = currentList.map((s) =>
          s.id === item.id
            ? {
                ...s,
                status: 'ready',
                processedUrl: res.transparentImageUrl,
                width: res.width,
                height: res.height,
                byteSize: res.byteSize,
              }
            : s
        );
        setStickers(currentList);
      } catch (err: any) {
        currentList = currentList.map((s) =>
          s.id === item.id
            ? { ...s, status: 'error', error: err.message || 'Error processing' }
            : s
        );
        setStickers(currentList);
      }

      setProcessedCount(i + 1);
    }

    setIsProcessingBatch(false);
  };

  // Re-process a single sticker
  const handleReprocessSingle = async (item: StudioSticker) => {
    setStickers((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, status: 'processing', error: undefined } : s))
    );

    try {
      const res = await processImage(item.rawUrl, 'sticker', threshold, extraStroke);
      setStickers((prev) =>
        prev.map((s) =>
          s.id === item.id
            ? {
                ...s,
                status: 'ready',
                processedUrl: res.transparentImageUrl,
                width: res.width,
                height: res.height,
                byteSize: res.byteSize,
              }
            : s
        )
      );
    } catch (err: any) {
      setStickers((prev) =>
        prev.map((s) =>
          s.id === item.id ? { ...s, status: 'error', error: err.message } : s
        )
      );
    }
  };

  // Delete a sticker
  const handleDeleteSticker = (id: string) => {
    const remaining = stickers.filter((s) => s.id !== id);
    // Renumber filenames
    const renumbered = remaining.map((s, idx) => ({
      ...s,
      filename: `${String(idx + 1).padStart(2, '0')}.png`,
    }));
    setStickers(renumbered);
    if (mainStickerId === id) setMainStickerId(renumbered[0]?.id || null);
    if (tabStickerId === id) setTabStickerId(renumbered[0]?.id || null);
  };

  // Reorder sticker left / right
  const handleMoveSticker = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stickers.length) return;

    const copy = [...stickers];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    // Renumber
    const renumbered = copy.map((s, idx) => ({
      ...s,
      filename: `${String(idx + 1).padStart(2, '0')}.png`,
    }));
    setStickers(renumbered);
  };

  // Prepare and Download the ready-to-sell LINE Sticker Pack (.ZIP)
  const handleDownloadPack = async () => {
    if (stickers.length === 0) return;

    setIsPackaging(true);

    try {
      // 1. Convert ready studio stickers into StickerItem format
      const validStickers: StickerItem[] = stickers.map((s, idx) => ({
        id: idx + 1,
        filename: s.filename,
        label: s.label || `Sticker ${idx + 1}`,
        emotionKey: 'studio',
        textBubble: '',
        prompt: 'User imported die-cut artwork',
        status: s.status,
        rawImageUrl: s.rawUrl,
        transparentImageUrl: s.processedUrl || s.rawUrl,
        width: s.width,
        height: s.height,
      }));

      // 2. Obtain / render main.png (240x240 px)
      const selectedMain =
        stickers.find((s) => s.id === mainStickerId) || stickers[0];
      let mainPngBase64 = '';
      if (selectedMain) {
        const mainRes = await processImage(selectedMain.rawUrl, 'main', threshold, extraStroke);
        mainPngBase64 = mainRes.transparentImageUrl;
      }

      // 3. Obtain / render tab.png (96x74 px)
      const selectedTab =
        stickers.find((s) => s.id === tabStickerId) || stickers[0];
      let tabPngBase64 = '';
      if (selectedTab) {
        const tabRes = await processImage(selectedTab.rawUrl, 'tab', threshold, extraStroke);
        tabPngBase64 = tabRes.transparentImageUrl;
      }

      // 4. Construct LINE Market Metadata
      const metadata: LineMarketMetadata = {
        title: {
          th: packTitleTh || 'ชุดสติกเกอร์น่ารัก',
          en: packTitleEn || 'Cute Sticker Pack',
          ja: 'かわいいスタンプセット',
        },
        description: {
          th: `${packTitleTh} สำหรับส่งในแชท LINE ใช้งานได้ทุกวัน ลายเส้นสวย คมชัด ไดคัทขอบขาวพร้อมใช้`,
          en: `${packTitleEn} for daily chats on LINE messenger! High-resolution transparent stickers.`,
          ja: '毎日のLINEトークを盛り上げる可愛いスタンプです！',
        },
        copyright: `© ${new Date().getFullYear()} ${authorName || 'Sticker Creator'}`,
        category: 'Characters',
        tagsBySticker: {},
      };

      await downloadStickerZip(
        {
          characterName: packTitleEn || 'LINE_Stickers',
          stickers: validStickers,
          metadata,
          mainImageBase64: mainPngBase64,
          tabImageBase64: tabPngBase64,
        },
        `${(packTitleEn || 'line_sticker_pack').toLowerCase().replace(/\s+/g, '_')}.zip`
      );
    } catch (e: any) {
      console.error('Failed to create pack:', e);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP: ' + (e.message || e));
    } finally {
      setIsPackaging(false);
    }
  };

  // Convert stickers to StickerItem list for Chat Simulator
  const handleOpenSimulator = () => {
    const readyItems: StickerItem[] = stickers
      .filter((s) => s.processedUrl || s.rawUrl)
      .map((s, idx) => ({
        id: idx + 1,
        filename: s.filename,
        label: s.label,
        emotionKey: 'studio',
        textBubble: '',
        prompt: '',
        status: 'ready',
        rawImageUrl: s.rawUrl,
        transparentImageUrl: s.processedUrl || s.rawUrl,
        width: s.width,
        height: s.height,
      }));

    if (readyItems.length === 0) {
      alert('กรุณารอให้ระบบประมวลผลตัดพื้นหลังอย่างน้อย 1 รูปก่อนเริ่มทดสอบในแชทครับ');
      return;
    }

    onOpenChatSimulator(readyItems);
  };

  // Compliance calculations
  const totalCount = stickers.length;
  const isLineValidCount = [8, 16, 24, 32, 40].includes(totalCount);
  const readyCount = stickers.filter((s) => s.status === 'ready').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-line text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Scissors className="w-80 h-80 -rotate-12" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-bold tracking-wide uppercase">
            <Scissors className="w-3.5 h-3.5" />
            <span>High-Precision Die-Cut & Auto-Format</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
            Sticker Studio (ตัดพื้นหลัง & จัดเตรียมขาย)
          </h2>

          <p className="text-emerald-50 text-sm leading-relaxed">
            มีภาพวาดหรือสติกเกอร์ที่วาดไว้อยู่แล้วใช่ไหม? อัปโหลดภาพเข้ามา ระบบจะใช้
            <strong> Boundary Flood-Fill</strong> ตัดพื้นหลังขาวและเงาออก 100%
            โดยไม่กินขอบขาวไดคัท คมชัดระดับ Lanczos3 พร้อมจัดขนาด Max 370×320 px (เลขคู่ + ขอบเซฟตี้ 10px) ให้ผ่านมาตรฐาน LINE Creators Market ทันที
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              onClick={handleLoadOtterSamples}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition shadow-sm active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>🦦 โหลดตัวอย่างรูปน้องนาก (3 รูปทดลองทันที)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-950/40 text-white font-bold text-xs hover:bg-emerald-950/60 transition backdrop-blur border border-white/20 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>อัปโหลดรูปภาพจากเครื่อง</span>
            </button>

            <button
              onClick={onOpenGuide}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/10 text-white font-medium text-xs hover:bg-white/20 transition backdrop-blur"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>เกณฑ์สเปก LINE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Dropzone & Quick Stats */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition ${
          isDragging
            ? 'border-line bg-line/5 ring-4 ring-line/10'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">
              ลากและวางรูปสติกเกอร์ที่นี่ หรือ{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-line hover:underline font-black"
              >
                เลือกไฟล์จากเครื่อง
              </button>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              รองรับไฟล์ PNG, JPG, JPEG, WEBP (เลือกได้ทีละหลายๆ รูปพร้อมกัน)
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold">
            <span>จำนวนที่ LINE กำหนดสำหรับ 1 ชุด:</span>
            <span className="font-bold text-gray-900">8, 16, 24, 32 หรือ 40 รูป</span>
          </div>
        </div>
      </div>

      {/* Main Content Area (Controls + Grid) */}
      {stickers.length > 0 && (
        <div className="space-y-6">
          {/* Action & Stats Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Left: Pack status summary */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-gray-900">
                  สติกเกอร์ในชุด: {totalCount} รูป
                </span>
                {isLineValidCount ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    จำนวนตรงตามสเปก LINE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    LINE แนะนำ 8, 16, 24, 32, 40 รูป (ยังดาวน์โหลดได้)
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-500 font-medium">
                (ไดคัทเสร็จแล้ว: <span className="font-bold text-emerald-600">{readyCount}</span>/{totalCount})
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                  showSettings
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>ตั้งค่าไดคัท ({threshold})</span>
              </button>

              <button
                onClick={() => processBatchStickers(stickers)}
                disabled={isProcessingBatch}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessingBatch ? 'animate-spin' : ''}`} />
                <span>{isProcessingBatch ? `กำลังไดคัท (${processedCount}/${totalCount})...` : 'ไดคัทใหม่ทั้งหมด'}</span>
              </button>

              <button
                onClick={handleOpenSimulator}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition border border-emerald-200"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>ทดสอบในแชท LINE</span>
              </button>

              <button
                onClick={handleDownloadPack}
                disabled={isPackaging || stickers.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-line hover:bg-line-dark text-white transition shadow-md shadow-line/20 disabled:opacity-50 active:scale-95"
              >
                <Download className={`w-4 h-4 ${isPackaging ? 'animate-bounce' : ''}`} />
                <span>{isPackaging ? 'กำลังรวมไฟล์ ZIP...' : 'ดาวน์โหลด ZIP พร้อมส่งขาย'}</span>
              </button>
            </div>
          </div>

          {/* Advanced Cutout Settings Panel */}
          {showSettings && (
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-gray-700" />
                  <span className="font-extrabold text-sm text-gray-800">
                    การตั้งค่าการตัดพื้นหลังและแพ็กเกจ (Cutout & Packaging Options)
                  </span>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  ปิด
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {/* 1. Shadow Threshold Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-gray-700">
                    <span>ความไวในการลบพื้นหลังขาว/เงา (Threshold):</span>
                    <span className="text-line font-black">{threshold}</span>
                  </div>
                  <input
                    type="range"
                    min="190"
                    max="245"
                    step="1"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full accent-line cursor-pointer"
                  />
                  <p className="text-[11px] text-gray-500">
                    ค่ามาตรฐาน 220: ตัดเงาจางๆ และพื้นหลังขาวออกเกลี้ยง 100% โดยคงขอบขาว Die-cut รอบตัวละครไว้คมกริบ
                  </p>
                </div>

                {/* 2. Extra Die-Cut Stroke */}
                <div className="space-y-2">
                  <span className="font-bold text-gray-700 block">
                    เพิ่มขอบขาวซ้อนทับ (Extra White Stroke):
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['none', 'thin', 'medium', 'thick'] as const).map((stroke) => (
                      <button
                        key={stroke}
                        onClick={() => setExtraStroke(stroke)}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[11px] text-center border transition capitalize ${
                          extraStroke === stroke
                            ? 'bg-line text-white border-line shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {stroke === 'none' ? 'None (มีอยู่แล้ว)' : stroke}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    ถ้าภาพวาดมีขอบขาวไดคัทอยู่แล้ว (เช่นรูปตัวอย่างน้องนาก) ให้เลือก <strong>None</strong>
                  </p>
                </div>

                {/* 3. Metadata Titles */}
                <div className="space-y-2">
                  <span className="font-bold text-gray-700 block">
                    ชื่อชุดสติกเกอร์ (สำหรับไฟล์ส่งขาย):
                  </span>
                  <input
                    type="text"
                    value={packTitleTh}
                    onChange={(e) => setPackTitleTh(e.target.value)}
                    placeholder="ชื่อภาษาไทย"
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-line/20 outline-none"
                  />
                  <input
                    type="text"
                    value={packTitleEn}
                    onChange={(e) => setPackTitleEn(e.target.value)}
                    placeholder="English Title"
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-line/20 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Store Cover (main.png) & Keyboard Tab (tab.png) Status Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Main Cover (240x240) */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 flex items-center gap-4 shadow-sm">
              <div className="w-16 h-16 rounded-xl bg-[repeating-conic-gradient(#f0f2f5_0%_25%,#ffffff_0%_50%)] bg-[length:12px_12px] border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                {stickers.find((s) => s.id === mainStickerId)?.processedUrl ||
                stickers[0]?.processedUrl ? (
                  <img
                    src={
                      stickers.find((s) => s.id === mainStickerId)?.processedUrl ||
                      stickers[0]?.processedUrl
                    }
                    alt="Main Cover"
                    className="w-14 h-14 object-contain"
                  />
                ) : (
                  <Star className="w-6 h-6 text-gray-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-900">main.png (Store Cover)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    240 × 240 px
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  เลือกจากสติกเกอร์ #{stickers.find((s) => s.id === mainStickerId)?.filename || '01.png'}
                </p>
                <div className="text-[10px] text-line font-bold mt-1">
                  ✓ จะถูกจัดขนาด 240×240 px อัตโนมัติเมื่อดาวน์โหลด ZIP
                </div>
              </div>
            </div>

            {/* Tab Icon (96x74) */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 flex items-center gap-4 shadow-sm">
              <div className="w-16 h-16 rounded-xl bg-[repeating-conic-gradient(#f0f2f5_0%_25%,#ffffff_0%_50%)] bg-[length:12px_12px] border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                {stickers.find((s) => s.id === tabStickerId)?.processedUrl ||
                stickers[0]?.processedUrl ? (
                  <img
                    src={
                      stickers.find((s) => s.id === tabStickerId)?.processedUrl ||
                      stickers[0]?.processedUrl
                    }
                    alt="Tab Icon"
                    className="w-12 h-10 object-contain"
                  />
                ) : (
                  <Bookmark className="w-6 h-6 text-gray-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-900">tab.png (Chat Tab Icon)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    96 × 74 px
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  เลือกจากสติกเกอร์ #{stickers.find((s) => s.id === tabStickerId)?.filename || '01.png'}
                </p>
                <div className="text-[10px] text-line font-bold mt-1">
                  ✓ จะถูกจัดขนาด 96×74 px อัตโนมัติเมื่อดาวน์โหลด ZIP
                </div>
              </div>
            </div>
          </div>

          {/* Grid of Sticker Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stickers.map((item, index) => {
              const isMain = item.id === mainStickerId;
              const isTab = item.id === tabStickerId;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-3 flex flex-col transition shadow-sm hover:shadow-md relative ${
                    isMain || isTab ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-gray-200'
                  }`}
                >
                  {/* Card Header: Filename & Actions */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black px-2 py-0.5 bg-gray-100 rounded-md text-gray-800">
                        {item.filename}
                      </span>
                      {isMain && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          Main
                        </span>
                      )}
                      {isTab && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          Tab
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setStickers((prev) =>
                            prev.map((s) =>
                              s.id === item.id ? { ...s, showOriginal: !s.showOriginal } : s
                            )
                          )
                        }
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                        title={item.showOriginal ? 'ดูผลลัพธ์ไดคัท' : 'ดูรูปต้นฉบับ'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSticker(item.id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="ลบสติกเกอร์นี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Image Display Area with Checkerboard */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[repeating-conic-gradient(#f0f2f5_0%_25%,#ffffff_0%_50%)] bg-[length:14px_14px] border border-gray-100 flex items-center justify-center p-2 group">
                    {item.status === 'processing' ? (
                      <div className="flex flex-col items-center gap-2 text-center p-4">
                        <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                        <span className="text-xs font-bold text-gray-600">กำลังไดคัท...</span>
                      </div>
                    ) : item.status === 'error' ? (
                      <div className="flex flex-col items-center gap-1.5 text-center p-3 text-red-600">
                        <AlertCircle className="w-6 h-6" />
                        <span className="text-xs font-bold">เกิดข้อผิดพลาด</span>
                        <span className="text-[10px] text-gray-500 line-clamp-2">{item.error}</span>
                        <button
                          onClick={() => handleReprocessSingle(item)}
                          className="mt-1 px-2 py-1 bg-red-50 hover:bg-red-100 rounded text-[11px] font-bold text-red-700"
                        >
                          ลองใหม่
                        </button>
                      </div>
                    ) : (
                      <>
                        <img
                          src={item.showOriginal ? item.rawUrl : item.processedUrl || item.rawUrl}
                          alt={item.label}
                          className="max-w-full max-h-full object-contain filter drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                        />

                        {/* View mode badge */}
                        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-semibold backdrop-blur">
                          {item.showOriginal ? 'ภาพต้นฉบับ' : 'ไดคัทขอบใส'}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Specification & Stats Pill */}
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                    {item.width && item.height ? (
                      <span className="font-bold text-emerald-700">
                        {item.width} × {item.height} px
                      </span>
                    ) : (
                      <span className="text-gray-400">ยังไม่ได้ไดคัท</span>
                    )}

                    {item.byteSize && (
                      <span className="text-gray-500 font-medium">
                        {(item.byteSize / 1024).toFixed(0)} KB
                      </span>
                    )}
                  </div>

                  {/* Card Controls */}
                  <div className="mt-2.5 grid grid-cols-4 gap-1">
                    <button
                      onClick={() => setMainStickerId(item.id)}
                      className={`py-1 rounded text-[10px] font-bold transition ${
                        isMain
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      title="ตั้งเป็นปกหลักร้านค้า (main.png)"
                    >
                      ★ Main
                    </button>

                    <button
                      onClick={() => setTabStickerId(item.id)}
                      className={`py-1 rounded text-[10px] font-bold transition ${
                        isTab
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      title="ตั้งเป็นไอคอนแป้นพิมพ์แชท (tab.png)"
                    >
                      📌 Tab
                    </button>

                    <button
                      onClick={() => handleMoveSticker(index, 'left')}
                      disabled={index === 0}
                      className="py-1 rounded text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30"
                      title="เลื่อนไปซ้าย"
                    >
                      ◀
                    </button>

                    <button
                      onClick={() => handleMoveSticker(index, 'right')}
                      disabled={index === stickers.length - 1}
                      className="py-1 rounded text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30"
                      title="เลื่อนไปขวา"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add More Card */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[260px] rounded-2xl border-2 border-dashed border-gray-200 hover:border-line hover:bg-line/5 transition flex flex-col items-center justify-center gap-2 p-4 text-gray-400 hover:text-line"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">เพิ่มรูปภาพสติกเกอร์</span>
            </button>
          </div>
        </div>
      )}

      {/* LINE Creators Market Submission Checklist Modal / Info */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm">
              มาตรฐานตรวจสอบความถูกต้อง (LINE Creators Market Compliance Checklist)
            </h3>
            <p className="text-xs text-gray-500">
              ทุกไฟล์ที่ดาวน์โหลดจากหน้านี้ ผ่านการคำนวณและปรับสเปกให้พร้อมอัปโหลดลงเว็บขาย creator.line.me ทันที
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-900 block">สติกเกอร์ (01.png - 40.png)</span>
              <p className="text-gray-600 text-[11px] mt-0.5">
                ขนาดสูงสุด 370 × 320 px (ต้องเป็นเลขคู่) พร้อมเว้นขอบว่างรอบรูปอย่างน้อย 10px ทุกด้าน
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-900 block">รูปหน้าปกหลัก (main.png)</span>
              <p className="text-gray-600 text-[11px] mt-0.5">
                ขนาดบังคับ 240 × 240 px ตรงเป๊ะ ใช้สำหรับหน้าแสดงผลใน Sticker Shop
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-900 block">ไอคอนแท็บแชท (tab.png)</span>
              <p className="text-gray-600 text-[11px] mt-0.5">
                ขนาดบังคับ 96 × 74 px พอดีช่องแป้นพิมพ์สติกเกอร์ในแอป LINE
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-900 block">ชนิดไฟล์ & โหมดสี</span>
              <p className="text-gray-600 text-[11px] mt-0.5">
                PNG โปร่งใส (RGBA), ความละเอียด Lanczos3 คมชัดเท่าเดิม, ขนาดไฟล์ไม่เกิน 1MB ต่อรูป
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-900 block">ชุดไฟล์ ZIP สำเร็จรูป</span>
              <p className="text-gray-600 text-[11px] mt-0.5">
                รวมไฟล์พร้อมไฟล์สรุปข้อความ <code>LINE_SUBMISSION_INFO.txt</code> สำหรับก็อปปี้ลงช่องกรอกใน creator.line.me
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-900 block">ขอบขาว Die-cut ชัดเจน</span>
              <p className="text-gray-600 text-[11px] mt-0.5">
                ระบบคงขอบขาวของภาพวาดไว้ ทำให้เห็นชัดเจนทั้งบนพื้นแชทสีขาว สีดำ (Dark Mode) และธีมสีต่างๆ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
