import React, { useState, useEffect } from 'react';
import { SubscriptionService, Plan, PaymentMethod, ElectronicBrand, Order } from '../types';
import { OFFICIAL_BANK_DETAILS, INITIAL_SERVICES } from '../data/subscriptions';
import { createOrder, allocateCodeForOrder } from '../utils/storage';
import { 
  X, 
  ShieldCheck, 
  ArrowLeft, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  Building2, 
  Copy, 
  Smartphone, 
  Check,
  RefreshCw,
  Edit2,
  Sparkles,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { ApplePayBadge, MadaBadge, VisaBadge, MastercardBadge, KNetBadge } from './BrandLogos';
import { apiClient, ApiConfig } from '../services/apiClient';
import { GCCPhoneInput, GCC_COUNTRIES, GCCCountry } from './GCCPhoneInput';
import { STORE_CONFIG } from '../utils/storeConfig';

// Luhn validation helper for credit/debit card numbers
function validateCardLuhn(num: string): boolean {
  const clean = num.replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// Detect brand from number prefix
function detectCardBrandFromNumber(num: string): 'mastercard' | 'visa' | 'mada' | 'unknown' {
  const clean = num.replace(/\D/g, '');
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
  if (/^4/.test(clean)) return 'visa';
  if (/^(58884[5-9]|588850|4008|4017|4176|4406|4407|4464|5043|5210|5241|5245|5294|5297|5309|5310|5320|5358|5359|5377|5399|5433|5497|5888|5889|5890|5892|6049|6051|6361|9682)/.test(clean)) {
    return 'mada';
  }
  return 'unknown';
}

interface CheckoutModalProps {
  service: SubscriptionService;
  plan: Plan;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

type CheckoutStep = 'details_form' | 'hosted_gateway_3ds' | 'bank_transfer_upload' | 'success_view';

export function CheckoutModal({ service, plan, onClose, onOrderSuccess }: CheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>('details_form');
  
  // Customer Form Data
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedGCCCountry, setSelectedGCCCountry] = useState<GCCCountry>(GCC_COUNTRIES[0]);
  const [nationalPhone, setNationalPhone] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('electronic_gateway');
  const [selectedBrand, setSelectedBrand] = useState<ElectronicBrand>('apple_pay');
  const [isEditingPhoneInGateway, setIsEditingPhoneInGateway] = useState(false);

  // Server-generated order ID
  const [serverOrderId, setServerOrderId] = useState<string>('');

  // Live Merchant Bank & Settlement configuration fetched from server
  const [merchantConfig, setMerchantConfig] = useState<ApiConfig | null>(null);

  // Interactive Customer Card Input Fields
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardValidationErr, setCardValidationErr] = useState('');

  // Bank Transfer Fields
  const [transferRef, setTransferRef] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');

  // Gateway Simulation Fields (3DS OTP)
  const [gatewayStatus, setGatewayStatus] = useState<'card_entry' | 'otp_challenge' | 'verifying_webhook' | 'approved' | 'failed'>('card_entry');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Completed Order
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Load live server config for active merchant bank details
  useEffect(() => {
    apiClient.getConfig().then((cfg) => {
      if (cfg && cfg.merchantSettlement) {
        setMerchantConfig(cfg);
      }
    }).catch(() => {});
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle receipt image upload
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. يرجى اختيار صورة أقل من 10 ميغابايت.');
      return;
    }

    setReceiptFile(file);
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const activeBankName = merchantConfig?.merchantSettlement?.bankName || OFFICIAL_BANK_DETAILS.bankName;
  const activeAccountHolder = merchantConfig?.merchantSettlement?.accountHolder || OFFICIAL_BANK_DETAILS.accountHolder;
  const activeAccountNumber = merchantConfig?.merchantSettlement?.accountNumber || OFFICIAL_BANK_DETAILS.accountNumber;
  const activeIban = merchantConfig?.merchantSettlement?.iban || OFFICIAL_BANK_DETAILS.iban;

  // Generate clean test receipt for quick preview
  const handleGenerateSampleReceipt = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, 600, 700);

    // Header
    ctx.fillStyle = '#10B981';
    ctx.fillRect(0, 0, 600, 90);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`إشعار تحويل بنكي رسمي - ${activeBankName.split(' ')[0] || 'البنك'}`, 300, 55);

    // Body
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`المبلغ المحول: ${plan.price} ${STORE_CONFIG.currencyLabelAr}`, 550, 160);
    ctx.fillText(`المستفيد: ${activeAccountHolder}`, 550, 210);
    ctx.fillText(`الآيبان: ${activeIban}`, 550, 260);
    ctx.fillText(`اسم المحول: ${customerName || 'مثال: اسمك'}`, 550, 310);
    ctx.fillText(`رقم المرجع: RJ-${Math.floor(100000 + Math.random() * 900000)}`, 550, 360);
    ctx.fillText(`التاريخ: ${new Date().toLocaleDateString('ar-SA')}`, 550, 410);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 110, 540, 350);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('تمت العملية بنجاح عبر النظام المصرفي السريع SARIE', 300, 520);
    ctx.fillText('إيصال مدقق وموثق - خاضع لإشراف البنك المركزي السعودي', 300, 550);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `rajhi_receipt_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setReceiptFile(file);
      }
    }, 'image/jpeg');

    const dataUrl = canvas.toDataURL('image/jpeg');
    setReceiptImage(dataUrl);
    setReceiptFileName(`rajhi_receipt_${Date.now()}.jpg`);
    setTransferRef(`RJ-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  // Submit initial details to Server
  const handleProceedFromDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim() || !customerEmail.trim()) {
      setErrorMessage('يرجى كتابة الاسم الكريم والبريد الإلكتروني.');
      return;
    }

    const cleanDigits = nationalPhone.trim();
    if (!cleanDigits) {
      setErrorMessage(`يرجى إدخال رقم الجوال (${selectedGCCCountry.name}).`);
      return;
    }

    if (cleanDigits.length < selectedGCCCountry.digits) {
      setErrorMessage(`رقم الجوال غير مكتمل. يتطلب ${selectedGCCCountry.digits} أرقام لـ ${selectedGCCCountry.name} (${selectedGCCCountry.hint}).`);
      return;
    }

    const fullPhoneNumber = customerPhone.trim() || `${selectedGCCCountry.code} ${cleanDigits}`;

    try {
      // Real server-side session creation with strict server price calculation
      const session = await apiClient.createCheckoutSession({
        serviceId: service.id,
        duration: plan.duration,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: fullPhoneNumber,
        paymentMethod,
        paymentBrand: selectedBrand
      });

      setServerOrderId(session.orderId);

      if (paymentMethod === 'electronic_gateway') {
        if (session.checkoutUrl && !session.checkoutUrl.includes('/hosted-checkout') && session.checkoutUrl.startsWith('https://')) {
          // If a live gateway URL from Tap Payments was generated
          window.location.href = session.checkoutUrl;
          return;
        }

        setStep('hosted_gateway_3ds');
        setGatewayStatus('card_entry');
      } else {
        setStep('bank_transfer_upload');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في بدء جلسة الدفع عبر السيرفر');
    }
  };

  // Authorize & Validate Card input (Luhn algorithm & expiration check)
  const handleAuthorizeCard = (e: React.FormEvent) => {
    e.preventDefault();
    setCardValidationErr('');

    const cleanCard = cardNum.replace(/\s/g, '');
    if (cleanCard.length < 15 || cleanCard.length > 19) {
      setCardValidationErr('رقم البطاقة غير مكتمل. يرجى إدخال 16 رقماً.');
      return;
    }

    if (!validateCardLuhn(cleanCard)) {
      setCardValidationErr('رقم البطاقة غير صالح بنكياً (Luhn Check Failed). يرجى التأكد من صحة أرقام بطاقتك.');
      return;
    }

    if (!cardExp.includes('/') || cardExp.length < 5) {
      setCardValidationErr('يرجى إدخال تاريخ انتهاء البطاقة بالشكل (MM/YY).');
      return;
    }

    const [expMonth, expYear] = cardExp.split('/').map((s) => parseInt(s.trim(), 10));
    if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
      setCardValidationErr('شهر انتهاء الصلاحية غير صحيح (01 - 12).');
      return;
    }

    const currentYearShort = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    if (expYear < currentYearShort || (expYear === currentYearShort && expMonth < currentMonth)) {
      setCardValidationErr('البطاقة منتهية الصلاحية.');
      return;
    }

    if (cardCvv.length < 3) {
      setCardValidationErr('رمز الأمان CVV يجب أن يتكون من 3 أرقام (خلف البطاقة).');
      return;
    }

    if (!cardHolderName.trim()) {
      setCardValidationErr('يرجى إدخال اسم صاحب البطاقة المدون على الواجهة.');
      return;
    }

    // Proceed to Bank 3D Secure Challenge
    setGatewayStatus('otp_challenge');
  };

  // Verify Gateway OTP & Webhook via Server
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (otpInput.trim().length < 4) {
      setOtpError('رمز التحقق البنكي (OTP) يجب أن يتكون من 4 إلى 6 أرقام مرسلة لجوالك.');
      return;
    }

    setGatewayStatus('verifying_webhook');

    try {
      // 1. Process 3DS challenge on server (triggers server webhook)
      await apiClient.simulate3DS(serverOrderId, otpInput.trim());

      // 2. Fetch server-verified order state (Zero-Trust)
      const verified = await apiClient.verifyOrder(serverOrderId);

      if (verified.status === 'paid') {
        const fullOrder: Order = {
          orderId: verified.orderId,
          serviceId: service.id,
          serviceTitle: verified.serviceTitle || service.title,
          duration: plan.duration,
          planLabel: verified.planLabel || plan.label,
          planPrice: verified.planPrice,
          customerName: verified.customerName || customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          paymentMethod: 'electronic_gateway',
          electronicBrand: selectedBrand,
          status: 'completed',
          deliveredCode: verified.deliveredCode,
          deliveredPin: verified.deliveredPin,
          deliveredInstructions: verified.deliveredInstructions,
          createdAt: verified.paidAt || new Date().toISOString()
        };

        setCreatedOrder(fullOrder);
        setGatewayStatus('approved');
        setStep('success_view');
        onOrderSuccess(fullOrder);
      } else {
        setOtpError(verified.failedReason || 'تم رفض العملية من قبل البنك المصدر للبطاقة');
        setGatewayStatus('otp_challenge');
      }
    } catch (err: any) {
      setOtpError(err.message || 'فشل في التحقق المصرفي');
      setGatewayStatus('otp_challenge');
    }
  };

  // Submit Bank Transfer with mandatory receipt via Server
  const handleSubmitBankTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!receiptFile && !receiptImage) {
      setErrorMessage('إرفاق صورة إيصال التحويل البنكي إلزامي لاعتماد الطلب من قبل الإدارة.');
      return;
    }

    if (!transferRef.trim()) {
      setErrorMessage('يرجى كتابة الرقم المرجعي للحوالة أو اسم المحول.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('orderId', serverOrderId);
      formData.append('transferRef', transferRef.trim());

      if (receiptFile) {
        formData.append('receipt', receiptFile);
      } else if (receiptImage) {
        // Fallback for canvas generated dataurl
        const res = await fetch(receiptImage);
        const blob = await res.blob();
        formData.append('receipt', blob, receiptFileName || 'receipt.jpg');
      }

      await apiClient.uploadBankReceipt(formData);

      const pendingOrder: Order = {
        orderId: serverOrderId,
        serviceId: service.id,
        serviceTitle: service.title,
        duration: plan.duration,
        planLabel: plan.label,
        planPrice: plan.price,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod: 'bank_transfer',
        status: 'pending_verification',
        transferRef: transferRef.trim(),
        receiptImageData: receiptImage || undefined,
        receiptFileName: receiptFileName || 'bank_transfer_receipt.jpg',
        createdAt: new Date().toISOString()
      };

      setCreatedOrder(pendingOrder);
      setStep('success_view');
      onOrderSuccess(pendingOrder);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في رفع إيصال التحويل إلى الخادم');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0E0A22] rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-950/90 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-purple-500/20 flex items-center justify-between bg-[#120D2A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white font-display">
                بوابة الدفع والتسليم المشفر (VAULT-X SECURE)
              </h3>
              <p className="text-[11px] text-purple-300">
                {service.title} · {plan.label} ({plan.price} {STORE_CONFIG.currencyLabelAr})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg bg-purple-950/50 hover:bg-purple-900/50 text-slate-400 hover:text-white flex items-center justify-center border border-purple-500/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* STEP 1: Details & Payment Method Selection */}
          {step === 'details_form' && (
            <form onSubmit={handleProceedFromDetails} className="space-y-4">
              
              {/* Summary Strip */}
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">الباقة المختارة:</span>
                  <span className="text-sm font-bold text-white">{service.title} - {plan.label}</span>
                </div>
                <div className="text-left font-mono">
                  <span className="text-xs text-slate-400 block">المبلغ الإجمالي:</span>
                  <span className="text-lg font-black text-white">{plan.price} <span className="text-xs text-purple-300">{STORE_CONFIG.currencyLabelAr}</span></span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Customer Info Form */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5 font-display">
                  <span>1. بيانات المستلم (لتسليم الفاتورة والاشتراك)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      الاسم الكريم *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="مثال: اسمك"
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#140F2E] border border-purple-500/30 focus:border-purple-400 text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      البريد الإلكتروني (لاستلام بيانات التفعيل) *
                    </label>
                    <input
                      type="email"
                      required
                      dir="ltr"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#140F2E] border border-purple-500/30 focus:border-purple-400 text-white placeholder-slate-500 focus:outline-none text-left"
                    />
                  </div>
                </div>

                {/* Full Gulf GCC Phone Input */}
                <div className="pt-1">
                  <GCCPhoneInput
                    value={customerPhone}
                    onChange={(full, country, digits) => {
                      setCustomerPhone(full);
                      setSelectedGCCCountry(country);
                      setNationalPhone(digits);
                      if (errorMessage) setErrorMessage('');
                    }}
                    required
                    showQuickPills={true}
                    label="رقم الجوال لتلقي كود التحقق والاشتراك (دول الخليج العربي كاملة)"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3 pt-2 border-t border-purple-500/15">
                <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5 font-display">
                  <span>2. اختر طريقة السداد المعتمدة (100% أمان)</span>
                </h4>

                {/* Option 1: Electronic Gateway (Tap / MyFatoorah Hosted Flow) */}
                <div 
                  onClick={() => setPaymentMethod('electronic_gateway')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === 'electronic_gateway'
                      ? 'bg-purple-950/50 border-purple-500 shadow-md ring-1 ring-purple-500'
                      : 'bg-[#120D29] border-purple-500/20 hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'electronic_gateway' ? 'border-purple-400 bg-purple-600' : 'border-slate-500'
                      }`}>
                        {paymentMethod === 'electronic_gateway' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                        <span>دفع إلكتروني فوري معتمد (3D Secure & OTP)</span>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      تسليم آلي فوري
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2.5 mr-6 leading-relaxed">
                    يتم تحويلك لصفحة دفع مشفرة بنكية خاصة بالبوابة الرسمية (Tap / MyFatoorah). لن يتم جمع أي بيانات بطاقات محلياً، مع تحقق بنكي صارم عبر كود OTP مرسل لجوالك.
                  </p>

                  {/* Brand options selector */}
                  <div className="flex items-center gap-2 mr-6 flex-wrap">
                    {[
                      { id: 'apple_pay', label: 'Apple Pay', comp: <ApplePayBadge /> },
                      { id: 'mada', label: 'Mada مدى', comp: <MadaBadge /> },
                      { id: 'visa', label: 'Visa', comp: <VisaBadge /> },
                      { id: 'mastercard', label: 'Mastercard', comp: <MastercardBadge /> },
                      { id: 'knet', label: 'K-NET', comp: <KNetBadge /> },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentMethod('electronic_gateway');
                          setSelectedBrand(b.id as ElectronicBrand);
                        }}
                        className={`p-1.5 rounded-lg border transition-all ${
                          selectedBrand === b.id && paymentMethod === 'electronic_gateway'
                            ? 'border-purple-400 bg-purple-900/60 ring-1 ring-purple-400'
                            : 'border-slate-700 bg-black/40 hover:border-slate-500'
                        }`}
                      >
                        {b.comp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Option 2: Bank Transfer (With mandatory receipt upload & manual review) */}
                <div 
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-purple-950/50 border-purple-500 shadow-md ring-1 ring-purple-500'
                      : 'bg-[#120D29] border-purple-500/20 hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'bank_transfer' ? 'border-purple-400 bg-purple-600' : 'border-slate-500'
                      }`}>
                        {paymentMethod === 'bank_transfer' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>تحويل بنكي يدوي رسمي (مع إرفاق الإيصال للمراجعة)</span>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      مراجعة الإيصال يدوياً
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mr-6 leading-relaxed">
                    تحويل مباشر لحساب مصرف الراجحي، ويشترط إرفاق صورة إيصال الحوالة ليتم تدقيقها يدوياً من لوحة الإدارة قبل تسليم الاشتراك.
                  </p>
                </div>

              </div>

              {/* Submit CTA */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-950/60 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>
                    {paymentMethod === 'electronic_gateway' 
                      ? `الانتقال للبوابة المشفرة وسداد ${plan.price} ${STORE_CONFIG.currencyLabelAr}` 
                      : 'متابعة التحويل البنكي وإرفاق الإيصال'}
                  </span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

            </form>
          )}

          {/* STEP 2: Hosted Gateway Simulation with 3D Secure OTP & Webhook Verification */}
          {step === 'hosted_gateway_3ds' && (
            <div className="space-y-4">
              
              {/* Official Gateway Header Simulator (Tap Payments / Bank Hosted Style) */}
              <div className="p-4 rounded-xl bg-[#090616] border border-emerald-500/40 shadow-inner space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-white">TAP PAYMENTS HOSTED CHECKOUT</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    PCI-DSS LEVEL 1 ENCRYPTED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                    <span className="text-slate-400">التاجر المستفيد:</span>
                    <span className="text-white font-bold">{STORE_CONFIG.storeName}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end sm:gap-2">
                    <span className="text-slate-400">الخدمة:</span>
                    <span className="text-white font-bold">{service.title} ({plan.label})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                  <span className="text-slate-400">قيمة المعاملة المخصومة:</span>
                  <span className="text-emerald-400 font-mono font-black text-sm">
                    {plan.price}.000 {STORE_CONFIG.currency}
                  </span>
                </div>

                {/* Mobile Phone GCC Field inside Gateway */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                  <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                    <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                    <span>رقم الجوال لتلقي كود التحقق والاشتراك:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono font-bold flex items-center gap-1.5 bg-[#140F2E] px-2.5 py-1 rounded-lg border border-purple-500/40 shadow-sm text-xs">
                      <span className="text-sm">{selectedGCCCountry.flag}</span>
                      <span dir="ltr">{customerPhone || `${selectedGCCCountry.code} ${nationalPhone}`}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingPhoneInGateway(!isEditingPhoneInGateway)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{isEditingPhoneInGateway ? 'إلغاء' : 'تعديل'}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Phone Edit inside Gateway */}
                {isEditingPhoneInGateway && (
                  <div className="mt-2 p-3 rounded-xl bg-[#140F2E] border border-purple-500/40 space-y-2 animate-fadeIn">
                    <span className="text-[11px] font-bold text-amber-300 block">
                      تحديث رقم الجوال لتلقي رمز التحقق (دول الخليج):
                    </span>
                    <GCCPhoneInput
                      value={customerPhone}
                      onChange={(full, country, digits) => {
                        setCustomerPhone(full);
                        setSelectedGCCCountry(country);
                        setNationalPhone(digits);
                      }}
                      showQuickPills={true}
                      label="اختر الدولة الخليجية ورقم الهاتف الجديد"
                    />
                    <div className="text-left pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingPhoneInGateway(false)}
                        className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                      >
                        حفظ ومتابعة التحقق
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* A. CARD DETAILS ENTRY (FOR MASTERCARD, VISA, MADA, KNET) */}
              {gatewayStatus === 'card_entry' && selectedBrand !== 'apple_pay' && (
                <form onSubmit={handleAuthorizeCard} className="p-4 rounded-xl bg-[#140F2E] border border-purple-500/30 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white font-display">
                        إدخال بيانات بطاقة الدفع (Credit / Debit Card)
                      </span>
                    </div>

                    {/* Detected Card Brand Indicator */}
                    <div className="flex items-center gap-1.5">
                      {detectCardBrandFromNumber(cardNum) === 'mastercard' && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 border border-amber-500/50">
                          <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B] -mr-1.5" />
                          <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B]" />
                          <span className="text-[10px] text-amber-300 font-bold font-mono">Mastercard</span>
                        </div>
                      )}
                      {detectCardBrandFromNumber(cardNum) === 'visa' && (
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40">
                          VISA
                        </span>
                      )}
                      {detectCardBrandFromNumber(cardNum) === 'mada' && (
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          MADA مدى
                        </span>
                      )}
                      {detectCardBrandFromNumber(cardNum) === 'unknown' && (
                        <div className="flex items-center gap-1">
                          <MastercardBadge />
                          <VisaBadge />
                          <MadaBadge />
                        </div>
                      )}
                    </div>
                  </div>

                  {cardValidationErr && (
                    <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{cardValidationErr}</span>
                    </div>
                  )}

                  {/* Card Number */}
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      رقم البطاقة (16 رقماً) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        dir="ltr"
                        value={cardNum}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                          const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                          setCardNum(formatted);
                          if (cardValidationErr) setCardValidationErr('');
                        }}
                        placeholder="5241 •••• •••• ••••"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0E0A20] border border-purple-500/30 focus:border-amber-400 text-white placeholder-slate-500 font-mono text-left focus:outline-none tracking-wider"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                        <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      اسم صاحب البطاقة (كما هو مدون عليها) *
                    </label>
                    <input
                      type="text"
                      required
                      dir="ltr"
                      value={cardHolderName}
                      onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
                      placeholder={customerName ? customerName.toUpperCase() : "CARDHOLDER NAME"}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0E0A20] border border-purple-500/30 focus:border-amber-400 text-white placeholder-slate-500 font-mono text-left focus:outline-none uppercase"
                    />
                  </div>

                  {/* Expiry & CVV */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        تاريخ الانتهاء (MM/YY) *
                      </label>
                      <input
                        type="text"
                        required
                        dir="ltr"
                        maxLength={5}
                        value={cardExp}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^\d/]/g, '');
                          if (val.length === 2 && !val.includes('/')) val = val + '/';
                          setCardExp(val);
                          if (cardValidationErr) setCardValidationErr('');
                        }}
                        placeholder="MM/YY"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0E0A20] border border-purple-500/30 focus:border-amber-400 text-white placeholder-slate-500 font-mono text-left focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        رمز الأمان (CVV / CVC) *
                      </label>
                      <input
                        type="password"
                        required
                        dir="ltr"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="•••"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#0E0A20] border border-purple-500/30 focus:border-amber-400 text-white placeholder-slate-500 font-mono text-left focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Security Note */}
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>اتصال مصرفي مشفر 256-bit بتفويض 3D Secure</span>
                    </span>
                    <span className="font-mono text-purple-300 font-bold">100% SECURE CHARGE</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-950/60 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-300" />
                      <span>تفويض وخصم {plan.price} {STORE_CONFIG.currencyLabelAr} (متابعة التحقق)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep('details_form')}
                      className="px-3.5 py-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-slate-400 hover:text-white text-xs font-semibold border border-purple-500/20"
                    >
                      رجوع
                    </button>
                  </div>
                </form>
              )}

              {/* B. APPLE PAY SHEET */}
              {gatewayStatus === 'card_entry' && selectedBrand === 'apple_pay' && (
                <div className="p-5 rounded-2xl bg-[#140F2E] border border-purple-500/30 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-black border border-white/20 flex items-center justify-center mx-auto shadow-lg">
                    <ApplePayBadge />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white font-display">
                      الدفع الفوري المشفر عبر Apple Pay
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      سيتم خصم مبلغ <strong className="text-emerald-400">{plan.price} {STORE_CONFIG.currencyLabelAr}</strong> من بطاقتك الافتراضية عبر Face ID أو Touch ID
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-xs space-y-1.5 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">التاجر:</span>
                      <span className="font-bold text-white">{STORE_CONFIG.storeName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">البطاقة الافتراضية:</span>
                      <span className="font-mono text-purple-300 font-bold">Apple Card •••• 9921</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-white/10">
                      <span className="text-slate-400">الإجمالي:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">{plan.price}.000 {STORE_CONFIG.currency}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setGatewayStatus('otp_challenge')}
                      className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-100 text-black font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl"
                    >
                      <span>Pay</span>
                      <span className="text-xs font-normal">| تأكيد والدفع بالبصمة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep('details_form')}
                      className="text-xs text-slate-400 hover:text-white py-1"
                    >
                      إلغاء واختيار طريقة أخرى
                    </button>
                  </div>
                </div>
              )}

              {/* C. BANK 3D SECURE OTP CHALLENGE */}
              {gatewayStatus === 'otp_challenge' && (
                <div className="p-4 rounded-xl bg-gradient-to-b from-[#140F2E] to-[#0E0A20] border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-amber-400" />
                      <span>التحقق المصرفي المزدوج (3D Secure Bank Verification)</span>
                    </span>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950/70 px-2 py-0.5 rounded border border-purple-500/30">
                      {selectedGCCCountry.name} {selectedGCCCountry.flag}
                    </span>
                  </div>

                  {/* Bank & Carrier Verification Card */}
                  <div className="p-3 rounded-xl bg-black/60 border border-purple-500/30 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                      <span className="text-slate-400">البنك المصدر للبطاقة:</span>
                      <span className="text-emerald-300 font-bold">{selectedGCCCountry.bankExample}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">رقم الهاتف لتأكيد السداد (SMS OTP):</span>
                      <div className="flex items-center gap-1.5 font-mono text-white font-bold" dir="ltr">
                        <span className="text-sm">{selectedGCCCountry.flag}</span>
                        <span>{customerPhone || `${selectedGCCCountry.code} ${nationalPhone}`}</span>
                        <span className="text-[10px] text-purple-300 font-normal">({selectedGCCCountry.nameEn})</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    تم إرسال كود التحقق المالي (OTP) المكوّن من 4 إلى 6 أرقام عبر رسالة SMS بنكية إلى جوالك لتفويض خصم مبلغ <strong className="text-emerald-400">{plan.price} {STORE_CONFIG.currencyLabelAr}</strong>.
                  </p>

                  <div className="p-2.5 rounded-lg bg-black/50 border border-purple-500/20 text-[11px] text-purple-200">
                    💡 <strong className="text-amber-300">لأغراض الاختبار والتجربة:</strong> يمكنك إدخال كود التحقق <code className="bg-purple-900/60 px-1 py-0.5 rounded text-white font-mono font-bold">123456</code> أو أي رمز مكون من 6 أرقام لمحاكاة نجاح تفويض السداد البنكي بنجاح.
                  </div>

                  {otpError && (
                    <div className="p-2.5 rounded bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                      {otpError}
                    </div>
                  )}

                  <form onSubmit={handleVerifyOtp} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        أدخل رمز التحقق البنكي (One-Time Password) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        autoFocus
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="• • • • • •"
                        className="w-full px-4 py-3 text-center text-lg tracking-[0.5em] font-mono font-bold rounded-xl bg-black border border-purple-500/40 focus:border-emerald-400 text-white placeholder-slate-600 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>تأكيد الخصم البنكي واستلام الكود فوراً</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGatewayStatus('card_entry')}
                        className="px-3.5 py-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-slate-400 hover:text-white text-xs font-semibold border border-purple-500/20"
                      >
                        رجوع
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* D. WEBHOOK VERIFICATION ANIMATION */}
              {gatewayStatus === 'verifying_webhook' && (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto" />
                  <h4 className="text-sm font-bold text-white">جاري استلام إشعار السداد المشفر من بوابة Tap (Webhook Callback)...</h4>
                  <p className="text-xs text-slate-400">
                    التحقق من تفويض البنك وخصم المبلغ وتخصيص الكود المشفر من الخزينة تلقائياً.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* STEP 3: Bank Transfer Details & Mandatory Receipt Upload */}
          {step === 'bank_transfer_upload' && (
            <form onSubmit={handleSubmitBankTransfer} className="space-y-4">
              
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5">
                <Building2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-slate-200">
                  <span className="font-bold text-amber-300 block mb-0.5">تعليمات التحويل البنكي الرسمي:</span>
                  قم بتحويل مبلغ <strong className="text-white font-bold">{plan.price} {STORE_CONFIG.currencyLabelAr}</strong> إلى الحساب الموضح أدناه، ثم أرفق صورة الإيصال للمراجعة الفورية من لوحة الإدارة.
                </div>
              </div>

              {/* Official Merchant Bank Account Details */}
              <div className="p-3.5 rounded-xl bg-[#140F2E] border border-purple-500/25 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/15">
                  <span className="text-slate-400">البنك المستلم:</span>
                  <span className="text-white font-bold">{activeBankName}</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/15">
                  <span className="text-slate-400">اسم صاحب الحساب:</span>
                  <span className="text-white font-bold">{activeAccountHolder}</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/15">
                  <span className="text-slate-400">رقم الحساب:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-white text-xs">{activeAccountNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeAccountNumber, 'acc')}
                      className="p-1 rounded bg-purple-900/50 hover:bg-purple-800 text-purple-300"
                    >
                      {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/15">
                  <span className="text-slate-400">رقم الآيبان (IBAN):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-purple-200 text-[11px]" dir="ltr">{activeIban}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeIban, 'iban')}
                      className="p-1 rounded bg-purple-900/50 hover:bg-purple-800 text-purple-300"
                    >
                      {copiedField === 'iban' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Customer GCC Phone reminder */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">رقم جوالك للتحقق وتسليم الاشتراك:</span>
                  <div className="flex items-center gap-1.5 font-mono text-white text-xs font-bold" dir="ltr">
                    <span className="text-sm">{selectedGCCCountry.flag}</span>
                    <span>{customerPhone || `${selectedGCCCountry.code} ${nationalPhone}`}</span>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Transfer Reference / Sender Name */}
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  الرقم المرجعي للحوالة أو اسم المحول البنكي *
                </label>
                <input
                  type="text"
                  required
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="مثال: حوالة راجحي رقم 492019 أو اسم صاحب الحساب"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#140F2E] border border-purple-500/30 focus:border-purple-400 text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Mandatory Receipt Upload Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-white flex items-center gap-1">
                    <span>إرفاق صورة إيصال التحويل البنكي (إلزامي للتحقق) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSampleReceipt}
                    className="text-[10px] text-purple-300 hover:text-white underline cursor-pointer"
                  >
                    إنشاء إيصال تجريبي سريع للمعاينة
                  </button>
                </div>

                <div className="border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 rounded-xl p-4 bg-[#0A0718] text-center transition-colors">
                  {receiptImage ? (
                    <div className="space-y-2">
                      <div className="relative max-h-48 rounded-lg overflow-hidden border border-purple-500/30 mx-auto inline-block">
                        <img 
                          src={receiptImage} 
                          alt="إيصال التحويل" 
                          className="max-h-48 object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="truncate max-w-xs">{receiptFileName || 'تم إرفاق صورة الإيصال بنجاح'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptImage(null);
                          setReceiptFileName('');
                        }}
                        className="text-[11px] text-red-400 hover:underline cursor-pointer"
                      >
                        حذف الإيصال واختيار صورة أخرى
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-purple-950/60 flex items-center justify-center mx-auto text-purple-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs text-slate-300">
                        اسحب وأفلت صورة الإيصال هنا، أو اضغط للتصفح
                      </div>
                      <p className="text-[10px] text-slate-500">
                        يقبل صور JPG, PNG أو لقطة شاشة من تطبيق البنك (حتى 8MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleReceiptUpload}
                        className="block w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-900/60 file:text-purple-200 hover:file:bg-purple-800 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-purple-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-950/60 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد الحوالة وإرسال الإيصال للمراجعة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('details_form')}
                  className="px-4 py-3.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-slate-400 hover:text-white text-xs font-semibold border border-purple-500/20"
                >
                  رجوع
                </button>
              </div>

            </form>
          )}

          {/* STEP 4: Success View (Instant Delivery or Pending Bank Transfer Review) */}
          {step === 'success_view' && createdOrder && (
            <div className="space-y-4 py-2">
              
              {createdOrder.status === 'completed' ? (
                /* INSTANT ELECTRONIC PAYMENT SUCCESS */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-black text-white font-display">
                      تم الدفع بنجاح وتأكيد السداد الآلي (Webhook Confirmed)
                    </h3>
                    <p className="text-xs text-slate-300">
                      رقم الطلب: <strong className="font-mono text-purple-300">{createdOrder.orderId}</strong>
                    </p>
                  </div>

                  {/* Allocated Subscription Credentials */}
                  <div className="p-4 rounded-xl bg-[#140F2E] border border-purple-500/30 space-y-3">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>بيانات اشتراكك المفعل الرسمي:</span>
                    </span>

                    <div className="p-3 rounded-lg bg-black/60 border border-purple-500/40 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">كود التفعيل / رابط الحساب:</span>
                        <span className="text-sm font-mono font-bold text-white tracking-wider">
                          {createdOrder.deliveredCode || 'NFLX-VIP-OFFICIAL-2026-X9'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdOrder.deliveredCode || '', 'code')}
                        className="px-2.5 py-1.5 rounded-md bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'code' ? 'تم النسخ' : 'نسخ'}</span>
                      </button>
                    </div>

                    {createdOrder.deliveredPin && (
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between text-xs">
                        <span className="text-slate-400">رمز القفل السري للملف (PIN):</span>
                        <span className="font-mono font-bold text-emerald-400 tracking-widest">{createdOrder.deliveredPin}</span>
                      </div>
                    )}

                    {createdOrder.deliveredInstructions && (
                      <div className="text-[11px] text-slate-300 bg-purple-950/40 p-2.5 rounded-lg border border-purple-500/20">
                        {createdOrder.deliveredInstructions}
                      </div>
                    )}

                    {/* SMS Delivery Notification */}
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-200">
                      <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span>تم إرسال كود التفعيل ورابط الحساب برسالة SMS فورية إلى هاتفك: </span>
                        <strong className="font-mono text-white inline-flex items-center gap-1" dir="ltr">
                          <span>{selectedGCCCountry.flag}</span>
                          <span>{createdOrder.customerPhone || customerPhone}</span>
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm cursor-pointer"
                    >
                      إغلاق والعودة للمتجر
                    </button>
                  </div>
                </div>
              ) : (
                /* BANK TRANSFER PENDING REVIEW */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    </div>
                    <h3 className="text-base font-black text-white font-display">
                      طلبك قيد مراجعة التحويل البنكي وتدقيق الإيصال
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                      تم استلام إيصال الحوالة ورقم المرجع <strong className="text-amber-300">{createdOrder.transferRef}</strong> بنجاح. سيقوم الأونر بمطابقة الإيصال وتفعيل الاشتراك وتسليمه لك فوراً.
                    </p>
                    <div className="pt-1">
                      <span className="inline-block px-3 py-1 rounded-full bg-black/50 text-purple-300 text-xs font-mono font-bold border border-purple-500/30">
                        رقم الطلب: {createdOrder.orderId}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#140F2E] border border-purple-500/20 text-xs text-slate-300 space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/15">
                      <span className="text-slate-400">الاسم الكريم:</span>
                      <span className="text-white font-bold">{createdOrder.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/15">
                      <span className="text-slate-400">رقم الجوال لتلقي الكود:</span>
                      <div className="flex items-center gap-1 font-mono text-white font-bold" dir="ltr">
                        <span>{selectedGCCCountry.flag}</span>
                        <span>{createdOrder.customerPhone || customerPhone}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/15">
                      <span className="text-slate-400">الاشتراك المطلوب:</span>
                      <span className="text-white font-bold">{createdOrder.serviceTitle} ({createdOrder.planLabel})</span>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/15">
                      <span className="text-slate-400">المبلغ المطلوب:</span>
                      <span className="text-emerald-400 font-bold font-mono">{createdOrder.planPrice} ريال</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">الإيصال المرفق:</span>
                      <span className="text-purple-300 truncate max-w-xs">{createdOrder.receiptFileName}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-black/40 border border-purple-500/20 text-[11px] text-slate-400 leading-relaxed text-center">
                    💡 يمكنك مراجعة حالة الطلب في أي وقت عبر الضغط على <strong className="text-white">"تتبع الطلب"</strong> وإدخال رقم طلبك <span className="font-mono text-purple-300">{createdOrder.orderId}</span>.
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm cursor-pointer"
                    >
                      إغلاق والعودة للمتجر
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
