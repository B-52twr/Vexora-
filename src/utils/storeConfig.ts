// Universal Store & Currency Configuration
// Configured to support dynamic store name and currency with fallback to Kuwaiti Dinar (KWD)

export const STORE_CONFIG = {
  storeName: import.meta.env.VITE_STORE_NAME || 'اسم المتجر',
  currency: import.meta.env.VITE_CURRENCY || 'KWD',
  currencyLabelAr: (import.meta.env.VITE_CURRENCY || 'KWD') === 'KWD' ? 'د.ك' : (import.meta.env.VITE_CURRENCY || 'KWD'),
  currencyNameAr: (import.meta.env.VITE_CURRENCY || 'KWD') === 'KWD' ? 'دينار كويتي' : (import.meta.env.VITE_CURRENCY || 'KWD'),
  gatewayProvider: 'tap',
  gatewayMode: 'production',
};

export function formatPrice(amount: number, currency: string = STORE_CONFIG.currency): string {
  if (currency === 'KWD') {
    // KWD standard display (e.g. 2.500 or 3 د.ك)
    return Number.isInteger(amount) ? `${amount}` : `${amount.toFixed(3)}`;
  }
  return `${amount}`;
}

export function getCurrencyLabel(currency: string = STORE_CONFIG.currency): string {
  if (currency === 'KWD') return 'د.ك';
  if (currency === 'SAR') return 'ر.س';
  return currency;
}
