import React from 'react';

export function NetflixLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M5.5 2H9.5V22H5.5V2Z" fill="#E50914" />
      <path d="M14.5 2H18.5V22H14.5V2Z" fill="#E50914" />
      <path d="M5.5 2L18.5 22H14.5L5.5 2Z" fill="#B81D24" />
    </svg>
  );
}

export function ShahidLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 32" fill="none">
      {/* Shahid letters & dots */}
      <rect x="78" y="4" width="8" height="8" rx="4" fill="#00E5FF" />
      <rect x="65" y="4" width="8" height="8" rx="4" fill="#10B981" />
      <path d="M10 24C10 24 16 28 28 28C40 28 48 22 48 14C48 6 36 6 36 6H20V24H10Z" fill="#FFFFFF" />
      <path d="M56 8V24H64V8H56Z" fill="#FFFFFF" />
    </svg>
  );
}

export function OsnLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 24" fill="none">
      <text x="32" y="18" fill="#E11D48" fontFamily="Arial Black, Impact, sans-serif" fontSize="20" fontWeight="900" textAnchor="middle">
        OSN+
      </text>
    </svg>
  );
}

export function DiscordLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#5865F2">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

// Payment Brands
export function MadaBadge() {
  return (
    <div className="h-6 px-2 rounded bg-white/95 flex items-center justify-center border border-slate-300">
      <span className="text-[10px] font-black tracking-tight text-[#006A4E]">mada</span>
      <span className="text-[8px] font-bold text-[#86C232] mr-0.5">مدى</span>
    </div>
  );
}

export function ApplePayBadge() {
  return (
    <div className="h-6 px-2 rounded bg-white/95 flex items-center justify-center border border-slate-300">
      <span className="text-[10px] font-bold text-black flex items-center gap-0.5">
        <span></span> Pay
      </span>
    </div>
  );
}

export function VisaBadge() {
  return (
    <div className="h-6 px-2 rounded bg-white/95 flex items-center justify-center border border-slate-300">
      <span className="text-[10px] font-black text-[#1A1F71] italic tracking-wider">VISA</span>
    </div>
  );
}

export function MastercardBadge() {
  return (
    <div className="h-6 px-1.5 rounded bg-white/95 flex items-center justify-center gap-0.5 border border-slate-300">
      <div className="w-2.5 h-2.5 rounded-full bg-[#EB001B] -mr-1" />
      <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B]/90" />
    </div>
  );
}

export function KNetBadge() {
  return (
    <div className="h-6 px-2 rounded bg-white/95 flex items-center justify-center border border-slate-300">
      <span className="text-[10px] font-black tracking-tight text-[#0A4B78]">K-NET</span>
    </div>
  );
}
