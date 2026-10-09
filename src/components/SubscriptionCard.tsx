import React, { useState } from 'react';
import { SubscriptionService, Plan } from '../types';
import { NetflixLogo, ShahidLogo, DiscordLogo, OsnLogo } from './BrandLogos';
import { Check, Zap, ArrowLeft, ShieldCheck, Star, Ban } from 'lucide-react';
import { getAvailableStockCount, isPlanOutOfStock } from '../utils/storage';
import { STORE_CONFIG } from '../utils/storeConfig';

interface SubscriptionCardProps {
  service: SubscriptionService;
  onSelectPlan: (service: SubscriptionService, plan: Plan) => void;
}

export function SubscriptionCard({ service, onSelectPlan }: SubscriptionCardProps) {
  // Default to the featured plan if exists, else middle plan
  const defaultPlan = service.plans.find(p => p.isFeatured) || service.plans[Math.min(1, service.plans.length - 1)];
  const [selectedDuration, setSelectedDuration] = useState<string>(defaultPlan.duration);

  const currentPlan = service.plans.find(p => p.duration === selectedDuration) || service.plans[0];
  const stockCount = getAvailableStockCount(service.id, currentPlan.duration);
  const isCurrentOutOfStock = isPlanOutOfStock(service.id, currentPlan.duration) || (currentPlan as any).isOutOfStock;

  const renderLogo = () => {
    switch (service.id) {
      case 'netflix':
        return <NetflixLogo className="w-7 h-7" />;
      case 'shahid':
        return <ShahidLogo className="w-7 h-7" />;
      case 'osn':
        return <OsnLogo className="w-7 h-7" />;
      case 'discord':
        return <DiscordLogo className="w-7 h-7" />;
    }
  };

  return (
    <div className="rounded-2xl p-[1px] bg-gradient-to-b from-purple-500/30 via-indigo-500/15 to-transparent hover:from-purple-400/50 hover:via-indigo-500/30 transition-all duration-300 flex flex-col h-full shadow-xl hover:shadow-purple-950/70 group">
      
      {/* Inner Card Container */}
      <div className="rounded-[15px] bg-[#0E0A20] flex flex-col flex-1 border border-purple-500/20 group-hover:border-purple-500/40 transition-colors overflow-hidden">
        
        {/* Banner Image Header */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#130E29]">
          <img
            src={service.bannerImage}
            alt={service.title}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0A20] via-black/30 to-black/30" />

          {/* Top Badge */}
          <div className="absolute top-2.5 right-2.5">
            <span className="text-[11px] font-black px-2.5 py-1 rounded-md bg-black/85 text-purple-200 border border-purple-500/40 backdrop-blur-md shadow-md">
              {service.badgeText}
            </span>
          </div>

          <div className="absolute top-2.5 left-2.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>ضمان ذهبي</span>
            </span>
          </div>

          {/* Logo & Platform Name */}
          <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 p-1.5 flex items-center justify-center shadow-lg">
                {renderLogo()}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white font-display drop-shadow">
                  {service.title}
                </h3>
                <p className="text-[11px] text-purple-200 font-mono drop-shadow">
                  {service.titleEn}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subtitle Caption */}
        <div className="px-4 py-2.5 bg-[#120D29] border-b border-purple-500/15 text-xs text-purple-200 leading-relaxed font-medium">
          {service.subtitle}
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          
          {/* Plan Duration Selector (All exact options from official design) */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-300 mb-2">
              اختر مدة الاشتراك:
            </label>
            <div className={`grid gap-1.5 p-1 bg-[#140F2E] rounded-xl border border-purple-500/20 ${service.plans.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
              {service.plans.map((p) => {
                const isSelected = p.duration === selectedDuration;
                const isPOutOfStock = isPlanOutOfStock(service.id, p.duration) || (p as any).isOutOfStock;
                return (
                  <button
                    key={p.duration}
                    type="button"
                    onClick={() => setSelectedDuration(p.duration)}
                    className={`p-2 rounded-lg text-center transition-all cursor-pointer relative flex flex-col items-center justify-center ${
                      isSelected
                        ? isPOutOfStock
                          ? 'bg-red-950/80 text-red-200 shadow-md ring-1 ring-red-500'
                          : p.badgeColor === 'red'
                          ? 'bg-red-600 text-white shadow-md shadow-red-900/60 ring-1 ring-red-400'
                          : p.badgeColor === 'cyan'
                          ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/60 ring-1 ring-cyan-400'
                          : p.badgeColor === 'gold'
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-900/60 ring-1 ring-amber-400'
                          : 'bg-purple-600 text-white shadow-md shadow-purple-900/60 ring-1 ring-purple-400'
                        : isPOutOfStock
                        ? 'text-red-400/80 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-purple-900/30'
                    }`}
                  >
                    {isPOutOfStock ? (
                      <span className="text-[8px] font-black px-1 rounded-sm bg-red-900/80 text-red-200 uppercase tracking-tighter mb-0.5 truncate max-w-full">
                        نفاذ
                      </span>
                    ) : p.badge ? (
                      <span className="text-[8px] font-black px-1 rounded-sm bg-black/60 text-amber-300 uppercase tracking-tighter mb-0.5 truncate max-w-full">
                        {p.badge}
                      </span>
                    ) : null}
                    <span className="text-xs font-bold block">{p.label}</span>
                    <span className={`text-[11px] font-mono font-black mt-0.5 ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                      {p.price} <span className="text-[9px] font-normal">{STORE_CONFIG.currencyLabelAr}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Selected Plan Specifications Box */}
          <div className={`mb-4 p-3.5 rounded-xl border relative ${
            currentPlan.badgeColor === 'red'
              ? 'bg-red-950/20 border-red-500/40'
              : currentPlan.badgeColor === 'cyan'
              ? 'bg-cyan-950/20 border-cyan-500/40'
              : currentPlan.badgeColor === 'gold'
              ? 'bg-amber-950/25 border-amber-500/50'
              : 'bg-[#140F2E] border-purple-500/25'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">{currentPlan.label}</span>
                {currentPlan.subLabel && (
                  <span className="text-[10px] text-purple-300 font-mono">({currentPlan.subLabel})</span>
                )}
                {currentPlan.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {currentPlan.badge}
                  </span>
                )}
              </div>
              <div className="text-left font-mono">
                <span className="text-xl font-black text-white">{currentPlan.price}</span>
                <span className="text-xs text-purple-300 mr-1 font-bold">{STORE_CONFIG.currencyLabelAr}</span>
              </div>
            </div>

            {/* Plan Features Checklist */}
            <ul className="space-y-1.5 pt-2 border-t border-purple-500/15">
              {currentPlan.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Guarantee Points from Original Design */}
          <div className="mb-4 space-y-1.5 border-t border-purple-500/15 pt-3">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">ضمانات الخدمة المعتمدة:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {service.footerFeatures.map((gf, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                  <span className="truncate">{gf}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stock and Purchase Button */}
          <div className="mt-auto space-y-2.5">
            <div className="flex items-center justify-between text-xs px-1 text-slate-400">
              {isCurrentOutOfStock ? (
                <span className="flex items-center gap-1 text-red-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>نفذت الكمية حالياً (نفاذ)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>متوفر للتسليم المباشر</span>
                </span>
              )}
              <span className="font-mono text-[11px] text-purple-300">
                {isCurrentOutOfStock ? 'نفذت الكمية' : stockCount > 0 ? `${stockCount} كود جاهز` : 'تسليم فوري متاح'}
              </span>
            </div>

            {isCurrentOutOfStock ? (
              <button
                type="button"
                disabled
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 font-bold text-sm shadow-md cursor-not-allowed opacity-90"
              >
                <Ban className="w-4 h-4 text-red-400" />
                <span>نفذت الكمية لهذه الباقة مؤقتاً</span>
              </button>
            ) : (
              <button
                onClick={() => onSelectPlan(service, currentPlan)}
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-950/60 hover:shadow-purple-700/50 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>اشتراك وتفعيل فوري ({currentPlan.price} {STORE_CONFIG.currencyLabelAr})</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
