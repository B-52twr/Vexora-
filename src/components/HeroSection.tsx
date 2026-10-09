import React from 'react';
import { ShieldCheck, Zap, Lock, ArrowDown, CheckCircle2 } from 'lucide-react';
import { ApplePayBadge, MadaBadge, VisaBadge, MastercardBadge, KNetBadge } from './BrandLogos';
import heroVaultImg from '../assets/images/hero_cyber_vault_1791364245656.jpg';

interface HeroSectionProps {
  onBrowseClick: () => void;
  availableStock: number;
}

export function HeroSection({ onBrowseClick, availableStock }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-8 pb-14 lg:py-16">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Main Hero Copy (Col 1-7) */}
          <div className="lg:col-span-7 flex flex-col items-start text-right">
            
            {/* Live Trust Notice */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-200 text-xs font-medium mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>نظام أمان مصرفي 100% · تسليم مشفر ومباشر</span>
              <span className="text-purple-400 font-mono text-[11px] font-bold">({availableStock} كود متاح)</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-white leading-[1.25] tracking-tight mb-5 font-display max-w-2xl text-balance">
              اشتراكاتك الرقمية الفاخرة
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300">
                بأمان بنكي حقيقي وضمان ذهبي كامل
              </span>
            </h1>

            {/* Descriptive Body */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mb-8">
              المنصة المعتمدة لبيع وإدارة اشتراكات <strong className="text-white">نتفلكس، شاهد VIP، أو إس إن (OSN+)، وديسكورد نايترو</strong>. بوابات دفع إلكترونية معتمدة بنظام التحقق البنكي (3D Secure & OTP)، وتحويل بنكي رسمي مع مراجعة الإيصالات.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-10 w-full sm:w-auto">
              <button
                onClick={onBrowseClick}
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-purple-900/40 hover:shadow-purple-700/60 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>تصفح الباقات الرسمية والأسعار</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-950/40 text-purple-200 text-xs sm:text-sm font-semibold border border-purple-500/25">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>منع البيانات الوهمية 100%</span>
              </div>
            </div>

            {/* Value Props & Payment Badges */}
            <div className="pt-6 border-t border-purple-500/15 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Zap className="w-4 h-4 text-amber-400" />
                  تسليم آلي معتمد
                </span>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  حسابات رسمية ومحمية
                </span>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  Zero-Card Storage
                </span>
              </div>

              {/* Verified Payment Marks */}
              <div className="flex items-center gap-2 flex-wrap">
                <ApplePayBadge />
                <MadaBadge />
                <VisaBadge />
                <MastercardBadge />
                <KNetBadge />
              </div>
            </div>

          </div>

          {/* Hero Visual Card (Col 8-12) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl p-1 bg-gradient-to-b from-purple-500/30 via-indigo-500/15 to-transparent shadow-2xl shadow-purple-950/60 backdrop-blur-md">
              <div className="relative rounded-[14px] overflow-hidden bg-[#0F0B21] border border-purple-500/20">
                
                <div className="relative aspect-video sm:aspect-[16/10] overflow-hidden">
                  <img
                    src={heroVaultImg}
                    alt="VAULT-X Digital Vault"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E0A20] via-black/20 to-transparent" />
                  
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-md bg-black/70 text-emerald-400 border border-emerald-500/40 text-[11px] font-mono font-bold backdrop-blur-md flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SECURE VAULT GATEWAY</span>
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-xs text-slate-200 bg-black/60 p-2.5 rounded-lg border border-white/10 backdrop-blur-md">
                    <div>
                      <span className="block font-bold text-white">تشفير خوارزمي عالي المستوى</span>
                      <span className="text-[10px] text-purple-300">تأكيد سداد مشفر بروابط Webhook آمنة</span>
                    </div>
                    <span className="text-emerald-400 font-bold font-mono text-xs">256-BIT SSL</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
