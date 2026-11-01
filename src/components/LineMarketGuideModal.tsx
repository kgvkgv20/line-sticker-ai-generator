'use client';

import React from 'react';
import { X, ExternalLink, CheckCircle2, AlertTriangle, FileText, DollarSign, Image as ImageIcon } from 'lucide-react';
import { LINE_STICKER_SPEC } from '@/lib/lineStickerPresets';

interface LineMarketGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LineMarketGuideModal: React.FC<LineMarketGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-line-light/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-line flex items-center justify-center text-white shadow-md shadow-line/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg">
                LINE Creators Market Submission Guide
              </h3>
              <p className="text-xs text-gray-500">
                Official specifications & checklist to get your stickers approved fast.
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

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-700 leading-relaxed">
          {/* Required Files Table */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-line" />
              Required Files & Dimensions
            </h4>
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-3">File Name</th>
                    <th className="p-3">Dimensions</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Our App Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-3 font-mono font-bold text-line-dark">01.png - 08.png</td>
                    <td className="p-3">W 370 × H 320 px (Max)</td>
                    <td className="p-3">Sticker illustrations</td>
                    <td className="p-3 text-emerald-600 font-semibold">✓ Auto-sized & padded</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-line-dark">main.png</td>
                    <td className="p-3">W 240 × H 240 px</td>
                    <td className="p-3">Sticker store package cover</td>
                    <td className="p-3 text-emerald-600 font-semibold">✓ Auto-generated</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-line-dark">tab.png</td>
                    <td className="p-3">W 96 × H 74 px</td>
                    <td className="p-3">Chat room tab icon</td>
                    <td className="p-3 text-emerald-600 font-semibold">✓ Auto-generated</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Critical Guidelines */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-line" />
              Technical Acceptance Criteria
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-line mt-1.5 shrink-0" />
                <span><strong>Transparent PNG:</strong> Backgrounds MUST be completely transparent (alpha channel). Our automatic AI cutout engine handles this.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-line mt-1.5 shrink-0" />
                <span><strong>10px Margin:</strong> Leave about 10px of transparent margin around the illustration so the sticker doesn't clip when rendered on phones.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-line mt-1.5 shrink-0" />
                <span><strong>Even Numbers:</strong> Width and height of sticker images must be even pixel values (e.g. 370 x 320 px).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-line mt-1.5 shrink-0" />
                <span><strong>Color Mode:</strong> RGB color mode (not CMYK).</span>
              </li>
            </ul>
          </div>

          {/* Submission Steps */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-line" />
              How to Submit Your Downloaded ZIP
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
              <li>Log in to <a href="https://creator.line.me/" target="_blank" rel="noreferrer" className="text-line-dark font-bold underline">LINE Creators Market</a> with your LINE account.</li>
              <li>Click <strong>New Submission</strong> &gt; <strong>Stickers</strong>.</li>
              <li>Enter Title & Description in English and your target languages.</li>
              <li>Under "Sticker Images", click <strong>Upload ZIP file</strong> and select the ZIP downloaded from this app.</li>
              <li>Set your price tier (e.g., 50 Coins / 35 THB / $0.99).</li>
              <li>Click <strong>Request Review</strong> (review typically takes 1–3 business days).</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <a
            href="https://creator.line.me/"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-line-dark hover:underline flex items-center gap-1"
          >
            <span>Visit LINE Creators Market</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-line hover:bg-line-dark text-white text-xs font-bold transition shadow-sm"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
