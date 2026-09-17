import React, { useState, useMemo } from 'react';
import {
  Candle,
  CurrencyPair,
  OrderType,
  Position,
  Timeframe,
} from '../types';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Crosshair,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { SymbolFlagBadge } from './CurrencyFlag';

interface TradingChartProps {
  pair: CurrencyPair;
  candles: Candle[];
  timeframe: Timeframe;
  onChangeTimeframe: (tf: Timeframe) => void;
  openPositions: Position[];
  onManualOrder: (type: OrderType, lots: number, slPips?: number, tpPips?: number) => void;
  quickLots: number;
  onChangeQuickLots: (lots: number) => void;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  pair,
  candles,
  timeframe,
  onChangeTimeframe,
  openPositions,
  onManualOrder,
  quickLots,
  onChangeQuickLots,
}) => {
  const [showEma, setShowEma] = useState(true);
  const [showBands, setShowBands] = useState(true);
  const [activeOscillator, setActiveOscillator] = useState<'RSI' | 'MACD' | 'BOTH'>('BOTH');
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);

  // Timeframe tabs
  const timeframes: Timeframe[] = ['1M', '5M', '15M', '1H', '4H', '1D'];

  // Calculate coordinates and scales for SVG rendering
  const visibleCandles = useMemo(() => {
    return candles.slice(-55); // Show last 55 candles for crisp spacing
  }, [candles]);

  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (!visibleCandles.length) return { minPrice: 0, maxPrice: 1, priceRange: 1 };
    let min = Infinity;
    let max = -Infinity;

    visibleCandles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (showBands) {
        if (c.lowerBand && c.lowerBand < min) min = c.lowerBand;
        if (c.upperBand && c.upperBand > max) max = c.upperBand;
      }
    });

    const padding = (max - min) * 0.08 || 0.0005;
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      priceRange: (max - min + padding * 2) || 0.001,
    };
  }, [visibleCandles, showBands]);

  // Chart layout dimensions
  const chartHeight = 320;
  const oscHeight = 85;
  const candleWidth = 7;
  const candleGap = 12;
  const totalSvgWidth = Math.max(680, visibleCandles.length * (candleWidth + candleGap) + 80);

  const getY = (price: number) => {
    return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  const latestCandle = visibleCandles[visibleCandles.length - 1];
  const activeHover = hoveredCandle || latestCandle;

  // Stop loss and take profit lines from open positions on this pair
  const currentPairPositions = openPositions.filter((p) => p.pairSymbol === pair.symbol);

  return (
    <div className="flex flex-col bg-zinc-950 border-b border-zinc-800/80">
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-zinc-900 bg-zinc-900/40 text-xs">
        {/* Left: Pair Info & Timeframes */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <SymbolFlagBadge symbol={pair.symbol} size="md" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-white text-sm">{pair.symbol}</span>
              <span className="text-[11px] text-zinc-400 hidden lg:inline">({pair.name})</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
              {pair.currentBid.toFixed(pair.digits)}
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-800"></div>

          {/* Timeframe Selector */}
          <div className="flex items-center bg-zinc-900 rounded border border-zinc-800 p-0.5">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onChangeTimeframe(tf)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  timeframe === tf
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicators toggle */}
          <div className="flex items-center gap-1 text-[11px]">
            <button
              onClick={() => setShowEma(!showEma)}
              className={`px-2 py-0.5 rounded border text-[11px] font-medium transition ${
                showEma
                  ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
            >
              EMA 9/21/50
            </button>
            <button
              onClick={() => setShowBands(!showBands)}
              className={`px-2 py-0.5 rounded border text-[11px] font-medium transition ${
                showBands
                  ? 'bg-indigo-950/40 border-indigo-800/60 text-indigo-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
            >
              BBands (20,2)
            </button>
            <button
              onClick={() => {
                if (activeOscillator === 'BOTH') setActiveOscillator('RSI');
                else if (activeOscillator === 'RSI') setActiveOscillator('MACD');
                else setActiveOscillator('BOTH');
              }}
              className="px-2 py-0.5 rounded border bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white transition text-[11px]"
            >
              Oscillator: <span className="font-semibold text-emerald-400">{activeOscillator}</span>
            </button>
          </div>
        </div>

        {/* Right: Quick Manual Order controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded px-2 py-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500">Lots:</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="50"
              value={quickLots}
              onChange={(e) => onChangeQuickLots(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
              className="w-14 bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            id="manual-buy-btn"
            onClick={() => onManualOrder('BUY', quickLots)}
            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded transition shadow-sm"
            title="Instant BUY market execution"
          >
            <TrendingUp className="w-3.5 h-3.5 stroke-[3]" />
            <span>BUY</span>
            <span className="font-mono text-[11px] ml-0.5 opacity-90">{pair.currentAsk.toFixed(pair.digits)}</span>
          </button>

          <button
            id="manual-sell-btn"
            onClick={() => onManualOrder('SELL', quickLots)}
            className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-zinc-950 font-bold text-xs rounded transition shadow-sm"
            title="Instant SELL market execution"
          >
            <TrendingDown className="w-3.5 h-3.5 stroke-[3]" />
            <span>SELL</span>
            <span className="font-mono text-[11px] ml-0.5 opacity-90">{pair.currentBid.toFixed(pair.digits)}</span>
          </button>
        </div>
      </div>

      {/* Floating Info Overlay (OHLC & Indicator Values) */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-1.5 bg-zinc-900/30 text-[11px] font-mono border-b border-zinc-900 text-zinc-400">
        {activeHover && (
          <>
            <div><span className="text-zinc-500">O:</span> <span className="text-zinc-200">{activeHover.open.toFixed(pair.digits)}</span></div>
            <div><span className="text-zinc-500">H:</span> <span className="text-zinc-200">{activeHover.high.toFixed(pair.digits)}</span></div>
            <div><span className="text-zinc-500">L:</span> <span className="text-zinc-200">{activeHover.low.toFixed(pair.digits)}</span></div>
            <div><span className="text-zinc-500">C:</span> <span className={activeHover.close >= activeHover.open ? 'text-emerald-400' : 'text-rose-400'}>{activeHover.close.toFixed(pair.digits)}</span></div>
            {showEma && activeHover.ema9 && (
              <div className="flex items-center gap-2 border-l border-zinc-800 pl-2">
                <span className="text-cyan-400">EMA9: {activeHover.ema9.toFixed(pair.digits)}</span>
                <span className="text-amber-400">EMA21: {activeHover.ema21?.toFixed(pair.digits)}</span>
                <span className="text-purple-400">EMA50: {activeHover.ema50?.toFixed(pair.digits)}</span>
              </div>
            )}
            {activeHover.rsi && (
              <div className="border-l border-zinc-800 pl-2">
                <span className={activeHover.rsi > 70 ? 'text-rose-400' : (activeHover.rsi < 30 ? 'text-emerald-400' : 'text-zinc-300')}>
                  RSI(14): {activeHover.rsi.toFixed(1)}
                </span>
              </div>
            )}
            {activeHover.macdHist !== undefined && (
              <div className="border-l border-zinc-800 pl-2">
                <span className={activeHover.macdHist >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  MACD: {activeHover.macdHist >= 0 ? '+' : ''}{(activeHover.macdHist * 1000).toFixed(2)}m
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Main SVG Candlestick Canvas Area */}
      <div className="relative overflow-x-auto select-none bg-zinc-950">
        <svg
          width={totalSvgWidth}
          height={chartHeight + (activeOscillator === 'BOTH' ? oscHeight * 2 : oscHeight) + 10}
          className="block"
          onMouseLeave={() => setHoveredCandle(null)}
        >
          {/* Horizontal Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const y = chartHeight * ratio;
            const priceVal = maxPrice - ratio * priceRange;
            return (
              <g key={ratio}>
                <line x1="0" y1={y} x2={totalSvgWidth} y2={y} stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />
                <text x={totalSvgWidth - 65} y={y - 4} fill="#71717a" fontSize="10" fontFamily="monospace">
                  {priceVal.toFixed(pair.digits)}
                </text>
              </g>
            );
          })}

          {/* Bollinger Bands Fill Area & Lines */}
          {showBands && (
            <>
              {visibleCandles.map((c, i) => {
                if (i === 0 || !c.upperBand || !c.lowerBand) return null;
                const prev = visibleCandles[i - 1];
                if (!prev.upperBand || !prev.lowerBand) return null;

                const x1 = (i - 1) * (candleWidth + candleGap) + 20;
                const x2 = i * (candleWidth + candleGap) + 20;
                const yUpper1 = getY(prev.upperBand);
                const yUpper2 = getY(c.upperBand);
                const yLower1 = getY(prev.lowerBand);
                const yLower2 = getY(c.lowerBand);
                const yMid1 = getY(prev.middleBand ?? prev.close);
                const yMid2 = getY(c.middleBand ?? c.close);

                return (
                  <g key={`bb-${i}`}>
                    <polygon
                      points={`${x1},${yUpper1} ${x2},${yUpper2} ${x2},${yLower2} ${x1},${yLower1}`}
                      fill="#6366f1"
                      fillOpacity="0.04"
                    />
                    <line x1={x1} y1={yUpper1} x2={x2} y2={yUpper2} stroke="#818cf8" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="2 2" />
                    <line x1={x1} y1={yLower1} x2={x2} y2={yLower2} stroke="#818cf8" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="2 2" />
                    <line x1={x1} y1={yMid1} x2={x2} y2={yMid2} stroke="#6366f1" strokeWidth="1" strokeOpacity="0.3" />
                  </g>
                );
              })}
            </>
          )}

          {/* EMA Lines */}
          {showEma && (
            <>
              {visibleCandles.map((c, i) => {
                if (i === 0) return null;
                const prev = visibleCandles[i - 1];
                const x1 = (i - 1) * (candleWidth + candleGap) + 20;
                const x2 = i * (candleWidth + candleGap) + 20;

                return (
                  <g key={`ema-${i}`}>
                    {c.ema9 && prev.ema9 && (
                      <line x1={x1} y1={getY(prev.ema9)} x2={x2} y2={getY(c.ema9)} stroke="#06b6d4" strokeWidth="1.5" />
                    )}
                    {c.ema21 && prev.ema21 && (
                      <line x1={x1} y1={getY(prev.ema21)} x2={x2} y2={getY(c.ema21)} stroke="#f59e0b" strokeWidth="1.5" />
                    )}
                    {c.ema50 && prev.ema50 && (
                      <line x1={x1} y1={getY(prev.ema50)} x2={x2} y2={getY(c.ema50)} stroke="#a855f7" strokeWidth="1.2" strokeDasharray="3 1" />
                    )}
                  </g>
                );
              })}
            </>
          )}

          {/* Candlesticks */}
          {visibleCandles.map((c, i) => {
            const x = i * (candleWidth + candleGap) + 20;
            const isBullish = c.close >= c.open;
            const bodyTopPrice = Math.max(c.open, c.close);
            const bodyBottomPrice = Math.min(c.open, c.close);
            const yHigh = getY(c.high);
            const yLow = getY(c.low);
            const yTop = getY(bodyTopPrice);
            const yBottom = getY(bodyBottomPrice);
            const bodyHeight = Math.max(1.5, yBottom - yTop);

            const candleColor = isBullish ? '#10b981' : '#f43f5e';

            return (
              <g
                key={`candle-${c.time}-${i}`}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onMouseEnter={() => setHoveredCandle(c)}
              >
                {/* Wick */}
                <line
                  x1={x + candleWidth / 2}
                  y1={yHigh}
                  x2={x + candleWidth / 2}
                  y2={yLow}
                  stroke={candleColor}
                  strokeWidth="1.2"
                />

                {/* Candle Body */}
                <rect
                  x={x}
                  y={yTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={candleColor}
                  rx="1"
                />

                {/* Signal pin if robot executed an order here */}
                {c.signalMarker && (
                  <g>
                    {c.signalMarker.type === 'BUY' ? (
                      <g transform={`translate(${x + candleWidth / 2 - 6}, ${yLow + 6})`}>
                        <polygon points="6,0 12,12 0,12" fill="#10b981" />
                        <text x="6" y="22" fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">
                          BUY
                        </text>
                      </g>
                    ) : (
                      <g transform={`translate(${x + candleWidth / 2 - 6}, ${yHigh - 22})`}>
                        <polygon points="6,12 12,0 0,0" fill="#f43f5e" />
                        <text x="6" y="-4" fill="#fb7185" fontSize="9" fontWeight="bold" textAnchor="middle">
                          SELL
                        </text>
                      </g>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* Active Positions SL & TP Horizontal Reference Lines */}
          {currentPairPositions.map((pos) => {
            const openY = getY(pos.openPrice);
            const slY = pos.stopLoss ? getY(pos.stopLoss) : null;
            const tpY = pos.takeProfit ? getY(pos.takeProfit) : null;

            return (
              <g key={`pos-lines-${pos.id}`}>
                {/* Entry line */}
                <line x1="0" y1={openY} x2={totalSvgWidth} y2={openY} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 4" />
                <text x="30" y={openY - 4} fill="#60a5fa" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  {pos.type} #{pos.ticket} @ {pos.openPrice.toFixed(pair.digits)}
                </text>

                {/* SL line */}
                {slY && (
                  <>
                    <line x1="0" y1={slY} x2={totalSvgWidth} y2={slY} stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" />
                    <text x={totalSvgWidth - 85} y={slY - 3} fill="#f43f5e" fontSize="9" fontFamily="monospace">
                      SL: {pos.stopLoss?.toFixed(pair.digits)}
                    </text>
                  </>
                )}

                {/* TP line */}
                {tpY && (
                  <>
                    <line x1="0" y1={tpY} x2={totalSvgWidth} y2={tpY} stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" />
                    <text x={totalSvgWidth - 85} y={tpY - 3} fill="#10b981" fontSize="9" fontFamily="monospace">
                      TP: {pos.takeProfit?.toFixed(pair.digits)}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Current Bid/Ask live badge */}
          {latestCandle && (
            <g>
              <line
                x1="0"
                y1={getY(pair.currentBid)}
                x2={totalSvgWidth}
                y2={getY(pair.currentBid)}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="2 1"
              />
              <rect
                x={totalSvgWidth - 75}
                y={getY(pair.currentBid) - 9}
                width="72"
                height="18"
                fill="#10b981"
                rx="3"
              />
              <text
                x={totalSvgWidth - 39}
                y={getY(pair.currentBid) + 3}
                fill="#09090b"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {pair.currentBid.toFixed(pair.digits)}
              </text>
            </g>
          )}

          {/* Sub-panel 1: RSI (14) */}
          {(activeOscillator === 'RSI' || activeOscillator === 'BOTH') && (
            <g transform={`translate(0, ${chartHeight + 15})`}>
              <line x1="0" y1="0" x2={totalSvgWidth} y2="0" stroke="#27272a" strokeWidth="1" />
              <text x="15" y="14" fill="#a1a1aa" fontSize="10" fontWeight="bold">
                RSI (14)
              </text>

              {/* 70 & 30 Lines */}
              <line x1="0" y1={oscHeight * 0.3} x2={totalSvgWidth} y2={oscHeight * 0.3} stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.4" />
              <line x1="0" y1={oscHeight * 0.7} x2={totalSvgWidth} y2={oscHeight * 0.7} stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.4" />
              <text x={totalSvgWidth - 30} y={oscHeight * 0.3 + 3} fill="#f43f5e" fontSize="9">70</text>
              <text x={totalSvgWidth - 30} y={oscHeight * 0.7 + 3} fill="#10b981" fontSize="9">30</text>

              {/* RSI Waveform */}
              {visibleCandles.map((c, i) => {
                if (i === 0 || !c.rsi) return null;
                const prev = visibleCandles[i - 1];
                if (!prev.rsi) return null;

                const x1 = (i - 1) * (candleWidth + candleGap) + 20;
                const x2 = i * (candleWidth + candleGap) + 20;
                const y1 = oscHeight - (prev.rsi / 100) * oscHeight;
                const y2 = oscHeight - (c.rsi / 100) * oscHeight;

                return (
                  <line key={`rsi-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#38bdf8" strokeWidth="1.5" />
                );
              })}
            </g>
          )}

          {/* Sub-panel 2: MACD (12, 26, 9) */}
          {(activeOscillator === 'MACD' || activeOscillator === 'BOTH') && (
            <g transform={`translate(0, ${chartHeight + (activeOscillator === 'BOTH' ? oscHeight + 25 : 15)})`}>
              <line x1="0" y1="0" x2={totalSvgWidth} y2="0" stroke="#27272a" strokeWidth="1" />
              <text x="15" y="14" fill="#a1a1aa" fontSize="10" fontWeight="bold">
                MACD (12, 26, 9)
              </text>

              {/* Center Zero Line */}
              <line x1="0" y1={oscHeight / 2} x2={totalSvgWidth} y2={oscHeight / 2} stroke="#3f3f46" strokeWidth="1" strokeDasharray="3 3" />

              {/* Histogram bars */}
              {visibleCandles.map((c, i) => {
                if (c.macdHist === undefined) return null;
                const x = i * (candleWidth + candleGap) + 20;
                const zeroY = oscHeight / 2;
                const scale = oscHeight * 1200; // scaling for small forex pip values
                const barH = Math.min(oscHeight / 2 - 4, Math.abs(c.macdHist * scale));
                const barY = c.macdHist >= 0 ? zeroY - barH : zeroY;

                return (
                  <rect
                    key={`hist-${i}`}
                    x={x}
                    y={barY}
                    width={candleWidth - 1}
                    height={Math.max(1, barH)}
                    fill={c.macdHist >= 0 ? '#10b981' : '#f43f5e'}
                    rx="0.5"
                    opacity="0.8"
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
