import type { GlobalCurrencyCode } from './utils/currencyFlags';

export type { GlobalCurrencyCode };

export type OrderType = 'BUY' | 'SELL';

export type StrategyType =
  | 'EMA_CROSS'
  | 'RSI_MACD_REVERSAL'
  | 'BOLLINGER_BREAKOUT'
  | 'SCALPER_PRO'
  | 'COPY_SCALPER'
  | 'ASIAN_SCALPER'
  | 'GRID_SYSTEM'
  | 'AI_QUANT'
  | 'CUSTOM_BUILDER';

export type Timeframe = '1M' | '5M' | '15M' | '1H' | '4H' | '1D';

export interface CurrencyPair {
  id: string;
  symbol: string;
  name: string;
  base: string;
  quote: string;
  digits: number;
  pipMultiplier: number;
  currentBid: number;
  currentAsk: number;
  spreadPips: number;
  high24h: number;
  low24h: number;
  change24h: number;
  changePercent24h: number;
  baseVolatility: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // Indicators
  ema9?: number;
  ema21?: number;
  ema50?: number;
  ema200?: number;
  rsi?: number;
  macd?: number;
  signalLine?: number;
  macdHist?: number;
  upperBand?: number;
  middleBand?: number;
  lowerBand?: number;
  atr?: number;
  // Signal marker on this candle
  signalMarker?: {
    type: OrderType;
    price: number;
    label: string;
  };
}

export interface Position {
  id: string;
  ticket: number;
  pairSymbol: string;
  type: OrderType;
  lots: number;
  openPrice: number;
  currentPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  trailingStopPips: number | null;
  peakPrice?: number;
  pnlDollar: number;
  pnlPips: number;
  openTime: number;
  closeTime?: number;
  closePrice?: number;
  closeReason?:
    | 'TAKE_PROFIT'
    | 'STOP_LOSS'
    | 'TRAILING_STOP'
    | 'BREAKEVEN'
    | 'PARTIAL_TP'
    | 'MANUAL'
    | 'BOT_SIGNAL'
    | 'MAX_DRAWDOWN'
    | 'SPREAD_GUARD';
  strategyName: string;
  isBreakevenLocked?: boolean;
  isPartialClosed?: boolean;
  originalLots?: number;
  slippagePips?: number;
  executionLatencyMs?: number;
}

export interface BotStrategy {
  id: StrategyType;
  name: string;
  tagline: string;
  description: string;
  timeframe: Timeframe;
  recommendedPairs: string[];
  parameters: {
    fastEma?: number;
    slowEma?: number;
    trendEma?: number;
    rsiPeriod?: number;
    rsiOverbought?: number;
    rsiOversold?: number;
    macdFast?: number;
    macdSlow?: number;
    macdSignal?: number;
    bbPeriod?: number;
    bbStdDev?: number;
    scalperPipTarget?: number;
    gridLevels?: number;
    gridStepPips?: number;
    takeProfitPips?: number;
    stopLossPips?: number;
    aiConfidenceMin?: number;
  };
}

export interface BotConfig {
  isRunning: boolean;
  activeStrategyId: StrategyType;
  activePairs: string[];
  executionIntervalMs: number;
  simulationSpeed: 1 | 2 | 5 | 10;
  lotSizeType: 'FIXED' | 'PERCENT_RISK';
  fixedLotSize: number;
  riskPercent: number;
  leverage: number;
  stopLossPips: number;
  takeProfitPips: number;
  trailingStopEnabled: boolean;
  trailingStopPips: number;
  smartRiskEnabled: boolean;
  maxOpenTrades: number;
  maxDailyDrawdownPercent: number;
  soundAlerts: boolean;
  globalCurrency: GlobalCurrencyCode;
  // Scalper Specific Behavior & Parameters
  maxSpreadPips: number;
  autoBreakevenEnabled: boolean;
  autoBreakevenTriggerPips: number;
  autoBreakevenOffsetPips: number;
  partialTakeProfitEnabled: boolean;
  partialTakeProfitTriggerPips: number;
  partialTakeProfitPercent: number;
  scalperSpeedMode: 'HFT_TURBO' | 'STANDARD' | 'SWING';
  stealthOrdersEnabled: boolean;
  spreadGuardEnabled: boolean;
}

export interface AccountSummary {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevelPercent: number;
  initialBalance: number;
  dailyStartBalance: number;
  realizedPnL: number;
  unrealizedPnL: number;
  winRatePercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  totalPipsHarvested: number;
  averageHoldTimeSeconds: number;
  breakevenTrades: number;
}

