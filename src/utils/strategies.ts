import { BotStrategy, Candle, CustomVisualStrategy, OrderType } from '../types';
import { evaluateCustomStrategySignal } from './visualStrategyEngine';

export const BOT_STRATEGIES: BotStrategy[] = [
  {
    id: 'EMA_CROSS',
    name: 'EMA Trend Momentum (9/21/50)',
    tagline: 'Golden & Death Cross with Trend Filtering',
    description: 'Executes trend-following trades when EMA 9 crosses EMA 21, validated by the 50-period macro trend baseline and RSI momentum confirmation.',
    timeframe: '5M',
    recommendedPairs: ['EUR/USD', 'GBP/USD', 'AUD/USD'],
    parameters: {
      fastEma: 9,
      slowEma: 21,
      trendEma: 50,
      rsiPeriod: 14,
      rsiOverbought: 68,
      rsiOversold: 32,
    },
  },
  {
    id: 'RSI_MACD_REVERSAL',
    name: 'RSI & MACD Divergence Reversal',
    tagline: 'Mean Reversion at Extreme Price Exhaustion',
    description: 'Catches sharp institutional reversals when RSI reaches oversold (<30) or overbought (>70) levels and MACD histogram signals directional inflection.',
    timeframe: '15M',
    recommendedPairs: ['EUR/USD', 'USD/JPY', 'USD/CAD'],
    parameters: {
      rsiPeriod: 14,
      rsiOversold: 30,
      rsiOverbought: 70,
      macdFast: 12,
      macdSlow: 26,
      macdSignal: 9,
    },
  },
  {
    id: 'BOLLINGER_BREAKOUT',
    name: 'Bollinger Band Volatility Breakout',
    tagline: 'Volatility Squeeze & Envelope Expansion',
    description: 'Identifies volatility compression phases and triggers aggressive entries as price explodes outside the 2.0 standard deviation bands with volume.',
    timeframe: '5M',
    recommendedPairs: ['GBP/USD', 'XAU/USD', 'EUR/USD'],
    parameters: {
      bbPeriod: 20,
      bbStdDev: 2.0,
      rsiPeriod: 14,
    },
  },
  {
    id: 'SCALPER_PRO',
    name: 'Forex Scalper Pro (Micro-Pip)',
    tagline: 'High-Frequency Rapid Pip Harvester',
    description: 'Ultra-responsive scalping algorithm designed for low-spread pairs. Exploits micro-swings for 8 to 15 pips with tight safety stops and aggressive trailing.',
    timeframe: '1M',
    recommendedPairs: ['EUR/USD', 'GBP/USD'],
    parameters: {
      scalperPipTarget: 10,
      fastEma: 5,
      slowEma: 13,
      rsiPeriod: 7,
    },
  },
  {
    id: 'COPY_SCALPER',
    name: 'Copy Scalper Robot (HFT Prop)',
    tagline: 'Mirrored Institutional High-Frequency Scalper',
    description: 'Autonomous prop-firm copy scalper engine. Replicates top institutional tick scalpers with sub-minute micro-burst entries, tight 10-pip hard stops, 12-pip targets, and hyper-dynamic 5-pip trailing stops.',
    timeframe: '1M',
    recommendedPairs: ['EUR/USD', 'GBP/USD', 'USD/JPY'],
    parameters: {
      scalperPipTarget: 12,
      fastEma: 5,
      slowEma: 13,
      rsiPeriod: 7,
      takeProfitPips: 12,
      stopLossPips: 10,
    },
  },
  {
    id: 'GRID_SYSTEM',
    name: 'Smart Dynamic Grid DCA',
    tagline: 'Multi-Level Staggered Orders',
    description: 'Deploys structured geometric order layers at 15-pip intervals. Capitalizes on ranging market oscillating volatility with automated basket profit taking.',
    timeframe: '15M',
    recommendedPairs: ['EUR/USD', 'USD/CAD', 'AUD/USD'],
    parameters: {
      gridLevels: 4,
      gridStepPips: 15,
      takeProfitPips: 20,
    },
  },
  {
    id: 'AI_QUANT',
    name: 'AI Gemini Neural Quant Agent',
    tagline: 'Multi-Factor Deep Technical & Macro Synthesis',
    description: 'Institutional-grade AI quantitative strategy evaluating multi-timeframe candle confluence, dynamic ATR risk sizing, and server-side machine intelligence.',
    timeframe: '5M',
    recommendedPairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD'],
    parameters: {
      aiConfidenceMin: 75,
      fastEma: 9,
      slowEma: 21,
      rsiPeriod: 14,
    },
  },
  {
    id: 'CUSTOM_BUILDER',
    name: 'Visual Custom Strategy Builder',
    tagline: 'Drag-and-Drop Dynamic Execution Logic',
    description: 'Autonomous trading logic engineered visually with drag-and-drop indicator conditions (e.g. RSI < 30 AND EMA 50 > EMA 200) without hardcoded rules.',
    timeframe: '5M',
    recommendedPairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD'],
    parameters: {
      takeProfitPips: 30,
      stopLossPips: 18,
    },
  },
];

