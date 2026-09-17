import {
  Candle,
  CurrencyPair,
  CustomVisualStrategy,
  OrderType,
  Position,
  StrategyType,
  StrategyValidationResult,
  StrategyValidationTrade,
} from '../types';
import { calculatePositionPnL, generateInitialCandles, getPipValue, INITIAL_PAIRS } from './forexMath';
import { evaluateStrategySignal } from './strategies';

export interface AutoValidationOptions {
  lotSize?: number;
  stopLossPips?: number;
  takeProfitPips?: number;
  trailingStopPips?: number;
  pair?: CurrencyPair;
  customStrategy?: CustomVisualStrategy;
  strategyId?: StrategyType;
  initialCapital?: number;
}

/**
 * Strategy Auto-Validator
 * Executes a fast, rigorous 100-candle backtest audit on newly created or deployed strategies.
 * Returns statistical success probability (% win rate), net currency payoff ($ USD), and risk metrics.
 */
export function run100CandleStrategyAutoValidation(
  strategy: CustomVisualStrategy | StrategyType,
  candles?: Candle[],
  options?: AutoValidationOptions
): StrategyValidationResult {
  const isCustom = typeof strategy !== 'string';
  const customStrategy = isCustom ? strategy : options?.customStrategy;
  const strategyId: StrategyType = isCustom ? 'CUSTOM_BUILDER' : strategy;
  const strategyName = isCustom
    ? customStrategy?.name || 'Custom Visual Strategy'
    : strategy;

  // Resolve Currency Pair
  const pair: CurrencyPair =
    options?.pair ||
    INITIAL_PAIRS.find((p) => p.symbol === 'EUR/USD') ||
    INITIAL_PAIRS[0];

  // Resolve 100 historical candles
  let targetCandles: Candle[] = [];
  if (candles && candles.length >= 100) {
    targetCandles = candles.slice(-100);
  } else if (candles && candles.length >= 40) {
    // If we have some live candles, backfill to 100 with realistic historical candles
    const needed = 100 - candles.length;
    const historical = generateInitialCandles(pair, needed);
    targetCandles = [...historical, ...candles];
  } else {
    targetCandles = generateInitialCandles(pair, 100);
  }

  const pipSize = getPipValue(pair.symbol);
  const lotSize = options?.lotSize ?? 0.1;
  const stopLossPips =
    options?.stopLossPips ??
    (isCustom && customStrategy?.defaultStopLossPips ? customStrategy.defaultStopLossPips : 18);
  const takeProfitPips =
    options?.takeProfitPips ??
    (isCustom && customStrategy?.defaultTakeProfitPips ? customStrategy.defaultTakeProfitPips : 30);
  const trailingStopPips =
    options?.trailingStopPips ??
    (isCustom && customStrategy?.defaultTrailingStopPips ? customStrategy.defaultTrailingStopPips : 0);

  let capital = options?.initialCapital ?? 10000;
  let peakCapital = capital;
  let maxDrawdownPercent = 0;

  const trades: StrategyValidationTrade[] = [];

  let currentTrade: {
    type: OrderType;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    trailingStopDistance: number | null;
    peakPrice: number;
    candleIndex: number;
  } | null = null;

  // Simulate across the 100 candles (starting at index 20 to ensure warm indicator buffers)
  for (let i = 20; i < targetCandles.length; i++) {
    const currentCandle = targetCandles[i];
    const subCandles = targetCandles.slice(0, i + 1);

    // 1. Manage Active Simulated Trade
    if (currentTrade) {
      let exitPrice: number | null = null;
      let exitReason: 'TP' | 'SL' | null = null;

      // Update trailing stop if enabled
      if (currentTrade.trailingStopDistance !== null && currentTrade.trailingStopDistance > 0) {
        if (currentTrade.type === 'BUY') {
          if (currentCandle.high > currentTrade.peakPrice) {
            currentTrade.peakPrice = currentCandle.high;
            const newSL = currentCandle.high - currentTrade.trailingStopDistance;
            if (newSL > currentTrade.stopLoss) {
              currentTrade.stopLoss = newSL;
            }
          }
        } else {
          if (currentCandle.low < currentTrade.peakPrice) {
            currentTrade.peakPrice = currentCandle.low;
            const newSL = currentCandle.low + currentTrade.trailingStopDistance;
            if (newSL < currentTrade.stopLoss) {
              currentTrade.stopLoss = newSL;
            }
          }
        }
      }

      // Check Stop Loss & Take Profit
      if (currentTrade.type === 'BUY') {
        if (currentCandle.low <= currentTrade.stopLoss) {
          exitPrice = currentTrade.stopLoss;
          exitReason = 'SL';
        } else if (currentCandle.high >= currentTrade.takeProfit) {
          exitPrice = currentTrade.takeProfit;
          exitReason = 'TP';
        }
      } else {
        if (currentCandle.high >= currentTrade.stopLoss) {
          exitPrice = currentTrade.stopLoss;
          exitReason = 'SL';
        } else if (currentCandle.low <= currentTrade.takeProfit) {
          exitPrice = currentTrade.takeProfit;
          exitReason = 'TP';
        }
      }

      if (exitPrice !== null && exitReason !== null) {
        const dummyPos: Position = {
          id: `val-pos-${trades.length + 1}`,
          ticket: trades.length + 1,
          pairSymbol: pair.symbol,
          type: currentTrade.type,
          lots: lotSize,
          openPrice: currentTrade.entryPrice,
          currentPrice: exitPrice,
          stopLoss: currentTrade.stopLoss,
          takeProfit: currentTrade.takeProfit,
          trailingStopPips: trailingStopPips > 0 ? trailingStopPips : null,
          pnlDollar: 0,
          pnlPips: 0,
          openTime: 0,
          strategyName,
        };

        const res = calculatePositionPnL(dummyPos, exitPrice, exitPrice, pair.symbol);
        capital += res.pnlDollar;
        if (capital > peakCapital) peakCapital = capital;
        const dd = ((peakCapital - capital) / peakCapital) * 100;
        if (dd > maxDrawdownPercent) maxDrawdownPercent = dd;

        trades.push({
          entryPrice: currentTrade.entryPrice,
          exitPrice,
          type: currentTrade.type,
          pnlDollar: res.pnlDollar,
          pnlPips: res.pnlPips,
          isWin: res.pnlDollar > 0,
          reason: exitReason,
          candleIndex: i,
        });

        currentTrade = null;
      }
    }

    // 2. Evaluate Entry Signal if No Trade is Active
    if (!currentTrade) {
      const evaluation = evaluateStrategySignal(strategyId, subCandles, pair.symbol, customStrategy);
      const minConfidence = isCustom && customStrategy?.minConfidence ? customStrategy.minConfidence : 70;

      if (evaluation.signal && evaluation.confidence >= minConfidence) {
        const entryPrice = currentCandle.close;
        const slDist = stopLossPips * pipSize;
        const tpDist = takeProfitPips * pipSize;

        const stopLoss = evaluation.signal === 'BUY' ? entryPrice - slDist : entryPrice + slDist;
        const takeProfit = evaluation.signal === 'BUY' ? entryPrice + tpDist : entryPrice - tpDist;
        const trailingDist = trailingStopPips > 0 ? trailingStopPips * pipSize : null;

        currentTrade = {
          type: evaluation.signal,
          entryPrice,
          stopLoss,
          takeProfit,
          trailingStopDistance: trailingDist,
          peakPrice: entryPrice,
          candleIndex: i,
        };
      }
    }
  }

  // Close remaining open trade at final candle close (Mark-to-market)
  if (currentTrade) {
    const finalCandle = targetCandles[targetCandles.length - 1];
    const dummyPos: Position = {
      id: `val-pos-${trades.length + 1}`,
      ticket: trades.length + 1,
      pairSymbol: pair.symbol,
      type: currentTrade.type,
      lots: lotSize,
      openPrice: currentTrade.entryPrice,
      currentPrice: finalCandle.close,
      stopLoss: currentTrade.stopLoss,
      takeProfit: currentTrade.takeProfit,
      trailingStopPips: trailingStopPips > 0 ? trailingStopPips : null,
      pnlDollar: 0,
      pnlPips: 0,
      openTime: 0,
      strategyName,
    };

    const res = calculatePositionPnL(dummyPos, finalCandle.close, finalCandle.close, pair.symbol);
    capital += res.pnlDollar;
    if (capital > peakCapital) peakCapital = capital;
    const dd = ((peakCapital - capital) / peakCapital) * 100;
    if (dd > maxDrawdownPercent) maxDrawdownPercent = dd;

    trades.push({
      entryPrice: currentTrade.entryPrice,
      exitPrice: finalCandle.close,
      type: currentTrade.type,
      pnlDollar: res.pnlDollar,
      pnlPips: res.pnlPips,
      isWin: res.pnlDollar > 0,
      reason: 'MARK_TO_MARKET',
      candleIndex: targetCandles.length - 1,
    });
  }

  // Calculate Metrics
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.isWin).length;
  const losingTrades = totalTrades - winningTrades;
  const successProbability =
    totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(1)) : 0;

  const grossProfit = trades.filter((t) => t.pnlDollar > 0).reduce((sum, t) => sum + t.pnlDollar, 0);
  const grossLoss = Math.abs(
    trades.filter((t) => t.pnlDollar < 0).reduce((sum, t) => sum + t.pnlDollar, 0)
  );

  const profitFactor =
    grossLoss === 0
      ? grossProfit > 0
        ? 9.99
        : 1.0
      : Number((grossProfit / grossLoss).toFixed(2));

  const currencyNetProfit = Number(
    trades.reduce((sum, t) => sum + t.pnlDollar, 0).toFixed(2)
  );
  const currencyPipsProfit = Number(
    trades.reduce((sum, t) => sum + t.pnlPips, 0).toFixed(1)
  );

  // Determine Probability Tier
  let probabilityTier: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
  if (successProbability >= 62) {
    probabilityTier = 'HIGH';
  } else if (successProbability >= 48) {
    probabilityTier = 'MODERATE';
  }

  // Determine Overall Status
  let status: 'OPTIMAL' | 'MODERATE' | 'CAUTION' = 'CAUTION';
  if (successProbability >= 58 && currencyNetProfit > 0 && profitFactor >= 1.3) {
    status = 'OPTIMAL';
  } else if (currencyNetProfit >= 0 || successProbability >= 45) {
    status = 'MODERATE';
  }

  // Generate Insightful Summary
  let summary = '';
  if (totalTrades === 0) {
    summary = `0 simulated trades triggered across 100 bars on ${pair.symbol}. The visual rules may be too restrictive or need broader oscillator bounds.`;
  } else {
    summary = `100-Candle Auto-Validation on ${pair.symbol}: ${successProbability}% Win Probability (${winningTrades}W / ${losingTrades}L) | Net PnL: ${
      currencyNetProfit >= 0 ? '+' : ''
    }$${currencyNetProfit.toFixed(2)} USD (${currencyPipsProfit >= 0 ? '+' : ''}${currencyPipsProfit} pips) | Profit Factor: ${profitFactor}.`;
  }

  return {
    id: `val-${Date.now()}`,
    strategyId,
    strategyName,
    pairSymbol: pair.symbol,
    candleCount: 100,
    successProbability,
    probabilityTier,
    totalTrades,
    winningTrades,
    losingTrades,
    currencyNetProfit,
    currencyPipsProfit,
    profitFactor,
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(1)),
    status,
    evaluatedAt: Date.now(),
    summary,
    trades,
  };
}
