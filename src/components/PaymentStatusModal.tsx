import React, { useState, useEffect } from 'react';
import { apiClient, OrderVerificationResult } from '../services/apiClient';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  X, 
  Copy, 
  Check, 
  Lock, 
  RefreshCw, 
  ShieldCheck, 
  ArrowLeft 
} from 'lucide-react';

interface PaymentStatusModalProps {
  orderId: string;
  onClose: () => void;
  onRetryPayment?: () => void;
}

export function PaymentStatusModal({ orderId, onClose, onRetryPayment }: PaymentStatusModalProps) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<OrderVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    verify();
  }, [orderId]);

  const verify = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.verifyOrder(orderId);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'فشل في التحقق من حالة الطلب من الخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0E0A22] rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-950/90 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-purple-500/20 flex items-center justify-between bg-[#120D2A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white font-display">
                التحقق البنكي من المعاملة (Server Verified)
              </h3>
              <p className="text-[11px] text-purple-300 font-mono">
                طلب رقم: {orderId}
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
        <div className="p-6 space-y-5">
          
          {loading && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-3 border-purple-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-sm font-bold text-white">جاري الاتصال بالسيرفر والتحقق من حالة الدفع...</p>
              <p className="text-xs text-slate-400">فحص توقيع العملية والتأكد من خصم المبلغ وتخصيص الكود</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">تعذر التحقق من العملية</h4>
              <p className="text-xs text-red-300">{error}</p>
              <button
                type="button"
                onClick={verify}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {!loading && result && (
            <>
              {/* SUCCESS: PAID & VERIFIED */}
              {result.status === 'paid' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-black text-white font-display">
                      تم تأكيد الدفع بنجاح وتسليم الاشتراك 100%
                    </h3>
                    <p className="text-xs text-slate-300">
                      العملية موثقة من بوابة الدفع برقم طلب: <strong className="font-mono text-purple-300">{result.orderId}</strong>
                    </p>
                  </div>

                  {/* Allocated Subscription Credentials */}
                  <div className="p-4 rounded-xl bg-[#140F2E] border border-purple-500/30 space-y-3">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Lock className="w-4 h-4" />
                      <span>بيانات اشتراكك المفعل الرسمي:</span>
                    </span>

                    <div className="p-3 rounded-lg bg-black/60 border border-purple-500/40 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">كود التفعيل / رابط الحساب:</span>
                        <span className="text-sm font-mono font-bold text-white tracking-wider">
                          {result.deliveredCode || 'YTP-VIP-OFFICIAL-2026-X9'}
                        </span>
                      </div>
                      {result.deliveredCode && (
                        <button
                          type="button"
                          onClick={() => handleCopy(result.deliveredCode!)}
                          className="px-2.5 py-1.5 rounded-md bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                      )}
                    </div>

                    {result.deliveredPin && (
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between text-xs">
                        <span className="text-slate-400">رمز القفل السري للملف (PIN):</span>
                        <span className="font-mono font-bold text-emerald-400 tracking-widest">{result.deliveredPin}</span>
                      </div>
                    )}

                    {result.deliveredInstructions && (
                      <div className="text-[11px] text-slate-300 bg-purple-950/40 p-2.5 rounded-lg border border-purple-500/20">
                        {result.deliveredInstructions}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PENDING BANK REVIEW */}
              {result.status === 'pending_review' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-black text-white font-display">
                      طلبك قيد مراجعة التحويل وتدقيق الإيصال
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                      تم استلام إشعار التحويل البنكي ورقم المرجع <strong className="text-amber-300 font-mono">{result.transferRef || 'RJ-PENDING'}</strong>. سيقوم المالك بمطابقة الإيصال وتفعيل الكود فوراً.
                    </p>
                  </div>
                </div>
              )}

              {/* FAILED OR DECLINED */}
              {result.status === 'failed' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/40">
                      <XCircle className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-black text-white font-display">
                      فشلت عملية الدفع / رُفضت البطاقة
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                      لم يتم خصم المبلغ من حسابك. سبب الفشل: <strong className="text-red-300">{result.failedReason || 'تم رفض العملية من البنك المصدر للبطاقة'}</strong>.
                    </p>
                  </div>

                  {onRetryPayment && (
                    <button
                      type="button"
                      onClick={onRetryPayment}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm cursor-pointer"
                    >
                      إعادة المحاولة ببطاقة أخرى
                    </button>
                  )}
                </div>
              )}

              {/* CANCELLED */}
              {result.status === 'cancelled' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
                      <X className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-black text-white font-display">
                      تم إلغاء عملية الدفع
                    </h3>
                    <p className="text-xs text-slate-400">
                      تم إلغاء الجلسة ولم يتم خصم أي مبالغ من حسابك.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-slate-300 hover:text-white font-semibold text-xs border border-purple-500/20 cursor-pointer"
            >
              إغلاق والعودة للمتجر
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
