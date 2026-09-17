import React, { useState, useMemo } from 'react';
import { Candle, CurrencyPair, OrderType, Position } from '../types';
import {
  buildCorrelationMatrix,
  analyzeHedgingOpportunities,
  classifyCorrelation,
  HedgingOpportunity,
} from '../utils/correlationEngine';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Info,
  SlidersHorizontal,
  ArrowRight,
  Zap,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SymbolFlagBadge } from './CurrencyFlag';

interface MarketCorrelationHeatmapProps {
  pairs: CurrencyPair[];
  allCandles: Record<string, Candle[]>;
  activePairsInBot: string[];
  openPositions: Position[];
  onExecuteHedgeOrder?: (pairSymbol: string, type: OrderType, lots: number, reason: string) => void;
  defaultLotSize?: number;
}

export const MarketCorrelationHeatmap: React.FC<MarketCorrelationHeatmapProps> = ({
  pairs,
  allCandles,
  activePairsInBot,
  openPositions,
  onExecuteHedgeOrder,
  defaultLotSize = 0.05,
}) => {
  const [lookback, setLookback] = useState<number>(50);
  const [onlyActivePairs, setOnlyActivePairs] = useState<boolean>(false);
  const [selectedCell, setSelectedCell] = useState<{ pairA: string; pairB: string } | null>(null);
  const [activeHedgingFilter, setActiveHedgingFilter] = useState<'ALL' | 'INVERSE' | 'SPREAD' | 'WARNINGS'>('ALL');
  const [hedgeExecutionStatus, setHedgeExecutionStatus] = useState<string | null>(null);

  // Available symbols
  const availableSymbols = useMemo(() => {
    const all = pairs.map((p) => p.symbol);
    if (onlyActivePairs && activePairsInBot.length >= 2) {
      return all.filter((sym) => activePairsInBot.includes(sym));
    }
    return all;
  }, [pairs, onlyActivePairs, activePairsInBot]);

  // Compute Matrix
  const { matrix, symbols } = useMemo(() => {
    return buildCorrelationMatrix(availableSymbols, allCandles, lookback);
  }, [availableSymbols, allCandles, lookback]);

  // Analyze Hedging Opportunities
  const hedgingOpportunities = useMemo(() => {
    return analyzeHedgingOpportunities(symbols, matrix, openPositions);
  }, [symbols, matrix, openPositions]);

  // Filtered Hedging Opportunities
  const filteredHedging = useMemo(() => {
    if (activeHedgingFilter === 'ALL') return hedgingOpportunities;
    if (activeHedgingFilter === 'INVERSE') {
      return hedgingOpportunities.filter((h) => h.type === 'INVERSE_HEDGE');
    }
    if (activeHedgingFilter === 'SPREAD') {
      return hedgingOpportunities.filter((h) => h.type === 'PAIR_SPREAD_HEDGE');
    }
    if (activeHedgingFilter === 'WARNINGS') {
      return hedgingOpportunities.filter((h) => h.type === 'CONCENTRATION_RISK');
    }
    return hedgingOpportunities;
  }, [hedgingOpportunities, activeHedgingFilter]);

  // Selected pair analysis
  const selectedPairDetails = useMemo(() => {
    if (!selectedCell) return null;
    const { pairA, pairB } = selectedCell;
    const coef = matrix[pairA]?.[pairB] ?? 0;
    const classification = classifyCorrelation(coef);
    const relatedHedge = hedgingOpportunities.find(
      (h) => (h.primaryPair === pairA && h.hedgePair === pairB) || (h.primaryPair === pairB && h.hedgePair === pairA)
    );

    const pairAObj = pairs.find((p) => p.symbol === pairA);
    const pairBObj = pairs.find((p) => p.symbol === pairB);

    return {
      pairA,
      pairB,
      pairAObj,
      pairBObj,
      coef,
      classification,
      relatedHedge,
    };
  }, [selectedCell, matrix, hedgingOpportunities, pairs]);

  const handleQuickExecuteHedge = (op: HedgingOpportunity) => {
    if (!onExecuteHedgeOrder) return;
    onExecuteHedgeOrder(
      op.hedgePair,
      op.suggestedType,
      defaultLotSize,
      `Hedge Execution (${op.primaryPair} ⇄ ${op.hedgePair} [${op.type}])`
    );
    setHedgeExecutionStatus(`Hedge order sent: ${op.suggestedType} ${defaultLotSize} lots on ${op.hedgePair}`);
    setTimeout(() => setHedgeExecutionStatus(null), 4000);
  };

  return (
    <div id="market-correlation-heatmap" className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col">
      {/* Component Header & Controls */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-zinc-900/60 border-b border-zinc-800/80 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight uppercase">
                Market Correlation Heatmap
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                REAL-TIME SYNC
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Pearson correlation matrix across forex pairs to detect co-movements and active hedging opportunities
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lookback Period */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
            <span className="text-[10px] font-semibold text-zinc-400 px-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-zinc-400" />
              Lookback:
            </span>
            {[25, 50, 100].map((period) => (
              <button
                key={period}
                id={`btn-lookback-${period}`}
                onClick={() => setLookback(period)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                  lookback === period
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {period}c
              </button>
            ))}
          </div>

          {/* Active Bot Pairs Toggle */}
          <button
            id="btn-toggle-active-pairs-filter"
            onClick={() => setOnlyActivePairs(!onlyActivePairs)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
              onlyActivePairs
                ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            {onlyActivePairs ? 'Active Bot Pairs' : 'All Tracked Pairs'}
          </button>
        </div>
      </div>

      {/* Main Heatmap Grid & Analysis Split View */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-0 divide-y xl:divide-y-0 xl:divide-x divide-zinc-800/80">
        {/* Left: Correlation Matrix Heatmap (7 cols) */}
        <div className="xl:col-span-7 p-4 flex flex-col justify-between overflow-x-auto">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <span>Correlation Matrix (Pearson r)</span>
                <span className="text-[10px] text-zinc-400 font-normal">
                  (Click any cell to inspect hedging synergy)
                </span>
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                {symbols.length} Pairs Analyzed
              </span>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto pb-2">
              <table className="w-full border-collapse text-center">
                <thead>
                  <tr>
                    <th className="p-2 text-[11px] font-bold text-zinc-400 text-left bg-zinc-900/30 rounded-tl-lg">
                      Pair
                    </th>
                    {symbols.map((sym) => (
                      <th
                        key={sym}
                        className="p-2 text-[11px] font-mono font-bold text-zinc-300 bg-zinc-900/30"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <SymbolFlagBadge symbol={sym} size="xs" />
                          <span>{sym.replace('/', '')}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {symbols.map((rowSym) => (
                    <tr key={rowSym} className="border-t border-zinc-850">
                      <td className="p-2 text-[11px] font-mono font-bold text-zinc-300 text-left bg-zinc-900/20 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <SymbolFlagBadge symbol={rowSym} size="xs" />
                          <span>{rowSym}</span>
                        </div>
                      </td>
                      {symbols.map((colSym) => {
                        const isDiagonal = rowSym === colSym;
                        const coef = matrix[rowSym]?.[colSym] ?? 0;
                        const classification = classifyCorrelation(coef);
                        const isSelected =
                          selectedCell &&
                          ((selectedCell.pairA === rowSym && selectedCell.pairB === colSym) ||
                            (selectedCell.pairA === colSym && selectedCell.pairB === rowSym));

                        return (
                          <td key={colSym} className="p-1">
                            <button
                              id={`cell-corr-${rowSym.replace('/', '')}-${colSym.replace('/', '')}`}
                              onClick={() => {
                                if (!isDiagonal) {
                                  setSelectedCell({ pairA: rowSym, pairB: colSym });
                                }
                              }}
                              disabled={isDiagonal}
                              title={`${rowSym} ⇄ ${colSym}: ${coef.toFixed(3)} (${classification.label})`}
                              className={`w-full py-2 px-1 rounded-md text-xs font-mono font-bold transition flex flex-col items-center justify-center border ${
                                isDiagonal
                                  ? 'bg-zinc-900/40 text-zinc-400 border-transparent cursor-default'
                                  : `${classification.bgClass} ${classification.colorClass} ${classification.borderClass} hover:ring-1 hover:ring-zinc-400 cursor-pointer`
                              } ${isSelected ? 'ring-2 ring-white border-white scale-105 z-10' : ''}`}
                            >
                              <span>{isDiagonal ? '1.00' : (coef >= 0 ? `+${coef.toFixed(2)}` : coef.toFixed(2))}</span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Color Legend & Scale */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px]">
            <span className="font-semibold text-zinc-400">Scale Interpretation:</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-950/80 border border-rose-500/50"></span>
                <span className="text-rose-400 font-mono font-medium">Strong Inverse (-1.0 to -0.7)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-zinc-900 border border-zinc-800"></span>
                <span className="text-zinc-400 font-mono font-medium">Uncorrelated (-0.15 to +0.15)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-950/80 border border-emerald-500/50"></span>
                <span className="text-emerald-400 font-mono font-medium">Strong Positive (+0.7 to +1.0)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Selected Synergy Inspection & Hedging Engine (5 cols) */}
        <div className="xl:col-span-5 p-4 bg-zinc-900/30 flex flex-col gap-4">
          {/* Active Toast Notification */}
          {hedgeExecutionStatus && (
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{hedgeExecutionStatus}</span>
            </div>
          )}

          {/* Drilldown Panel for Selected Cell */}
          {selectedPairDetails ? (
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white text-sm">
                    {selectedPairDetails.pairA} ⇄ {selectedPairDetails.pairB}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${selectedPairDetails.classification.bgClass} ${selectedPairDetails.classification.colorClass} ${selectedPairDetails.classification.borderClass}`}
                  >
                    {selectedPairDetails.coef >= 0 ? `+${selectedPairDetails.coef.toFixed(2)}` : selectedPairDetails.coef.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Clear
                </button>
              </div>

              <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-850">
                <span className="font-semibold text-white">Relationship: </span>
                {selectedPairDetails.classification.label}.{' '}
                {selectedPairDetails.coef <= -0.6
                  ? `These pairs move inversely. Taking the same directional position (e.g. BUY on both) provides a natural foreign exchange balance against sudden USD shocks.`
                  : selectedPairDetails.coef >= 0.7
                  ? `These pairs move in close lockstep. Simultaneous identical trades will double directional exposure. An opposing Long/Short position forms a statistical spread hedge.`
                  : `These pairs exhibit low directional dependency, allowing portfolio diversification with minimal mutual interference.`}
              </div>

              {/* Action Button if related hedge exists */}
              {selectedPairDetails.relatedHedge && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-zinc-400">
                    Calculated Hedging Efficiency: <strong className="text-emerald-400">{selectedPairDetails.relatedHedge.riskReductionScore}%</strong>
                  </span>
                  <button
                    id="btn-execute-selected-hedge"
                    onClick={() => handleQuickExecuteHedge(selectedPairDetails.relatedHedge!)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Quick Hedge ({selectedPairDetails.relatedHedge.suggestedType})</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Select any matrix intersection above to evaluate specific pair-wise hedging mechanics.</span>
            </div>
          )}

          {/* Hedging Opportunities Section */}
          <div className="flex flex-col gap-2.5 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-tight">
                  Identified Hedging Playbooks
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                  {filteredHedging.length}
                </span>
              </div>

              {/* Subfilters */}
              <div className="flex items-center gap-1 text-[10px]">
                {(['ALL', 'INVERSE', 'SPREAD', 'WARNINGS'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveHedgingFilter(filter)}
                    className={`px-1.5 py-0.5 rounded font-medium transition ${
                      activeHedgingFilter === filter
                        ? 'bg-zinc-800 text-white font-bold'
                        : 'text-zinc-400 hover:text-zinc-300'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Opportunities List */}
            <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredHedging.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-400 bg-zinc-900/40 rounded-xl border border-zinc-800">
                  No active opportunities match the selected filter.
                </div>
              ) : (
                filteredHedging.map((op) => {
                  const isWarning = op.type === 'CONCENTRATION_RISK';
                  const isInverse = op.type === 'INVERSE_HEDGE';

                  return (
                    <div
                      key={op.id}
                      id={`card-${op.id}`}
                      className={`p-3 rounded-xl border transition flex flex-col gap-2 ${
                        isWarning
                          ? 'bg-amber-950/20 border-amber-800/40 hover:border-amber-700/60'
                          : isInverse
                          ? 'bg-zinc-900/90 border-emerald-900/40 hover:border-emerald-700/50'
                          : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isWarning ? (
                            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          )}
                          <div>
                            <span className="font-bold text-xs text-white block">
                              {op.title}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Correlation: {op.correlation >= 0 ? `+${op.correlation.toFixed(2)}` : op.correlation.toFixed(2)} &bull; Risk Reduction: {op.riskReductionScore}%
                            </span>
                          </div>
                        </div>

                        {op.isCurrentlyHedging && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                            Hedge Active
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        {op.hedgingRationale}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[11px]">
                        <span className="text-zinc-400 font-medium">
                          Suggested Action:{' '}
                          <strong className={op.suggestedType === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                            {op.suggestedType} {op.hedgePair}
                          </strong>
                        </span>

                        {onExecuteHedgeOrder && !op.isCurrentlyHedging && (
                          <button
                            id={`btn-apply-hedge-${op.id}`}
                            onClick={() => handleQuickExecuteHedge(op)}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition flex items-center gap-1"
                          >
                            <span>Deploy</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
