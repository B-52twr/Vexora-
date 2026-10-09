import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { ApplePayBadge, MadaBadge, VisaBadge, MastercardBadge, KNetBadge } from './BrandLogos';
import { STORE_CONFIG } from '../utils/storeConfig';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenTracker: () => void;
}

export function Footer({ onOpenAdmin, onOpenTracker }: FooterProps) {
  return (
    <footer className="bg-[#06040E] border-t border-purple-500/20 py-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-purple-500/15">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-900/60 border border-purple-500/30 flex items-center justify-center">
              <Lock className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <span className="text-base font-black text-white font-mono tracking-wider">
                {STORE_CONFIG.storeName}
              </span>
              <p className="text-[11px] text-slate-400">
                منصة بيع الاشتراكات الرقمية الآمنة · الكويت وكافة دول الخليج العربي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <ApplePayBadge />
            <MadaBadge />
            <VisaBadge />
            <MastercardBadge />
            <KNetBadge />
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={onOpenTracker}
              type="button"
              className="text-purple-300 hover:text-white transition-colors cursor-pointer"
            >
              تتبع الطلبات
            </button>
            <span>·</span>
            <button
              onClick={onOpenAdmin}
              type="button"
              className="text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>دخول الأونر (Owner)</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} منصة VAULT-X للتجارة الرقمية.
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>نظام دفع مشفر 256-Bit SSL · خالي من جمع البطاقات محلياً</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
