'use client';

import React from 'react';
import { Sparkles, HelpCircle, ShieldCheck, ExternalLink, Smartphone } from 'lucide-react';
import { LiffState } from '@/types/sticker';

interface HeaderProps {
  liffState: LiffState;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ liffState, onOpenGuide }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-line flex items-center justify-center shadow-md shadow-line/20">
            <span className="text-white font-black text-xl tracking-tight">L</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-gray-900 text-lg leading-tight tracking-tight">
                LINE Sticker <span className="text-line">AI</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-line/10 text-line-dark border border-line/20">
                LIFF App
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Powered by Google AI Studio (Gemini & Imagen)
            </p>
          </div>
        </div>

        {/* User profile / LIFF status */}
        <div className="flex items-center gap-2">
          {/* Environment Pill */}
          <div className="hidden sm:flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
            {liffState.isInClient ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-line" />
                <span>Inside LINE App</span>
              </>
            ) : liffState.isMock ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Browser Sandbox</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                <span>External Browser</span>
              </>
            )}
          </div>

          {/* User Profile Avatar */}
          {liffState.profile && (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              {liffState.profile.pictureUrl ? (
                <img
                  src={liffState.profile.pictureUrl}
                  alt={liffState.profile.displayName}
                  className="w-8 h-8 rounded-full border border-line/30 object-cover shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700">
                  {liffState.profile.displayName?.slice(0, 1) || 'U'}
                </div>
              )}
              <span className="text-xs font-semibold text-gray-800 max-w-[100px] truncate hidden md:inline">
                {liffState.profile.displayName}
              </span>
            </div>
          )}

          {/* Guide Button */}
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition border border-gray-200"
            title="LINE Creators Market Guidelines"
          >
            <HelpCircle className="w-4 h-4 text-line" />
            <span className="hidden sm:inline">LINE Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
