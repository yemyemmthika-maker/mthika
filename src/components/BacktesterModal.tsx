import React, { useState } from 'react';
import {
  BacktestResult,
  Candle,
  CurrencyPair,
  CustomVisualStrategy,
  StrategyType,
} from '../types';
import { BOT_STRATEGIES } from '../utils/strategies';
import { runBacktest } from '../utils/backtestEngine';
import {
  X,
  Play,
  TrendingUp,
  BarChart2,
  Award,
  ShieldAlert,
  Percent,
  Layers,
} from 'lucide-react';

interface BacktesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairs: CurrencyPair[];
  allCandles: Record<string, Candle[]>;
  currentStrategyId: StrategyType;
  customStrategy?: CustomVisualStrategy;
}

export const BacktesterModal: React.FC<BacktesterModalProps> = ({
  isOpen,
  onClose,
  pairs,
  allCandles,
  currentStrategyId,
  customStrategy,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>(currentStrategyId);
  const [selectedPairSymbol, setSelectedPairSymbol] = useState<string>(pairs[0]?.symbol || 'EUR/USD');
  const [lotSize, setLotSize] = useState<number>(0.1);
  const [slPips, setSlPips] = useState<number>(20);
  const [tpPips, setTpPips] = useState<number>(38);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const handleRunBacktest = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const pair = pairs.find((p) => p.symbol === selectedPairSymbol) || pairs[0];
      const candles = allCandles[selectedPairSymbol] || [];
      const res = runBacktest(
        selectedStrategy,
        pair,
        candles,
        lotSize,
        slPips,
        tpPips,
        10000,
        customStrategy
      );
      setResult(res);
      setIsSimulating(false);
    }, 250);
  };

  // Render SVG equity curve
  const renderEquityCurve = () => {
    if (!result || result.equityCurve.length < 2) return null;

    const curve = result.equityCurve;
    const minEq = Math.min(...curve.map((p) => p.equity)) * 0.98;
    const maxEq = Math.max(...curve.map((p) => p.equity)) * 1.02;
    const range = maxEq - minEq || 1;

    const width = 580;
    const height = 140;

    const points = curve
      .map((pt, i) => {
        const x = (i / (curve.length - 1)) * width;
        const y = height - ((pt.equity - minEq) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');

    const isPositive = result.netProfit >= 0;

    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-zinc-300">Equity Growth Curve</span>
          <span className="font-mono text-zinc-400">
            Start: $10,000 → End: ${(10000 + result.netProfit).toFixed(2)}
          </span>
        </div>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* Baseline */}
          <line
            x1="0"
            y1={height - ((10000 - minEq) / range) * height}
            x2={width}
            y2={height - ((10000 - minEq) / range) * height}
            stroke="#3f3f46"
            strokeDasharray="3 3"
          />
          {/* Curve */}
          <polyline
            fill="none"
            stroke={isPositive ? '#10b981' : '#f43f5e'}
            strokeWidth="2.5"
            points={points}
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Strategy Historical Backtester
              </h3>
              <p className="text-zinc-400 text-[11px]">
                Simulate algorithmic performance across historical bar sequences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Controls */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-zinc-400 text-[11px] block mb-1">Strategy:</label>
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value as StrategyType)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-xs font-semibold"
              >
                {BOT_STRATEGIES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-400 text-[11px] block mb-1">Pair Symbol:</label>
              <select
                value={selectedPairSymbol}
                onChange={(e) => setSelectedPairSymbol(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-xs font-semibold"
              >
                {pairs.map((p) => (
                  <option key={p.id} value={p.symbol}>
                    {p.symbol}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-400 text-[11px] block mb-1">Stop Loss (Pips):</label>
              <input
                type="number"
                value={slPips}
                onChange={(e) => setSlPips(parseInt(e.target.value) || 15)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-rose-400 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-[11px] block mb-1">Take Profit (Pips):</label>
              <input
                type="number"
                value={tpPips}
                onChange={(e) => setTpPips(parseInt(e.target.value) || 30)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-emerald-400 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <button
            onClick={handleRunBacktest}
            disabled={isSimulating}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isSimulating ? 'Simulating Historical Executions...' : 'Execute Historical Backtest'}</span>
          </button>

          {/* Results Display */}
          {result && (
            <div className="flex flex-col gap-3 pt-2">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span>Win Rate</span>
                    <Percent className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="text-base font-bold text-white mt-1">
                    {result.winRate.toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {result.winningTrades}W / {result.losingTrades}L
                  </span>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span>Net Profit</span>
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className={`text-base font-bold mt-1 ${result.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.netProfit >= 0 ? '+' : ''}${result.netProfit.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {result.totalTrades} total orders
                  </span>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span>Profit Factor</span>
                    <Award className="w-3 h-3 text-amber-400" />
                  </div>
                  <div className="text-base font-bold text-amber-400 mt-1">
                    {result.profitFactor}
                  </div>
                  <span className="text-[10px] text-zinc-500">Gross W / Gross L</span>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span>Max Drawdown</span>
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                  </div>
                  <div className="text-base font-bold text-rose-400 mt-1">
                    {result.maxDrawdownPercent.toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-zinc-500">Peak to trough</span>
                </div>
              </div>

              {/* Equity Curve Visualizer */}
              {renderEquityCurve()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
