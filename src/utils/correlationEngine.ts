import { Candle, CurrencyPair, Position } from '../types';

export type CorrelationStrength =
  | 'STRONG_POSITIVE'
  | 'MODERATE_POSITIVE'
  | 'WEAK_POSITIVE'
  | 'NEUTRAL'
  | 'WEAK_NEGATIVE'
  | 'MODERATE_NEGATIVE'
  | 'STRONG_NEGATIVE';

export interface CorrelationCell {
  pairA: string;
  pairB: string;
  coefficient: number; // -1 to 1
  strength: CorrelationStrength;
  description: string;
}

export interface HedgingOpportunity {
  id: string;
  primaryPair: string;
  hedgePair: string;
  correlation: number;
  type: 'INVERSE_HEDGE' | 'PAIR_SPREAD_HEDGE' | 'SAFE_HAVEN_BUFFER' | 'CONCENTRATION_RISK';
  title: string;
  description: string;
  hedgingRationale: string;
  recommendedAction: string;
  suggestedType: 'BUY' | 'SELL';
  riskReductionScore: number; // 0 - 100
  isCurrentlyHedging?: boolean;
}

/**
 * Calculates the Pearson correlation coefficient between two numeric series
 */
export function calculatePearsonCorrelation(seriesA: number[], seriesB: number[]): number {
  const minLen = Math.min(seriesA.length, seriesB.length);
  if (minLen < 3) return 0;

  // Use the most recent minLen points
  const a = seriesA.slice(-minLen);
  const b = seriesB.slice(-minLen);

  const meanA = a.reduce((sum, val) => sum + val, 0) / minLen;
  const meanB = b.reduce((sum, val) => sum + val, 0) / minLen;

  let numerator = 0;
  let denomA = 0;
  let denomB = 0;

  for (let i = 0; i < minLen; i++) {
    const diffA = a[i] - meanA;
    const diffB = b[i] - meanB;
    numerator += diffA * diffB;
    denomA += diffA * diffA;
    denomB += diffB * diffB;
  }

  const denominator = Math.sqrt(denomA * denomB);
  if (denominator === 0) return 0;

  const r = numerator / denominator;
  // Clamp between -1 and 1
  return Math.max(-1, Math.min(1, Number(r.toFixed(3))));
}

/**
 * Computes price returns or normalized closes for correlation calculation
 */
export function extractPriceSeries(candles: Candle[], mode: 'CLOSE' | 'RETURNS' = 'RETURNS'): number[] {
  if (!candles || candles.length === 0) return [];
  const closes = candles.map((c) => c.close);

  if (mode === 'CLOSE') return closes;

  // Percentage returns series: (P_t - P_{t-1}) / P_{t-1}
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1];
    if (prev > 0) {
      returns.push((closes[i] - prev) / prev);
    }
  }
  return returns;
}

export function classifyCorrelation(coefficient: number): {
  strength: CorrelationStrength;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
} {
  if (coefficient >= 0.75) {
    return {
      strength: 'STRONG_POSITIVE',
      label: 'Strong Positive',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-950/80',
      borderClass: 'border-emerald-500/40',
    };
  }
  if (coefficient >= 0.4) {
    return {
      strength: 'MODERATE_POSITIVE',
      label: 'Moderate Positive',
      colorClass: 'text-emerald-300',
      bgClass: 'bg-emerald-950/40',
      borderClass: 'border-emerald-700/30',
    };
  }
  if (coefficient >= 0.15) {
    return {
      strength: 'WEAK_POSITIVE',
      label: 'Weak Positive',
      colorClass: 'text-emerald-200/80',
      bgClass: 'bg-emerald-950/20',
      borderClass: 'border-emerald-800/20',
    };
  }
  if (coefficient > -0.15) {
    return {
      strength: 'NEUTRAL',
      label: 'Uncorrelated',
      colorClass: 'text-zinc-400',
      bgClass: 'bg-zinc-900/60',
      borderClass: 'border-zinc-800',
    };
  }
  if (coefficient > -0.4) {
    return {
      strength: 'WEAK_NEGATIVE',
      label: 'Weak Negative',
      colorClass: 'text-rose-200/80',
      bgClass: 'bg-rose-950/20',
      borderClass: 'border-rose-800/20',
    };
  }
  if (coefficient > -0.75) {
    return {
      strength: 'MODERATE_NEGATIVE',
      label: 'Moderate Inverse',
      colorClass: 'text-rose-300',
      bgClass: 'bg-rose-950/40',
      borderClass: 'border-rose-700/30',
    };
  }
  return {
    strength: 'STRONG_NEGATIVE',
    label: 'Strong Inverse',
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-950/80',
    borderClass: 'border-rose-500/40',
  };
}