export type LogLevel = 'SIGNAL' | 'ORDER_FILLED' | 'POSITION_CLOSED' | 'RISK_HALT' | 'AI_ADVICE' | 'INFO';

export interface BotLog {
  id: string;
  timestamp: number;
  level: LogLevel;
  pairSymbol: string;
  message: string;
  details?: string;
  price?: number;
  pnl?: number;
}

export interface AISignalAnalysis {
  action: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  stopLossPips: number;
  takeProfitPips: number;
  riskRewardRatio: string;
  reasoning: string;
  factors: string[];
  trailingStopRecommended: boolean;
  marketSentiment: string;
}

export interface BacktestResult {
  strategyName: string;
  pairSymbol: string;
  totalBars: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netProfit: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  equityCurve: { time: number; equity: number }[];
}

export interface EquityPoint {
  time: number;
  timeStr: string;
  equity: number;
  balance: number;
}

// Visual Strategy Builder Types
export type IndicatorSource =
  | 'RSI'
  | 'EMA_9'
  | 'EMA_21'
  | 'EMA_50'
  | 'EMA_200'
  | 'PRICE_CLOSE'
  | 'PRICE_OPEN'
  | 'MACD_HIST'
  | 'MACD_LINE'
  | 'BB_UPPER'
  | 'BB_LOWER'
  | 'BB_MIDDLE'
  | 'ATR';

export type ComparisonOperator =
  | '<'
  | '<='
  | '>'
  | '>='
  | 'CROSSES_ABOVE'
  | 'CROSSES_BELOW';

export type RightOperandType = 'VALUE' | 'INDICATOR';

export interface VisualCondition {
  id: string;
  leftIndicator: IndicatorSource;
  operator: ComparisonOperator;
  rightType: RightOperandType;
  rightValue?: number;
  rightIndicator?: IndicatorSource;
  label?: string;
}

export interface VisualRuleGroup {
  conjunction: 'AND' | 'OR';
  conditions: VisualCondition[];
}

export interface EmailNotificationConfig {
  enabled: boolean;
  recipientEmail: string;
  notifyOnMarginCall: boolean;
  marginCallThresholdPercent: number;
  notifyOnLargeLoss: boolean;
  largeLossThresholdDollar: number;
  largeLossThresholdPips: number;
  notifyOnStrategySwitch: boolean;
  notifyOnPanicStop: boolean;
  notifyOnDailyDrawdownHalt: boolean;
  throttleMinutes: number;
}

export interface DispatchedEmail {
  id: string;
  timestamp: number;
  recipient: string;
  subject: string;
  event: 'MARGIN_CALL' | 'LARGE_LOSS' | 'STRATEGY_SWITCH' | 'PANIC_STOP' | 'CIRCUIT_BREAKER' | 'TEST_EMAIL';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  summary: string;
  body: string;
  status: 'DELIVERED' | 'QUEUED';
  meta?: {
    pairSymbol?: string;
    amount?: number;
    pips?: number;
    marginLevel?: number;
    prevStrategy?: string;
    newStrategy?: string;
    reason?: string;
  };
}

export interface CustomVisualStrategy {
  id: string;
  name: string;
  description: string;
  timeframe: Timeframe;
  buyRules: VisualRuleGroup;
  sellRules: VisualRuleGroup;
  defaultTakeProfitPips: number;
  defaultStopLossPips: number;
  defaultTrailingStopPips: number;
  minConfidence: number;
  createdAt: number;
}

export interface StrategyValidationTrade {
  entryPrice: number;
  exitPrice: number;
  type: OrderType;
  pnlDollar: number;
  pnlPips: number;
  isWin: boolean;
  reason: 'TP' | 'SL' | 'MARK_TO_MARKET';
  candleIndex: number;
}

export interface StrategyValidationResult {
  id: string;
  strategyId: StrategyType | string;
  strategyName: string;
  pairSymbol: string;
  candleCount: number; // 100
  successProbability: number; // e.g. 68.5 (%)
  probabilityTier: 'HIGH' | 'MODERATE' | 'LOW';
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  currencyNetProfit: number; // e.g. 142.50 in $
  currencyPipsProfit: number; // e.g. 24.5 pips
  profitFactor: number;
  maxDrawdownPercent: number;
  status: 'OPTIMAL' | 'MODERATE' | 'CAUTION';
  evaluatedAt: number;
  summary: string;
  trades?: StrategyValidationTrade[];
}


