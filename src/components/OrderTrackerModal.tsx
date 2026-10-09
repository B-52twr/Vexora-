import React, { useState } from 'react';
import { Order } from '../types';
import { getOrderById, getStoredOrders } from '../utils/storage';
import { apiClient } from '../services/apiClient';
import { X, Search, CheckCircle2, Clock, XCircle, Copy, Check, Lock, Smartphone } from 'lucide-react';

interface OrderTrackerModalProps {
  onClose: () => void;
}

export function OrderTrackerModal({ onClose }: OrderTrackerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedField, setCopiedField] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setHasSearched(false);

    try {
      // 1. Try local storage by ID
      let found = getOrderById(query);

      // 2. Try local storage by phone number (GCC)
      if (!found) {
        const cleanDigits = query.replace(/\D/g, '');
        if (cleanDigits.length >= 7) {
          const all = getStoredOrders();
          found = all.find(o => {
            const oPhone = o.customerPhone.replace(/\D/g, '');
            return oPhone.includes(cleanDigits) || cleanDigits.includes(oPhone);
          }) || null;
        }
      }

      // 3. Try server API
      if (!found) {
        try {
          const serverOrder = await apiClient.trackOrder(query);
          if (serverOrder) {
            found = {
              orderId: serverOrder.orderId,
              serviceId: 'netflix',
              serviceTitle: serverOrder.serviceTitle,
              duration: '1_month',
              planLabel: serverOrder.planLabel,
              planPrice: serverOrder.planPrice,
              customerName: serverOrder.customerName || 'عميل المتجر',
              customerEmail: '',
              customerPhone: '',
              paymentMethod: serverOrder.paymentMethod,
              status: serverOrder.status === 'paid' ? 'completed' : serverOrder.status === 'pending_review' ? 'pending_verification' : 'rejected',
              deliveredCode: serverOrder.deliveredCode,
              deliveredPin: serverOrder.deliveredPin,
              deliveredInstructions: serverOrder.deliveredInstructions,
              transferRef: serverOrder.transferRef,
              adminNote: serverOrder.failedReason,
              createdAt: serverOrder.createdAt || new Date().toISOString()
            };
          }
        } catch {
          // Ignore server 404
        }
      }

      setSearchedOrder(found);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedField(true);
    setTimeout(() => setCopiedField(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0E0A22] rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-950/90 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-purple-500/20 flex items-center justify-between bg-[#120D2A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/30 flex items-center justify-center">
              <Search className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white font-display">
                تتبع حالة الطلب واستلام الكود
              </h3>
              <p className="text-[11px] text-purple-300">
                ابحث برقم الطلب (VX-...) أو برقم الجوال الخليجي المسجل
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
        <div className="p-4 sm:p-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              required
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="أدخل رقم الطلب أو رقم الجوال (مثال: VX-... أو 05XXXXXXXX)"
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-[#140F2E] border border-purple-500/30 focus:border-purple-400 text-white placeholder-slate-500 font-mono focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>{isSearching ? 'بحث...' : 'بحث'}</span>
            </button>
          </form>

          {hasSearched && !searchedOrder && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-center text-xs text-red-300">
              لم يتم العثور على أي طلب برقم ({searchQuery}). يرجى التحقق من الرقم والمحاولة مرة أخرى.
            </div>
          )}

          {searchedOrder && (
            <div className="p-4 rounded-xl bg-[#140F2E] border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-purple-500/15">
                <div>
                  <span className="text-[10px] text-slate-400 block">رقم الطلب:</span>
                  <span className="font-mono font-bold text-white text-xs">{searchedOrder.orderId}</span>
                </div>

                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    searchedOrder.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : searchedOrder.status === 'pending_verification'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {searchedOrder.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                    {searchedOrder.status === 'pending_verification' && <Clock className="w-3 h-3" />}
                    {searchedOrder.status === 'rejected' && <XCircle className="w-3 h-3" />}
                    <span>
                      {searchedOrder.status === 'completed' && 'مكتمل ومسلّم'}
                      {searchedOrder.status === 'pending_verification' && 'قيد مراجعة التحويل البنكي'}
                      {searchedOrder.status === 'rejected' && 'تم الرفض'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px]">الخدمة:</span>
                  <span className="font-bold text-white">{searchedOrder.serviceTitle} ({searchedOrder.planLabel})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">المبلغ:</span>
                  <span className="font-bold font-mono text-purple-300">{searchedOrder.planPrice} ر.س</span>
                </div>
                {searchedOrder.customerPhone && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">رقم الجوال المسجل:</span>
                    <span className="font-mono text-purple-200 text-xs font-bold" dir="ltr">{searchedOrder.customerPhone}</span>
                  </div>
                )}
              </div>

              {/* Status Specific Messages */}
              {searchedOrder.status === 'completed' && (
                <div className="p-3 rounded-lg bg-black/60 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-400 block">كود الاشتراك / رابط التفعيل:</span>
                      <span className="font-mono font-bold text-white text-sm">{searchedOrder.deliveredCode}</span>
                    </div>
                    {searchedOrder.deliveredCode && (
                      <button
                        type="button"
                        onClick={() => handleCopyCode(searchedOrder.deliveredCode!)}
                        className="p-1.5 rounded bg-purple-900/60 text-purple-200 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField ? 'تم' : 'نسخ'}</span>
                      </button>
                    )}
                  </div>

                  {searchedOrder.deliveredPin && (
                    <div className="text-xs text-purple-200">
                      رمز القفل السري للملف (PIN): <strong className="font-mono text-white">{searchedOrder.deliveredPin}</strong>
                    </div>
                  )}

                  {searchedOrder.deliveredInstructions && (
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-white/10">
                      {searchedOrder.deliveredInstructions}
                    </div>
                  )}
                </div>
              )}

              {searchedOrder.status === 'pending_verification' && (
                <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                  ⏳ تم استلام إيصال التحويل ورقم المرجع <strong className="text-white">({searchedOrder.transferRef})</strong>. الطلب قيد التدقيق اليدوي من الإدارة، وسيتم تسليم الكود تلقائياً فور المطابقة.
                </div>
              )}

              {searchedOrder.status === 'rejected' && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-200 leading-relaxed">
                  ❌ تم رفض الحوالة البنكية. السبب: {searchedOrder.adminNote || 'عدم مطابقة الإيصال مع كشف الحساب البنكي'}. يرجى التواصل مع الدعم.
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