/**
 * Builds the complete N x N correlation matrix for a set of pairs
 */
export function buildCorrelationMatrix(
  pairSymbols: string[],
  allCandles: Record<string, Candle[]>,
  lookback: number = 50
): {
  symbols: string[];
  matrix: Record<string, Record<string, number>>;
  cells: CorrelationCell[];
} {
  const symbols = [...pairSymbols];
  const matrix: Record<string, Record<string, number>> = {};
  const cells: CorrelationCell[] = [];

  // Extract series
  const seriesMap: Record<string, number[]> = {};
  symbols.forEach((sym) => {
    const candles = (allCandles[sym] || []).slice(-lookback);
    seriesMap[sym] = extractPriceSeries(candles, 'RETURNS');
  });

  for (let i = 0; i < symbols.length; i++) {
    const symA = symbols[i];
    matrix[symA] = matrix[symA] || {};

    for (let j = 0; j < symbols.length; j++) {
      const symB = symbols[j];

      if (symA === symB) {
        matrix[symA][symB] = 1.0;
        continue;
      }

      // Check if already computed symmetrically
      if (matrix[symB]?.[symA] !== undefined) {
        matrix[symA][symB] = matrix[symB][symA];
      } else {
        const coef = calculatePearsonCorrelation(seriesMap[symA] || [], seriesMap[symB] || []);
        matrix[symA][symB] = coef;
      }

      if (i < j) {
        const coef = matrix[symA][symB];
        const classification = classifyCorrelation(coef);
        cells.push({
          pairA: symA,
          pairB: symB,
          coefficient: coef,
          strength: classification.strength,
          description: `${symA} vs ${symB}: ${classification.label} (${coef >= 0 ? '+' : ''}${coef.toFixed(2)})`,
        });
      }
    }
  }

  return { symbols, matrix, cells };
}

/**
 * Analyzes market correlation matrix and active positions to generate actionable hedging opportunities
 */
