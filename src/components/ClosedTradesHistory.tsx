import React, { useState } from 'react';
import { Position } from '../types';
import { formatPrice } from '../utils/forexMath';
import { GlobalCurrencyCode, formatGlobalCurrency, getCurrencyInfo, convertFromUSD } from '../utils/currencyFlags';
import { SymbolFlagBadge } from './CurrencyFlag';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  History,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

interface ClosedTradesHistoryProps {
  closedPositions: Position[];
  globalCurrency?: GlobalCurrencyCode;
}

export const ClosedTradesHistory: React.FC<ClosedTradesHistoryProps> = ({
  closedPositions,
  globalCurrency = 'USD',
}) => {
  const [exportSuccess, setExportSuccess] = useState(false);
  const currencyInfo = getCurrencyInfo(globalCurrency);

  const exportToCSV = () => {
    if (closedPositions.length === 0) return;

    const headers = [
      'Ticket',
      'Pair Symbol',
      'Order Type',
      'Lot Size',
      'Open Price',
      'Close Price',
      `Profit (${currencyInfo.code})`,
      'PnL (Pips)',
      'Exit Reason',
      'Strategy',
      'Open Time (UTC)',
      'Close Time (UTC)',
      'Duration (sec)',
      'Outcome',
    ];

    const rows = closedPositions.map((pos) => {
      const durationSec = pos.closeTime ? Math.round((pos.closeTime - pos.openTime) / 1000) : 0;
      const outcome = pos.pnlDollar > 0 ? 'WIN' : pos.pnlDollar < 0 ? 'LOSS' : 'BREAKEVEN';
      const convertedProfit = convertFromUSD(pos.pnlDollar, globalCurrency);
      return [
        pos.ticket,
        pos.pairSymbol,
        pos.type,
        pos.lots.toFixed(2),
        formatPrice(pos.openPrice, pos.pairSymbol),
        pos.closePrice ? formatPrice(pos.closePrice, pos.pairSymbol) : '',
        convertedProfit.toFixed(2),
        pos.pnlPips.toFixed(1),
        pos.closeReason || 'CLOSED',
        `"${(pos.strategyName || '').replace(/"/g, '""')}"`,
        new Date(pos.openTime).toISOString(),
        pos.closeTime ? new Date(pos.closeTime).toISOString() : '',
        durationSec,
        outcome,
      ];
    });

    // Prepend UTF-8 BOM so Excel opens non-ASCII and symbols cleanly
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    link.setAttribute('href', url);
    link.setAttribute('download', `forex_trades_history_${dateStr}_${timeStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  if (closedPositions.length === 0) {
    return (
      <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-8 text-center flex flex-col items-center justify-center text-zinc-500">
        <History className="w-8 h-8 stroke-1 text-zinc-600 mb-2" />
        <span className="text-xs font-semibold text-zinc-400">No Closed Trades Yet</span>
        <p className="text-[11px] text-zinc-500 max-w-sm mt-1 mb-4">
          When the robot exits trades via Take Profit, Stop Loss, or Trailing Stops, closed orders will appear here with audited statistics.
        </p>
        <button
          disabled
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-60"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV (Waiting for trades)</span>
        </button>
      </div>
    );
  }

  const reversed = [...closedPositions].reverse();
  const totalPnL = closedPositions.reduce((sum, p) => sum + p.pnlDollar, 0);
  const totalWins = closedPositions.filter((p) => p.pnlDollar > 0).length;
  const winRate = closedPositions.length > 0 ? ((totalWins / closedPositions.length) * 100).toFixed(0) : '0';

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-bold text-white tracking-tight">
            Closed Trade Execution History
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">
            {closedPositions.length} Closed
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 ml-2">
            Realized:{' '}
            <strong className={totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </strong>{' '}
            ({winRate}% Win)
          </span>
        </div>

        {/* Export CSV Button */}
        <button
          type="button"
          onClick={exportToCSV}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition ${
            exportSuccess
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-900/40'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700 hover:border-zinc-600 hover:text-white'
          }`}
          title="Export closed trades to CSV spreadsheet for Excel or Google Sheets"
        >
          {exportSuccess ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV Exported!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-850 bg-zinc-900/30 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <th className="py-2 px-3">Ticket</th>
              <th className="py-2 px-3">Pair</th>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Lots</th>
              <th className="py-2 px-3">Open</th>
              <th className="py-2 px-3">Close</th>
              <th className="py-2 px-3 text-right">Profit ({currencyInfo.symbol})</th>
              <th className="py-2 px-3 text-right">Pips</th>
              <th className="py-2 px-3">Exit Reason</th>
              <th className="py-2 px-3">Strategy</th>
              <th className="py-2 px-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850/60 font-mono">
            {reversed.map((pos) => {
              const isWin = pos.pnlDollar >= 0;
              return (
                <tr key={pos.id} className="hover:bg-zinc-900/40 transition">
                  <td className="py-2 px-3 text-zinc-500 text-[11px]">#{pos.ticket}</td>
                  <td className="py-2 px-3 font-sans font-bold text-white text-xs">
                    <div className="flex items-center gap-1.5">
                      <SymbolFlagBadge symbol={pos.pairSymbol} size="xs" />
                      <span>{pos.pairSymbol}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 font-sans">
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        pos.type === 'BUY'
                          ? 'bg-emerald-950/40 text-emerald-400'
                          : 'bg-rose-950/40 text-rose-400'
                      }`}
                    >
                      {pos.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-zinc-300 text-[11px]">{pos.lots.toFixed(2)}</td>
                  <td className="py-2 px-3 text-zinc-400 text-[11px]">
                    {formatPrice(pos.openPrice, pos.pairSymbol)}
                  </td>
                  <td className="py-2 px-3 text-zinc-300 text-[11px]">
                    {pos.closePrice ? formatPrice(pos.closePrice, pos.pairSymbol) : '—'}
                  </td>
                  <td className={`py-2 px-3 text-right font-bold text-[12px] ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatGlobalCurrency(pos.pnlDollar, globalCurrency, { showSign: true })}
                  </td>
                  <td className={`py-2 px-3 text-right text-[11px] ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isWin ? '+' : ''}{pos.pnlPips.toFixed(1)}p
                  </td>
                  <td className="py-2 px-3 font-sans">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded ${
                        pos.closeReason === 'TAKE_PROFIT'
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'
                          : pos.closeReason === 'STOP_LOSS'
                          ? 'bg-rose-950/50 text-rose-400 border border-rose-800/40'
                          : pos.closeReason === 'TRAILING_STOP'
                          ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-800/40'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {pos.closeReason || 'CLOSED'}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-sans text-[10px] text-zinc-400 truncate max-w-[120px]">
                    {pos.strategyName}
                  </td>
                  <td className="py-2 px-3 text-right text-[10px] text-zinc-500 font-sans">
                    {pos.closeTime ? new Date(pos.closeTime).toLocaleTimeString() : '—'}
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
