import {
  Candle,
  ComparisonOperator,
  CustomVisualStrategy,
  IndicatorSource,
  OrderType,
  RightOperandType,
  VisualCondition,
  VisualRuleGroup,
} from '../types';

export interface SignalEvaluationResult {
  signal: OrderType | null;
  confidence: number;
  reason: string;
}

export interface ToolboxConditionTemplate {
  id: string;
  name: string;
  category: 'MOMENTUM' | 'MOVING_AVERAGES' | 'VOLATILITY' | 'PRICE_ACTION';
  leftIndicator: IndicatorSource;
  operator: ComparisonOperator;
  rightType: RightOperandType;
  rightValue?: number;
  rightIndicator?: IndicatorSource;
  description: string;
  badge: string;
}

export const TOOLBOX_TEMPLATES: ToolboxConditionTemplate[] = [
  {
    id: 'rsi_oversold_30',
    name: 'RSI < 30 (Oversold)',
    category: 'MOMENTUM',
    leftIndicator: 'RSI',
    operator: '<',
    rightType: 'VALUE',
    rightValue: 30,
    description: 'Relative Strength Index below 30 indicates deeply oversold rebound territory.',
    badge: 'RSI < 30',
  },
  {
    id: 'rsi_overbought_70',
    name: 'RSI > 70 (Overbought)',
    category: 'MOMENTUM',
    leftIndicator: 'RSI',
    operator: '>',
    rightType: 'VALUE',
    rightValue: 70,
    description: 'Relative Strength Index above 70 indicates exhausted overbought levels.',
    badge: 'RSI > 70',
  },
  {
    id: 'ema_50_gt_200',
    name: 'EMA 50 > EMA 200 (Golden Cross)',
    category: 'MOVING_AVERAGES',
    leftIndicator: 'EMA_50',
    operator: '>',
    rightType: 'INDICATOR',
    rightIndicator: 'EMA_200',
    description: 'Medium 50-EMA trending above long-term 200-EMA confirms macro bullish regime.',
    badge: 'EMA 50 > EMA 200',
  },
  {
    id: 'ema_50_lt_200',
    name: 'EMA 50 < EMA 200 (Death Cross)',
    category: 'MOVING_AVERAGES',
    leftIndicator: 'EMA_50',
    operator: '<',
    rightType: 'INDICATOR',
    rightIndicator: 'EMA_200',
    description: '50-EMA below 200-EMA confirms dominant macro bearish trend.',
    badge: 'EMA 50 < EMA 200',
  },
  {
    id: 'ema_9_gt_21',
    name: 'EMA 9 > EMA 21 (Fast Cross)',
    category: 'MOVING_AVERAGES',
    leftIndicator: 'EMA_9',
    operator: '>',
    rightType: 'INDICATOR',
    rightIndicator: 'EMA_21',
    description: 'Fast 9-EMA leads 21-EMA for short-term bullish acceleration.',
    badge: 'EMA 9 > EMA 21',
  },
  {
    id: 'ema_9_lt_21',
    name: 'EMA 9 < EMA 21 (Fast Bear Cross)',
    category: 'MOVING_AVERAGES',
    leftIndicator: 'EMA_9',
    operator: '<',
    rightType: 'INDICATOR',
    rightIndicator: 'EMA_21',
    description: 'Fast 9-EMA drops below 21-EMA for short-term downward momentum.',
    badge: 'EMA 9 < EMA 21',
  },
  {
    id: 'price_gt_ema_50',
    name: 'Price > EMA 50 (Trend Bull)',
    category: 'PRICE_ACTION',
    leftIndicator: 'PRICE_CLOSE',
    operator: '>',
    rightType: 'INDICATOR',
    rightIndicator: 'EMA_50',
    description: 'Current bar closes safely above institutional 50-EMA trendline.',
    badge: 'Price > EMA 50',
  },
  {
    id: 'price_lt_ema_50',
    name: 'Price < EMA 50 (Trend Bear)',
    category: 'PRICE_ACTION',
    leftIndicator: 'PRICE_CLOSE',
    operator: '<',
    rightType: 'INDICATOR',
    rightIndicator: 'EMA_50',
    description: 'Current bar closes below 50-EMA trend resistance.',
    badge: 'Price < EMA 50',
  },
  {
    id: 'macd_hist_positive',
    name: 'MACD Hist > 0 (Bullish Momentum)',
    category: 'MOMENTUM',
    leftIndicator: 'MACD_HIST',
    operator: '>',
    rightType: 'VALUE',
    rightValue: 0,
    description: 'MACD histogram enters positive quadrant indicating expanding buy volume.',
    badge: 'MACD Hist > 0',
  },
  {
    id: 'macd_hist_negative',
    name: 'MACD Hist < 0 (Bearish Momentum)',
    category: 'MOMENTUM',
    leftIndicator: 'MACD_HIST',
    operator: '<',
    rightType: 'VALUE',
    rightValue: 0,
    description: 'MACD histogram turns negative indicating downward acceleration.',
    badge: 'MACD Hist < 0',
  },
  {
    id: 'price_lt_lower_bb',
    name: 'Price < Lower BB (Band Dip)',
    category: 'VOLATILITY',
    leftIndicator: 'PRICE_CLOSE',
    operator: '<',
    rightType: 'INDICATOR',
    rightIndicator: 'BB_LOWER',
    description: 'Price pierces lower 2.0-stddev Bollinger Band for mean reversion.',
    badge: 'Price < Lower BB',
  },
  {
    id: 'price_gt_upper_bb',
    name: 'Price > Upper BB (Band Peak)',
    category: 'VOLATILITY',
    leftIndicator: 'PRICE_CLOSE',
    operator: '>',
    rightType: 'INDICATOR',
    rightIndicator: 'BB_UPPER',
    description: 'Price stretches beyond upper Bollinger Band indicating over-extension.',
    badge: 'Price > Upper BB',
  },
  {
    id: 'price_bullish_bar',
    name: 'Price Close > Price Open (Green Bar)',
    category: 'PRICE_ACTION',
    leftIndicator: 'PRICE_CLOSE',
    operator: '>',
    rightType: 'INDICATOR',
    rightIndicator: 'PRICE_OPEN',
    description: 'Bullish candle confirmation with closing higher than open.',
    badge: 'Close > Open',
  },
  {
    id: 'price_bearish_bar',
    name: 'Price Close < Price Open (Red Bar)',
    category: 'PRICE_ACTION',
    leftIndicator: 'PRICE_CLOSE',
    operator: '<',
    rightType: 'INDICATOR',
    rightIndicator: 'PRICE_OPEN',
    description: 'Bearish candle confirmation with closing below open.',
    badge: 'Close < Open',
  },
];

