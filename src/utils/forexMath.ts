import { Candle, CurrencyPair, OrderType, Position } from '../types';

export const INITIAL_PAIRS: CurrencyPair[] = [
  {
    id: 'eurusd',
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    base: 'EUR',
    quote: 'USD',
    digits: 5,
    pipMultiplier: 10000,
    currentBid: 1.08452,
    currentAsk: 1.08462,
    spreadPips: 1.0,
    high24h: 1.08920,
    low24h: 1.08110,
    change24h: 0.00215,
    changePercent24h: 0.20,
    baseVolatility: 0.00015,
  },
  {
    id: 'gbpusd',
    symbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    base: 'GBP',
    quote: 'USD',
    digits: 5,
    pipMultiplier: 10000,
    currentBid: 1.29340,
    currentAsk: 1.29355,
    spreadPips: 1.5,
    high24h: 1.30150,
    low24h: 1.28900,
    change24h: 0.00310,
    changePercent24h: 0.24,
    baseVolatility: 0.00022,
  },
  {
    id: 'usdjpy',
    symbol: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    base: 'USD',
    quote: 'JPY',
    digits: 3,
    pipMultiplier: 100,
    currentBid: 154.235,
    currentAsk: 154.250,
    spreadPips: 1.5,
    high24h: 155.100,
    low24h: 153.800,
    change24h: -0.420,
    changePercent24h: -0.27,
    baseVolatility: 0.025,
  },
  {
    id: 'audusd',
    symbol: 'AUD/USD',
    name: 'Australian Dollar / US Dollar',
    base: 'AUD',
    quote: 'USD',
    digits: 5,
    pipMultiplier: 10000,
    currentBid: 0.65820,
    currentAsk: 0.65832,
    spreadPips: 1.2,
    high24h: 0.66250,
    low24h: 0.65510,
    change24h: 0.00180,
    changePercent24h: 0.27,
    baseVolatility: 0.00018,
  },
  {
    id: 'usdcad',
    symbol: 'USD/CAD',
    name: 'US Dollar / Canadian Dollar',
    base: 'USD',
    quote: 'CAD',
    digits: 5,
    pipMultiplier: 10000,
    currentBid: 1.38120,
    currentAsk: 1.38135,
    spreadPips: 1.5,
    high24h: 1.38600,
    low24h: 1.37800,
    change24h: -0.00140,
    changePercent24h: -0.10,
    baseVolatility: 0.00019,
  },
  {
    id: 'xauusd',
    symbol: 'XAU/USD',
    name: 'Gold / US Dollar',
    base: 'XAU',
    quote: 'USD',
    digits: 2,
    pipMultiplier: 10,
    currentBid: 2735.40,
    currentAsk: 2735.75,
    spreadPips: 3.5,
    high24h: 2748.20,
    low24h: 2715.00,
    change24h: 14.80,
    changePercent24h: 0.54,
    baseVolatility: 0.45,
  },
  {
    id: 'usdchf',
    symbol: 'USD/CHF',
    name: 'US Dollar / Swiss Franc',
    base: 'USD',
    quote: 'CHF',
    digits: 5,
    pipMultiplier: 10000,
    currentBid: 0.88450,
    currentAsk: 0.88465,
    spreadPips: 1.5,
    high24h: 0.88900,
    low24h: 0.88120,
    change24h: 0.00110,
    changePercent24h: 0.12,
    baseVolatility: 0.00016,
  },
  {
    id: 'nzdusd',
    symbol: 'NZD/USD',
    name: 'New Zealand Dollar / US Dollar',
    base: 'NZD',
    quote: 'USD',
    digits: 5,
    pipMultiplier: 10000,
    currentBid: 0.61050,
    currentAsk: 0.61066,
    spreadPips: 1.6,
    high24h: 0.61450,
    low24h: 0.60780,
    change24h: 0.00130,
    changePercent24h: 0.21,
    baseVolatility: 0.00017,
  },
  {
    id: 'eurgbp',
    symbol: 'EUR/GBP',
    name: 'Euro / British Pound',
    base: 'EUR',
    quote: 'GBP',
    digits: 5,
    pipMultiplier: 10000,
    currentBid: 0.83850,
    currentAsk: 0.83864,
    spreadPips: 1.4,
    high24h: 0.84150,
    low24h: 0.83580,
    change24h: -0.00045,
    changePercent24h: -0.05,
    baseVolatility: 0.00014,
  },
  {
    id: 'eurjpy',
    symbol: 'EUR/JPY',
    name: 'Euro / Japanese Yen',
    base: 'EUR',
    quote: 'JPY',
    digits: 3,
    pipMultiplier: 100,
    currentBid: 167.280,
    currentAsk: 167.298,
    spreadPips: 1.8,
    high24h: 168.150,
    low24h: 166.800,
    change24h: -0.210,
    changePercent24h: -0.13,
    baseVolatility: 0.024,
  },
  {
    id: 'gbpjpy',
    symbol: 'GBP/JPY',
    name: 'British Pound / Japanese Yen',
    base: 'GBP',
    quote: 'JPY',
    digits: 3,
    pipMultiplier: 100,
    currentBid: 199.490,
    currentAsk: 199.512,
    spreadPips: 2.2,
    high24h: 200.600,
    low24h: 198.900,
    change24h: 0.350,
    changePercent24h: 0.18,
    baseVolatility: 0.035,
  },
  {
    id: 'usdsgd',
    symbol: 'USD/SGD',
    name: 'US Dollar / Singapore Dollar',
    base: 'USD',
    quote: 'SGD',
    digits: 5,
    pipMultiplier: 10000,
    currentBid: 1.34520,
    currentAsk: 1.34538,
    spreadPips: 1.8,
    high24h: 1.34900,
    low24h: 1.34210,
    change24h: -0.00080,
    changePercent24h: -0.06,
    baseVolatility: 0.00015,
  },
];

