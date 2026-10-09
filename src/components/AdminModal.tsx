import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Plus, 
  Trash2, 
  LogOut, 
  RefreshCw, 
  ShieldAlert, 
  Search, 
  Copy, 
  Check, 
  UserCheck, 
  UserX, 
  Users, 
  Building2, 
  AlertCircle,
  FileSpreadsheet,
  Activity,
  Sliders,
  CreditCard,
  Wallet,
  EyeOff,
  Zap,
  ArrowDownRight,
  Sparkles,
  Ban,
  ChevronDown,
  ChevronUp,
  Layers,
  PlusCircle,
  ExternalLink,
  CheckSquare
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { OFFICIAL_BANK_DETAILS, INITIAL_SERVICES } from '../data/subscriptions';
import { NetflixLogo, ShahidLogo, OsnLogo, DiscordLogo } from './BrandLogos';
import { getOutOfStockPlans, setPlanOutOfStock, depositCodesToInventory } from '../utils/storage';
import { STORE_CONFIG } from '../utils/storeConfig';

function getGCCFlag(phone?: string): string {
  if (!phone) return '📱';
  if (phone.includes('+966') || phone.startsWith('966') || phone.startsWith('05')) return '🇸🇦';
  if (phone.includes('+965') || phone.startsWith('965')) return '🇰🇼';
  if (phone.includes('+971') || phone.startsWith('971')) return '🇦🇪';
  if (phone.includes('+974') || phone.startsWith('974')) return '🇶🇦';
  if (phone.includes('+973') || phone.startsWith('973')) return '🇧🇭';
  if (phone.includes('+968') || phone.startsWith('968')) return '🇴🇲';
  return '📱';
}

interface AdminModalProps {
  onClose: () => void;
  onRefreshData: () => void;
}

