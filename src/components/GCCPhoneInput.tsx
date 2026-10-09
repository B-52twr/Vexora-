import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Phone, AlertCircle } from 'lucide-react';

export interface GCCCountry {
  id: string;
  name: string;
  nameEn: string;
  code: string; // e.g. '+966'
  dialCode: string; // '966'
  flag: string;
  placeholder: string;
  digits: number;
  leadingZeroAllowed: boolean;
  prefixPattern: RegExp;
  hint: string;
  bankExample: string;
}

export const GCC_COUNTRIES: GCCCountry[] = [
  {
    id: 'sa',
    name: 'المملكة العربية السعودية',
    nameEn: 'Saudi Arabia',
    code: '+966',
    dialCode: '966',
    flag: '🇸🇦',
    placeholder: '5X XXX XXXX',
    digits: 9,
    leadingZeroAllowed: true,
    prefixPattern: /^5\d{8}$/,
    hint: 'يبدأ بـ 5 (9 أرقام)',
    bankExample: 'مصرف الراجحي / البنك الأهلي السعودي'
  },
  {
    id: 'kw',
    name: 'دولة الكويت',
    nameEn: 'Kuwait',
    code: '+965',
    dialCode: '965',
    flag: '🇰🇼',
    placeholder: '5/6/9X XXX XXX',
    digits: 8,
    leadingZeroAllowed: false,
    prefixPattern: /^[569]\d{7}$/,
    hint: 'يبدأ بـ 5 أو 6 أو 9 (8 أرقام)',
    bankExample: 'بنك الكويت الوطني (NBK) / بيت التمويل الكويتي'
  },
  {
    id: 'ae',
    name: 'دولة الإمارات العربية المتحدة',
    nameEn: 'UAE',
    code: '+971',
    dialCode: '971',
    flag: '🇦🇪',
    placeholder: '5X XXX XXXX',
    digits: 9,
    leadingZeroAllowed: true,
    prefixPattern: /^5\d{8}$/,
    hint: 'يبدأ بـ 5 (9 أرقام)',
    bankExample: 'بنك أبوظبي الأول (FAB) / بنك الإمارات دبي الوطني'
  },
  {
    id: 'qa',
    name: 'دولة قطر',
    nameEn: 'Qatar',
    code: '+974',
    dialCode: '974',
    flag: '🇶🇦',
    placeholder: '3/5/6/7X XXX XXX',
    digits: 8,
    leadingZeroAllowed: false,
    prefixPattern: /^[3567]\d{7}$/,
    hint: 'يبدأ بـ 3 أو 5 أو 6 أو 7 (8 أرقام)',
    bankExample: 'بنك قطر الوطني (QNB)'
  },
  {
    id: 'bh',
    name: 'مملكة البحرين',
    nameEn: 'Bahrain',
    code: '+973',
    dialCode: '973',
    flag: '🇧🇭',
    placeholder: '3/6X XXX XXX',
    digits: 8,
    leadingZeroAllowed: false,
    prefixPattern: /^[36]\d{7}$/,
    hint: 'يبدأ بـ 3 أو 6 (8 أرقام)',
    bankExample: 'بنك البحرين الوطني (NBB)'
  },
  {
    id: 'om',
    name: 'سلطنة عُمان',
    nameEn: 'Oman',
    code: '+968',
    dialCode: '968',
    flag: '🇴🇲',
    placeholder: '7/9X XXX XXX',
    digits: 8,
    leadingZeroAllowed: false,
    prefixPattern: /^[79]\d{7}$/,
    hint: 'يبدأ بـ 7 أو 9 (8 أرقام)',
    bankExample: 'بنك مسقط (Bank Muscat)'
  }
];

interface GCCPhoneInputProps {
  value: string; // full phone or national digits
  onChange: (fullPhone: string, country: GCCCountry, nationalDigits: string) => void;
  required?: boolean;
  disabled?: boolean;
  showQuickPills?: boolean;
  label?: string;
  className?: string;
}

