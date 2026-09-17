import React from 'react';
import { Position } from '../types';
import {
  X,
  Shield,
  TrendingUp,
  TrendingDown,
  Clock,
  Layers,
  Check,
} from 'lucide-react';
import { formatPrice } from '../utils/forexMath';
import { GlobalCurrencyCode, formatGlobalCurrency, getCurrencyInfo } from '../utils/currencyFlags';
import { SymbolFlagBadge, CurrencyFlag } from './CurrencyFlag';

interface ActivePositionsTableProps {
  positions: Position[];
  onClosePosition: (id: string) => void;
  onSetBreakeven: (id: string) => void;
  onCloseAll: () => void;
  onCloseProfitable: () => void;
  globalCurrency?: GlobalCurrencyCode;
}

export const ActivePositionsTable: React.FC<ActivePositionsTableProps> = ({
  positions,
  onClosePosition,
  onSetBreakeven,
  onCloseAll,
  onCloseProfitable,
  globalCurrency = 'USD',
}) => {
  const currencyInfo = getCurrencyInfo(globalCurrency);

  if (positions.length === 0) {
    return (
      <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-8 text-center flex flex-col items-center justify-center text-zinc-500">
        <Layers className="w-8 h-8 stroke-1 text-zinc-600 mb-2" />
        <span className="text-xs font-semibold text-zinc-400">No Active Positions</span>
        <p className="text-[11px] text-zinc-500 max-w-sm mt-1">
          The bot is continuously scanning indicators. New orders will execute automatically once entry criteria are met.
        </p>
      </div>
    );
  }

  const totalFloating = positions.reduce((sum, p) => sum + p.pnlDollar, 0);

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col">
      {/* Table Header & Bulk Actions */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800/80 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white tracking-tight">
            Active Open Positions
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {positions.length} Live
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 ml-2">
            <span>Net Floating:</span>
            <CurrencyFlag code={globalCurrency} size="xs" />
            <span className={totalFloating >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {formatGlobalCurrency(totalFloating, globalCurrency, { showSign: true })}
            </span>
          </div>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCloseProfitable}
            className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium transition"
          >
            Close Profitable
          </button>
          <button
            onClick={onCloseAll}
            className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-medium transition"
          >
            Close All
          </button>
        </div>
      </div>

      {/* Table Rows */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-850 bg-zinc-900/30 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <th className="py-2 px-3">Ticket</th>
              <th className="py-2 px-3">Pair</th>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Lots</th>
              <th className="py-2 px-3">Open Price</th>
              <th className="py-2 px-3">Current</th>
              <th className="py-2 px-3">Stop Loss</th>
              <th className="py-2 px-3">Take Profit</th>
              <th className="py-2 px-3 text-right">Profit ({currencyInfo.symbol})</th>
              <th className="py-2 px-3 text-right">Pips</th>
              <th className="py-2 px-3">Strategy</th>
              <th className="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850/60 font-mono">
            {positions.map((pos) => {
              const isProfit = pos.pnlDollar >= 0;
              return (
                <tr key={pos.id} className="hover:bg-zinc-900/40 transition">
                  <td className="py-2.5 px-3 text-zinc-400 text-[11px]">#{pos.ticket}</td>
                  <td className="py-2.5 px-3 font-sans font-bold text-white text-xs">
                    <div className="flex items-center gap-1.5">
                      <SymbolFlagBadge symbol={pos.pairSymbol} size="xs" />
                      <span>{pos.pairSymbol}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        pos.type === 'BUY'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                      }`}
                    >
                      {pos.type === 'BUY' ? (
                        <TrendingUp className="w-2.5 h-2.5" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5" />
                      )}
                      {pos.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-300 text-[11px]">{pos.lots.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-zinc-300 text-[11px]">
                    {formatPrice(pos.openPrice, pos.pairSymbol)}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-200 text-[11px] font-bold">
                    {formatPrice(pos.currentPrice, pos.pairSymbol)}
                  </td>
                  <td className="py-2.5 px-3 text-rose-400 text-[11px]">
                    {pos.stopLoss ? formatPrice(pos.stopLoss, pos.pairSymbol) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400 text-[11px]">
                    {pos.takeProfit ? formatPrice(pos.takeProfit, pos.pairSymbol) : '—'}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold text-[12px] ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatGlobalCurrency(pos.pnlDollar, globalCurrency, { showSign: true })}
                  </td>
                  <td className={`py-2.5 px-3 text-right text-[11px] ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isProfit ? '+' : ''}{pos.pnlPips.toFixed(1)}p
                  </td>
                  <td className="py-2.5 px-3 font-sans text-[10px] text-zinc-400 truncate max-w-[110px]">
                    {pos.strategyName}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Set Breakeven if in profit */}
                      {pos.pnlPips > 5 && (
                        <button
                          onClick={() => onSetBreakeven(pos.id)}
                          className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-sans flex items-center gap-0.5"
                          title="Move Stop Loss to Entry price (risk free)"
                        >
                          <Shield className="w-2.5 h-2.5 text-cyan-400" />
                          <span>BE</span>
                        </button>
                      )}

                      {/* Close Position */}
                      <button
                        onClick={() => onClosePosition(pos.id)}
                        className="p-1 rounded bg-zinc-800 hover:bg-rose-900/60 text-zinc-400 hover:text-rose-300 transition"
                        title="Close this position immediately"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