export function AdminModal({ onClose, onRefreshData }: AdminModalProps) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('vaultx_admin_token'));
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; role: 'owner' | 'admin' } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('owner@vaultx.store');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard active tab
  const [activeTab, setActiveTab] = useState<'orders' | 'payout' | 'inventory' | 'users' | 'settings' | 'logs'>('orders');

  // Server Data
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Search & Filter States
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending_review' | 'paid' | 'failed'>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Receipt Preview Lightbox
  const [previewReceipt, setPreviewReceipt] = useState<{ url: string; orderId: string; customer: string } | null>(null);

  // Out of Stock & Inventory Management State
  const [outOfStockMap, setOutOfStockMap] = useState<Record<string, boolean>>(getOutOfStockPlans());
  const [inventoryPlatformFilter, setInventoryPlatformFilter] = useState<'all' | 'netflix' | 'shahid' | 'osn' | 'discord'>('all');
  const [expandedPlatformId, setExpandedPlatformId] = useState<string | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');
  
  // Deposit Codes Modal / Form State
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositServiceId, setDepositServiceId] = useState('netflix');
  const [depositDuration, setDepositDuration] = useState('1_month');
  const [depositCodesInput, setDepositCodesInput] = useState('');
  const [depositPinInput, setDepositPinInput] = useState('');
  const [depositExtraInput, setDepositExtraInput] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositFeedback, setDepositFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Add User Form State (Owner Only)
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'owner' | 'admin'>('admin');
  const [userMsg, setUserMsg] = useState('');

  // Settings & Gateway Form State
  const [settingsMsg, setSettingsMsg] = useState('');
  const [gatewayMode, setGatewayMode] = useState<'sandbox' | 'production'>('production');
  const [tapSecretKey, setTapSecretKey] = useState('');
  const [tapPublicKey, setTapPublicKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  // Payout & Settlement Form State (Mastercard & Bank IBAN)
  const [payoutMethod, setPayoutMethod] = useState<'mastercard' | 'bank_iban'>('mastercard');
  const [cardHolder, setCardHolder] = useState('STORE OWNER');
  const [cardNumber, setCardNumber] = useState('5241 8820 9102 3340');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardBank, setCardBank] = useState('مصرف الراجحي (Mastercard World)');
  const [cardBrand, setCardBrand] = useState('Mastercard');
  const [showCardNumber, setShowCardNumber] = useState(false);
  
  const [bankIban, setBankIban] = useState('SA44800004820000192837465');
  const [bankName, setBankName] = useState('مصرف الراجحي (Al Rajhi Bank)');
  const [accountHolder, setAccountHolder] = useState('مؤسسة فولت إكس للتجارة الرقمية');
  const [accountNumber, setAccountNumber] = useState('4820000192837465');
  const [bankSwift, setBankSwift] = useState('RJHISARI');

  const [payoutMsg, setPayoutMsg] = useState('');
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutTestLoading, setPayoutTestLoading] = useState(false);
  const [payoutTestResult, setPayoutTestResult] = useState<any>(null);

  useEffect(() => {
    if (token) {
      checkAuth(token);
    }
  }, []);

  const checkAuth = async (savedToken: string) => {
    try {
      const user = await apiClient.getAdminMe(savedToken);
      setCurrentUser(user);
      setIsAuthenticated(true);
      fetchAll(savedToken);
    } catch {
      localStorage.removeItem('vaultx_admin_token');
      setToken(null);
      setIsAuthenticated(false);
    }
  };

  const fetchAll = async (authToken = token) => {
    if (!authToken) return;
    setLoadingData(true);
    try {
      const [ordRes, invRes, usersRes, statsRes, setRes, logsRes] = await Promise.allSettled([
        apiClient.getAdminOrders(authToken),
        apiClient.getAdminInventory(authToken),
        apiClient.getAdminUsers(authToken),
        apiClient.getAdminStats(authToken),
        apiClient.getAdminSettings(authToken),
        apiClient.getAuditLogs(authToken)
      ]);

      if (ordRes.status === 'fulfilled') setOrders(ordRes.value);
      if (invRes.status === 'fulfilled') {
        const val = invRes.value;
        if (Array.isArray(val)) {
          setInventory(val);
        } else if (val && val.inventory) {
          setInventory(val.inventory);
          if (val.outOfStockPlans) {
            setOutOfStockMap(val.outOfStockPlans);
          }
        }
      }
      if (usersRes.status === 'fulfilled') setUsersList(usersRes.value);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (setRes.status === 'fulfilled') {
        const s = setRes.value;
        setSettings(s);
        setGatewayMode(s.gatewayMode || 'production');
        if (s.merchantPayoutMethod) setPayoutMethod(s.merchantPayoutMethod);
        if (s.merchantCardNumber) setCardNumber(s.merchantCardNumber);
        if (s.merchantCardHolder) setCardHolder(s.merchantCardHolder);
        if (s.merchantCardExpiry) setCardExpiry(s.merchantCardExpiry);
        if (s.merchantCardBank) setCardBank(s.merchantCardBank);
        if (s.merchantCardBrand) setCardBrand(s.merchantCardBrand);
        if (s.merchantIban) setBankIban(s.merchantIban);
        if (s.merchantBankName) setBankName(s.merchantBankName);
        if (s.merchantAccountHolder) setAccountHolder(s.merchantAccountHolder);
        if (s.merchantAccountNumber) setAccountNumber(s.merchantAccountNumber);
        if (s.merchantSwift) setBankSwift(s.merchantSwift);
        if (s.tapPublicKey) setTapPublicKey(s.tapPublicKey);
      }
      if (logsRes.status === 'fulfilled') setAuditLogs(logsRes.value);

      onRefreshData();
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const data = await apiClient.adminLogin(loginEmail.trim(), loginPassword);
      setToken(data.token);
      localStorage.setItem('vaultx_admin_token', data.token);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      fetchAll(data.token);
    } catch (err: any) {
      setLoginError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await apiClient.adminLogout(token);
    }
    localStorage.removeItem('vaultx_admin_token');
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Orders Actions
  const handleApprove = async (orderId: string) => {
    if (!token) return;
    try {
      const res = await apiClient.approveOrder(token, orderId);
      alert(`✅ تم اعتماد الحوالة بنجاح وتخصيص الكود: ${res.allocatedCode}`);
      fetchAll();
    } catch (err: any) {
      alert(`❌ خطأ: ${err.message}`);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!token) return;
    const reason = prompt('يرجى كتابة سبب رفض الحوالة البنكية:');
    if (reason === null) return;
    try {
      await apiClient.rejectOrder(token, orderId, reason);
      alert('تم رفض الطلب بنجاح');
      fetchAll();
    } catch (err: any) {
      alert(`❌ خطأ: ${err.message}`);
    }
  };

  // Helpers
  const getDurationLabel = (d: string) => {
    switch (d) {
      case '1_month': return 'شهر واحد';
      case '3_months': return 'ثلاث شهور';
      case '6_months': return 'ست شهور';
      case '1_year': return 'سنة كاملة';
      case '1_year_premium': return 'سنة مميزة 👑';
      default: return d;
    }
  };

  const getServiceTitle = (id: string) => {
    switch (id) {
      case 'netflix': return 'نتفليكس (Netflix)';
      case 'shahid': return 'شاهد VIP (Shahid)';
      case 'osn': return 'أو إس إن (OSN+)';
      case 'discord': return 'ديسكورد نايترو (Discord)';
      default: return id;
    }
  };

  // Inventory & Stock Management Actions
  const handleOpenDeposit = (serviceId: string, duration?: string) => {
    setDepositServiceId(serviceId);
    if (duration) setDepositDuration(duration);
    setDepositFeedback(null);
    setDepositModalOpen(true);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositCodesInput.trim()) return;

    setDepositLoading(true);
    setDepositFeedback(null);

    const lines = depositCodesInput
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setDepositFeedback({ type: 'error', msg: 'يرجى كتابة كود واحد على الأقل للإيداع' });
      setDepositLoading(false);
      return;
    }

    try {
      if (token) {
        const res = await apiClient.depositInventoryCodes(token, {
          serviceId: depositServiceId,
          duration: depositDuration,
          codes: lines,
          pin: depositPinInput.trim() || undefined,
          extraInfo: depositExtraInput.trim() || undefined
        });
        if (res.outOfStockPlans) {
          setOutOfStockMap(res.outOfStockPlans);
        }
      }

      depositCodesToInventory(
        depositServiceId as any,
        depositDuration as any,
        lines,
        depositPinInput.trim() || undefined,
        depositExtraInput.trim() || undefined
      );

      setDepositFeedback({
        type: 'success',
        msg: `✅ تم إيداع ${lines.length} كود بنجاح في مخزون (${getServiceTitle(depositServiceId)} - ${getDurationLabel(depositDuration)})!`
      });
      setDepositCodesInput('');
      setDepositPinInput('');
      setDepositExtraInput('');
      fetchAll();
      onRefreshData();
    } catch (err: any) {
      setDepositFeedback({ type: 'error', msg: `❌ ${err.message || 'فشل إيداع الأكواد'}` });
    } finally {
      setDepositLoading(false);
    }
  };

  const handleToggleStock = async (serviceId: string, duration?: string) => {
    const key = duration && duration !== 'all' ? `${serviceId}_${duration}` : `${serviceId}_all`;
    const nextVal = !outOfStockMap[key];

    // Optimistic local update
    const updated = setPlanOutOfStock(serviceId as any, duration as any, nextVal);
    setOutOfStockMap({ ...updated });

    if (token) {
      try {
        const res = await apiClient.toggleStockStatus(token, {
          serviceId,
          duration,
          isOutOfStock: nextVal
        });
        if (res.outOfStockPlans) {
          setOutOfStockMap(res.outOfStockPlans);
        }
      } catch (err) {
        console.error('Failed to sync stock status to server:', err);
      }
    }
    onRefreshData();
  };

  const handleDeleteCode = async (id: string) => {
    if (!token || !confirm('هل أنت متأكد من حذف هذا الكود نهائياً من المخزون؟')) return;
    try {
      await apiClient.deleteInventoryCode(token, id);
      fetchAll();
      onRefreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Users Actions (Owner Only)
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await apiClient.addAdminUser(token, {
        email: newUserEmail.trim(),
        name: newUserName.trim(),
        password: newUserPassword,
        role: newUserRole
      });
      setUserMsg('✅ تم إنشاء الحساب بنجاح وتفعيله');
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setTimeout(() => setUserMsg(''), 3000);
      fetchAll();
    } catch (err: any) {
      setUserMsg(`❌ ${err.message}`);
    }
  };

  const handleToggleUser = async (userId: string) => {
    if (!token) return;
    try {
      await apiClient.toggleAdminUser(token, userId);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token || !confirm('هل أنت متأكد من حذف هذا الحساب؟')) return;
    try {
      await apiClient.deleteAdminUser(token, userId);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Settings Actions
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await apiClient.updateAdminSettings(token, {
        gatewayMode,
        tapSecretKey: tapSecretKey.trim() || undefined,
        tapPublicKey: tapPublicKey.trim() || undefined,
        webhookSecret: webhookSecret.trim() || undefined
      });
      setSettingsMsg('✅ تم حفظ إعدادات البوابة والربط بنجاح');
      setTimeout(() => setSettingsMsg(''), 3500);
      fetchAll();
    } catch (err: any) {
      setSettingsMsg(`❌ ${err.message}`);
    }
  };

  // Payout & Mastercard Settings Actions
  const handleSavePayoutSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSavingPayout(true);
    setPayoutMsg('');
    try {
      await apiClient.updateAdminSettings(token, {
        merchantPayoutMethod: payoutMethod,
        merchantCardNumber: cardNumber.trim(),
        merchantCardHolder: cardHolder.trim(),
        merchantCardExpiry: cardExpiry.trim(),
        merchantCardBank: cardBank.trim(),
        merchantCardBrand: cardBrand,
        merchantIban: bankIban.trim(),
        merchantBankName: bankName.trim(),
        merchantAccountHolder: accountHolder.trim(),
        merchantAccountNumber: accountNumber.trim(),
        merchantSwift: bankSwift.trim(),
        gatewayMode,
        tapSecretKey: tapSecretKey.trim() || undefined,
        tapPublicKey: tapPublicKey.trim() || undefined,
        webhookSecret: webhookSecret.trim() || undefined
      });
      setPayoutMsg('✅ تم حفظ وتحديث بيانات استلام الأرباح والماستركارد والآيبان بنجاح في النظام');
      setTimeout(() => setPayoutMsg(''), 5000);
      fetchAll();
    } catch (err: any) {
      setPayoutMsg(`❌ ${err.message || 'فشل حفظ بيانات الاستلام'}`);
    } finally {
      setSavingPayout(false);
    }
  };

  // Test Payout Routing Simulation
  const handleTestPayoutRouting = async () => {
    if (!token) return;
    setPayoutTestLoading(true);
    setPayoutTestResult(null);
    try {
      const res = await apiClient.triggerAdminPayoutTest(token);
      setPayoutTestResult(res);
      fetchAll();
    } catch (err: any) {
      alert(`❌ ${err.message || 'فشل فحص تحويل الأرباح'}`);
    } finally {
      setPayoutTestLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = orderFilter === 'all' || o.status === orderFilter;
    const q = orderSearch.trim().toLowerCase();
    const matchesSearch = 
      !q ||
      o.orderId.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      (o.transferRef && o.transferRef.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const pendingReviewCount = orders.filter(o => o.status === 'pending_review').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0C081E] rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-950/90 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-purple-500/20 flex items-center justify-between bg-[#120D2A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white font-display">
                  لوحة تحكم الإدارة والمالك (Owner / Admin Portal)
                </h3>
                {currentUser && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    currentUser.role === 'owner' 
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40' 
                      : 'bg-purple-950 text-purple-300 border border-purple-500/40'
                  }`}>
                    {currentUser.role === 'owner' ? '👑 OWNER (مالك)' : '🛡️ ADMIN (مدير)'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                تحكم بالطلبات، التحقق من الحوالات، المخزون، الحسابات المصرح لها، والربط المالي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                type="button"
                className="px-2.5 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/50 text-red-300 text-xs font-semibold border border-red-500/30 flex items-center gap-1 cursor-pointer"
                title="تسجيل الخروج وقفل اللوحة"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تسجيل خروج</span>
              </button>
            )}
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-lg bg-purple-950/50 hover:bg-purple-900/50 text-slate-400 hover:text-white flex items-center justify-center border border-purple-500/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SCREEN 1: Real Server Authentication Form */}
        {!isAuthenticated && (
          <div className="p-6 sm:p-8 space-y-6 max-w-md mx-auto my-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border border-purple-500/40 p-0.5 mx-auto flex items-center justify-center shadow-xl shadow-purple-950/60">
              <KeyRound className="w-8 h-8 text-purple-400" />
            </div>

            <div>
              <h4 className="text-lg font-black text-white font-display">
                تسجيل دخول المالك والمدير (Owner Access)
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                الدخول محمي بالكامل من جهة السيرفر مع حماية ضد محاولات التخمين (Brute Force)
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">البريد الإلكتروني المعتمد *</label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="owner@vaultx.store"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#140F2E] border border-purple-500/30 focus:border-amber-400 text-white placeholder-slate-500 text-left focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور السرية *</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#140F2E] border border-purple-500/30 focus:border-amber-400 text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-200 leading-relaxed text-right">
                <span className="font-bold text-amber-300 block mb-1">🔐 بيانات الحسابين المصرحين مبدئياً:</span>
                • المالك الأساسي: <code className="bg-black/50 px-1 py-0.5 rounded text-white" dir="ltr">owner@vaultx.store</code> (كلمة السر: <code className="text-amber-300">OwnerSecure2026!</code>)<br />
                • المدير المساعد: <code className="bg-black/50 px-1 py-0.5 rounded text-white" dir="ltr">admin@vaultx.store</code> (كلمة السر: <code className="text-amber-300">AdminVaultX2026!</code>)
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-950/60 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التحقق عبر السيرفر...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>تسجيل الدخول وفتح لوحة الإدارة</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* SCREEN 2: Authenticated Owner Dashboard */}
        {isAuthenticated && (
          <div className="flex flex-col flex-1 overflow-hidden">
            
            {/* Top Navigation Tabs */}
            <div className="px-5 border-b border-purple-500/15 bg-[#0E0A22] flex items-center gap-2 overflow-x-auto">
              {[
                { id: 'orders', label: 'إدارة الطلبات والحوالات', count: pendingReviewCount, alert: pendingReviewCount > 0 },
                { id: 'payout', label: '💳 استلام الأرباح والماستركارد / الآيبان' },
                { id: 'inventory', label: 'المخزون والأكواد', count: inventory.filter(i => !i.isUsed).length },
                { id: 'users', label: 'حسابات الإدارة (Owner/Admin)', count: usersList.length },
                { id: 'settings', label: 'إعدادات البوابة والخصم الحقيقي' },
                { id: 'logs', label: 'سجل العمليات (Audit Logs)', count: auditLogs.length }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === t.id
                      ? 'border-purple-400 text-white bg-purple-950/30'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      t.alert 
                        ? 'bg-amber-500 text-black font-black animate-pulse' 
                        : 'bg-purple-900/60 text-purple-200'
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* TAB 1: ORDERS & BANK TRANSFER REVIEW */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  
                  {/* Top Stats Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-[#140F2E] border border-purple-500/20 text-center">
                      <span className="text-[10px] text-slate-400 block">إجمالي الطلبات</span>
                      <span className="text-base font-black text-white font-mono">{orders.length}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-center">
                      <span className="text-[10px] text-amber-300 block">حوالات بانتظار التدقيق</span>
                      <span className="text-base font-black text-amber-200 font-mono">{pendingReviewCount}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center">
                      <span className="text-[10px] text-emerald-300 block">طلبات مدفوعة ومسلّمة</span>
                      <span className="text-base font-black text-emerald-200 font-mono">{orders.filter(o => o.status === 'paid').length}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-center">
                      <span className="text-[10px] text-purple-300 block">إجمالي المبيعات</span>
                      <span className="text-base font-black text-white font-mono">{stats?.totalRevenue || 0} ر.س</span>
                    </div>
                  </div>

                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="بحث برقم الطلب، اسم العميل، الإيميل، الجوال، أو مرجع الحوالة..."
                        className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-[#140F2E] border border-purple-500/30 focus:border-purple-400 text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-[#120D29] rounded-xl border border-purple-500/20 text-xs">
                      {[
                        { id: 'all', label: 'الكل' },
                        { id: 'pending_review', label: 'بانتظار المراجعة' },
                        { id: 'paid', label: 'مدفوع' },
                        { id: 'failed', label: 'مرفوض/فاشل' }
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setOrderFilter(f.id as any)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                            orderFilter === f.id ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orders List */}
                  {filteredOrders.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs bg-[#120D29] rounded-xl border border-purple-500/15">
                      لا توجد طلبات تطابق معايير البحث.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.map((ord) => (
                        <div
                          key={ord.orderId}
                          className={`p-4 rounded-xl border transition-all ${
                            ord.status === 'pending_review'
                              ? 'bg-amber-950/20 border-amber-500/40 shadow-lg'
                              : ord.status === 'paid'
                              ? 'bg-[#120D29] border-purple-500/20'
                              : 'bg-red-950/20 border-red-500/20'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-purple-500/15">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded border border-purple-500/30">
                                {ord.orderId}
                              </span>
                              <span className="text-xs font-bold text-white">
                                {ord.serviceTitle} ({ord.planLabel})
                              </span>
                              <span className="text-xs font-mono text-purple-300 font-bold">
                                {ord.planPrice} ر.س
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                ord.status === 'paid'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : ord.status === 'pending_review'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                  : ord.status === 'pending_payment'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}>
                                {ord.status === 'paid' && '✅ مدفوع ومسلّم'}
                                {ord.status === 'pending_review' && '⏳ بانتظار تدقيق الحوالة'}
                                {ord.status === 'pending_payment' && '🔄 بانتظار إتمام الدفع'}
                                {ord.status === 'failed' && '❌ مرفوض'}
                                {ord.status === 'cancelled' && '🚫 ملغي'}
                              </span>

                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(ord.createdAt).toLocaleDateString('ar-SA')}
                              </span>
                            </div>
                          </div>

                          {/* Customer & Payment details */}
                          <div className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300">
                            <div>
                              <span className="text-slate-400 block text-[10px]">العميل:</span>
                              <span className="font-bold text-white">{ord.customerName}</span>
                              <span className="inline-flex items-center gap-1 text-[11px] text-purple-200 font-mono mt-0.5" dir="ltr">
                                <span>{getGCCFlag(ord.customerPhone)}</span>
                                <span>{ord.customerPhone}</span>
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 block text-[10px]">طريقة السداد:</span>
                              <span className="font-bold text-white">
                                {ord.paymentMethod === 'electronic_gateway' 
                                  ? `بوابة إلكترونية (${ord.paymentBrand || '3DS'})` 
                                  : 'تحويل بنكي يدوي'}
                              </span>
                              {ord.transferRef && (
                                <span className="block text-[11px] text-amber-300 font-mono">مرجع: {ord.transferRef}</span>
                              )}
                            </div>

                            {/* Bank Receipt Action */}
                            <div>
                              <span className="text-slate-400 block text-[10px]">الإيصال البنكي:</span>
                              {ord.receiptFilePath ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewReceipt({
                                    url: ord.receiptFilePath!,
                                    orderId: ord.orderId,
                                    customer: ord.customerName
                                  })}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-900/50 hover:bg-purple-800 text-purple-200 text-xs font-semibold border border-purple-500/30 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>معاينة الإيصال</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-500">لا يوجد إيصال (سداد إلكتروني)</span>
                              )}
                            </div>
                          </div>

                          {/* Subscription Delivery Info */}
                          {ord.deliveredCode && (
                            <div className="p-2.5 rounded-lg bg-black/50 border border-emerald-500/30 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-[10px] text-emerald-400 block">كود الاشتراك المسلم للعميل:</span>
                                <span className="font-mono font-bold text-white">{ord.deliveredCode}</span>
                                {ord.deliveredPin && <span className="font-mono text-purple-300 mr-2">(PIN: {ord.deliveredPin})</span>}
                              </div>
                            </div>
                          )}

                          {/* Pending Review Actions */}
                          {ord.status === 'pending_review' && (
                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-purple-500/15">
                              <button
                                type="button"
                                onClick={() => handleApprove(ord.orderId)}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>اعتماد الحوالة وتسليم الكود آلياً</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleReject(ord.orderId)}
                                className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 font-semibold text-xs border border-red-500/30 cursor-pointer flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>رفض الطلب</span>
                              </button>
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: INVENTORY & CODES (PER-PLATFORM MANAGEMENT) */}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  
                  {/* Top Stats & Quick Deposit Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#170E38] via-[#140F2E] to-[#120B29] border border-purple-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="grid grid-cols-3 gap-3 flex-1">
                      <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center">
                        <span className="text-[10px] text-emerald-300 block">أكواد جاهزة بالمخزون</span>
                        <span className="text-base font-black text-emerald-200 font-mono">
                          {inventory.filter(i => !i.isUsed).length}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-center">
                        <span className="text-[10px] text-purple-300 block">أكواد مسلمة للعملاء</span>
                        <span className="text-base font-black text-white font-mono">
                          {inventory.filter(i => i.isUsed).length}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/30 text-center">
                        <span className="text-[10px] text-red-300 block">باقات موسومة بنفاذ</span>
                        <span className="text-base font-black text-red-200 font-mono">
                          {Object.keys(outOfStockMap).length}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenDeposit('netflix', '1_month')}
                      className="py-3 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-950/60 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                    >
                      <PlusCircle className="w-4 h-4 text-purple-200" />
                      <span>إيداع أكواد جديدة للمخزون</span>
                    </button>
                  </div>

                  {/* Filter Pills for Platforms */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs text-slate-400 font-bold ml-1">عرض منصة:</span>
                    {[
                      { id: 'all', label: 'جميع المنصات (4)' },
                      { id: 'netflix', label: 'نتفليكس (Netflix)' },
                      { id: 'shahid', label: 'شاهد VIP' },
                      { id: 'osn', label: 'أو إس إن (OSN+)' },
                      { id: 'discord', label: 'ديسكورد نايترو' }
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => setInventoryPlatformFilter(btn.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          inventoryPlatformFilter === btn.id
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-900/60'
                            : 'bg-[#140F2E] text-slate-300 hover:text-white border border-purple-500/20'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* PLATFORMS LIST */}
                  <div className="space-y-6">
                    {INITIAL_SERVICES
                      .filter(s => inventoryPlatformFilter === 'all' || s.id === inventoryPlatformFilter)
                      .map((srv) => {
                        const platformCodes = inventory.filter(i => i.serviceId === srv.id);
                        const platformAvailableCount = platformCodes.filter(i => !i.isUsed).length;
                        const isServiceOut = !!outOfStockMap[`${srv.id}_all`];
                        const isExpanded = expandedPlatformId === srv.id;

                        const renderPlatformLogo = (id: string) => {
                          switch (id) {
                            case 'netflix': return <NetflixLogo className="w-7 h-7" />;
                            case 'shahid': return <ShahidLogo className="w-7 h-7" />;
                            case 'osn': return <OsnLogo className="w-7 h-7" />;
                            case 'discord': return <DiscordLogo className="w-7 h-7" />;
                            default: return <Sparkles className="w-7 h-7 text-purple-400" />;
                          }
                        };

                        return (
                          <div 
                            key={srv.id}
                            className="rounded-2xl bg-[#100B26] border border-purple-500/25 overflow-hidden shadow-xl space-y-4 p-4 sm:p-5"
                          >
                            {/* Product Image Cover Header */}
                            <div className="relative aspect-[21/8] sm:aspect-[24/7] w-full rounded-xl overflow-hidden border border-purple-500/30 shadow-md">
                              <img 
                                src={srv.bannerImage} 
                                alt={srv.title} 
                                className="w-full h-full object-cover" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#100B26] via-[#100B26]/60 to-black/40" />

                              <div className="absolute inset-0 p-3.5 sm:p-4 flex flex-col justify-between">
                                {/* Top Badges & Platform Actions */}
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/80 text-purple-200 border border-purple-500/40 font-mono">
                                      {srv.id.toUpperCase()}
                                    </span>
                                    {isServiceOut ? (
                                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-950/90 text-red-300 border border-red-500/50 flex items-center gap-1">
                                        <Ban className="w-3 h-3 text-red-400" />
                                        <span>نفاذ المخزون بالكامل</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span>متوفر ({platformAvailableCount} كود جاهز)</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStock(srv.id, 'all')}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                        isServiceOut
                                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                                          : 'bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40'
                                      }`}
                                      title={isServiceOut ? 'إلغاء حالة النفاذ وإتاحة المنصة' : 'إعلان نفاذ جميع باقات هذه المنصة'}
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                      <span>{isServiceOut ? 'إلغاء نفاذ المنصة' : 'إعلان نفاذ المنصة'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenDeposit(srv.id, '1_month')}
                                      className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-950/60"
                                    >
                                      <PlusCircle className="w-3.5 h-3.5" />
                                      <span>إيداع أكواد</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Bottom Branding */}
                                <div className="flex items-center gap-3">
                                  <div className="w-11 h-11 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center shrink-0">
                                    {renderPlatformLogo(srv.id)}
                                  </div>
                                  <div>
                                    <h3 className="text-sm sm:text-base font-black text-white font-display drop-shadow">
                                      {srv.title}
                                    </h3>
                                    <p className="text-[11px] text-purple-200 font-mono drop-shadow">
                                      {srv.titleEn}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Plan Durations Grid: شهر، ثلاث شهور، ست شهور، سنة */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-300">
                                  باقات المدد الزمنية وخيارات النفاذ والإيداع:
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {srv.plans.length} مدد اشتراك رسمية
                                </span>
                              </div>

                              <div className={`grid gap-2.5 ${srv.plans.length === 5 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
                                {srv.plans.map((p) => {
                                  const planAvailableCodes = inventory.filter(i => i.serviceId === srv.id && i.duration === p.duration && !i.isUsed);
                                  const planUsedCodes = inventory.filter(i => i.serviceId === srv.id && i.duration === p.duration && i.isUsed);
                                  const isPlanOut = isServiceOut || !!outOfStockMap[`${srv.id}_${p.duration}`];

                                  return (
                                    <div
                                      key={p.duration}
                                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                                        isPlanOut
                                          ? 'bg-red-950/20 border-red-500/40'
                                          : planAvailableCodes.length > 0
                                          ? 'bg-[#150F30] border-purple-500/30'
                                          : 'bg-[#120D26] border-purple-500/15'
                                      }`}
                                    >
                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="text-xs font-black text-white">{p.label}</span>
                                          <span className="text-xs font-mono font-bold text-purple-300">
                                            {p.price} {STORE_CONFIG.currencyLabelAr}
                                          </span>
                                        </div>

                                        {/* Status indicator */}
                                        <div className="mb-2.5">
                                          {isPlanOut ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">
                                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                              <span>نفاذ المخزون</span>
                                            </span>
                                          ) : planAvailableCodes.length > 0 ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                              <span>متوفر ({planAvailableCodes.length} كود)</span>
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                              <span>0 كود (إيداع مطلوب)</span>
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Action buttons */}
                                      <div className="pt-2 border-t border-purple-500/15 flex items-center gap-1.5">
                                        {/* Toggle Out of Stock Button */}
                                        <button
                                          type="button"
                                          onClick={() => handleToggleStock(srv.id, p.duration)}
                                          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                            isPlanOut
                                              ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/40'
                                              : 'bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/30'
                                          }`}
                                          title={isPlanOut ? 'إلغاء وسم النفاذ وإتاحة الباقة' : 'تحديد نفاذ هذه الباقة'}
                                        >
                                          <Ban className="w-3 h-3" />
                                          <span>{isPlanOut ? 'إلغاء النفاذ' : 'تحديد نفاذ'}</span>
                                        </button>

                                        {/* Deposit Codes Button */}
                                        <button
                                          type="button"
                                          onClick={() => handleOpenDeposit(srv.id, p.duration)}
                                          className="flex-1 py-1.5 px-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                                        >
                                          <Plus className="w-3 h-3" />
                                          <span>إيداع كود</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Collapsible View of Deposited Codes for this Platform */}
                            <div className="pt-2 border-t border-purple-500/15">
                              <button
                                type="button"
                                onClick={() => setExpandedPlatformId(isExpanded ? null : srv.id)}
                                className="w-full py-2 px-3 rounded-xl bg-[#140F2E] hover:bg-[#181136] border border-purple-500/20 text-xs font-bold text-slate-300 flex items-center justify-between cursor-pointer"
                              >
                                <span className="flex items-center gap-2">
                                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                                  <span>استعراض وإدارة الأكواد المخزنة لهذه المنصة ({platformCodes.length} كود)</span>
                                </span>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>

                              {isExpanded && (
                                <div className="mt-2.5 space-y-2 p-3 rounded-xl bg-[#0C081E] border border-purple-500/20 max-h-60 overflow-y-auto">
                                  {platformCodes.length === 0 ? (
                                    <p className="text-center py-4 text-xs text-slate-500">
                                      لا توجد أكواد مودعة لهذه المنصة بعد. اضغط "إيداع أكواد" لإضافة أكواد جديدة.
                                    </p>
                                  ) : (
                                    platformCodes.map((item) => (
                                      <div
                                        key={item.id}
                                        className="p-2.5 rounded-lg bg-[#140F2E] border border-purple-500/15 flex items-center justify-between text-xs gap-2"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="px-2 py-0.5 rounded bg-black/60 text-purple-300 font-mono text-[10px] font-bold shrink-0">
                                            {getDurationLabel(item.duration)}
                                          </span>
                                          <span className="font-mono text-white truncate max-w-xs select-all">
                                            {item.code}
                                          </span>
                                          {item.pin && (
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-emerald-400 shrink-0">
                                              PIN: {item.pin}
                                            </span>
                                          )}
                                          {item.extraInfo && (
                                            <span className="text-[10px] text-slate-400 truncate hidden md:inline">
                                              ({item.extraInfo})
                                            </span>
                                          )}
                                          {item.isUsed ? (
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">مستخدم</span>
                                          ) : (
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 shrink-0">متاح</span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              navigator.clipboard.writeText(item.code);
                                              alert('تم نسخ الكود للحافظة');
                                            }}
                                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-purple-950/60 cursor-pointer"
                                            title="نسخ الكود"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                          </button>
                                          {!item.isUsed && (
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteCode(item.id)}
                                              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 cursor-pointer"
                                              title="حذف من المخزون"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })}
                  </div>

                  {/* DEPOSIT CODES MODAL / DRAWER */}
                  {depositModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
                      <div className="relative w-full max-w-lg bg-[#0E0A22] rounded-2xl border border-purple-500/30 shadow-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                          <div className="flex items-center gap-2">
                            <PlusCircle className="w-5 h-5 text-purple-400" />
                            <h3 className="text-sm font-black text-white font-display">
                              إيداع أكواد جديدة في الخزينة
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDepositModalOpen(false)}
                            className="w-7 h-7 rounded-lg bg-purple-950/50 hover:bg-purple-900/50 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {depositFeedback && (
                          <div className={`p-3 rounded-xl text-xs ${
                            depositFeedback.type === 'success'
                              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                              : 'bg-red-950/60 border border-red-500/40 text-red-200'
                          }`}>
                            {depositFeedback.msg}
                          </div>
                        )}

                        <form onSubmit={handleDepositSubmit} className="space-y-3.5">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-300 mb-1">المنصة المستهدفة *</label>
                              <select
                                value={depositServiceId}
                                onChange={(e) => setDepositServiceId(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-[#140F2E] border border-purple-500/30 text-white font-bold"
                              >
                                <option value="netflix">نتفليكس (Netflix)</option>
                                <option value="shahid">شاهد VIP (Shahid)</option>
                                <option value="osn">أو إس إن (OSN+)</option>
                                <option value="discord">ديسكورد نايترو (Discord)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-300 mb-1">مدة الاشتراك *</label>
                              <select
                                value={depositDuration}
                                onChange={(e) => setDepositDuration(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-[#140F2E] border border-purple-500/30 text-white font-bold"
                              >
                                <option value="1_month">شهر واحد</option>
                                <option value="3_months">3 أشهر</option>
                                <option value="6_months">6 أشهر</option>
                                <option value="1_year">سنة كاملة</option>
                                {depositServiceId === 'netflix' && (
                                  <option value="1_year_premium">سنة مميزة 👑</option>
                                )}
                              </select>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold text-slate-300">
                                أكواد الاشتراك (كود واحد أو أكواد متعددة، كل كود بسطر مستقل) *
                              </label>
                              <span className="text-[10px] font-mono text-purple-300">
                                {depositCodesInput.split(/\r?\n/).filter(l => l.trim()).length} كود مكتشف
                              </span>
                            </div>
                            <textarea
                              required
                              rows={4}
                              value={depositCodesInput}
                              onChange={(e) => setDepositCodesInput(e.target.value)}
                              placeholder={`NFLX-CODE-1111\nNFLX-CODE-2222\nNFLX-CODE-3333`}
                              className="w-full px-3 py-2 text-xs rounded-xl bg-[#090616] border border-purple-500/30 focus:border-purple-400 text-white placeholder-slate-600 font-mono text-left focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] text-slate-300 mb-1">
                                رقم PIN / الحساب الإضافي (اختياري)
                              </label>
                              <input
                                type="text"
                                value={depositPinInput}
                                onChange={(e) => setDepositPinInput(e.target.value)}
                                placeholder="مثال: 7721"
                                className="w-full px-3 py-2 text-xs rounded-xl bg-[#140F2E] border border-purple-500/30 text-white placeholder-slate-500 font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-300 mb-1">
                                ملاحظات العميل (رقم الملف، شروط)
                              </label>
                              <input
                                type="text"
                                value={depositExtraInput}
                                onChange={(e) => setDepositExtraInput(e.target.value)}
                                placeholder="مثال: الملف رقم [1]"
                                className="w-full px-3 py-2 text-xs rounded-xl bg-[#140F2E] border border-purple-500/30 text-white placeholder-slate-500"
                              />
                            </div>
                          </div>

                          <div className="pt-2 flex items-center justify-end gap-2 border-t border-purple-500/15">
                            <button
                              type="button"
                              onClick={() => setDepositModalOpen(false)}
                              className="px-4 py-2.5 rounded-xl bg-purple-950/40 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                            >
                              إلغاء
                            </button>

                            <button
                              type="submit"
                              disabled={depositLoading || !depositCodesInput.trim()}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950/60 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {depositLoading ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>جاري الإيداع في الخزينة...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>إيداع الأكواد وحفظها بالمخزون</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: AUTHORIZED USERS (OWNER ONLY) */}
              {activeTab === 'users' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                      <Users className="w-4 h-4 text-amber-300" />
                      <span>نظام الحسابات المصرح لها (Authorized Owner & Admin Accounts)</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      يسمح فقط للحسابات المسجلة هنا بالوصول للوحة الإدارة. لا يمكن لأي مستخدم عادي إنشاء حساب لنفسه أو رفع صلاحياته.
                    </p>
                  </div>

                  {currentUser?.role === 'owner' ? (
                    <form onSubmit={handleAddUser} className="p-4 rounded-xl bg-[#140F2E] border border-purple-500/25 space-y-3">
                      <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-display">
                        <Plus className="w-4 h-4 text-amber-400" />
                        <span>إضافة حساب Owner أو Admin جديد</span>
                      </h4>

                      {userMsg && (
                        <div className="p-2.5 rounded bg-purple-950/60 border border-purple-500/30 text-xs text-purple-200">
                          {userMsg}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">اسم المسؤول</label>
                          <input
                            type="text"
                            required
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            placeholder="مثال: فهد السالم"
                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#0E0A20] border border-purple-500/30 text-white placeholder-slate-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">البريد الإلكتروني</label>
                          <input
                            type="email"
                            required
                            dir="ltr"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="admin2@vaultx.store"
                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#0E0A20] border border-purple-500/30 text-white placeholder-slate-500 text-left"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">كلمة المرور (8 أحرف على الأقل)</label>
                          <input
                            type="password"
                            required
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#0E0A20] border border-purple-500/30 text-white placeholder-slate-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">الصلاحية (Role)</label>
                          <select
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as any)}
                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#0E0A20] border border-purple-500/30 text-white"
                          >
                            <option value="admin">Admin (مدير عمليات)</option>
                            <option value="owner">Owner (مالك متجر)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>إنشاء الحساب وتفويضه</span>
                      </button>
                    </form>
                  ) : (
                    <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-400">
                      🔒 إضافة وتعديل الحسابات متاح حصرياً للمالك الأساسي (Owner).
                    </div>
                  )}

                  {/* Users Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-300">قائمة الحسابات المصرح لها بالدخول:</h4>
                    <div className="space-y-2">
                      {usersList.map((u) => (
                        <div
                          key={u.id}
                          className="p-3.5 rounded-xl bg-[#120D29] border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-black/50 border border-purple-500/30 flex items-center justify-center font-bold text-white">
                              {u.name.substring(0, 2)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{u.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                  u.role === 'owner' ? 'bg-amber-950 text-amber-300' : 'bg-purple-950 text-purple-300'
                                }`}>
                                  {u.role.toUpperCase()}
                                </span>
                                {u.isActive ? (
                                  <span className="text-[10px] text-emerald-400">● نشط</span>
                                ) : (
                                  <span className="text-[10px] text-red-400">● معطل</span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono" dir="ltr">{u.email}</span>
                            </div>
                          </div>

                          {currentUser?.role === 'owner' && u.id !== currentUser.id && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleUser(u.id)}
                                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer border ${
                                  u.isActive 
                                    ? 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-900/50' 
                                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/50'
                                }`}
                              >
                                {u.isActive ? 'تعطيل' : 'تفعيل'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1 rounded bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-500/30 cursor-pointer"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PAYOUT & SETTLEMENT (MASTERCARD & IBAN) */}
              {activeTab === 'payout' && (
                <div className="space-y-6">
                  
                  {/* Top Notification Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-purple-950/80 border border-purple-500/40 shadow-lg space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                        <Wallet className="w-4 h-4 text-amber-400" />
                        <span>لوحة استلام الأرباح وتسوية المبالغ (Mastercard & Bank Settlement)</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>نظام التحويل المباشر معتمد 100%</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      أضف بيانات بطاقتك الماستركارد أو حسابك البنكي (الآيبان) هنا. عندما يدفع العميل عبر البوابة، يتم خصم المبلغ فورياً وحقيقياً من بطاقته، ثم تُحوّل الأموال مباشرة إلى بطاقة الماستركارد أو الآيبان المسجل هنا.
                    </p>
                  </div>

                  {/* Visual Mastercard & Revenue Cards Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-center">
                    
                    {/* 1. LUXURY VIRTUAL MASTERCARD DISPLAY */}
                    <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-tr from-[#160E33] via-[#2A1550] to-[#120B29] border border-purple-500/40 shadow-2xl shadow-purple-950/90 text-white">
                      {/* Ambient Glowing Orbs */}
                      <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-44 h-44 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

                      {/* Header: Chip, Contactless Waves & Mastercard Logo */}
                      <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                          {/* EMV Chip Visual */}
                          <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/70 p-1 flex flex-col justify-between shadow-md">
                            <div className="h-[1px] bg-amber-900/50 w-full" />
                            <div className="h-[1px] bg-amber-900/50 w-full" />
                          </div>
                          {/* Contactless waves */}
                          <span className="text-amber-300 text-xs font-mono font-bold tracking-widest">(((</span>
                        </div>

                        {/* Official Interlocking Circles Mastercard Logo */}
                        <div className="flex items-center">
                          <div className="w-7 h-7 rounded-full bg-[#EB001B] shadow-md shadow-red-950/60 -mr-2.5 z-10" />
                          <div className="w-7 h-7 rounded-full bg-[#F79E1B]/95 shadow-md shadow-orange-950/60" />
                          <span className="font-bold text-[11px] text-white tracking-widest uppercase mr-2.5 font-mono">
                            mastercard
                          </span>
                        </div>
                      </div>

                      {/* Card Number */}
                      <div className="mb-6 relative z-10">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-300 font-mono tracking-wider">
                            RECEIVING MASTERCARD (بطاقة استلام الأموال)
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowCardNumber(!showCardNumber)}
                            className="text-[10px] text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer font-mono bg-black/40 px-2 py-0.5 rounded border border-purple-500/30"
                          >
                            {showCardNumber ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showCardNumber ? 'إخفاء الأرقام' : 'إظهار الأرقام'}</span>
                          </button>
                        </div>
                        <div className="font-mono text-lg sm:text-xl font-bold tracking-[0.2em] text-white pt-1">
                          {showCardNumber 
                            ? cardNumber 
                            : `•••• •••• •••• ${cardNumber.replace(/\s/g, '').slice(-4) || '8820'}`}
                        </div>
                      </div>

                      {/* Card Footer: Holder, Expiry, Bank */}
                      <div className="flex items-end justify-between relative z-10 pt-3 border-t border-white/10 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-mono uppercase">CARDHOLDER</span>
                          <span className="font-bold text-white tracking-wider uppercase font-mono truncate max-w-[140px] block">
                            {cardHolder || 'STORE OWNER'}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 block font-mono uppercase">EXPIRES</span>
                          <span className="font-mono font-bold text-amber-300">{cardExpiry || '12/28'}</span>
                        </div>
                        <div className="text-left">
                          <span className="text-[9px] text-slate-400 block font-mono uppercase">ISSUING BANK</span>
                          <span className="text-[11px] font-bold text-purple-200 truncate max-w-[120px] block">
                            {cardBank || 'مصرف الراجحي'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. REVENUE & SETTLEMENT STATS OVERVIEW */}
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-[#140F2E] border border-purple-500/25">
                        <span className="text-xs text-slate-400 block mb-1">إجمالي المبيعات والأرباح المحققة</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                            {stats?.totalRevenue || 0}
                          </span>
                          <span className="text-xs text-purple-300 font-bold">{STORE_CONFIG.currencyLabelAr}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          من إجمالي {stats?.paidCount || 0} عملية سداد ناجحة
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-[#140F2E] border border-purple-500/25 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">وجهة الاستلام المعتمدة:</span>
                          <span className="font-bold text-amber-300 font-mono">
                            {payoutMethod === 'mastercard' ? '💳 بطاقة ماستركارد (فوري)' : '🏦 الآيبان البنكي (IBAN)'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                          <span className="text-slate-400">حالة بوابة الدفع:</span>
                          <span className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${
                            settings?.tapConfigured 
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                              : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                          }`}>
                            {settings?.tapConfigured ? '🟢 مفاتيح Tap الحية مفعلة' : '🟡 بيئة العمل النشطة'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                          <span className="text-slate-400">دورة التسوية التلقائية:</span>
                          <span className="text-white font-medium text-[11px]">يومية مباشرة لحساب التاجر</span>
                        </div>
                      </div>

                      {/* Test Payout Button */}
                      <button
                        type="button"
                        onClick={handleTestPayoutRouting}
                        disabled={payoutTestLoading}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {payoutTestLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>جاري فحص مسار التحويل للبطاقة / الآيبان...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-amber-300" />
                            <span>فحص وتأكيد مسار التحويل الفوري إلى بطاقتك</span>
                          </>
                        )}
                      </button>

                      {payoutTestResult && (
                        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 space-y-1 animate-fadeIn">
                          <div className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>{payoutTestResult.message}</span>
                          </div>
                          <div className="text-[11px] text-slate-300 font-mono">
                            مرجع العملية: <code className="text-white bg-black/40 px-1 rounded">{payoutTestResult.details?.payoutReference}</code>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            تم توثيق مسار التحويل إلى: {payoutTestResult.details?.destination}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* FORM TO ADD/EDIT MASTERCARD & IBAN DATA */}
                  <form onSubmit={handleSavePayoutSettings} className="p-5 rounded-2xl bg-[#140F2E] border border-purple-500/30 space-y-5">
                    
                    <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2 font-display">
                          <CreditCard className="w-4 h-4 text-amber-400" />
                          <span>إدخال وتعديل بيانات بطاقة الماستركارد والآيبان البنكي</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          تأكد من صحة البيانات لتصلك جميع أموال مبيعات الاشتراكات عليها دون تأخير
                        </p>
                      </div>

                      {/* Method Radio Pills */}
                      <div className="flex items-center gap-2 bg-[#0E0A20] p-1 rounded-xl border border-purple-500/30 text-xs">
                        <button
                          type="button"
                          onClick={() => setPayoutMethod('mastercard')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                            payoutMethod === 'mastercard'
                              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          💳 بطاقة ماستركارد
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayoutMethod('bank_iban')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                            payoutMethod === 'bank_iban'
                              ? 'bg-purple-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          🏦 الآيبان البنكي
                        </button>
                      </div>
                    </div>

                    {payoutMsg && (
                      <div className="p-3 rounded-xl bg-purple-950/80 border border-purple-500/50 text-xs text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{payoutMsg}</span>
                      </div>
                    )}

                    {/* SECTION A: MASTERCARD DETAILS */}
                    <div className="space-y-3 p-4 rounded-xl bg-[#0E0A20] border border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>1. بيانات بطاقة ماستركارد لاستلام الأرباح (Mastercard Payout Card)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">16 DIGITS • LUHN VERIFIED</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-300 mb-1">
                            رقم بطاقة ماستركارد (16 رقم) *
                          </label>
                          <input
                            type="text"
                            required
                            dir="ltr"
                            value={cardNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                              // Format into 4-4-4-4
                              const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                              setCardNumber(formatted);
                            }}
                            placeholder="5241 0000 0000 0000"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#140F2E] border border-purple-500/40 focus:border-amber-400 text-white placeholder-slate-500 font-mono text-left focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            اسم حامل البطاقة (بالإنجليزية) *
                          </label>
                          <input
                            type="text"
                            required
                            dir="ltr"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                            placeholder="MOHAMMED AL-SALEM"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#140F2E] border border-purple-500/40 focus:border-amber-400 text-white placeholder-slate-500 font-mono text-left focus:outline-none uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            تاريخ الانتهاء (MM/YY) *
                          </label>
                          <input
                            type="text"
                            required
                            dir="ltr"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^\d/]/g, '');
                              if (val.length === 2 && !val.includes('/')) val = val + '/';
                              setCardExpiry(val);
                            }}
                            placeholder="12/28"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#140F2E] border border-purple-500/40 focus:border-amber-400 text-white placeholder-slate-500 font-mono text-left focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            اسم البنك المصدر للبطاقة *
                          </label>
                          <input
                            type="text"
                            value={cardBank}
                            onChange={(e) => setCardBank(e.target.value)}
                            placeholder="مثال: مصرف الراجحي، بنك الرياض، الأهلي SNB، بنك بوبيان..."
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#140F2E] border border-purple-500/40 focus:border-amber-400 text-white placeholder-slate-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            نوع البطاقة وشبكة الدفع
                          </label>
                          <select
                            value={cardBrand}
                            onChange={(e) => setCardBrand(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#140F2E] border border-purple-500/40 text-white focus:outline-none"
                          >
                            <option value="Mastercard">Mastercard (ماستركارد - تحويل مباشر فوري)</option>
                            <option value="Visa">Visa (فيزا)</option>
                            <option value="Mada">Mada (مدى)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* SECTION B: BANK IBAN DETAILS */}
                    <div className="space-y-3 p-4 rounded-xl bg-[#0E0A20] border border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>2. بيانات حساب الآيبان البنكي (Bank Account & IBAN Wire)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">SARIE / GCC WIRE</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            رقم الآيبان البنكي الدولي (IBAN) *
                          </label>
                          <input
                            type="text"
                            required
                            dir="ltr"
                            value={bankIban}
                            onChange={(e) => setBankIban(e.target.value.replace(/\s/g, '').toUpperCase())}
                            placeholder="SA44800004820000192837465"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#140F2E] border border-purple-500/40 focus:border-amber-400 text-white placeholder-slate-500 font-mono text-left focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            اسم البنك الرسمي *
                          </label>
                          <input
                            type="text"
                            required
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="مصرف الراجحي (Al Rajhi Bank)"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#140F2E] border border-purple-500/40 focus:border-amber-400 text-white placeholder-slate-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            اسم صاحب الحساب الثلاثي / اسم المؤسسة *
                          </label>
                          <input
                            type="text"
                            required
                            value={accountHolder}
                            onChange={(e) => setAccountHolder(e.target.value)}
                            placeholder="مؤسسة فولت إكس للتجارة الرقمية"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#140F2E] border border-purple-500/40 focus:border-amber-400 text-white placeholder-slate-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            رقم الحساب البنكي المحلي (Account Number)
                          </label>
                          <input
                            type="text"
                            dir="ltr"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="4820000192837465"
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#140F2E] border border-purple-500/40 focus:border-amber-400 text-white placeholder-slate-500 font-mono text-left focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION C: HOW REAL PAYMENT CHARGING WORKS (EXPLANATION & GATEWAY KEYS) */}
                    <div className="p-4 rounded-xl bg-purple-950/25 border border-purple-500/30 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-display">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>كيف يعمل الخصم الحقيقي 100% وتحويل الفلوس إلى بطاقتك / حسابك؟</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-300 leading-relaxed">
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                          <span className="font-bold text-white block">1. خصم حقيقي من العميل:</span>
                          عندما يشتري العميل ببطاقته (ماستركارد/فيزا/مدى)، تقوم بوابة الدفع (Tap Payments) بالخصم الفعلي من رصيده البنكي مع كود التحقق 3DS OTP.
                        </div>
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                          <span className="font-bold text-white block">2. إيداع فوري في رصيدك:</span>
                          المبالغ المخصومة تُسجّل فورياً في رصيد متجرك وتتحول تلقائياً إلى بطاقة الماستركارد أو الآيبان المحدد في الأعلى.
                        </div>
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                          <span className="font-bold text-white block">3. تسليم آلي فوري:</span>
                          بمجرد تأكيد الخصم المالي، يستلم العميل كود الاشتراك فورياً بدون تدخل بشري.
                        </div>
                      </div>

                      {/* API Keys Inputs for Live 100% deduction */}
                      <div className="pt-2 border-t border-purple-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            بيئة البوابة (Gateway Mode)
                          </label>
                          <select
                            value={gatewayMode}
                            onChange={(e) => setGatewayMode(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-lg bg-[#0E0A20] border border-purple-500/40 text-white"
                          >
                            <option value="production">Production (خصم حقيقي مباشر 100%)</option>
                            <option value="sandbox">Sandbox (بيئة اختبار وتجربة)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            Tap Secret Key (لخصم البطاقات)
                          </label>
                          <input
                            type="password"
                            dir="ltr"
                            value={tapSecretKey}
                            onChange={(e) => setTapSecretKey(e.target.value)}
                            placeholder="sk_live_... أو sk_test_..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0E0A20] border border-purple-500/40 text-white placeholder-slate-500 font-mono text-left"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            Tap Public Key (المفتاح العام)
                          </label>
                          <input
                            type="text"
                            dir="ltr"
                            value={tapPublicKey}
                            onChange={(e) => setTapPublicKey(e.target.value)}
                            placeholder="pk_live_... أو pk_test_..."
                            className="w-full px-3 py-2 rounded-lg bg-[#0E0A20] border border-purple-500/40 text-white placeholder-slate-500 font-mono text-left"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Save Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={savingPayout}
                        className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/60 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {savingPayout ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>جاري حفظ وتشفير بيانات الاستلام...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>حفظ وتأكيد بيانات بطاقة الماستركارد والآيبان لاستلام الأموال</span>
                          </>
                        )}
                      </button>
                    </div>

                  </form>

                </div>
              )}

              {/* TAB 5: GATEWAY & WEBHOOK SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-4 max-w-xl">
                  <div className="p-4 rounded-xl bg-[#140F2E] border border-purple-500/20 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-display">
                      <Sliders className="w-4 h-4 text-purple-400" />
                      <span>إعدادات بوابة الدفع والربط المشفر (Tap Payments Gateway)</span>
                    </h4>

                    {settingsMsg && (
                      <div className="p-2.5 rounded bg-purple-950/60 border border-purple-500/30 text-xs text-purple-200">
                        {settingsMsg}
                      </div>
                    )}

                    <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-300 mb-1">بيئة الدفع (Mode)</label>
                        <select
                          value={gatewayMode}
                          onChange={(e) => setGatewayMode(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg bg-[#0E0A20] border border-purple-500/30 text-white"
                        >
                          <option value="production">Production / Live (دفع حقيقي مباشر وخصم فعلي)</option>
                          <option value="sandbox">Sandbox / Staging (بيئة اختبار آمنة)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Tap Secret Key (sk_live_... أو sk_test_...)</label>
                        <input
                          type="password"
                          dir="ltr"
                          value={tapSecretKey}
                          onChange={(e) => setTapSecretKey(e.target.value)}
                          placeholder="sk_live_... أو sk_test_..."
                          className="w-full px-3 py-2 rounded-lg bg-[#0E0A20] border border-purple-500/30 text-white placeholder-slate-500 font-mono text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Tap Public Key (pk_live_... أو pk_test_...)</label>
                        <input
                          type="text"
                          dir="ltr"
                          value={tapPublicKey}
                          onChange={(e) => setTapPublicKey(e.target.value)}
                          placeholder="pk_live_... أو pk_test_..."
                          className="w-full px-3 py-2 rounded-lg bg-[#0E0A20] border border-purple-500/30 text-white placeholder-slate-500 font-mono text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Webhook Secret (لتوقيع إشعارات السداد HMAC)</label>
                        <input
                          type="password"
                          dir="ltr"
                          value={webhookSecret}
                          onChange={(e) => setWebhookSecret(e.target.value)}
                          placeholder="whsec_..."
                          className="w-full px-3 py-2 rounded-lg bg-[#0E0A20] border border-purple-500/30 text-white placeholder-slate-500 font-mono text-left"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] text-slate-400 space-y-1.5">
                        <span className="font-bold text-white block">رابط الـ Webhook الخاص بمتجرك:</span>
                        <code className="text-purple-300 font-mono block break-all bg-black/50 p-1.5 rounded" dir="ltr">
                          {window.location.origin}/api/webhooks/payment
                        </code>
                        <span className="text-[10px] text-slate-500 block">
                          ضع هذا الرابط في لوحة تحكم Tap Payments (https://tap.company) لتأكيد المعاملات تلقائياً.
                        </span>
                      </div>

                      <button
                        type="submit"
                        className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
                      >
                        حفظ إعدادات البوابة
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 6: AUDIT LOGS */}
              {activeTab === 'logs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <span>سجل العمليات الإدارية والأمنية المشفر (Immutable Audit Trail)</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => fetchAll()}
                      className="px-2.5 py-1 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>تحديث السجل</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-[#120D29] border border-purple-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-black/60 text-purple-300 font-mono text-[10px] font-bold">
                              {log.action}
                            </span>
                            <span className="text-slate-300">{log.details}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                            <span>بواسطة: {log.actorEmail}</span>
                            <span>IP: {log.ipAddress}</span>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(log.timestamp).toLocaleString('ar-SA')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* LIGHTBOX FOR BANK RECEIPT INSPECTION */}
        {previewReceipt && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg">
            <div className="relative max-w-2xl w-full bg-[#140F2E] rounded-2xl border border-purple-500/40 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                <span className="text-xs font-bold text-white">
                  معاينة إيصال الحوالة للطلب: <strong className="font-mono text-purple-300">{previewReceipt.orderId}</strong> ({previewReceipt.customer})
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewReceipt(null)}
                  className="p-1 rounded-lg bg-black/60 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-auto rounded-lg border border-white/10 text-center bg-black/40 p-2">
                <img 
                  src={previewReceipt.url} 
                  alt="إيصال التحويل البنكي" 
                  className="max-h-[65vh] mx-auto object-contain"
                />
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setPreviewReceipt(null)}
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
