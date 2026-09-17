import React, { useState } from 'react';
import { CurrencyPair, StrategyValidationResult } from '../types';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Info,
  RotateCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';

interface StrategyAutoValidatorCardProps {
  validation: StrategyValidationResult | null;
  isValidating?: boolean;
  onRevalidate?: (pairSymbol?: string) => void;
  availablePairs?: CurrencyPair[];
  selectedPairSymbol?: string;
  onOpenStrategyBuilder?: () => void;
  isCustomStrategyActive?: boolean;
}

export const StrategyAutoValidatorCard: React.FC<StrategyAutoValidatorCardProps> = ({
  validation,
  isValidating = false,
  onRevalidate,
  availablePairs = [],
  selectedPairSymbol = 'EUR/USD',
  onOpenStrategyBuilder,
  isCustomStrategyActive = true,
}) => {
  const [showTradesBreakdown, setShowTradesBreakdown] = useState(false);
  const [selectedPair, setSelectedPair] = useState<string>(
    validation?.pairSymbol || selectedPairSymbol
  );

  const handlePairChange = (newPair: string) => {
    setSelectedPair(newPair);
    if (onRevalidate) {
      onRevalidate(newPair);
    }
  };

  const handleRevalidateClick = () => {
    if (onRevalidate) {
      onRevalidate(selectedPair);
    }
  };

  if (!validation) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Strategy Auto-Validator</span>
            <span className="text-[11px] text-zinc-400">
              Awaiting strategy deployment via Visual Strategy Builder.
            </span>
          </div>
        </div>

        {onRevalidate && (
          <button
            type="button"
            onClick={handleRevalidateClick}
            disabled={isValidating}
            className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-[11px] flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RotateCw className={`w-3 h-3 ${isValidating ? 'animate-spin' : ''}`} />
            <span>Run 100-Bar Audit</span>
          </button>
        )}
      </div>
    );
  }

  const isProfit = validation.currencyNetProfit >= 0;
  const isOptimal = validation.status === 'OPTIMAL';
  const isCaution = validation.status === 'CAUTION';

  // Probability Color Palette
  const probColor =
    validation.probabilityTier === 'HIGH'
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40'
      : validation.probabilityTier === 'MODERATE'
      ? 'text-amber-400 border-amber-500/40 bg-amber-950/40'
      : 'text-rose-400 border-rose-500/40 bg-rose-950/40';

  const probBadgeBg =
    validation.probabilityTier === 'HIGH'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      : validation.probabilityTier === 'MODERATE'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

  return (
    <div
      id="strategy-auto-validator-panel"
      className="bg-gradient-to-br from-zinc-900/90 via-zinc-950/90 to-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex flex-col gap-3 shadow-md"
    >
      {/* Top Header: Title, Audit Badge, and Revalidate Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-850 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight">
                Strategy Auto-Validator
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
                100-CANDLE FAST AUDIT
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 truncate block max-w-xs sm:max-w-sm">
              Tested: <strong className="text-zinc-200">{validation.strategyName}</strong> &bull; Auto-validated on deployment
            </span>
          </div>
        </div>

        {/* Currency Pair Selector & Refresh Audit Button */}
        <div className="flex items-center gap-1.5">
          {availablePairs.length > 0 && (
            <select
              value={selectedPair}
              onChange={(e) => handlePairChange(e.target.value)}
              className="bg-zinc-900 border border-zinc-750 rounded-lg px-2 py-1 text-[11px] font-mono font-bold text-zinc-200 outline-none hover:border-zinc-600 transition"
              title="Select currency pair to audit"
            >
              {availablePairs.map((p) => (
                <option key={p.symbol} value={p.symbol}>
                  {p.symbol}
                </option>
              ))}
            </select>
          )}

          {onRevalidate && (
            <button
              type="button"
              onClick={handleRevalidateClick}
              disabled={isValidating}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              title="Re-run 100-candle backtest audit on latest live candles"
            >
              <RotateCw className={`w-3 h-3 text-cyan-400 ${isValidating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Re-audit</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Highlights Grid: Success Probability Indicator & Currency Yield */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Success Probability Indicator Card */}
        <div className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${probColor}`}>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              Success Probability
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black font-mono tracking-tight text-white">
                {validation.successProbability.toFixed(1)}%
              </span>
              <span className="text-xs font-bold font-mono">Win Rate</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${probBadgeBg}`}
              >
                {validation.probabilityTier} PROBABILITY
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                ({validation.winningTrades}W / {validation.losingTrades}L)
              </span>
            </div>
          </div>

          {/* Radial / Visual Progress Indicator */}
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-zinc-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={
                  validation.probabilityTier === 'HIGH'
                    ? 'text-emerald-400'
                    : validation.probabilityTier === 'MODERATE'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }
                strokeDasharray={`${Math.min(100, Math.max(0, validation.successProbability))}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[11px] font-black font-mono text-white">
              {Math.round(validation.successProbability)}%
            </span>
          </div>
        </div>

        {/* Currency Payoff Indicator Card */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              100-Candle Currency Return
            </span>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
              {validation.pairSymbol}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-2xl font-black font-mono tracking-tight ${
                isProfit ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isProfit ? '+' : ''}${validation.currencyNetProfit.toFixed(2)}{' '}
              <span className="text-xs font-semibold text-zinc-400">USD</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-zinc-400">
            <span className="flex items-center gap-1">
              {isProfit ? (
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-400" />
              )}
              <span className={isProfit ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {validation.currencyPipsProfit >= 0 ? '+' : ''}
                {validation.currencyPipsProfit.toFixed(1)} Pips
              </span>
            </span>
            <span>Profit Factor: <strong className="text-zinc-200">{validation.profitFactor}</strong></span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Strip: Sample Size, Drawdown, Status */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="bg-zinc-950/60 border border-zinc-850 p-1.5 rounded-lg">
          <span className="text-[9px] text-zinc-500 uppercase block font-sans">Simulated Sample</span>
          <span className="text-zinc-200 font-bold text-[11px]">{validation.candleCount} Bars</span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-850 p-1.5 rounded-lg">
          <span className="text-[9px] text-zinc-500 uppercase block font-sans">Max Drawdown</span>
          <span
            className={`font-bold text-[11px] ${
              validation.maxDrawdownPercent > 3.0 ? 'text-rose-400' : 'text-zinc-200'
            }`}
          >
            {validation.maxDrawdownPercent.toFixed(1)}%
          </span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-850 p-1.5 rounded-lg">
          <span className="text-[9px] text-zinc-500 uppercase block font-sans">Deployment Edge</span>
          <span
            className={`font-bold text-[11px] ${
              isOptimal ? 'text-emerald-400' : isCaution ? 'text-rose-400' : 'text-amber-400'
            }`}
          >
            {validation.status}
          </span>
        </div>
      </div>

      {/* Summary Note & Detailed Trades Dropdown Toggle */}
      <div className="flex items-center justify-between pt-1 text-[11px]">
        <span className="text-zinc-400 truncate max-w-[260px] sm:max-w-md">
          {validation.summary}
        </span>

        {validation.trades && validation.trades.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTradesBreakdown(!showTradesBreakdown)}
            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5 shrink-0 ml-2"
          >
            <span>{showTradesBreakdown ? 'Hide Log' : `Trades (${validation.trades.length})`}</span>
            {showTradesBreakdown ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Expandable Simulated Trades Log */}
      {showTradesBreakdown && validation.trades && (
        <div className="mt-1 bg-zinc-950 rounded-lg border border-zinc-800 p-2.5 text-xs flex flex-col gap-1.5 max-h-44 overflow-y-auto font-mono animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-sans uppercase font-bold border-b border-zinc-850 pb-1">
            <span># &bull; Type</span>
            <span>Entry &rarr; Exit</span>
            <span>Pips</span>
            <span>Currency PnL</span>
          </div>
          {validation.trades.map((t, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-[11px] py-1 border-b border-zinc-900 last:border-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 text-[10px]">#{idx + 1}</span>
                <span
                  className={`px-1 rounded text-[10px] font-bold ${
                    t.type === 'BUY'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {t.type}
                </span>
                <span className="text-zinc-500 text-[9px] uppercase">({t.reason})</span>
              </div>

              <span className="text-zinc-300 text-[10px]">
                {t.entryPrice.toFixed(4)} &rarr; {t.exitPrice.toFixed(4)}
              </span>

              <span
                className={`font-semibold text-[10px] ${
                  t.pnlPips >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {t.pnlPips >= 0 ? '+' : ''}
                {t.pnlPips.toFixed(1)}p
              </span>

              <span
                className={`font-bold text-[11px] ${
                  t.pnlDollar >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {t.pnlDollar >= 0 ? '+' : ''}${t.pnlDollar.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
