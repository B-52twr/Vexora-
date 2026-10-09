import { ApiProduct, ApiProductPlan } from '../services/apiClient';
import { NetflixLogo, ShahidLogo, OsnLogo, DiscordLogo } from './BrandLogos';
import { X, Check, ShieldCheck, Zap, ArrowLeft, Star, Monitor, Smartphone, Tv, Ban } from 'lucide-react';
import { STORE_CONFIG } from '../utils/storeConfig';
import { isPlanOutOfStock } from '../utils/storage';

interface ProductDetailModalProps {
  product: ApiProduct;
  selectedPlan: ApiProductPlan;
  onSelectPlan: (plan: ApiProductPlan) => void;
  onProceedToCheckout: (product: ApiProduct, plan: ApiProductPlan) => void;
  onClose: () => void;
}

export function ProductDetailModal({
  product,
  selectedPlan,
  onSelectPlan,
  onProceedToCheckout,
  onClose
}: ProductDetailModalProps) {
  const isSelectedOutOfStock = isPlanOutOfStock(product.id as any, selectedPlan.duration as any) || selectedPlan.isOutOfStock;
  const renderLogo = () => {
    switch (product.id) {
      case 'netflix':
        return <NetflixLogo className="w-8 h-8" />;
      case 'shahid':
        return <ShahidLogo className="w-8 h-8" />;
      case 'osn':
        return <OsnLogo className="w-8 h-8" />;
      case 'discord':
        return <DiscordLogo className="w-8 h-8" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0E0A22] rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-950/90 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-purple-500/20 flex items-center justify-between bg-[#120D2A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 p-1.5 flex items-center justify-center">
              {renderLogo()}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white font-display">
                {product.title}
              </h3>
              <p className="text-[11px] text-purple-300 font-mono">
                {product.titleEn} · مواصفات وتفاصيل الباقة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg bg-purple-950/50 hover:bg-purple-900/50 text-slate-400 hover:text-white flex items-center justify-center border border-purple-500/20 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Overview text */}
          <div className="p-4 rounded-xl bg-[#140F2E] border border-purple-500/20 space-y-2">
            <span className="text-xs font-bold text-purple-300 block">وصف الخدمة والضمان:</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Select Duration */}
          <div>
            <label className="block text-xs font-bold text-white mb-2.5">
              اختر مدة الاشتراك المطلوبة:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {product.plans.map((p) => {
                const isSelected = p.duration === selectedPlan.duration;
                const isPOut = isPlanOutOfStock(product.id as any, p.duration as any) || p.isOutOfStock;
                return (
                  <button
                    key={p.duration}
                    type="button"
                    onClick={() => onSelectPlan(p)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                      isSelected
                        ? isPOut 
                          ? 'border-red-500 bg-red-950/60 ring-1 ring-red-500'
                          : 'border-purple-400 bg-purple-900/50 shadow-lg shadow-purple-950/60 ring-1 ring-purple-400'
                        : isPOut
                        ? 'border-red-500/20 bg-red-950/20 text-red-300'
                        : 'border-purple-500/20 bg-[#120D29] hover:border-purple-500/40 text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold block">{p.label}</span>
                    <span className="text-base font-black font-mono text-white mt-1">
                      {p.price} <span className="text-[10px] font-normal text-purple-300">{STORE_CONFIG.currencyLabelAr}</span>
                    </span>
                    {isPOut ? (
                      <span className="text-[9px] text-red-400 font-bold mt-1 font-mono">
                        نفذت الكمية (نفاذ)
                      </span>
                    ) : p.availableStock > 0 ? (
                      <span className="text-[9px] text-emerald-400 mt-1 font-mono">
                        {p.availableStock} كود متاح
                      </span>
                    ) : (
                      <span className="text-[9px] text-purple-300 mt-1 font-mono">
                        تسليم فوري
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Plan In-depth Features */}
          <div className="p-4 rounded-xl bg-[#140F2E] border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span>مزايا باقة {selectedPlan.label}</span>
                {selectedPlan.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    {selectedPlan.badge}
                  </span>
                )}
              </span>

              <div className="text-left font-mono">
                <span className="text-xl font-black text-white">{selectedPlan.price}</span>
                <span className="text-xs text-purple-300 mr-1">{STORE_CONFIG.currencyLabelAr}</span>
              </div>
            </div>

            <ul className="space-y-2 pt-1">
              {selectedPlan.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Supported Devices and Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#120D29] border border-purple-500/20 space-y-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-indigo-400" />
                <span>الأجهزة المتوافقة</span>
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                التلفزيونات الذكية (Smart TV), الهواتف (iOS / Android), أجهزة التابلت, الحواسيب الشخصية وأجهزة الألعاب.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#120D29] border border-purple-500/20 space-y-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>الضمان الذهبي</span>
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                ضمان كامل ومستمر طوال مدة الاشتراك مع تعويض واستبدال مباشر في حال حدوث أي خلل.
              </p>
            </div>
          </div>

        </div>

        {/* Action Button */}
        <div className="p-4 bg-[#120D2A] border-t border-purple-500/20 flex items-center justify-between">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">الإجمالي المطلوب:</span>
            <span className="text-lg font-black text-white font-mono">{selectedPlan.price} {STORE_CONFIG.currencyLabelAr}</span>
          </div>

          {isSelectedOutOfStock ? (
            <button
              type="button"
              disabled
              className="py-3 px-6 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 font-bold text-xs sm:text-sm cursor-not-allowed flex items-center gap-2"
            >
              <Ban className="w-4 h-4 text-red-400" />
              <span>نفذت الكمية لهذه الباقة مؤقتاً</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onProceedToCheckout(product, selectedPlan)}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-950/60 cursor-pointer flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>متابعة الشراء والتفعيل الفوري</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