export const PRESET_STRATEGY_TEMPLATES: CustomVisualStrategy[] = [
  {
    id: 'preset_golden_oversold',
    name: 'RSI 30 Oversold + EMA 50/200 Golden Cross',
    description: 'Captures high-probability trend continuation pullbacks: buys when 50 EMA is above 200 EMA and RSI is oversold (< 30).',
    timeframe: '5M',
    buyRules: {
      conjunction: 'AND',
      conditions: [
        {
          id: 'c-buy-1',
          leftIndicator: 'RSI',
          operator: '<',
          rightType: 'VALUE',
          rightValue: 30,
        },
        {
          id: 'c-buy-2',
          leftIndicator: 'EMA_50',
          operator: '>',
          rightType: 'INDICATOR',
          rightIndicator: 'EMA_200',
        },
      ],
    },
    sellRules: {
      conjunction: 'AND',
      conditions: [
        {
          id: 'c-sell-1',
          leftIndicator: 'RSI',
          operator: '>',
          rightType: 'VALUE',
          rightValue: 70,
        },
        {
          id: 'c-sell-2',
          leftIndicator: 'EMA_50',
          operator: '<',
          rightType: 'INDICATOR',
          rightIndicator: 'EMA_200',
        },
      ],
    },
    defaultTakeProfitPips: 32,
    defaultStopLossPips: 18,
    defaultTrailingStopPips: 12,
    minConfidence: 85,
    createdAt: Date.now(),
  },
  {
    id: 'preset_bollinger_reversal',
    name: 'Bollinger Band Mean Reversion + RSI',
    description: 'Harvests volatility exhaustions when price pierces external Bollinger Bands with RSI momentum extremes.',
    timeframe: '5M',
    buyRules: {
      conjunction: 'AND',
      conditions: [
        {
          id: 'c-bb-buy-1',
          leftIndicator: 'PRICE_CLOSE',
          operator: '<',
          rightType: 'INDICATOR',
          rightIndicator: 'BB_LOWER',
        },
        {
          id: 'c-bb-buy-2',
          leftIndicator: 'RSI',
          operator: '<',
          rightType: 'VALUE',
          rightValue: 35,
        },
      ],
    },
    sellRules: {
      conjunction: 'AND',
      conditions: [
        {
          id: 'c-bb-sell-1',
          leftIndicator: 'PRICE_CLOSE',
          operator: '>',
          rightType: 'INDICATOR',
          rightIndicator: 'BB_UPPER',
        },
        {
          id: 'c-bb-sell-2',
          leftIndicator: 'RSI',
          operator: '>',
          rightType: 'VALUE',
          rightValue: 65,
        },
      ],
    },
    defaultTakeProfitPips: 24,
    defaultStopLossPips: 15,
    defaultTrailingStopPips: 8,
    minConfidence: 82,
    createdAt: Date.now(),
  },
  {
    id: 'preset_trend_scalper',
    name: 'Multi-EMA Trend & MACD Momentum',
    description: 'Synchronizes fast EMA cross (9 > 21) with positive MACD histogram above 50-EMA baseline.',
    timeframe: '1M',
    buyRules: {
      conjunction: 'AND',
      conditions: [
        {
          id: 'c-ts-buy-1',
          leftIndicator: 'EMA_9',
          operator: '>',
          rightType: 'INDICATOR',
          rightIndicator: 'EMA_21',
        },
        {
          id: 'c-ts-buy-2',
          leftIndicator: 'MACD_HIST',
          operator: '>',
          rightType: 'VALUE',
          rightValue: 0,
        },
        {
          id: 'c-ts-buy-3',
          leftIndicator: 'PRICE_CLOSE',
          operator: '>',
          rightType: 'INDICATOR',
          rightIndicator: 'EMA_50',
        },
      ],
    },
    sellRules: {
      conjunction: 'AND',
      conditions: [
        {
          id: 'c-ts-sell-1',
          leftIndicator: 'EMA_9',
          operator: '<',
          rightType: 'INDICATOR',
          rightIndicator: 'EMA_21',
        },
        {
          id: 'c-ts-sell-2',
          leftIndicator: 'MACD_HIST',
          operator: '<',
          rightType: 'VALUE',
          rightValue: 0,
        },
        {
          id: 'c-ts-sell-3',
          leftIndicator: 'PRICE_CLOSE',
          operator: '<',
          rightType: 'INDICATOR',
          rightIndicator: 'EMA_50',
        },
      ],
    },
    defaultTakeProfitPips: 20,
    defaultStopLossPips: 14,
    defaultTrailingStopPips: 7,
    minConfidence: 84,
    createdAt: Date.now(),
  },
];

