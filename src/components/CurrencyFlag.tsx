import React, { useState, useRef, useEffect } from 'react';
import {
  GlobalCurrencyCode,
  GLOBAL_CURRENCIES,
  getCurrencyInfo,
} from '../utils/currencyFlags';
import { ChevronDown, Check, Globe } from 'lucide-react';

interface CurrencyFlagProps {
  currency?: string;
  code?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showEmojiFallback?: boolean;
}

const SIZE_MAP = {
  xs: 'w-3.5 h-3.5 text-[10px]',
  sm: 'w-4 h-4 text-xs',
  md: 'w-5 h-5 text-sm',
  lg: 'w-6 h-6 text-base',
};

export const CurrencyFlag: React.FC<CurrencyFlagProps> = ({
  currency,
  code: codeProp,
  size = 'sm',
  className = '',
  showEmojiFallback = false,
}) => {
  const code = (currency || codeProp || '').toUpperCase();
  const info = getCurrencyInfo(code);

  // SVG representation for high-DPI and uniform round shields across platforms
  const renderSVG = () => {
    switch (code) {
      case 'USD':
        return (
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <rect width="36" height="36" fill="#B22234" />
            <rect y="4" width="36" height="4" fill="#FFFFFF" />
            <rect y="12" width="36" height="4" fill="#FFFFFF" />
            <rect y="20" width="36" height="4" fill="#FFFFFF" />
            <rect y="28" width="36" height="4" fill="#FFFFFF" />
            <rect width="18" height="18" fill="#3C3B6E" />
            {/* Stars pattern simplified */}
            <circle cx="5" cy="5" r="1.5" fill="#FFFFFF" />
            <circle cx="13" cy="5" r="1.5" fill="#FFFFFF" />
            <circle cx="9" cy="9" r="1.5" fill="#FFFFFF" />
            <circle cx="5" cy="13" r="1.5" fill="#FFFFFF" />
            <circle cx="13" cy="13" r="1.5" fill="#FFFFFF" />
          </svg>
        );

      case 'EUR':
        return (
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <rect width="36" height="36" fill="#003399" />
            {/* Circle of 12 gold stars */}
            <g fill="#FFCC00">
              <circle cx="18" cy="7" r="1.3" />
              <circle cx="23.5" cy="8.5" r="1.3" />
              <circle cx="27.5" cy="12.5" r="1.3" />
              <circle cx="29" cy="18" r="1.3" />
              <circle cx="27.5" cy="23.5" r="1.3" />
              <circle cx="23.5" cy="27.5" r="1.3" />
              <circle cx="18" cy="29" r="1.3" />
              <circle cx="12.5" cy="27.5" r="1.3" />
              <circle cx="8.5" cy="23.5" r="1.3" />
              <circle cx="7" cy="18" r="1.3" />
              <circle cx="8.5" cy="12.5" r="1.3" />
              <circle cx="12.5" cy="8.5" r="1.3" />
            </g>
          </svg>
        );

      case 'GBP':
        return (
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <rect width="36" height="36" fill="#00247D" />
            {/* Diagonals */}
            <line x1="0" y1="0" x2="36" y2="36" stroke="#FFFFFF" strokeWidth="5" />
            <line x1="0" y1="36" x2="36" y2="0" stroke="#FFFFFF" strokeWidth="5" />
            <line x1="0" y1="0" x2="36" y2="36" stroke="#CF142B" strokeWidth="2.5" />
            <line x1="0" y1="36" x2="36" y2="0" stroke="#CF142B" strokeWidth="2.5" />
            {/* Cross */}
            <rect x="14" width="8" height="36" fill="#FFFFFF" />
            <rect y="14" width="36" height="8" fill="#FFFFFF" />
            <rect x="15.5" width="5" height="36" fill="#CF142B" />
            <rect y="15.5" width="36" height="5" fill="#CF142B" />
          </svg>
        );

      case 'JPY':
        return (
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <rect width="36" height="36" fill="#FFFFFF" />
            <circle cx="18" cy="18" r="9" fill="#BC002D" />
          </svg>
        );

      case 'AUD':
        return (
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <rect width="36" height="36" fill="#00008B" />
            {/* Canton */}
            <g transform="scale(0.5)">
              <rect width="36" height="36" fill="#00247D" />
              <line x1="0" y1="0" x2="36" y2="36" stroke="#FFFFFF" strokeWidth="5" />
              <line x1="0" y1="36" x2="36" y2="0" stroke="#FFFFFF" strokeWidth="5" />
              <line x1="0" y1="0" x2="36" y2="36" stroke="#CF142B" strokeWidth="2" />
              <line x1="0" y1="36" x2="36" y2="0" stroke="#CF142B" strokeWidth="2" />
              <rect x="14" width="8" height="36" fill="#FFFFFF" />
              <rect y="14" width="36" height="8" fill="#FFFFFF" />
              <rect x="16" width="4" height="36" fill="#CF142B" />
              <rect y="16" width="36" height="4" fill="#CF142B" />
            </g>
            {/* Federation Star */}
            <circle cx="9" cy="27" r="3" fill="#FFFFFF" />
            {/* Southern Cross stars */}
            <circle cx="28" cy="10" r="1.4" fill="#FFFFFF" />
            <circle cx="32" cy="16" r="1.4" fill="#FFFFFF" />
            <circle cx="24" cy="20" r="1.4" fill="#FFFFFF" />
            <circle cx="28" cy="27" r="1.4" fill="#FFFFFF" />
          </svg>
        );

      case 'CAD':
        return (
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <rect width="36" height="36" fill="#D80027" />
            <rect x="9" width="18" height="36" fill="#FFFFFF" />
            {/* Stylized Maple leaf */}
            <path
              d="M18 10 L19.5 14 L22 13 L21 16 L24 18 L21.5 20 L22 23 L19 22 L18.5 25 L17.5 25 L17 22 L14 23 L14.5 20 L12 18 L15 16 L14 13 L16.5 14 Z"
              fill="#D80027"
            />
          </svg>
        );

      case 'CHF':
        return (
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <rect width="36" height="36" fill="#D52B1E" />
            <rect x="14" y="8" width="8" height="20" rx="1" fill="#FFFFFF" />
            <rect x="8" y="14" width="20" height="8" rx="1" fill="#FFFFFF" />
          </svg>
        );

      case 'NZD':
        return (
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <rect width="36" height="36" fill="#00247D" />
            {/* Union Jack in canton */}
            <g transform="scale(0.5)">
              <rect width="36" height="36" fill="#00247D" />
              <line x1="0" y1="0" x2="36" y2="36" stroke="#FFFFFF" strokeWidth="5" />
              <line x1="0" y1="36" x2="36" y2="0" stroke="#FFFFFF" strokeWidth="5" />
              <rect x="14" width="8" height="36" fill="#FFFFFF" />
              <rect y="14" width="36" height="8" fill="#FFFFFF" />
              <rect x="16" width="4" height="36" fill="#CF142B" />
              <rect y="16" width="36" height="4" fill="#CF142B" />
            </g>
            {/* Red Southern cross with white borders */}
            <circle cx="28" cy="10" r="1.8" fill="#FFFFFF" />
            <circle cx="28" cy="10" r="1.3" fill="#CC142B" />
            <circle cx="32" cy="16" r="1.8" fill="#FFFFFF" />
            <circle cx="32" cy="16" r="1.3" fill="#CC142B" />
            <circle cx="24" cy="20" r="1.8" fill="#FFFFFF" />
            <circle cx="24" cy="20" r="1.3" fill="#CC142B" />
            <circle cx="28" cy="27" r="1.8" fill="#FFFFFF" />
            <circle cx="28" cy="27" r="1.3" fill="#CC142B" />
          </svg>
        );

      case 'SGD':
        return (
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <rect width="36" height="18" fill="#ED2939" />
            <rect y="18" width="36" height="18" fill="#FFFFFF" />
            {/* Crescent and stars on red canton */}
            <circle cx="8" cy="9" r="5" fill="#FFFFFF" />
            <circle cx="9.5" cy="9" r="4.5" fill="#ED2939" />
            <circle cx="12" cy="6.5" r="0.9" fill="#FFFFFF" />
            <circle cx="13.5" cy="8" r="0.9" fill="#FFFFFF" />
            <circle cx="13" cy="10" r="0.9" fill="#FFFFFF" />
            <circle cx="11" cy="10" r="0.9" fill="#FFFFFF" />
            <circle cx="10.5" cy="8" r="0.9" fill="#FFFFFF" />
          </svg>
        );

      case 'ZAR':
        return (
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <rect width="36" height="18" fill="#E03C31" />
            <rect y="18" width="36" height="18" fill="#001489" />
            <path d="M0 0 L16 18 L0 36 Z" fill="#000000" />
            <path d="M0 0 L18 18 L0 36" fill="none" stroke="#FFB81C" strokeWidth="3" />
            <path d="M0 0 L20 18 L36 18 M20 18 L0 36" fill="none" stroke="#007749" strokeWidth="6" />
          </svg>
        );

      case 'XAU':
        return (
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <defs>
              <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="50%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#A16207" />
              </linearGradient>
            </defs>
            <rect width="36" height="36" fill="url(#goldG)" />
            <path d="M7 13 L29 13 L26 25 L10 25 Z" fill="#713F12" opacity="0.4" />
            <text x="18" y="22" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#451A03" fontFamily="sans-serif">
              Au
            </text>
          </svg>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-300 font-bold text-[9px]">
            {code.slice(0, 2)}
          </div>
        );
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden rounded-full ring-1 ring-zinc-700/60 shadow-sm shrink-0 select-none ${SIZE_MAP[size]} ${className}`}
      title={`${info.name} (${info.code}) ${info.flagEmoji}`}
    >
      {renderSVG()}
    </span>
  );
};

// Dual flag badge for currency pairs (e.g. EUR/USD)
interface PairFlagBadgeProps {
  base: string;
  quote: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const PairFlagBadge: React.FC<PairFlagBadgeProps> = ({
  base,
  quote,
  size = 'sm',
  className = '',
}) => {
  return (
    <span className={`inline-flex items-center -space-x-1.5 shrink-0 ${className}`}>
      <CurrencyFlag currency={base} size={size} className="z-10 ring-1 ring-zinc-950" />
      <CurrencyFlag currency={quote} size={size} className="z-0 ring-1 ring-zinc-950" />
    </span>
  );
};

// Helper that takes a symbol like "EUR/USD" and renders its flags
export const SymbolFlagBadge: React.FC<{ symbol: string; size?: 'xs' | 'sm' | 'md'; className?: string }> = ({
  symbol,
  size = 'sm',
  className = '',
}) => {
  const parts = (symbol || '').split('/');
  const base = parts[0] || 'USD';
  const quote = parts[1] || 'USD';
  return <PairFlagBadge base={base} quote={quote} size={size} className={className} />;
};

// Dropdown Global Currency Selector for Navbar or Headers
interface GlobalCurrencySelectorProps {
  selectedCurrency: GlobalCurrencyCode;
  onSelectCurrency: (currency: GlobalCurrencyCode) => void;
  className?: string;
  compact?: boolean;
}

export const GlobalCurrencySelector: React.FC<GlobalCurrencySelectorProps> = ({
  selectedCurrency,
  onSelectCurrency,
  className = '',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentInfo = GLOBAL_CURRENCIES[selectedCurrency] || GLOBAL_CURRENCIES.USD;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currencyList = Object.values(GLOBAL_CURRENCIES);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        id="global-currency-selector-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 text-zinc-200 text-xs font-semibold transition shadow-sm"
        title="Switch Base Account Currency"
      >
        <CurrencyFlag currency={currentInfo.code} size="sm" />
        <span className="font-mono text-white font-bold">{currentInfo.code}</span>
        <span className="text-zinc-400 font-sans">({currentInfo.symbol})</span>
        <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
      </button>

      {isOpen && (
        <div
          id="global-currency-dropdown-menu"
          className="absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95"
        >
          <div className="px-2.5 py-1.5 border-b border-zinc-850 flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-zinc-400">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-emerald-400" />
              Global Currency
            </span>
            <span>Fx Rate (USD)</span>
          </div>

          <div className="max-h-64 overflow-y-auto py-1 space-y-0.5">
            {currencyList.map((cur) => {
              const isSelected = cur.code === selectedCurrency;
              return (
                <button
                  key={cur.code}
                  type="button"
                  onClick={() => {
                    onSelectCurrency(cur.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                    isSelected
                      ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CurrencyFlag currency={cur.code} size="sm" />
                    <div className="text-left">
                      <div className="flex items-center gap-1.5 leading-none">
                        <span className="font-bold text-white font-mono">{cur.code}</span>
                        <span className="text-zinc-400 text-[11px] font-sans">({cur.symbol})</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">{cur.country}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-zinc-400">
                      {cur.code === 'USD' ? '1.000' : cur.defaultRateToUSD.toFixed(cur.decimals > 0 ? 3 : 1)}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-2.5 py-1.5 border-t border-zinc-850 text-[10px] text-zinc-500">
            Converts all account metrics, PnL, & trade logs.
          </div>
        </div>
      )}
    </div>
  );
};
