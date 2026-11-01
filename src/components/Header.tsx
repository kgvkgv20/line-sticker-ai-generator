'use client';

import React from 'react';
import { Sparkles, HelpCircle, ShieldCheck, ExternalLink, Smartphone, Scissors } from 'lucide-react';
import { LiffState } from '@/types/sticker';

export type AppTab = 'ai-generator' | 'studio';

interface HeaderProps {
  liffState: LiffState;
  onOpenGuide: () => void;
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  liffState,
  onOpenGuide,
  activeTab,
  onChangeTab,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-line flex items-center justify-center shadow-md shadow-line/20 shrink-0">
            <span className="text-white font-black text-lg tracking-tight">L</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-gray-900 text-base leading-tight tracking-tight">
                LINE Sticker <span className="text-line">AI & Studio</span>
              </h1>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-line/10 text-line-dark border border-line/20 hidden sm:inline-block">
                LIFF App
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium hidden sm:block">
              AI Generator & LINE Creators Market Packager
            </p>
          </div>
        </div>

        {/* Center Navigation Pills (AI Generator vs Sticker Studio) */}
        <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200/80">
          <button
            onClick={() => onChangeTab('ai-generator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'ai-generator'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-line" />
            <span className="hidden xs:inline">AI Generator</span>
          </button>

          <button
            onClick={() => onChangeTab('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'studio'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sticker Studio</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-[9px] font-black text-emerald-800">
              NEW
            </span>
          </button>
        </div>

        {/* User profile / LIFF status */}
        <div className="flex items-center gap-2">
          {/* Environment Pill */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
            {liffState.isInClient ? (
              <>
                <Smartphone className="w-3 h-3 text-line" />
                <span>Inside LINE App</span>
              </>
            ) : liffState.isMock ? (
              <>
                <ShieldCheck className="w-3 h-3 text-amber-500" />
                <span>Browser Sandbox</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-3 h-3 text-blue-500" />
                <span>External Browser</span>
              </>
            )}
          </div>

          {/* User Profile Avatar */}
          {liffState.profile && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-gray-200">
              {liffState.profile.pictureUrl ? (
                <img
                  src={liffState.profile.pictureUrl}
                  alt={liffState.profile.displayName}
                  className="w-7 h-7 rounded-full border border-line/30 object-cover shadow-sm"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-700">
                  {liffState.profile.displayName?.slice(0, 1) || 'U'}
                </div>
              )}
              <span className="text-xs font-semibold text-gray-800 max-w-[80px] truncate hidden md:inline">
                {liffState.profile.displayName}
              </span>
            </div>
          )}

          {/* Guide Button */}
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition border border-gray-200"
            title="LINE Creators Market Guidelines"
          >
            <HelpCircle className="w-3.5 h-3.5 text-line" />
            <span className="hidden sm:inline">LINE Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
