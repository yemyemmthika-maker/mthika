import React, { useState } from 'react';
import {
  BotStrategy,
  BotConfig,
  EmailNotificationConfig,
  StrategyType,
  CurrencyPair,
  StrategyValidationResult,
} from '../types';
import { BOT_STRATEGIES } from '../utils/strategies';
import { calculateSmartLotSize } from '../utils/forexMath';
import { StrategyAutoValidatorCard } from './StrategyAutoValidatorCard';
import {
  ShieldCheck,
  ShieldAlert,
  Zap,
  Sliders,
  Sparkles,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Gauge,
  Info,
  Copy,
  Mail,
  Bell,
  Settings,
} from 'lucide-react';

interface BotControlPanelProps {
  config: BotConfig;
  onUpdateConfig: (updater: (prev: BotConfig) => BotConfig) => void;
  botStatusText: string;
  currentDrawdownPercent?: number;
  onOpenStrategyBuilder?: () => void;
  notificationConfig?: EmailNotificationConfig;
  onUpdateNotificationConfig?: (newConfig: EmailNotificationConfig) => void;
  onOpenSettings?: () => void;
  strategyValidation?: StrategyValidationResult | null;
  isValidatingStrategy?: boolean;
  onRevalidateStrategy?: (pairSymbol?: string) => void;
  availablePairs?: CurrencyPair[];
}

