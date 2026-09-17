import React from 'react';

export type GlobalCurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'NZD' | 'SGD' | 'ZAR';

export interface GlobalCurrencyInfo {
  code: GlobalCurrencyCode;
  name: string;
  symbol: string;
  flagEmoji: string;
  country: string;
  defaultRateToUSD: number; // units of this currency per 1 USD
  decimals: number;
}

export const GLOBAL_CURRENCIES: Record<GlobalCurrencyCode, GlobalCurrencyInfo> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flagEmoji: '🇺🇸',
    country: 'United States',
    defaultRateToUSD: 1.0,
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flagEmoji: '🇪🇺',
    country: 'European Union',
    defaultRateToUSD: 0.9221,
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flagEmoji: '🇬🇧',
    country: 'United Kingdom',
    defaultRateToUSD: 0.7731,
    decimals: 2,
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    flagEmoji: '🇯🇵',
    country: 'Japan',
    defaultRateToUSD: 154.23,
    decimals: 0,
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    flagEmoji: '🇦🇺',
    country: 'Australia',
    defaultRateToUSD: 1.5192,
    decimals: 2,
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    flagEmoji: '🇨🇦',
    country: 'Canada',
    defaultRateToUSD: 1.3812,
    decimals: 2,
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    flagEmoji: '🇨🇭',
    country: 'Switzerland',
    defaultRateToUSD: 0.8845,
    decimals: 2,
  },
  NZD: {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    flagEmoji: '🇳🇿',
    country: 'New Zealand',
    defaultRateToUSD: 1.6380,
    decimals: 2,
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    flagEmoji: '🇸🇬',
    country: 'Singapore',
    defaultRateToUSD: 1.3450,
    decimals: 2,
  },
  ZAR: {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    flagEmoji: '🇿🇦',
    country: 'South Africa',
    defaultRateToUSD: 17.65,
    decimals: 2,
  },
};

export const SUPPORTED_GLOBAL_CURRENCIES: GlobalCurrencyInfo[] = Object.values(GLOBAL_CURRENCIES);

// Helper to get currency details by 3-letter code
export function getCurrencyInfo(code: string = 'USD'): GlobalCurrencyInfo {
  const upper = (code || 'USD').toUpperCase();
  if (upper === 'XAU') {
    return {
      code: 'USD',
      name: 'Gold Bullion',
      symbol: 'oz',
      flagEmoji: '🪙',
      country: 'Precious Metals',
      defaultRateToUSD: 0.000416,
      decimals: 2,
    };
  }
  if (upper in GLOBAL_CURRENCIES) {
    return GLOBAL_CURRENCIES[upper as GlobalCurrencyCode];
  }
  return {
    code: 'USD',
    name: upper,
    symbol: upper,
    flagEmoji: '🌐',
    country: 'International',
    defaultRateToUSD: 1,
    decimals: 2,
  };
}

// Convert amount from USD to selected Global Base Currency
export function convertFromUSD(
  amountInUSD: number,
  targetCurrency: GlobalCurrencyCode | string = 'USD',
  liveRateOverrides?: Partial<Record<string, number>>
): number {
  const upper = (targetCurrency || 'USD').toUpperCase() as GlobalCurrencyCode;
  const rate = liveRateOverrides?.[upper] ?? GLOBAL_CURRENCIES[upper]?.defaultRateToUSD ?? 1;
  return amountInUSD * rate;
}

// Format currency amount in selected Global Base Currency
export function formatGlobalCurrency(
  amountInUSD: number,
  targetCurrency: GlobalCurrencyCode | string = 'USD',
  options?: {
    showSign?: boolean;
    compact?: boolean;
    includeCode?: boolean;
    maximumFractionDigits?: number;
    rates?: Partial<Record<string, number>>;
  }
): string {
  const upper = (targetCurrency || 'USD').toUpperCase() as GlobalCurrencyCode;
  const info = GLOBAL_CURRENCIES[upper] || GLOBAL_CURRENCIES.USD;
  const converted = convertFromUSD(amountInUSD, upper, options?.rates);
  const decimals = options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : info.decimals;

  let formattedNumber: string;
  if (options?.compact && Math.abs(converted) >= 1000000) {
    formattedNumber = (converted / 1000000).toFixed(2) + 'M';
  } else if (options?.compact && Math.abs(converted) >= 10000) {
    formattedNumber = (converted / 1000).toFixed(1) + 'k';
  } else {
    formattedNumber = converted.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  const sign = options?.showSign ? (converted >= 0 ? '+' : '') : '';
  const prefix = `${info.symbol}`;
  const suffix = options?.includeCode ? ` ${info.code}` : '';

  // If number is negative and showSign wasn't requested, localeString puts "-" before or we handle it cleanly
  if (converted < 0 && !options?.showSign) {
    const absStr = Math.abs(converted).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `-${prefix}${absStr}${suffix}`;
  }

  return `${sign}${prefix}${formattedNumber}${suffix}`;
}