export function analyzeHedgingOpportunities(
  symbols: string[],
  matrix: Record<string, Record<string, number>>,
  openPositions: Position[]
): HedgingOpportunity[] {
  const opportunities: HedgingOpportunity[] = [];

  // Map active exposure by pair
  const openPositionsByPair: Record<string, Position[]> = {};
  openPositions.forEach((pos) => {
    openPositionsByPair[pos.pairSymbol] = openPositionsByPair[pos.pairSymbol] || [];
    openPositionsByPair[pos.pairSymbol].push(pos);
  });

  // 1. Position-Driven Hedging (if user has active trades)
  symbols.forEach((symA) => {
    const activeA = openPositionsByPair[symA] || [];
    if (activeA.length === 0) return;

    // Check against all other pairs
    symbols.forEach((symB) => {
      if (symA === symB) return;
      const coef = matrix[symA]?.[symB] ?? 0;
      const activeB = openPositionsByPair[symB] || [];

      // Case A: Strong Inverse Pair (Negative Correlation <= -0.60)
      if (coef <= -0.60) {
        const primaryOrderType = activeA[0].type;
        // Natural delta hedge is same direction on inversely correlated pair!
        // E.g. Buy EUR/USD is short USD. Buy USD/CAD is long USD. Buying both hedges USD exposure.
        const suggestedType = primaryOrderType; 
        const isHedging = activeB.some((b) => b.type === suggestedType);

        opportunities.push({
          id: `hedge-inv-${symA}-${symB}`,
          primaryPair: symA,
          hedgePair: symB,
          correlation: coef,
          type: 'INVERSE_HEDGE',
          title: `Direct Inverse Hedge: ${symA} ⇄ ${symB}`,
          description: `${symA} and ${symB} exhibit a strong negative correlation of ${coef.toFixed(2)}.`,
          hedgingRationale: `Since you hold an active ${primaryOrderType} on ${symA}, taking a ${suggestedType} on ${symB} provides an offsetting counter-balance against severe USD/macro swings.`,
          recommendedAction: isHedging
            ? `Active hedge in place: You have ${activeB.length} ${suggestedType} trade(s) on ${symB}.`
            : `Open a ${suggestedType} on ${symB} to insulate open ${symA} PnL from sudden market shocks.`,
          suggestedType,
          riskReductionScore: Math.round(Math.abs(coef) * 90),
          isCurrentlyHedging: isHedging,
        });
      }

      // Case B: Strong Positive Correlation (>= +0.70)
      if (coef >= 0.70) {
        const primaryOrderType = activeA[0].type;
        const sameDirectionActiveB = activeB.filter((b) => b.type === primaryOrderType);
        const opposingActiveB = activeB.filter((b) => b.type !== primaryOrderType);

        // Warning if user has double exposure in same direction
        if (sameDirectionActiveB.length > 0) {
          opportunities.push({
            id: `risk-conc-${symA}-${symB}`,
            primaryPair: symA,
            hedgePair: symB,
            correlation: coef,
            type: 'CONCENTRATION_RISK',
            title: `Risk Concentration Warning: ${symA} & ${symB}`,
            description: `High positive correlation (+${coef.toFixed(2)}) with matching ${primaryOrderType} positions.`,
            hedgingRationale: `Holding identical directional trades on highly co-moving pairs doubles risk exposure to the same underlying currency driver.`,
            recommendedAction: `Consider closing one leg or converting ${symB} into a pair-spread hedge by taking the opposing side.`,
            suggestedType: primaryOrderType === 'BUY' ? 'SELL' : 'BUY',
            riskReductionScore: 75,
            isCurrentlyHedging: false,
          });
        } else {
          // Spread arbitrage / Pair hedge
          const opposingType = primaryOrderType === 'BUY' ? 'SELL' : 'BUY';
          const isOpposingHedge = opposingActiveB.length > 0;

          opportunities.push({
            id: `hedge-pair-${symA}-${symB}`,
            primaryPair: symA,
            hedgePair: symB,
            correlation: coef,
            type: 'PAIR_SPREAD_HEDGE',
            title: `Pair Spread Hedge: Long/Short ${symA}/${symB}`,
            description: `Strong co-movement (+${coef.toFixed(2)}) enables statistical pair-spread hedging.`,
            hedgingRationale: `Taking a ${opposingType} on ${symB} neutralizes systemic directional volatility while capturing divergence in relative currency strength.`,
            recommendedAction: isOpposingHedge
              ? `Active spread hedge active: ${opposingActiveB.length} opposing position(s) on ${symB}.`
              : `Execute ${opposingType} on ${symB} to lock in a market-neutral delta spread.`,
            suggestedType: opposingType,
            riskReductionScore: Math.round(coef * 85),
            isCurrentlyHedging: isOpposingHedge,
          });
        }
      }
    });
  });

  // 2. Market-Wide Strategic Hedging Pairs (if no positions or general opportunities)
  if (opportunities.length < 3) {
    // Gold safe haven hedge
    if (symbols.includes('XAU/USD')) {
      const gbpCorr = matrix['XAU/USD']?.['USD/JPY'] ?? -0.45;
      opportunities.push({
        id: 'hedge-gold-safe-haven',
        primaryPair: 'XAU/USD',
        hedgePair: 'USD/JPY',
        correlation: gbpCorr,
        type: 'SAFE_HAVEN_BUFFER',
        title: 'Safe-Haven Divergence Buffer (Gold vs Yen)',
        description: `XAU/USD and USD/JPY frequently decouple during risk-off geopolitical flight.`,
        hedgingRationale: `Gold serves as a store-of-value buffer against fiat currency depreciation, dampening drawdowns when correlated forex pairs experience volatility spikes.`,
        recommendedAction: `Maintain low-delta allocation across XAU/USD to buffer foreign exchange cross risk.`,
        suggestedType: 'BUY',
        riskReductionScore: 68,
        isCurrentlyHedging: false,
      });
    }

    // Classic EUR/USD vs USD/CAD inverse macro hedge
    if (symbols.includes('EUR/USD') && symbols.includes('USD/CAD')) {
      const eurCadCorr = matrix['EUR/USD']?.['USD/CAD'] ?? -0.82;
      opportunities.push({
        id: 'hedge-classic-eurusd-usdcad',
        primaryPair: 'EUR/USD',
        hedgePair: 'USD/CAD',
        correlation: eurCadCorr,
        type: 'INVERSE_HEDGE',
        title: 'Transatlantic Inverse Hedge (EUR/USD & USD/CAD)',
        description: `Persistent inverse correlation of ${eurCadCorr.toFixed(2)} based on bilateral USD denominator mechanics.`,
        hedgingRationale: `When EUR/USD trends downward due to dollar strength, USD/CAD typically appreciates, offsetting losses for balanced book trading.`,
        recommendedAction: `Pair EUR/USD long positions with USD/CAD long positions for a zero-net USD exposure hedge.`,
        suggestedType: 'BUY',
        riskReductionScore: 88,
        isCurrentlyHedging: false,
      });
    }
  }

  // Deduplicate opportunities
  const seen = new Set<string>();
  return opportunities.filter((op) => {
    const key = [op.primaryPair, op.hedgePair].sort().join('-') + '-' + op.type;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
