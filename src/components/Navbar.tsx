import React from 'react';
import { ShieldCheck, Sparkles, Search, ShieldAlert } from 'lucide-react';
import { MadaBadge, ApplePayBadge, VisaBadge, MastercardBadge, KNetBadge } from './BrandLogos';
import { STORE_CONFIG } from '../utils/storeConfig';

interface NavbarProps {
  onOpenAdmin: () => void;
  onOpenTracker: () => void;
  totalStock: number;
}

export function Navbar({ onOpenAdmin, onOpenTracker, totalStock }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#090714]/90 backdrop-blur-xl border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 p-0.5 shadow-lg shadow-purple-900/40">
              <div className="w-full h-full bg-[#0E0A22] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wider text-white font-mono">
                  {STORE_CONFIG.storeName}
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-950 border border-purple-500/30 text-purple-300 font-mono">
                  TAP LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                متجر الاشتراكات الرقمية المعتمد · تسليم فوري مشفر 100%
              </p>
            </div>
          </div>

          {/* Center: Payment marks for instant trust */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/40 border border-purple-500/20">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium ml-1">بوابات دفع رسمية:</span>
            <div className="flex items-center gap-1.5">
              <ApplePayBadge />
              <MadaBadge />
              <VisaBadge />
              <MastercardBadge />
              <KNetBadge />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Track Order Button */}
            <button
              onClick={onOpenTracker}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-950/50 hover:bg-purple-900/50 border border-purple-500/30 text-purple-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer hover:border-purple-400"
            >
              <Search className="w-4 h-4 text-purple-400" />
              <span>تتبع الطلب</span>
            </button>

            {/* Owner Admin Button (Protected by Owner Security PIN) */}
            <button
              onClick={onOpenAdmin}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-700/80 to-indigo-700/80 hover:from-purple-600 hover:to-indigo-600 border border-purple-400/40 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-950/60 transition-all cursor-pointer"
              title="لوحة تحكم المالك الأساسي (Owner Only)"
            >
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">لوحة الإدارة</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono">
                OWNER
              </span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
