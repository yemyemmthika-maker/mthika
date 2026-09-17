import React, { useState } from 'react';
import { BotLog, LogLevel } from '../types';
import { Terminal, Shield, Zap, Info, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { SymbolFlagBadge } from './CurrencyFlag';

interface BotTelemetryLogsProps {
  logs: BotLog[];
  onClearLogs: () => void;
}

export const BotTelemetryLogs: React.FC<BotTelemetryLogsProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<'ALL' | 'SIGNAL' | 'ORDER' | 'RISK'>('ALL');

  const filtered = logs.filter((log) => {
    if (filter === 'ALL') return true;
    if (filter === 'SIGNAL') return log.level === 'SIGNAL' || log.level === 'AI_ADVICE';
    if (filter === 'ORDER') return log.level === 'ORDER_FILLED' || log.level === 'POSITION_CLOSED';
    if (filter === 'RISK') return log.level === 'RISK_HALT';
    return true;
  });

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col h-72">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/70 border-b border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-white tracking-tight">
            Bot Execution Telemetry & Decision Engine
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>

        <div className="flex items-center gap-1">
          {(['ALL', 'SIGNAL', 'ORDER', 'RISK'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                filter === f
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={onClearLogs}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 ml-2 px-1.5 py-0.5"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Logs Scroll Container */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] divide-y divide-zinc-900/50 space-y-1">
        {filtered.length === 0 ? (
          <div className="text-zinc-600 text-center py-8 font-sans text-xs">
            No telemetry records for this filter yet.
          </div>
        ) : (
          filtered.slice(0, 100).map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString();

            return (
              <div key={log.id} className="pt-1 flex items-start gap-2 leading-relaxed">
                <span className="text-zinc-500 shrink-0 text-[10px]">{timeStr}</span>

                {/* Level badge */}
                <span
                  className={`shrink-0 px-1 py-0.2 rounded text-[9px] font-bold ${
                    log.level === 'ORDER_FILLED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : log.level === 'POSITION_CLOSED'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : log.level === 'SIGNAL'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : log.level === 'RISK_HALT'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  {log.level}
                </span>

                {log.pairSymbol && (
                  <span className="inline-flex items-center gap-1 text-zinc-300 font-bold shrink-0">
                    <SymbolFlagBadge symbol={log.pairSymbol} size="xs" />
                    <span>[{log.pairSymbol}]</span>
                  </span>
                )}

                <span className="text-zinc-300 break-words flex-1">
                  {log.message}
                </span>

                {log.details && (
                  <span className="text-zinc-500 text-[10px] hidden sm:inline-block">
                    {log.details}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