// Helper to extract value from Candle
export function getIndicatorValue(source: IndicatorSource, candle: Candle): number {
  switch (source) {
    case 'RSI':
      return candle.rsi ?? 50;
    case 'EMA_9':
      return candle.ema9 ?? candle.close;
    case 'EMA_21':
      return candle.ema21 ?? candle.close;
    case 'EMA_50':
      return candle.ema50 ?? candle.close;
    case 'EMA_200':
      return candle.ema200 ?? candle.close;
    case 'PRICE_CLOSE':
      return candle.close;
    case 'PRICE_OPEN':
      return candle.open;
    case 'MACD_HIST':
      return candle.macdHist ?? 0;
    case 'MACD_LINE':
      return candle.macd ?? 0;
    case 'BB_UPPER':
      return candle.upperBand ?? candle.close * 1.002;
    case 'BB_LOWER':
      return candle.lowerBand ?? candle.close * 0.998;
    case 'BB_MIDDLE':
      return candle.middleBand ?? candle.close;
    case 'ATR':
      return candle.atr ?? 0.001;
    default:
      return candle.close;
  }
}

export function formatIndicatorLabel(source: IndicatorSource): string {
  switch (source) {
    case 'RSI':
      return 'RSI (14)';
    case 'EMA_9':
      return 'EMA (9)';
    case 'EMA_21':
      return 'EMA (21)';
    case 'EMA_50':
      return 'EMA (50)';
    case 'EMA_200':
      return 'EMA (200)';
    case 'PRICE_CLOSE':
      return 'Price (Close)';
    case 'PRICE_OPEN':
      return 'Price (Open)';
    case 'MACD_HIST':
      return 'MACD Hist';
    case 'MACD_LINE':
      return 'MACD Line';
    case 'BB_UPPER':
      return 'Upper BB';
    case 'BB_LOWER':
      return 'Lower BB';
    case 'BB_MIDDLE':
      return 'Middle BB';
    case 'ATR':
      return 'ATR (14)';
  }
}

export function formatOperatorLabel(op: ComparisonOperator): string {
  switch (op) {
    case '<':
      return '<';
    case '<=':
      return '≤';
    case '>':
      return '>';
    case '>=':
      return '≥';
    case 'CROSSES_ABOVE':
      return 'Crosses Above';
    case 'CROSSES_BELOW':
      return 'Crosses Below';
  }
}

