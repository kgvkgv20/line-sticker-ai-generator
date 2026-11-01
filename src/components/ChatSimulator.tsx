'use client';

import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  Search,
  Menu,
  Smile,
  Send,
  Plus,
  Mic,
  Camera,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { StickerItem } from '@/types/sticker';

interface ChatSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  stickers: StickerItem[];
  initialSticker?: StickerItem;
  characterName: string;
}

interface ChatMessage {
  id: string;
  sender: 'friend' | 'me';
  type: 'text' | 'sticker';
  text?: string;
  stickerUrl?: string;
  time: string;
}

export const ChatSimulator: React.FC<ChatSimulatorProps> = ({
  isOpen,
  onClose,
  stickers,
  initialSticker,
  characterName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const list: ChatMessage[] = [
      {
        id: '1',
        sender: 'friend',
        type: 'text',
        text: 'Hey! Did you finish designing that new LINE sticker pack?',
        time: '19:40',
      },
    ];
    if (initialSticker && (initialSticker.transparentImageUrl || initialSticker.rawImageUrl)) {
      list.push({
        id: '2',
        sender: 'me',
        type: 'sticker',
        stickerUrl: initialSticker.transparentImageUrl || initialSticker.rawImageUrl,
        time: '19:41',
      });
    }
    return list;
  });

  const [activeTab, setActiveTab] = useState<'stickers' | 'keyboard'>('stickers');

  if (!isOpen) return null;

  const handleSendSticker = (sticker: StickerItem) => {
    const url = sticker.transparentImageUrl || sticker.rawImageUrl;
    if (!url) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'me',
        type: 'sticker',
        stickerUrl: url,
        time: timeStr,
      },
    ]);
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        sender: 'friend',
        type: 'text',
        text: 'Show me your stickers!',
        time: '19:42',
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[36px] max-w-sm w-full h-[680px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border-4 border-gray-800 relative">
        {/* Phone Notch / Speaker Island */}
        <div className="h-6 bg-black flex items-center justify-center relative">
          <div className="w-20 h-4 bg-gray-900 rounded-full" />
        </div>

        {/* LINE Chat Header */}
        <div className="bg-[#1E2B37] text-white px-3 py-2.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm leading-tight truncate max-w-[140px]">
                  {characterName || 'LINE Friends'}
                </h4>
                <span className="text-[10px] bg-line px-1.5 py-0.2 rounded-full font-bold">
                  2
                </span>
              </div>
              <p className="text-[10px] text-gray-400">LINE Sticker Preview Room</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={clearChat} className="text-[11px] text-gray-300 hover:text-white px-2 py-0.5 rounded bg-white/10">
              Clear
            </button>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LINE Chat Message Canvas (Authentic Chat Wallpaper #849EB0) */}
        <div className="flex-1 bg-[#849EB0] p-4 overflow-y-auto space-y-3 flex flex-col">
          {/* Date separator */}
          <div className="text-center my-1">
            <span className="text-[10px] font-semibold text-white/90 bg-black/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
              Today
            </span>
          </div>

          {messages.map((msg) => {
            if (msg.sender === 'friend') {
              return (
                <div key={msg.id} className="flex items-end gap-2 max-w-[85%] self-start">
                  <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                    B
                  </div>
                  <div className="space-y-1">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2 text-xs text-gray-800 shadow-sm leading-relaxed">
                      {msg.text}
                    </div>
                  </div>
                  <span className="text-[9px] text-white/80 pb-0.5 shrink-0">{msg.time}</span>
                </div>
              );
            }

            // User messages
            return (
              <div key={msg.id} className="flex items-end gap-1.5 max-w-[85%] self-end flex-row-reverse">
                {msg.type === 'sticker' ? (
                  <div className="relative group">
                    <img
                      src={msg.stickerUrl}
                      alt="Sticker"
                      className="w-36 h-36 object-contain filter drop-shadow-md transition hover:scale-105 duration-200"
                    />
                  </div>
                ) : (
                  <div className="bg-[#A0E75A] text-gray-900 rounded-2xl rounded-tr-sm px-3.5 py-2 text-xs shadow-sm font-medium">
                    {msg.text}
                  </div>
                )}
                <div className="flex flex-col items-end pb-0.5 shrink-0">
                  <span className="text-[9px] text-white/90 font-medium">Read</span>
                  <span className="text-[9px] text-white/80">{msg.time}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat Input Bar */}
        <div className="bg-[#F6F6F6] border-t border-gray-200 px-3 py-2 flex items-center gap-2">
          <button className="text-gray-500 hover:text-line p-1">
            <Plus className="w-5 h-5" />
          </button>
          <button className="text-gray-500 hover:text-line p-1">
            <Camera className="w-5 h-5" />
          </button>
          <button className="text-gray-500 hover:text-line p-1">
            <ImageIcon className="w-5 h-5" />
          </button>

          <div className="flex-1 bg-white rounded-full px-3 py-1.5 border border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-400 select-none">Send a sticker below...</span>
            <Smile className="w-4 h-4 text-line" />
          </div>

          <button className="text-gray-500 hover:text-line p-1">
            <Mic className="w-5 h-5" />
          </button>
        </div>

        {/* Sticker Keyboard Drawer */}
        <div className="bg-[#ECECED] border-t border-gray-300 p-2 h-44 overflow-y-auto">
          <div className="flex items-center justify-between px-2 pb-1.5 border-b border-gray-300 text-[11px] font-bold text-gray-600">
            <span>Tap any sticker to send:</span>
            <span className="text-[10px] text-line-dark font-medium">Transparent PNG Preview</span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            {stickers.map((s) => {
              const url = s.transparentImageUrl || s.rawImageUrl;
              const isReady = !!url;

              return (
                <button
                  key={s.id}
                  disabled={!isReady}
                  onClick={() => handleSendSticker(s)}
                  className={`p-1.5 rounded-xl hover:bg-white transition flex flex-col items-center justify-center relative group active:scale-95 ${
                    isReady ? 'cursor-pointer' : 'opacity-40 pointer-events-none'
                  }`}
                  title={s.label}
                >
                  {isReady ? (
                    <img
                      src={url}
                      alt={s.label}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-200 animate-pulse" />
                  )}
                  <span className="text-[9px] text-gray-600 truncate max-w-full mt-0.5 font-medium">
                    {s.textBubble || s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
