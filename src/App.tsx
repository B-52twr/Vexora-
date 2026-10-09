import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SubscriptionCard } from './components/SubscriptionCard';
import { GuaranteesSection } from './components/GuaranteesSection';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminModal } from './components/AdminModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { PaymentStatusModal } from './components/PaymentStatusModal';
import { SubscriptionService, Plan, Order } from './types';
import { getStoredServices, getTotalStockCount } from './utils/storage';
import { apiClient, ApiProduct, ApiProductPlan } from './services/apiClient';
import { Sparkles, Layers, ShieldCheck } from 'lucide-react';

export function App() {
  const [services, setServices] = useState<SubscriptionService[]>(getStoredServices());
  const [totalStock, setTotalStock] = useState<number>(getTotalStockCount());

  // Modal Controllers
  const [selectedCheckout, setSelectedCheckout] = useState<{ service: SubscriptionService; plan: Plan } | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<{ product: ApiProduct; plan: ApiProductPlan } | null>(null);
  const [verifiedModalOrderId, setVerifiedModalOrderId] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showTrackerModal, setShowTrackerModal] = useState(false);

  // Filter Category
  const [activeCategory, setActiveCategory] = useState<'all' | 'movies' | 'gaming'>('all');

  // Load live server products & verify callback if redirected from gateway
  useEffect(() => {
    loadServerProducts();

    // Check if user was redirected from gateway callback
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get('order_id');
    if (orderIdParam) {
      setVerifiedModalOrderId(orderIdParam);
      // Clean query params from URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadServerProducts = async () => {
    try {
      const serverProducts = await apiClient.getProducts();
      if (serverProducts && serverProducts.length > 0) {
        // Map server products to client services
        setServices((prev) => 
          prev.map((s) => {
            const found = serverProducts.find((p) => p.id === s.id);
            if (found) {
              return {
                ...s,
                plans: found.plans.map((p) => ({
                  duration: p.duration as any,
                  label: p.label,
                  subLabel: p.subLabel,
                  price: p.price,
                  originalPrice: p.originalPrice,
                  badge: p.badge,
                  badgeColor: p.badgeColor,
                  features: p.features,
                  isFeatured: p.isFeatured
                }))
              };
            }
            return s;
          })
        );
      }
    } catch {
      // Fallback to initial local services
    }
  };

  const handleRefreshData = () => {
    loadServerProducts();
    setTotalStock(getTotalStockCount());
  };

  const handleSelectPlan = (service: SubscriptionService, plan: Plan) => {
    setSelectedCheckout({ service, plan });
  };

  const handleOrderSuccess = (order: Order) => {
    handleRefreshData();
    // Prompt verified status modal
    setVerifiedModalOrderId(order.orderId);
  };

  const scrollToSubscriptions = () => {
    const el = document.getElementById('subscriptions-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredServices = services.filter((s) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'movies') return s.id === 'netflix' || s.id === 'shahid' || s.id === 'osn';
    if (activeCategory === 'gaming') return s.id === 'discord';
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#090714] text-slate-100 selection:bg-purple-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenTracker={() => setShowTrackerModal(true)}
        totalStock={totalStock}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onBrowseClick={scrollToSubscriptions}
          availableStock={totalStock}
        />

        {/* Subscriptions Grid Section */}
        <section id="subscriptions-grid" className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Heading & Category Filter */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-purple-500/20">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-xs text-purple-300 font-bold mb-3 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>OFFICIAL DIGITAL PLANS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-display">
                باقات الاشتراكات الرسمية المعتمدة
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
                اختر المنصة والمدة المطلوبة. أسعار ومواصفات مطابقة 100% للتراخيص الرسمية مع ضمان ذهبي وتسليم فوري مشفر.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 p-1.5 bg-[#120D29] rounded-xl border border-purple-500/20 overflow-x-auto">
              {[
                { id: 'all', label: 'كافة المنصات' },
                { id: 'movies', label: 'أفلام ومسلسلات (نتفلكس / شاهد / OSN)' },
                { id: 'gaming', label: 'ألعاب وديسكورد نايترو' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                      : 'text-slate-400 hover:text-white hover:bg-purple-900/30'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5 Platforms Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredServices.map((service) => (
              <SubscriptionCard
                key={service.id}
                service={service}
                onSelectPlan={handleSelectPlan}
              />
            ))}
          </div>

        </section>

        {/* Guarantees & Banking Standards */}
        <GuaranteesSection />

        {/* FAQs */}
        <FAQSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenTracker={() => setShowTrackerModal(true)}
      />

      {/* Checkout Modal */}
      {selectedCheckout && (
        <CheckoutModal
          service={selectedCheckout.service}
          plan={selectedCheckout.plan}
          onClose={() => setSelectedCheckout(null)}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {/* Product Detail Modal */}
      {selectedDetail && (
        <ProductDetailModal
          product={selectedDetail.product}
          selectedPlan={selectedDetail.plan}
          onSelectPlan={(plan) => setSelectedDetail({ ...selectedDetail, plan })}
          onProceedToCheckout={(product, plan) => {
            const foundService = services.find((s) => s.id === product.id);
            if (foundService) {
              const foundPlan = foundService.plans.find((p) => p.duration === plan.duration) || foundService.plans[0];
              setSelectedDetail(null);
              setSelectedCheckout({ service: foundService, plan: foundPlan });
            }
          }}
          onClose={() => setSelectedDetail(null)}
        />
      )}

      {/* Payment Status Modal (Strict Server Verification) */}
      {verifiedModalOrderId && (
        <PaymentStatusModal
          orderId={verifiedModalOrderId}
          onClose={() => setVerifiedModalOrderId(null)}
          onRetryPayment={() => {
            setVerifiedModalOrderId(null);
            scrollToSubscriptions();
          }}
        />
      )}

      {/* Owner Admin Modal */}
      {showAdminModal && (
        <AdminModal
          onClose={() => setShowAdminModal(false)}
          onRefreshData={handleRefreshData}
        />
      )}

      {/* Public Order Tracker Modal */}
      {showTrackerModal && (
        <OrderTrackerModal
          onClose={() => setShowTrackerModal(false)}
        />
      )}

    </div>
  );
}
export default App;