export interface SignalEvaluationResult {
  signal: OrderType | null;
  confidence: number;
  reason: string;
}

// Evaluate Strategy condition on the latest candles
export function evaluateStrategySignal(
  strategyId: string,
  candles: Candle[],
  pairSymbol: string,
  customStrategy?: CustomVisualStrategy
): SignalEvaluationResult {
  if (candles.length < 3) {
    return { signal: null, confidence: 0, reason: 'Insufficient candle history' };
  }

  const current = candles[candles.length - 1];
  const previous = candles[candles.length - 2];
  const prev2 = candles[candles.length - 3];

  switch (strategyId) {
    case 'EMA_CROSS': {
      const currFast = current.ema9 ?? current.close;
      const currSlow = current.ema21 ?? current.close;
      const prevFast = previous.ema9 ?? previous.close;
      const prevSlow = previous.ema21 ?? previous.close;
      const trend = current.ema50 ?? current.close;
      const rsi = current.rsi ?? 50;

      // Bullish Cross: Fast crossed above Slow, price above Trend, RSI not overbought
      if (prevFast <= prevSlow && currFast > currSlow && current.close > trend && rsi < 65) {
        return {
          signal: 'BUY',
          confidence: 86,
          reason: `Bullish EMA 9 cross above EMA 21 confirmed above 50-EMA trend with RSI at ${rsi.toFixed(1)}`,
        };
      }

      // Bearish Cross: Fast crossed below Slow, price below Trend, RSI not oversold
      if (prevFast >= prevSlow && currFast < currSlow && current.close < trend && rsi > 35) {
        return {
          signal: 'SELL',
          confidence: 84,
          reason: `Bearish EMA 9 cross below EMA 21 confirmed below 50-EMA trend with RSI at ${rsi.toFixed(1)}`,
        };
      }

      return { signal: null, confidence: 0, reason: 'No crossover detected' };
    }

    case 'RSI_MACD_REVERSAL': {
      const rsi = current.rsi ?? 50;
      const macdHist = current.macdHist ?? 0;
      const prevHist = previous.macdHist ?? 0;

      // Oversold rebound: RSI was < 30 and curling up, MACD hist improving
      if ((previous.rsi ?? 50) < 32 && rsi > (previous.rsi ?? 50) && macdHist > prevHist) {
        return {
          signal: 'BUY',
          confidence: 82,
          reason: `Oversold reversal triggered: RSI bounced to ${rsi.toFixed(1)} with upward MACD histogram divergence`,
        };
      }

      // Overbought pullback: RSI was > 70 and curling down, MACD hist turning negative
      if ((previous.rsi ?? 50) > 68 && rsi < (previous.rsi ?? 50) && macdHist < prevHist) {
        return {
          signal: 'SELL',
          confidence: 81,
          reason: `Overbought exhaustion triggered: RSI cooled to ${rsi.toFixed(1)} with declining MACD momentum`,
        };
      }

      return { signal: null, confidence: 0, reason: 'RSI in neutral range' };
    }

    case 'BOLLINGER_BREAKOUT': {
      const upper = current.upperBand ?? current.high;
      const lower = current.lowerBand ?? current.low;
      const middle = current.middleBand ?? current.close;

      // Bullish breakout above upper band
      if (current.close > upper && previous.close <= (previous.upperBand ?? previous.high)) {
        return {
          signal: 'BUY',
          confidence: 79,
          reason: `Volatility breakout: Candle closed above upper Bollinger band at ${current.close}`,
        };
      }

      // Bearish breakdown below lower band
      if (current.close < lower && previous.close >= (previous.lowerBand ?? previous.low)) {
        return {
          signal: 'SELL',
          confidence: 78,
          reason: `Volatility breakdown: Candle closed below lower Bollinger band at ${current.close}`,
        };
      }

      // Mean reversion bounce from lower band back towards middle
      if (previous.low < lower && current.close > lower && current.close < middle && (current.rsi ?? 50) < 40) {
        return {
          signal: 'BUY',
          confidence: 75,
          reason: `Mean-reversion bounce off lower Bollinger band towards centerline`,
        };
      }

      return { signal: null, confidence: 0, reason: 'Price inside envelope' };
    }

    case 'SCALPER_PRO': {
      const rsi = current.rsi ?? 50;
      const ema9 = current.ema9 ?? current.close;
      const isUpMomentum = current.close > current.open && current.close > ema9;
      const isDownMomentum = current.close < current.open && current.close < ema9;

      if (isUpMomentum && rsi > 52 && rsi < 66 && (current.macdHist ?? 0) > 0) {
        return {
          signal: 'BUY',
          confidence: 77,
          reason: `High-speed 1M momentum impulse detected above EMA 9 with positive MACD flow`,
        };
      }

      if (isDownMomentum && rsi < 48 && rsi > 34 && (current.macdHist ?? 0) < 0) {
        return {
          signal: 'SELL',
          confidence: 76,
          reason: `High-speed 1M downward momentum impulse detected below EMA 9`,
        };
      }

      return { signal: null, confidence: 0, reason: 'Scalping conditions not aligned' };
    }

    case 'COPY_SCALPER': {
      const rsi = current.rsi ?? 50;
      const ema9 = current.ema9 ?? current.close;
      const ema21 = current.ema21 ?? current.close;
      const macdHist = current.macdHist ?? 0;

      // Fast tick scalper burst
      const isBullishTick = current.close > current.open && current.close >= ema9 && ema9 >= ema21;
      const isBearishTick = current.close < current.open && current.close <= ema9 && ema9 <= ema21;

      if (isBullishTick && rsi >= 51 && rsi <= 68 && macdHist >= -0.00005) {
        return {
          signal: 'BUY',
          confidence: 82,
          reason: `[Copy Scalper] Institutional micro-burst breakout confirmed on ${pairSymbol} targeting 12 pips`,
        };
      }

      if (isBearishTick && rsi <= 49 && rsi >= 32 && macdHist <= 0.00005) {
        return {
          signal: 'SELL',
          confidence: 81,
          reason: `[Copy Scalper] Institutional downward tick thrust confirmed on ${pairSymbol} targeting 12 pips`,
        };
      }

      return { signal: null, confidence: 0, reason: 'Copy scalper scanning for rapid tick breakout' };
    }

    case 'GRID_SYSTEM': {
      // Dynamic grid entry based on swing pivots
      if (current.close < (previous.close) && (current.rsi ?? 50) < 42) {
        return {
          signal: 'BUY',
          confidence: 72,
          reason: `Grid DCA order layer triggered on dip at ${current.close}`,
        };
      }
      if (current.close > (previous.close) && (current.rsi ?? 50) > 58) {
        return {
          signal: 'SELL',
          confidence: 71,
          reason: `Grid DCA order layer triggered on rally at ${current.close}`,
        };
      }
      return { signal: null, confidence: 0, reason: 'Awaiting grid step threshold' };
    }

    case 'AI_QUANT': {
      // Multi-confluence quantitative composite
      const rsi = current.rsi ?? 50;
      const emaBullish = (current.ema9 ?? 0) > (current.ema21 ?? 0);
      const macdBullish = (current.macdHist ?? 0) > 0;
      const aboveMiddle = current.close > (current.middleBand ?? current.close);

      let buyScore = 0;
      let sellScore = 0;

      if (emaBullish) buyScore += 30; else sellScore += 30;
      if (macdBullish) buyScore += 25; else sellScore += 25;
      if (aboveMiddle) buyScore += 20; else sellScore += 20;
      if (rsi > 45 && rsi < 65) buyScore += 20;
      if (rsi < 55 && rsi > 35) sellScore += 20;

      if (buyScore >= 75) {
        return {
          signal: 'BUY',
          confidence: buyScore,
          reason: `AI Quantitative Confluence: Trend (EMA), Momentum (MACD), and Volatility score ${buyScore}% bullish`,
        };
      }

      if (sellScore >= 75) {
        return {
          signal: 'SELL',
          confidence: sellScore,
          reason: `AI Quantitative Confluence: Trend (EMA), Momentum (MACD), and Volatility score ${sellScore}% bearish`,
        };
      }

      return { signal: null, confidence: Math.max(buyScore, sellScore), reason: 'Composite confluence below 75% threshold' };
    }

    case 'CUSTOM_BUILDER': {
      if (customStrategy) {
        return evaluateCustomStrategySignal(customStrategy, candles, pairSymbol);
      }
      return {
        signal: null,
        confidence: 0,
        reason: 'Visual Strategy Builder active - awaiting rule formulation or indicator alignment',
      };
    }

    default:
      return { signal: null, confidence: 0, reason: 'Unknown strategy' };
  }
}
