import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldAlert,
  Percent,
  Award,
  Wallet,
  Activity,
  LineChart as LineChartIcon,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { AccountSummary, EquityPoint } from '../types';
import { GlobalCurrencyCode, formatGlobalCurrency, getCurrencyInfo } from '../utils/currencyFlags';
import { CurrencyFlag } from './CurrencyFlag';

interface AccountMetricsProps {
  metrics: AccountSummary;
  openPositionsCount: number;
  equityHistory: EquityPoint[];
  globalCurrency?: GlobalCurrencyCode;
  onSelectCurrency?: (currency: GlobalCurrencyCode) => void;
}

// Custom Tooltip component for Recharts
const CustomEquityTooltip = ({ active, payload, label, globalCurrency = 'USD' }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as EquityPoint;
    const initial = 10000;
    const gainDollar = data.equity - initial;
    const gainPercent = ((gainDollar / initial) * 100).toFixed(2);
    const isGain = gainDollar >= 0;

    return (
      <div className="bg-zinc-950/95 border border-zinc-700/90 rounded-lg p-3 shadow-2xl backdrop-blur-md text-xs font-mono">
        <div className="text-zinc-400 font-sans text-[11px] mb-1.5 flex items-center justify-between gap-3 border-b border-zinc-800 pb-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-zinc-500" />
            {data.timeStr}
          </span>
          <span className={`font-bold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isGain ? '+' : ''}{gainPercent}%
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-400 font-sans text-[11px]">Floating Equity:</span>
            <span className="font-bold text-white text-xs">
              {formatGlobalCurrency(data.equity, globalCurrency)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-400 font-sans text-[11px]">Settled Balance:</span>
            <span className="text-zinc-300 text-xs">
              {formatGlobalCurrency(data.balance, globalCurrency)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1 border-t border-zinc-850">
            <span className="text-zinc-400 font-sans text-[11px]">Total Net Return:</span>
            <span className={`font-bold text-xs ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatGlobalCurrency(gainDollar, globalCurrency, { showSign: true })}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const AccountMetrics: React.FC<AccountMetricsProps> = ({
  metrics,
  openPositionsCount,
  equityHistory,
  globalCurrency = 'USD',
  onSelectCurrency,
}) => {
  const [isChartExpanded, setIsChartExpanded] = useState<boolean>(true);
  const [dataPointsRange, setDataPointsRange] = useState<'ALL' | '50' | '25'>('ALL');
  const currencyInfo = getCurrencyInfo(globalCurrency);

  const isPnlPositive = metrics.unrealizedPnL >= 0;
  const isRealizedPositive = metrics.realizedPnL >= 0;

  // Filter history points based on selected range
  const filteredHistory = React.useMemo(() => {
    if (equityHistory.length === 0) return [];
    if (dataPointsRange === '25') return equityHistory.slice(-25);
    if (dataPointsRange === '50') return equityHistory.slice(-50);
    return equityHistory;
  }, [equityHistory, dataPointsRange]);

  // Calculate high and low for dynamic domain
  const { minVal, maxVal, isOverallProfitable, peakEquity, minEquity, totalNetGrowth, totalReturnPercent } = React.useMemo(() => {
    if (filteredHistory.length === 0) {
      return {
        minVal: 9900,
        maxVal: 10100,
        isOverallProfitable: true,
        peakEquity: 10000,
        minEquity: 10000,
        totalNetGrowth: 0,
        totalReturnPercent: 0,
      };
    }

    const equities = filteredHistory.map((p) => p.equity);
    const balances = filteredHistory.map((p) => p.balance);
    const allValues = [...equities, ...balances, metrics.initialBalance];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const pad = Math.max(15, (max - min) * 0.1);

    const netGrowth = metrics.equity - metrics.initialBalance;
    const returnPct = (netGrowth / metrics.initialBalance) * 100;

    return {
      minVal: Math.floor(min - pad),
      maxVal: Math.ceil(max + pad),
      isOverallProfitable: netGrowth >= 0,
      peakEquity: Math.max(...equities),
      minEquity: Math.min(...equities),
      totalNetGrowth: netGrowth,
      totalReturnPercent: returnPct,
    };
  }, [filteredHistory, metrics]);

  return (
    <div className="bg-zinc-950/80 border-b border-zinc-850 flex flex-col">
      {/* Top 8-metric Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 px-4 py-2.5">
        {/* Balance */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <div className="flex items-center gap-1.5">
              <CurrencyFlag code={globalCurrency} size="xs" />
              <span className="text-[11px] font-medium tracking-wide">Balance</span>
            </div>
            <Wallet className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-sm sm:text-base font-bold text-white tracking-tight">
            {formatGlobalCurrency(metrics.balance, globalCurrency)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Initial: {formatGlobalCurrency(metrics.initialBalance, globalCurrency, { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Equity */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <div className="flex items-center gap-1.5">
              <CurrencyFlag code={globalCurrency} size="xs" />
              <span className="text-[11px] font-medium tracking-wide">Equity</span>
            </div>
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-sm sm:text-base font-bold text-white tracking-tight">
            {formatGlobalCurrency(metrics.equity, globalCurrency)}
          </div>
          <div className={`text-[10px] font-medium mt-0.5 ${metrics.equity >= metrics.balance ? 'text-emerald-400' : 'text-rose-400'}`}>
            {metrics.equity >= metrics.balance ? '+' : ''}
            {((metrics.equity - metrics.balance) / (metrics.balance || 1) * 100).toFixed(2)}% vs bal
          </div>
        </div>

        {/* Floating Unrealized PnL */}
        <div className={`border rounded-lg p-2.5 flex flex-col justify-between ${
          isPnlPositive
            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
            : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
        }`}>
          <div className="flex items-center justify-between mb-1 opacity-80">
            <span className="text-[11px] font-medium tracking-wide">Floating PnL</span>
            {isPnlPositive ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
          </div>
          <div className="text-sm sm:text-base font-bold tracking-tight">
            {formatGlobalCurrency(metrics.unrealizedPnL, globalCurrency, { showSign: true })}
          </div>
          <div className="text-[10px] opacity-75 mt-0.5">
            {openPositionsCount} active trade{openPositionsCount === 1 ? '' : 's'}
          </div>
        </div>

        {/* Today's Realized PnL */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-medium tracking-wide">Realized PnL</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className={`text-sm sm:text-base font-bold tracking-tight ${isRealizedPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatGlobalCurrency(metrics.realizedPnL, globalCurrency, { showSign: true })}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            {metrics.totalTrades} closed order{metrics.totalTrades === 1 ? '' : 's'}
          </div>
        </div>

        {/* Free Margin */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-medium tracking-wide">Free Margin</span>
            <span className="text-[10px] text-zinc-500">
              Used: {formatGlobalCurrency(metrics.margin, globalCurrency, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="text-sm sm:text-base font-bold text-white tracking-tight">
            {formatGlobalCurrency(metrics.freeMargin, globalCurrency, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Leverage: 1:100 ({currencyInfo.code})
          </div>
        </div>

        {/* Margin Level % */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-medium tracking-wide">Margin Level</span>
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className={`text-sm sm:text-base font-bold tracking-tight ${
            metrics.marginLevelPercent > 300 ? 'text-emerald-400' : (metrics.marginLevelPercent > 120 ? 'text-amber-400' : 'text-rose-400')
          }`}>
            {metrics.marginLevelPercent > 5000 ? '>5000%' : `${metrics.marginLevelPercent.toFixed(0)}%`}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            {metrics.margin === 0 ? 'No open margin' : 'Safe zone'}
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-medium tracking-wide">Win Rate</span>
            <Percent className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-sm sm:text-base font-bold text-white tracking-tight">
            {metrics.winRatePercent.toFixed(1)}%
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            {metrics.winningTrades}W / {metrics.losingTrades}L
          </div>
        </div>

        {/* Profit Factor / Max DD */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-medium tracking-wide">Profit Factor</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-sm sm:text-base font-bold text-amber-400 tracking-tight">
            {metrics.profitFactor >= 9.9 ? '9.9+' : metrics.profitFactor.toFixed(2)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Max DD: {metrics.maxDrawdownPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Expandable Equity Performance Curve Section */}
      <div className="border-t border-zinc-850/80 bg-zinc-950/40">
        <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          {/* Left Title & Live Pulse */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsChartExpanded(!isChartExpanded)}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 hover:text-white transition group"
            >
              <LineChartIcon className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Equity Performance Curve</span>
              {isChartExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              )}
            </button>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Trend
            </span>

            {/* Overall Return pill */}
            <span
              className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                isOverallProfitable
                  ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                  : 'bg-rose-950/40 border-rose-800/40 text-rose-400'
              }`}
            >
              {formatGlobalCurrency(totalNetGrowth, globalCurrency, { showSign: true })} ({isOverallProfitable ? '+' : ''}{totalReturnPercent.toFixed(2)}%)
            </span>
          </div>

          {/* Right Controls (Range Filter & Stat Summaries) */}
          <div className="flex items-center gap-3 text-xs">
            {isChartExpanded && (
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                <span>
                  Peak: <span className="text-zinc-200 font-bold">{formatGlobalCurrency(peakEquity, globalCurrency)}</span>
                </span>
                <span className="text-zinc-700">|</span>
                <span>
                  Low: <span className="text-zinc-200 font-bold">{formatGlobalCurrency(minEquity, globalCurrency)}</span>
                </span>
                <span className="text-zinc-700">|</span>
              </div>
            )}

            {isChartExpanded && (
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded p-0.5 text-[10px] font-mono">
                {(['ALL', '50', '25'] as const).map((rng) => (
                  <button
                    key={rng}
                    onClick={() => setDataPointsRange(rng)}
                    className={`px-2 py-0.5 rounded transition ${
                      dataPointsRange === rng
                        ? 'bg-zinc-800 text-white font-bold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {rng === 'ALL' ? 'Full' : `${rng} pts`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recharts Equity Chart Display */}
        {isChartExpanded && (
          <div className="px-4 pb-3 pt-1">
            <div className="h-36 sm:h-44 w-full bg-zinc-900/30 border border-zinc-850/90 rounded-lg p-2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredHistory}
                  margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={isOverallProfitable ? '#10b981' : '#f43f5e'}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor={isOverallProfitable ? '#10b981' : '#f43f5e'}
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272a"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="timeStr"
                    stroke="#52525b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                    minTickGap={35}
                  />

                  <YAxis
                    domain={[minVal, maxVal]}
                    stroke="#52525b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => formatGlobalCurrency(val, globalCurrency, { maximumFractionDigits: 0 })}
                  />

                  <Tooltip content={<CustomEquityTooltip globalCurrency={globalCurrency} />} />

                  {/* Baseline Initial Balance Anchor Line */}
                  <ReferenceLine
                    y={metrics.initialBalance}
                    stroke="#71717a"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    label={{
                      value: `Start ${formatGlobalCurrency(metrics.initialBalance, globalCurrency, { maximumFractionDigits: 0 })}`,
                      position: 'insideTopLeft',
                      fill: '#71717a',
                      fontSize: 9,
                    }}
                  />

                  {/* Settled Balance Line */}
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#818cf8"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    fill="url(#balanceGradient)"
                    name="Balance"
                    isAnimationActive={false}
                  />

                  {/* Floating Equity Area Curve */}
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke={isOverallProfitable ? '#10b981' : '#f43f5e'}
                    strokeWidth={2}
                    fill="url(#equityGradient)"
                    name="Equity"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* In-chart legend tag */}
              <div className="absolute top-2 right-4 flex items-center gap-3 text-[10px] font-mono pointer-events-none bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800/60">
                <span className="flex items-center gap-1 text-zinc-300">
                  <span className={`w-2 h-2 rounded-full ${isOverallProfitable ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                  Equity (Floating)
                </span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <span className="w-2 h-0.5 bg-indigo-400"></span>
                  Balance (Settled)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