export const BotControlPanel: React.FC<BotControlPanelProps> = ({
  config,
  onUpdateConfig,
  botStatusText,
  currentDrawdownPercent = 0,
  onOpenStrategyBuilder,
  notificationConfig,
  onUpdateNotificationConfig,
  onOpenSettings,
  strategyValidation,
  isValidatingStrategy,
  onRevalidateStrategy,
  availablePairs = [],
}) => {
  const [copiedConfig, setCopiedConfig] = useState(false);
  const currentStrategy = BOT_STRATEGIES.find((s) => s.id === config.activeStrategyId) || BOT_STRATEGIES[0];
  const smartRisk = calculateSmartLotSize(config.fixedLotSize, currentDrawdownPercent, config.smartRiskEnabled);

  const copyScalperConfig = () => {
    const scalperPayload = {
      robot: 'Forex Copy Scalper Robot (HFT Micro)',
      strategyId: 'COPY_SCALPER',
      timeframe: '1M',
      recommendedPairs: ['EUR/USD', 'GBP/USD', 'USD/JPY'],
      lotSize: 0.10,
      stopLossPips: 10,
      takeProfitPips: 12,
      trailingStopEnabled: true,
      trailingStopPips: 5,
      smartRiskEnabled: true,
      maxOpenTrades: 4,
      leverage: 100,
      executionModel: 'EMA 5/13 + RSI 7 Impulse Burst Scalping',
    };
    try {
      navigator.clipboard.writeText(JSON.stringify(scalperPayload, null, 2));
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2200);
    } catch (e) {
      console.error(e);
    }
  };

  const applyPreset = (presetName: string) => {
    if (presetName === 'COPY_SCALPER') {
      onUpdateConfig((prev) => ({
        ...prev,
        activeStrategyId: 'COPY_SCALPER',
        fixedLotSize: 0.1,
        stopLossPips: 10,
        takeProfitPips: 12,
        trailingStopEnabled: true,
        trailingStopPips: 5,
        smartRiskEnabled: true,
        maxOpenTrades: 4,
      }));
    } else if (presetName === 'SCALPER') {
      onUpdateConfig((prev) => ({
        ...prev,
        activeStrategyId: 'SCALPER_PRO',
        fixedLotSize: 0.05,
        stopLossPips: 10,
        takeProfitPips: 18,
        trailingStopEnabled: true,
        trailingStopPips: 6,
        maxOpenTrades: 3,
      }));
    } else if (presetName === 'TREND') {
      onUpdateConfig((prev) => ({
        ...prev,
        activeStrategyId: 'EMA_CROSS',
        fixedLotSize: 0.1,
        stopLossPips: 25,
        takeProfitPips: 55,
        trailingStopEnabled: true,
        trailingStopPips: 15,
        maxOpenTrades: 4,
      }));
    } else if (presetName === 'AI_QUANT') {
      onUpdateConfig((prev) => ({
        ...prev,
        activeStrategyId: 'AI_QUANT',
        fixedLotSize: 0.1,
        stopLossPips: 20,
        takeProfitPips: 45,
        trailingStopEnabled: true,
        trailingStopPips: 12,
        maxOpenTrades: 5,
      }));
    } else if (presetName === 'GRID') {
      onUpdateConfig((prev) => ({
        ...prev,
        activeStrategyId: 'GRID_SYSTEM',
        fixedLotSize: 0.02,
        stopLossPips: 40,
        takeProfitPips: 25,
        trailingStopEnabled: false,
        maxOpenTrades: 6,
      }));
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex flex-col gap-4">
      {/* Title & Live Bot Status */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white tracking-tight">
            Robot Strategy & Risk Engine
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Small Success Probability Indicator & Currency in Top Header */}
          {strategyValidation && (
            <div
              id="top-success-prob-indicator"
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border transition ${
                strategyValidation.probabilityTier === 'HIGH'
                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-700/60'
                  : strategyValidation.probabilityTier === 'MODERATE'
                  ? 'bg-amber-950/50 text-amber-300 border-amber-700/60'
                  : 'bg-rose-950/50 text-rose-300 border-rose-700/60'
              }`}
              title={`100-Candle Strategy Auto-Validator: ${strategyValidation.successProbability.toFixed(1)}% Success Probability on ${strategyValidation.pairSymbol} (${strategyValidation.currencyNetProfit >= 0 ? '+' : ''}$${strategyValidation.currencyNetProfit.toFixed(2)} USD)`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{strategyValidation.successProbability.toFixed(0)}% Win Prob</span>
              <span className="text-zinc-500 font-sans">&bull;</span>
              <span className={strategyValidation.currencyNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {strategyValidation.currencyNetProfit >= 0 ? '+' : ''}${strategyValidation.currencyNetProfit.toFixed(2)} USD
              </span>
              <span className="text-zinc-500 text-[10px] hidden sm:inline">({strategyValidation.pairSymbol})</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 font-medium">State:</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                config.isRunning
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.isRunning ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`}></span>
              {botStatusText}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Bot Presets */}
      <div>
        <div className="text-[11px] font-bold uppercase text-zinc-500 tracking-wider mb-2 flex items-center justify-between">
          <span>Quick Strategy Presets</span>
          <span className="text-[10px] text-zinc-400 font-normal">One-click configuration</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            onClick={() => applyPreset('COPY_SCALPER')}
            className={`px-2.5 py-1.5 rounded-lg border text-left transition text-xs flex flex-col justify-between ${
              config.activeStrategyId === 'COPY_SCALPER'
                ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 shadow-sm shadow-cyan-950'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <span className="font-bold flex items-center gap-1 text-cyan-400">
              <Zap className="w-3 h-3 text-cyan-400" /> Copy Scalper
            </span>
            <span className="text-[10px] text-zinc-400 mt-0.5">Prop HFT 1M</span>
          </button>

          <button
            onClick={() => applyPreset('SCALPER')}
            className={`px-2.5 py-1.5 rounded-lg border text-left transition text-xs flex flex-col justify-between ${
              config.activeStrategyId === 'SCALPER_PRO'
                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <span className="font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" /> Micro Scalper
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5">8-15 Pip Harvester</span>
          </button>

          <button
            onClick={() => applyPreset('TREND')}
            className={`px-2.5 py-1.5 rounded-lg border text-left transition text-xs flex flex-col justify-between ${
              config.activeStrategyId === 'EMA_CROSS'
                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <span className="font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> London Trend
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5">EMA 9/21/50 Filter</span>
          </button>

          <button
            onClick={() => applyPreset('AI_QUANT')}
            className={`px-2.5 py-1.5 rounded-lg border text-left transition text-xs flex flex-col justify-between ${
              config.activeStrategyId === 'AI_QUANT'
                ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-300'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <span className="font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> AI Quant
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5">Neural Confluence</span>
          </button>

          <button
            onClick={() => applyPreset('GRID')}
            className={`px-2.5 py-1.5 rounded-lg border text-left transition text-xs flex flex-col justify-between ${
              config.activeStrategyId === 'GRID_SYSTEM'
                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <span className="font-bold flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-400" /> Dynamic Grid
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5">Range Volatility</span>
          </button>

          {onOpenStrategyBuilder && (
            <button
              id="open-strategy-builder-preset-btn"
              onClick={onOpenStrategyBuilder}
              className={`px-2.5 py-1.5 rounded-lg border text-left transition text-xs flex flex-col justify-between ${
                config.activeStrategyId === 'CUSTOM_BUILDER'
                  ? 'bg-cyan-950/40 border-cyan-500/70 text-cyan-300 ring-1 ring-cyan-500/50'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-cyan-700/50'
              }`}
            >
              <span className="font-bold flex items-center gap-1">
                <Sliders className="w-3 h-3 text-cyan-400" /> Visual Builder
              </span>
              <span className="text-[10px] text-cyan-500/80 mt-0.5">Drag-and-Drop</span>
            </button>
          )}
        </div>
      </div>

      {/* Copy Scalper Robot Architecture & Strategy Design Studio */}
      <div className="bg-gradient-to-r from-cyan-950/30 via-zinc-900/60 to-emerald-950/20 border border-cyan-800/40 rounded-xl p-3 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">
                  Copy Scalper Robot Architecture
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-700/50 text-cyan-300">
                  HFT 1M
                </span>
              </div>
              <span className="text-[11px] text-zinc-400">
                Institutional Tick Harvesting &bull; Sub-minute Micro Execution &bull; Prop Scalper
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyScalperConfig}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold transition"
              title="Copy Scalper Robot configuration to clipboard for external use"
            >
              {copiedConfig ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Config Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Copy Scalper Config</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => applyPreset('COPY_SCALPER')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition ${
                config.activeStrategyId === 'COPY_SCALPER'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-cyan-600 hover:bg-cyan-500 border-cyan-500 text-zinc-950'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{config.activeStrategyId === 'COPY_SCALPER' ? 'Active Scalper' : 'Deploy Scalper'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
          <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80">
            <span className="text-zinc-500 text-[10px] block">Target Profit</span>
            <span className="text-white font-bold">12 Pips (Micro-Take)</span>
          </div>
          <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80">
            <span className="text-zinc-500 text-[10px] block">Protective SL</span>
            <span className="text-rose-400 font-bold">10 Pips Hard Stop</span>
          </div>
          <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80">
            <span className="text-zinc-500 text-[10px] block">Dynamic Trailing</span>
            <span className="text-cyan-400 font-bold">5 Pips Step Lock</span>
          </div>
          <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80">
            <span className="text-zinc-500 text-[10px] block">Spread Filter</span>
            <span className="text-emerald-400 font-bold">&lt; 1.2 Pips Max</span>
          </div>
        </div>
      </div>

      {/* Strategy Selection Dropdown */}
      <div>
        <label className="text-[11px] font-bold uppercase text-zinc-500 tracking-wider block mb-1.5">
          Active Execution Algorithm:
        </label>
        <select
          value={config.activeStrategyId}
          onChange={(e) =>
            onUpdateConfig((prev) => ({
              ...prev,
              activeStrategyId: e.target.value as StrategyType,
            }))
          }
          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
        >
          {BOT_STRATEGIES.map((strat) => (
            <option key={strat.id} value={strat.id}>
              {strat.name} — ({strat.tagline})
            </option>
          ))}
        </select>
        <p className="text-[11px] text-zinc-400 mt-1 leading-normal bg-zinc-900/40 p-2 rounded border border-zinc-800/80">
          {currentStrategy.description}
        </p>

        {config.activeStrategyId === 'CUSTOM_BUILDER' && onOpenStrategyBuilder && (
          <div className="mt-2 p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-cyan-300 block">Custom Execution Rules Active</span>
                <span className="text-[11px] text-zinc-400">
                  Indicator logic evaluates live (e.g. RSI &lt; 30 AND EMA 50 &gt; EMA 200).
                </span>
              </div>
            </div>
            <button
              onClick={onOpenStrategyBuilder}
              className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-[11px] shrink-0 transition"
            >
              Open Builder
            </button>
          </div>
        )}

        {/* Strategy Auto-Validator 100-Candle Audit Section */}
        <div className="mt-3">
          <StrategyAutoValidatorCard
            validation={strategyValidation ?? null}
            isValidating={isValidatingStrategy}
            onRevalidate={onRevalidateStrategy}
            availablePairs={availablePairs}
            selectedPairSymbol={config.activePairs[0] || 'EUR/USD'}
            onOpenStrategyBuilder={onOpenStrategyBuilder}
            isCustomStrategyActive={config.activeStrategyId === 'CUSTOM_BUILDER'}
          />
        </div>
      </div>

      {/* Risk & Money Management Inputs */}
      <div className="border-t border-zinc-850 pt-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Money & Risk Management Parameters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Default Lot Size */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg flex flex-col justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">Order Lot Size</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="10"
                value={config.fixedLotSize}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    fixedLotSize: Math.max(0.01, parseFloat(e.target.value) || 0.01),
                  }))
                }
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono"
              />
              <span className="text-zinc-500 text-[10px]">lots</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1">1.0 = $10/pip</span>
          </div>

          {/* Stop Loss (pips) */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg flex flex-col justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">Stop Loss (SL)</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                step="1"
                min="5"
                max="200"
                value={config.stopLossPips}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    stopLossPips: Math.max(5, parseInt(e.target.value) || 10),
                  }))
                }
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono text-rose-400 font-bold"
              />
              <span className="text-zinc-500 text-[10px]">pips</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1">Fixed protection</span>
          </div>

          {/* Take Profit (pips) */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg flex flex-col justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">Take Profit (TP)</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                step="1"
                min="5"
                max="500"
                value={config.takeProfitPips}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    takeProfitPips: Math.max(5, parseInt(e.target.value) || 20),
                  }))
                }
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono text-emerald-400 font-bold"
              />
              <span className="text-zinc-500 text-[10px]">pips</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1">
              R:R 1:{(config.takeProfitPips / config.stopLossPips).toFixed(1)}
            </span>
          </div>

          {/* Trailing Stop */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 font-medium">Trailing Stop</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    trailingStopEnabled: !prev.trailingStopEnabled,
                  }))
                }
                className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                  config.trailingStopEnabled
                    ? 'bg-emerald-500 border-emerald-400 text-zinc-950'
                    : 'bg-zinc-800 border-zinc-700 text-transparent'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                step="1"
                min="3"
                max="100"
                disabled={!config.trailingStopEnabled}
                value={config.trailingStopPips}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    trailingStopPips: Math.max(3, parseInt(e.target.value) || 8),
                  }))
                }
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono disabled:opacity-40"
              />
              <span className="text-zinc-500 text-[10px]">pips</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1">
              {config.trailingStopEnabled ? 'Locking in profit' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Secondary Risk Controls: Max Open Trades & Max Daily DD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800 px-3 py-2 rounded-lg text-xs">
            <span className="text-zinc-300">Max Open Simultaneous Positions:</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="8"
                value={config.maxOpenTrades}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    maxOpenTrades: parseInt(e.target.value),
                  }))
                }
                className="w-24 accent-emerald-500"
              />
              <span className="font-mono font-bold text-white w-4 text-right">
                {config.maxOpenTrades}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800 px-3 py-2 rounded-lg text-xs">
            <span className="text-zinc-300">Daily Max Drawdown Kill-Switch:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="20"
                value={config.maxDailyDrawdownPercent}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    maxDailyDrawdownPercent: Math.max(1, parseInt(e.target.value) || 5),
                  }))
                }
                className="w-14 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-xs text-white font-mono text-center"
              />
              <span className="text-rose-400 font-bold">% loss</span>
            </div>
          </div>
        </div>

        {/* Smart Risk Dynamic Drawdown Lot Sizing Section */}
        <div
          className={`mt-3 rounded-xl border p-3.5 transition-all ${
            config.smartRiskEnabled
              ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-950/40'
              : 'bg-zinc-900/40 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div
                className={`p-1.5 rounded-lg border mt-0.5 ${
                  config.smartRiskEnabled
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-tight">
                    Smart Risk Dynamic Lot Sizing
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      config.smartRiskEnabled
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {config.smartRiskEnabled ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Dynamically throttles order lot size based on current account drawdown to preserve margin during volatile streaks.
                </p>
              </div>
            </div>

            {/* Smart Risk Switch */}
            <button
              type="button"
              onClick={() =>
                onUpdateConfig((prev) => ({
                  ...prev,
                  smartRiskEnabled: !prev.smartRiskEnabled,
                }))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.smartRiskEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
              role="switch"
              aria-checked={config.smartRiskEnabled}
              title="Toggle Smart Risk Drawdown Preservation"
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  config.smartRiskEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Dynamic Telemetry Metrics */}
          {config.smartRiskEnabled && (
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-zinc-950/80 border border-zinc-800/80 p-2 rounded-lg">
                <span className="text-[10px] text-zinc-400 block font-medium">Account Drawdown</span>
                <span
                  className={`font-mono font-bold text-xs ${
                    currentDrawdownPercent > 2.0
                      ? 'text-rose-400'
                      : currentDrawdownPercent > 0.8
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {currentDrawdownPercent.toFixed(1)}% Peak Drop
                </span>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800/80 p-2 rounded-lg">
                <span className="text-[10px] text-zinc-400 block font-medium">Scale Multiplier</span>
                <span className="font-mono font-bold text-xs text-white">
                  {(smartRisk.multiplier * 100).toFixed(0)}% Allocation{' '}
                  {smartRisk.reductionPercent > 0 && (
                    <span className="text-rose-400 text-[10px]">(-{smartRisk.reductionPercent}%)</span>
                  )}
                </span>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800/80 p-2 rounded-lg">
                <span className="text-[10px] text-zinc-400 block font-medium">Next Order Sizing</span>
                <span className="font-mono font-bold text-xs text-emerald-400">
                  {smartRisk.effectiveLot.toFixed(2)} Lots{' '}
                  <span className="text-zinc-500 text-[10px] font-normal">(Base: {config.fixedLotSize})</span>
                </span>
              </div>
            </div>
          )}

          {config.smartRiskEnabled && (
            <div className="mt-2 text-[10px] text-zinc-400 flex flex-wrap items-center justify-between gap-1 font-mono bg-zinc-900/60 px-2.5 py-1.5 rounded border border-zinc-800/60">
              <span className="flex items-center gap-1 text-zinc-300">
                <Gauge className="w-3 h-3 text-emerald-400" />
                <span>Tier: <strong className="text-white">{smartRisk.riskTier}</strong></span>
              </span>
              <span className="text-zinc-500 text-[9px] hidden sm:inline">
                &lt;0.8% (100%) &bull; 0.8-2% (75%) &bull; 2-3.5% (50%) &bull; &gt;3.5% (25%)
              </span>
            </div>
          )}
        </div>

        {/* Email Alerts & Critical Notification Settings Section */}
        <div className="mt-3 rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div
                className={`p-1.5 rounded-lg border mt-0.5 ${
                  notificationConfig?.enabled
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-tight">
                    Email Notification Alerts
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      notificationConfig?.enabled
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {notificationConfig?.enabled ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Immediate dispatches for Margin Calls, Large Losses & Strategy Switches.
                </p>
                {notificationConfig?.recipientEmail && (
                  <div className="text-[10px] font-mono text-zinc-400 mt-1 flex items-center gap-1.5">
                    <span className="text-zinc-500">To:</span>
                    <span className="text-zinc-300 font-semibold">{notificationConfig.recipientEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Toggle / Open Settings Button */}
            <div className="flex items-center gap-2">
              {notificationConfig && onUpdateNotificationConfig && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateNotificationConfig({
                      ...notificationConfig,
                      enabled: !notificationConfig.enabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notificationConfig.enabled ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={notificationConfig.enabled}
                  title="Toggle Email Notifications"
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notificationConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              )}

              {onOpenSettings && (
                <button
                  type="button"
                  id="open-settings-from-control-panel"
                  onClick={onOpenSettings}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1 transition"
                  title="Open notification settings modal"
                >
                  <Settings className="w-3 h-3 text-emerald-400" />
                  <span>Configure</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Event Indicators */}
          {notificationConfig && (
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-wrap gap-1.5 text-[10px]">
              <span
                className={`px-2 py-0.5 rounded border font-medium ${
                  notificationConfig.notifyOnMarginCall
                    ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                    : 'bg-zinc-950 text-zinc-600 border-zinc-850'
                }`}
              >
                🚨 Margin &lt; {notificationConfig.marginCallThresholdPercent}%
              </span>
              <span
                className={`px-2 py-0.5 rounded border font-medium ${
                  notificationConfig.notifyOnLargeLoss
                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                    : 'bg-zinc-950 text-zinc-600 border-zinc-850'
                }`}
              >
                ⚠️ Loss &gt; ${notificationConfig.largeLossThresholdDollar}
              </span>
              <span
                className={`px-2 py-0.5 rounded border font-medium ${
                  notificationConfig.notifyOnStrategySwitch
                    ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50'
                    : 'bg-zinc-950 text-zinc-600 border-zinc-850'
                }`}
              >
                🔄 Strategy Switches
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