export function getPipValue(symbol: string): number {
  if (symbol.includes('JPY')) return 0.01;
  if (symbol === 'XAU/USD') return 0.1;
  return 0.0001;
}

export function formatPrice(price: number, symbol: string): string {
  if (symbol.includes('JPY')) return price.toFixed(3);
  if (symbol === 'XAU/USD') return price.toFixed(2);
  return price.toFixed(5);
}

// Calculate Exponential Moving Average
export function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const emaArray: number[] = [];

  // Simple average for the first point
  let sum = 0;
  for (let i = 0; i < Math.min(period, data.length); i++) {
    sum += data[i];
  }
  let currentEma = sum / Math.min(period, data.length);

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      emaArray.push(data[i]);
    } else if (i === period - 1) {
      emaArray.push(currentEma);
    } else {
      currentEma = data[i] * k + currentEma * (1 - k);
      emaArray.push(currentEma);
    }
  }
  return emaArray;
}

// Calculate Relative Strength Index (RSI 14)
export function calculateRSI(closes: number[], period: number = 14): number[] {
  const rsis: number[] = [];
  if (closes.length <= period) {
    return closes.map(() => 50);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  rsis.push(50); // first dummy
  for (let i = 1; i < period; i++) {
    rsis.push(50);
  }

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsis.push(100 - 100 / (1 + rs));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsis.push(100 - 100 / (1 + rs));
  }

  return rsis;
}

// Calculate MACD (12, 26, 9)
export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
) {
  const fastEma = calculateEMA(closes, fastPeriod);
  const slowEma = calculateEMA(closes, slowPeriod);

  const macdLine = fastEma.map((val, idx) => val - slowEma[idx]);
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram = macdLine.map((val, idx) => val - signalLine[idx]);

  return { macdLine, signalLine, histogram };
}

// Calculate Bollinger Bands
export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
) {
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      middle.push(closes[i]);
      upper.push(closes[i]);
      lower.push(closes[i]);
      continue;
    }

    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    middle.push(mean);
    upper.push(mean + stdDevMultiplier * stdDev);
    lower.push(mean - stdDevMultiplier * stdDev);
  }

  return { upper, middle, lower };
}

// Calculate Average True Range (ATR 14)
export function calculateATR(candles: { high: number; low: number; close: number }[], period: number = 14): number[] {
  const trs: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trs.push(candles[i].high - candles[i].low);
    } else {
      const tr = Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      );
      trs.push(tr);
    }
  }
  return calculateEMA(trs, period);
}

// Enrich candles with technical indicators
export function enrichCandlesWithIndicators(candles: Candle[]): Candle[] {
  if (candles.length < 5) return candles;

  const closes = candles.map((c) => c.close);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  const rsi = calculateRSI(closes, 14);
  const { macdLine, signalLine, histogram } = calculateMACD(closes);
  const { upper, middle, lower } = calculateBollingerBands(closes, 20, 2);
  const atr = calculateATR(candles, 14);

  return candles.map((c, i) => ({
    ...c,
    ema9: ema9[i],
    ema21: ema21[i],
    ema50: ema50[i],
    ema200: ema200[i],
    rsi: rsi[i],
    macd: macdLine[i],
    signalLine: signalLine[i],
    macdHist: histogram[i],
    upperBand: upper[i],
    middleBand: middle[i],
    lowerBand: lower[i],
    atr: atr[i],
  }));
}

// Generate realistic starting historical candles for a pair
export function generateInitialCandles(pair: CurrencyPair, count: number = 80): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const barDuration = 60 * 1000 * 5; // 5-minute bars
  const pip = getPipValue(pair.symbol);

  let currentClose = pair.currentBid;
  const trendPhase = Math.random() > 0.5 ? 1 : -1;

  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * barDuration;
    const wave = Math.sin(i / 8) * pair.baseVolatility * 1.5;
    const drift = (Math.random() - 0.49) * pair.baseVolatility * 2 + wave * 0.05 * trendPhase;
    
    const open = currentClose;
    currentClose = Math.max(open + drift, pip * 10);
    const wickHigh = Math.random() * pair.baseVolatility * 1.8;
    const wickLow = Math.random() * pair.baseVolatility * 1.8;
    const high = Math.max(open, currentClose) + wickHigh;
    const low = Math.min(open, currentClose) - wickLow;
    const volume = Math.floor(Math.random() * 800 + 200);

    candles.push({
      time,
      open: Number(open.toFixed(pair.digits)),
      high: Number(high.toFixed(pair.digits)),
      low: Number(low.toFixed(pair.digits)),
      close: Number(currentClose.toFixed(pair.digits)),
      volume,
    });
  }

  return enrichCandlesWithIndicators(candles);
}

