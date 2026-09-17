import React from 'react';
import { CurrencyPair } from '../types';
import { Check, Flame } from 'lucide-react';
import { PairFlagBadge } from './CurrencyFlag';

interface PairSelectorProps {
  pairs: CurrencyPair[];
  selectedPair: CurrencyPair;
  onSelectPair: (pair: CurrencyPair) => void;
  activePairsInBot: string[];
  onTogglePairInBot: (symbol: string) => void;
  openPositionsByPair: Record<string, number>;
}

export const PairSelector: React.FC<PairSelectorProps> = ({
  pairs,
  selectedPair,
  onSelectPair,
  activePairsInBot,
  onTogglePairInBot,
  openPositionsByPair,
}) => {
  return (
    <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800/80 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 min-w-max">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider pr-1">
          Forex Pairs:
        </span>
        {pairs.map((pair) => {
          const isSelected = pair.symbol === selectedPair.symbol;
          const isBotActive = activePairsInBot.includes(pair.symbol);
          const posCount = openPositionsByPair[pair.symbol] || 0;
          const isUp = pair.changePercent24h >= 0;

          return (
            <div
              key={pair.id}
              className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer text-xs ${
                isSelected
                  ? 'bg-zinc-900 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
                  : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
              }`}
              onClick={() => onSelectPair(pair)}
            >
              {/* Bot active checkbox toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePairInBot(pair.symbol);
                }}
                className={`w-3.5 h-3.5 rounded flex items-center justify-center transition border ${
                  isBotActive
                    ? 'bg-emerald-500 border-emerald-400 text-zinc-950'
                    : 'bg-zinc-800 border-zinc-700 text-transparent hover:border-zinc-500'
                }`}
                title={isBotActive ? 'Bot trades this pair' : 'Enable bot trading on this pair'}
              >
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </button>

              {/* Country Flag Badges */}
              <PairFlagBadge base={pair.base} quote={pair.quote} size="sm" />

              {/* Pair Symbol & Volatility Icon */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className={`font-bold tracking-tight ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                    {pair.symbol}
                  </span>
                  {pair.symbol === 'XAU/USD' && (
                    <Flame className="w-3 h-3 text-amber-400 fill-amber-400/20" />
                  )}
                  {posCount > 0 && (
                    <span className="px-1 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {posCount} pos
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-zinc-400 font-mono">
                    {pair.currentBid.toFixed(pair.digits === 5 ? 5 : (pair.digits === 3 ? 3 : 2))}
                  </span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-zinc-500 text-[9px]">
                    Spr: {pair.spreadPips.toFixed(1)}p
                  </span>
                </div>
              </div>

              {/* 24h Change badge */}
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded font-mono ${
                  isUp
                    ? 'text-emerald-400 bg-emerald-950/40'
                    : 'text-rose-400 bg-rose-950/40'
                }`}
              >
                {isUp ? '+' : ''}
                {pair.changePercent24h.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