export function GCCPhoneInput({
  value,
  onChange,
  required = true,
  disabled = false,
  showQuickPills = true,
  label = 'رقم الجوال لتلقي كود التحقق والاشتراك (دول الخليج العربي)',
  className = ''
}: GCCPhoneInputProps) {
  // Determine initial country based on value or default to Saudi Arabia
  const getInitialCountry = () => {
    if (value) {
      const match = GCC_COUNTRIES.find(c => value.startsWith(c.code) || value.startsWith(c.dialCode));
      if (match) return match;
    }
    return GCC_COUNTRIES[0]; // KSA
  };

  const [selectedCountry, setSelectedCountry] = useState<GCCCountry>(getInitialCountry);
  const [nationalNumber, setNationalNumber] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse incoming value if controlled externally
  useEffect(() => {
    if (!value) {
      setNationalNumber('');
      return;
    }

    // Check if value includes any country dialcode
    let matchedCountry = selectedCountry;
    let digits = value.replace(/[^\d+]/g, '');

    for (const country of GCC_COUNTRIES) {
      if (digits.startsWith(country.code)) {
        matchedCountry = country;
        digits = digits.substring(country.code.length);
        break;
      } else if (digits.startsWith(`+${country.dialCode}`)) {
        matchedCountry = country;
        digits = digits.substring(country.dialCode.length + 1);
        break;
      } else if (digits.startsWith(country.dialCode)) {
        matchedCountry = country;
        digits = digits.substring(country.dialCode.length);
        break;
      }
    }

    // Strip leading 0
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    setSelectedCountry(matchedCountry);
    setNationalNumber(digits);
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country: GCCCountry) => {
    setSelectedCountry(country);
    setDropdownOpen(false);

    // Re-evaluate full phone with new country
    const full = nationalNumber ? `${country.code} ${nationalNumber}` : '';
    onChange(full, country, nationalNumber);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Check if user pasted full international format
    for (const country of GCC_COUNTRIES) {
      if (raw.includes(country.code) || raw.includes(`+${country.dialCode}`)) {
        setSelectedCountry(country);
        raw = raw.replace(country.code, '').replace(`+${country.dialCode}`, '');
        break;
      }
    }

    // Extract digits only
    let clean = raw.replace(/\D/g, '');

    // If starts with 0 (e.g. 050...), remove leading zero automatically
    if (clean.startsWith('0')) {
      clean = clean.substring(1);
    }

    // Limit to country digits max
    if (clean.length > selectedCountry.digits) {
      clean = clean.substring(0, selectedCountry.digits);
    }

    setNationalNumber(clean);

    const fullPhone = clean ? `${selectedCountry.code} ${clean}` : '';
    onChange(fullPhone, selectedCountry, clean);
  };

  const isValidLength = nationalNumber.length === selectedCountry.digits;
  const isValidFormat = selectedCountry.prefixPattern.test(nationalNumber);
  const isValid = isValidLength && isValidFormat;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label and Helper Header */}
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold text-slate-200">
          {label} {required && <span className="text-purple-400">*</span>}
        </label>
        
        {nationalNumber.length > 0 && (
          <span className={`text-[10px] font-mono flex items-center gap-1 ${
            isValid ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {isValid ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>رقم صحيح ({selectedCountry.nameEn})</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>{selectedCountry.hint}</span>
              </>
            )}
          </span>
        )}
      </div>

      {/* Quick GCC Country Switcher Pills */}
      {showQuickPills && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-0.5">
          <span className="text-[10px] text-slate-400 shrink-0 font-medium pl-1">
            دول الخليج:
          </span>
          {GCC_COUNTRIES.map((c) => {
            const isSelected = selectedCountry.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleCountrySelect(c)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all shrink-0 flex items-center gap-1 cursor-pointer border ${
                  isSelected
                    ? 'bg-purple-600/30 text-white border-purple-500 font-bold shadow-sm ring-1 ring-purple-500/40'
                    : 'bg-[#120D28] text-slate-400 border-purple-500/20 hover:border-purple-500/40 hover:text-slate-200'
                }`}
              >
                <span>{c.flag}</span>
                <span dir="ltr" className="font-mono">{c.code}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Unified Input Container */}
      <div 
        className={`relative flex items-center rounded-xl bg-[#140F2E] border transition-all ${
          isFocused 
            ? 'border-purple-400 ring-2 ring-purple-500/20 shadow-lg shadow-purple-950/40' 
            : isValid 
            ? 'border-emerald-500/40' 
            : 'border-purple-500/30 hover:border-purple-500/50'
        }`}
        ref={dropdownRef}
      >
        {/* Country Selector Dropdown Toggle */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-black/30 hover:bg-black/50 rounded-r-xl border-l border-purple-500/20 text-white transition-colors cursor-pointer select-none"
            title="اختر الدولة"
          >
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span dir="ltr" className="font-mono text-xs font-bold text-purple-200">
              {selectedCountry.code}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* GCC Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-64 bg-[#0E0A22] border border-purple-500/40 rounded-xl shadow-2xl shadow-black/80 py-1.5 z-50 backdrop-blur-xl">
              <div className="px-3 py-1 text-[10px] text-purple-300 font-bold border-b border-purple-500/15 mb-1">
                اختر دولة من مجلس التعاون الخليجي:
              </div>
              {GCC_COUNTRIES.map((country) => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full px-3 py-2 flex items-center justify-between text-right text-xs transition-colors cursor-pointer ${
                    selectedCountry.id === country.id
                      ? 'bg-purple-900/40 text-white font-bold'
                      : 'hover:bg-purple-950/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{country.flag}</span>
                    <div>
                      <span className="block text-xs text-white">{country.name}</span>
                      <span className="block text-[10px] text-slate-400 font-mono" dir="ltr">
                        {country.nameEn} · {country.hint}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span dir="ltr" className="font-mono text-purple-300 font-bold text-xs">
                      {country.code}
                    </span>
                    {selectedCountry.id === country.id && (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Numeric Input */}
        <div className="relative flex-1">
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            disabled={disabled}
            required={required}
            value={nationalNumber}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={selectedCountry.placeholder}
            dir="ltr"
            className="w-full px-3 py-2.5 text-sm font-mono font-medium text-white placeholder-slate-500 bg-transparent focus:outline-none text-left"
          />
        </div>

        {/* Right Icon / Clear */}
        <div className="pl-3 pr-2 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-purple-400" />
        </div>
      </div>

      {/* Format hint caption */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
        <span>
          الصيغة المعتمدة لـ {selectedCountry.name}: <span className="text-purple-300 font-mono font-bold" dir="ltr">{selectedCountry.placeholder}</span>
        </span>
        <span className="text-slate-500 font-mono">
          {nationalNumber.length} / {selectedCountry.digits} أرقام
        </span>
      </div>
    </div>
  );
}