// Calculate PnL for an open position
export function calculatePositionPnL(
  position: Position,
  currentBid: number,
  currentAsk: number,
  symbol: string
): { pnlDollar: number; pnlPips: number } {
  const pipSize = getPipValue(symbol);
  const currentPrice = position.type === 'BUY' ? currentBid : currentAsk;

  let pipsDiff = 0;
  if (position.type === 'BUY') {
    pipsDiff = (currentPrice - position.openPrice) / pipSize;
  } else {
    pipsDiff = (position.openPrice - currentPrice) / pipSize;
  }

  // 1 standard lot = 100,000 units.
  // For USD quote (EUR/USD, GBP/USD, AUD/USD): 1 pip = $10 per 1 standard lot (10 * lots * pips)
  // For JPY quote: 1 pip = (1000 / currentPrice) * lots * pips approx ~$6.50 - $7.00
  // For Gold: 1 lot = 100 oz. $1 move = $100. 1 pip (0.10) = $10
  let dollarPerPipPerLot = 10;
  if (symbol.includes('JPY')) {
    dollarPerPipPerLot = 1000 / (symbol.startsWith('USD') ? currentPrice : 154.23);
  } else if (symbol === 'USD/CAD' || symbol === 'USD/CHF' || symbol === 'USD/SGD') {
    dollarPerPipPerLot = 10 / currentPrice;
  } else if (symbol === 'EUR/GBP') {
    dollarPerPipPerLot = 10 * 1.293;
  }

  const pnlDollar = pipsDiff * dollarPerPipPerLot * position.lots;

  return {
    pnlDollar: Number(pnlDollar.toFixed(2)),
    pnlPips: Number(pipsDiff.toFixed(1)),
  };
}

// Calculate required margin
export function calculateRequiredMargin(lots: number, price: number, leverage: number, symbol: string): number {
  const contractSize = symbol === 'XAU/USD' ? 100 : 100000;
  const notionalValue = lots * contractSize * (symbol.startsWith('USD') ? 1 : price);
  return Number((notionalValue / leverage).toFixed(2));
}

export interface SmartRiskResult {
  effectiveLot: number;
  multiplier: number;
  riskTier: string;
  reductionPercent: number;
  reason: string;
}

// Dynamically adjusts lot size based on current account drawdown to preserve margin during volatile periods
export function calculateSmartLotSize(
  nominalLot: number,
  drawdownPercent: number,
  smartRiskEnabled: boolean
): SmartRiskResult {
  if (!smartRiskEnabled) {
    return {
      effectiveLot: nominalLot,
      multiplier: 1.0,
      riskTier: 'Standard Fixed',
      reductionPercent: 0,
      reason: 'Smart Risk inactive. Nominal lot size deployed.',
    };
  }

  // If drawdown is minimal (< 0.8%), full size
  if (drawdownPercent < 0.8) {
    return {
      effectiveLot: nominalLot,
      multiplier: 1.0,
      riskTier: 'Peak Capital (100%)',
      reductionPercent: 0,
      reason: 'Drawdown < 0.8%. Operating at 100% nominal risk.',
    };
  }

  // Tier 1: 0.8% - 2.0% Drawdown -> 75% lot size
  if (drawdownPercent <= 2.0) {
    const lot = Math.max(0.01, Number((nominalLot * 0.75).toFixed(2)));
    return {
      effectiveLot: lot,
      multiplier: 0.75,
      riskTier: 'Mild Volatility (-25%)',
      reductionPercent: 25,
      reason: `Drawdown is ${drawdownPercent.toFixed(1)}%. Scaling lot size to 75% to soften margin impact.`,
    };
  }

  // Tier 2: 2.0% - 3.5% Drawdown -> 50% lot size
  if (drawdownPercent <= 3.5) {
    const lot = Math.max(0.01, Number((nominalLot * 0.50).toFixed(2)));
    return {
      effectiveLot: lot,
      multiplier: 0.50,
      riskTier: 'Defensive Mode (-50%)',
      reductionPercent: 50,
      reason: `Drawdown elevated at ${drawdownPercent.toFixed(1)}%. Halving lot size to protect capital reserves.`,
    };
  }

  // Tier 3: > 3.5% Drawdown -> 25% lot size (Capital Preservation)
  const lot = Math.max(0.01, Number((nominalLot * 0.25).toFixed(2)));
  return {
    effectiveLot: lot,
    multiplier: 0.25,
    riskTier: 'Capital Preservation (-75%)',
    reductionPercent: 75,
    reason: `Drawdown critical at ${drawdownPercent.toFixed(1)}%. Quartering lot size to preserve free margin.`,
  };
}