export function formatConditionString(cond: VisualCondition): string {
  const left = formatIndicatorLabel(cond.leftIndicator);
  const op = formatOperatorLabel(cond.operator);
  const right =
    cond.rightType === 'INDICATOR' && cond.rightIndicator
      ? formatIndicatorLabel(cond.rightIndicator)
      : String(cond.rightValue ?? 0);
  return `${left} ${op} ${right}`;
}

export function formatRuleGroupFormula(group: VisualRuleGroup, action: 'BUY' | 'SELL'): string {
  if (group.conditions.length === 0) {
    return `NO ${action} CONDITIONS CONFIGURED`;
  }
  const parts = group.conditions.map((c) => `(${formatConditionString(c)})`);
  return `IF ${parts.join(` ${group.conjunction} `)} => EXECUTE ${action}`;
}

// Evaluate single visual condition
export function evaluateCondition(
  cond: VisualCondition,
  current: Candle,
  previous?: Candle
): boolean {
  const leftVal = getIndicatorValue(cond.leftIndicator, current);
  let rightVal = 0;

  if (cond.rightType === 'INDICATOR' && cond.rightIndicator) {
    rightVal = getIndicatorValue(cond.rightIndicator, current);
  } else {
    rightVal = cond.rightValue ?? 0;
  }

  // Crosses operators require previous bar comparison
  if (cond.operator === 'CROSSES_ABOVE') {
    if (!previous) return leftVal > rightVal;
    const prevLeft = getIndicatorValue(cond.leftIndicator, previous);
    const prevRight =
      cond.rightType === 'INDICATOR' && cond.rightIndicator
        ? getIndicatorValue(cond.rightIndicator, previous)
        : cond.rightValue ?? 0;
    return prevLeft <= prevRight && leftVal > rightVal;
  }

  if (cond.operator === 'CROSSES_BELOW') {
    if (!previous) return leftVal < rightVal;
    const prevLeft = getIndicatorValue(cond.leftIndicator, previous);
    const prevRight =
      cond.rightType === 'INDICATOR' && cond.rightIndicator
        ? getIndicatorValue(cond.rightIndicator, previous)
        : cond.rightValue ?? 0;
    return prevLeft >= prevRight && leftVal < rightVal;
  }

  switch (cond.operator) {
    case '<':
      return leftVal < rightVal;
    case '<=':
      return leftVal <= rightVal;
    case '>':
      return leftVal > rightVal;
    case '>=':
      return leftVal >= rightVal;
    default:
      return false;
  }
}

// Evaluate Rule Group (AND / OR)
export function evaluateRuleGroup(
  group: VisualRuleGroup,
  current: Candle,
  previous?: Candle
): boolean {
  if (group.conditions.length === 0) return false;

  if (group.conjunction === 'AND') {
    return group.conditions.every((c) => evaluateCondition(c, current, previous));
  } else {
    return group.conditions.some((c) => evaluateCondition(c, current, previous));
  }
}

// Evaluate custom strategy signal on latest candles
export function evaluateCustomStrategySignal(
  strategy: CustomVisualStrategy,
  candles: Candle[],
  pairSymbol: string
): SignalEvaluationResult {
  if (candles.length < 3) {
    return { signal: null, confidence: 0, reason: 'Insufficient candle data for custom strategy' };
  }

  const current = candles[candles.length - 1];
  const previous = candles[candles.length - 2];

  const buyMatched = evaluateRuleGroup(strategy.buyRules, current, previous);
  const sellMatched = evaluateRuleGroup(strategy.sellRules, current, previous);

  if (buyMatched && !sellMatched) {
    const buyFormula = strategy.buyRules.conditions.map(formatConditionString).join(` ${strategy.buyRules.conjunction} `);
    return {
      signal: 'BUY',
      confidence: strategy.minConfidence,
      reason: `[Visual Builder: ${strategy.name}] BUY Triggered on ${pairSymbol} | Met: ${buyFormula}`,
    };
  }

  if (sellMatched && !buyMatched) {
    const sellFormula = strategy.sellRules.conditions.map(formatConditionString).join(` ${strategy.sellRules.conjunction} `);
    return {
      signal: 'SELL',
      confidence: strategy.minConfidence,
      reason: `[Visual Builder: ${strategy.name}] SELL Triggered on ${pairSymbol} | Met: ${sellFormula}`,
    };
  }

  if (buyMatched && sellMatched) {
    return {
      signal: null,
      confidence: 0,
      reason: `[Visual Builder: ${strategy.name}] Conflicting BUY & SELL signals simultaneously met. Holding neutral.`,
    };
  }

  return {
    signal: null,
    confidence: 0,
    reason: `[Visual Builder: ${strategy.name}] Scanning ${pairSymbol} for rule conditions`,
  };
}
