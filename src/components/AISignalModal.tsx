import React, { useState, useEffect } from 'react';
import {
  AISignalAnalysis,
  Candle,
  CurrencyPair,
  OrderType,
} from '../types';
import {
  Sparkles,
  X,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  Zap,
  Activity,
  Cpu,
  ArrowRight,
  Bot,
  Check,
} from 'lucide-react';
import { formatPrice } from '../utils/forexMath';

interface AISignalModalProps {
  isOpen: boolean;
  onClose: () => void;
  pair: CurrencyPair;
  candles: Candle[];
  onExecuteAITrade: (type: OrderType, lots: number, slPips: number, tpPips: number, strategyName: string) => void;
  quickLots: number;
}

export const AISignalModal: React.FC<AISignalModalProps> = ({
  isOpen,
  onClose,
  pair,
  candles,
  onExecuteAITrade,
  quickLots,
}) => {
  const [activeTab, setActiveTab] = useState<'SIGNAL' | 'STRATEGY_GEN'>('SIGNAL');
  const [isLoading, setIsLoading] = useState(false);
  const [aiSignal, setAiSignal] = useState<AISignalAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Strategy generator state
  const [traderStyle, setTraderStyle] = useState('Scalper');
  const [riskPreference, setRiskPreference] = useState('Moderate');
  const [customStrategyResult, setCustomStrategyResult] = useState<any>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);

  const latestCandle = candles[candles.length - 1];

  const fetchAISignal = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/analyze-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair: pair.symbol,
          price: pair.currentBid,
          timeframe: '15M',
          indicators: {
            rsi: latestCandle?.rsi,
            ema9: latestCandle?.ema9,
            ema21: latestCandle?.ema21,
            ema50: latestCandle?.ema50,
            macd: latestCandle?.macd,
            signalLine: latestCandle?.signalLine,
            macdHist: latestCandle?.macdHist,
            upperBand: latestCandle?.upperBand,
            lowerBand: latestCandle?.lowerBand,
            atr: latestCandle?.atr,
          },
          currentTrend: latestCandle && latestCandle.close > (latestCandle.ema50 ?? 0) ? 'Bullish Expansion' : 'Bearish Consolidation',
        }),
      });

      if (!response.ok) {
        throw new Error('Signal generation endpoint error');
      }

      const data = await response.json();
      setAiSignal(data);
    } catch (err: any) {
      console.error(err);
      setError('Unable to fetch live AI signal. Using algorithmic quant baseline.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCustomStrategy = async () => {
    setIsGeneratingStrategy(true);
    try {
      const res = await fetch('/api/gemini/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traderStyle,
          riskPreference,
          preferredPairs: [pair.symbol],
        }),
      });
      const data = await res.json();
      setCustomStrategyResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'SIGNAL') {
      fetchAISignal();
    }
  }, [isOpen, pair.symbol]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">
                  Gemini Neural Quant Intelligence
                </h3>
                <span className="text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded-full font-medium">
                  gemini-3.8-flash
                </span>
              </div>
              <p className="text-zinc-400 text-[11px]">
                Deep multi-factor signal synthesis for {pair.symbol}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-zinc-900 bg-zinc-900/20 text-xs">
          <button
            onClick={() => setActiveTab('SIGNAL')}
            className={`pb-2 font-bold transition border-b-2 ${
              activeTab === 'SIGNAL'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Live Market Signal & Order
          </button>
          <button
            onClick={() => setActiveTab('STRATEGY_GEN')}
            className={`pb-2 font-bold transition border-b-2 ${
              activeTab === 'STRATEGY_GEN'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            AI Strategy Generator
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
          {activeTab === 'SIGNAL' && (
            <>
              {isLoading ? (
                <div className="py-16 text-center flex flex-col items-center justify-center">
                  <Activity className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                  <span className="text-white font-semibold text-sm">
                    Synthesizing Market Confluence...
                  </span>
                  <p className="text-zinc-500 text-xs max-w-sm mt-1">
                    Evaluating EMA crossovers, Wilder RSI, MACD divergence histogram, Bollinger Bands volatility squeeze, and ATR risk metrics.
                  </p>
                </div>
              ) : aiSignal ? (
                <div className="flex flex-col gap-4">
                  {/* Signal Banner */}
                  <div className="flex flex-wrap items-center justify-between p-4 rounded-xl border bg-zinc-900/60 border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border font-bold text-sm ${
                          aiSignal.action.includes('BUY')
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : aiSignal.action.includes('SELL')
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                        }`}
                      >
                        {aiSignal.action.includes('BUY') ? (
                          <TrendingUp className="w-6 h-6 stroke-[2.5]" />
                        ) : aiSignal.action.includes('SELL') ? (
                          <TrendingDown className="w-6 h-6 stroke-[2.5]" />
                        ) : (
                          <Bot className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white tracking-tight">
                            {aiSignal.action}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                            Confidence: {aiSignal.confidence}%
                          </span>
                        </div>
                        <p className="text-zinc-400 text-xs mt-0.5">
                          Market Sentiment: <span className="text-white font-medium">{aiSignal.marketSentiment}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-zinc-400 text-[11px]">Market Price</div>
                      <div className="text-base font-bold text-white">
                        {formatPrice(pair.currentBid, pair.symbol)}
                      </div>
                    </div>
                  </div>

                  {/* Targets & Risk-Reward */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-zinc-900/40 border border-zinc-800 p-2.5 rounded-lg">
                      <span className="text-zinc-400 text-[10px] block">Entry Level</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {aiSignal.entryPrice ? formatPrice(aiSignal.entryPrice, pair.symbol) : formatPrice(pair.currentBid, pair.symbol)}
                      </span>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800 p-2.5 rounded-lg">
                      <span className="text-zinc-400 text-[10px] block">Stop Loss (SL)</span>
                      <span className="text-xs font-mono font-bold text-rose-400">
                        {aiSignal.stopLossPrice ? formatPrice(aiSignal.stopLossPrice, pair.symbol) : '—'}
                      </span>
                      <span className="text-[10px] text-zinc-500 ml-1">({aiSignal.stopLossPips}p)</span>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800 p-2.5 rounded-lg">
                      <span className="text-zinc-400 text-[10px] block">Take Profit (TP)</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {aiSignal.takeProfitPrice ? formatPrice(aiSignal.takeProfitPrice, pair.symbol) : '—'}
                      </span>
                      <span className="text-[10px] text-zinc-500 ml-1">({aiSignal.takeProfitPips}p)</span>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800 p-2.5 rounded-lg">
                      <span className="text-zinc-400 text-[10px] block">Risk : Reward</span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {aiSignal.riskRewardRatio}
                      </span>
                    </div>
                  </div>

                  {/* Institutional Rationale */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 p-3 rounded-lg">
                    <span className="text-[11px] font-bold text-white block mb-1">
                      Algorithmic Analysis & Rationale:
                    </span>
                    <p className="text-zinc-300 text-xs leading-relaxed">
                      {aiSignal.reasoning}
                    </p>
                  </div>

                  {/* Key Factors */}
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Confluence Metrics:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {aiSignal.factors?.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 rounded bg-zinc-900/30 border border-zinc-850 text-zinc-300 text-[11px]"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* One-Click Execute AI Trade Button */}
                  {aiSignal.action !== 'NEUTRAL' && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          const orderType = aiSignal.action.includes('BUY') ? 'BUY' : 'SELL';
                          onExecuteAITrade(
                            orderType,
                            quickLots,
                            aiSignal.stopLossPips || 20,
                            aiSignal.takeProfitPips || 40,
                            'AI Gemini Quant'
                          );
                          onClose();
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                          aiSignal.action.includes('BUY')
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20'
                            : 'bg-rose-500 hover:bg-rose-400 text-zinc-950 shadow-rose-500/20'
                        }`}
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        <span>
                          Deploy AI {aiSignal.action.includes('BUY') ? 'BUY' : 'SELL'} Order ({quickLots} Lots)
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}

          {activeTab === 'STRATEGY_GEN' && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-zinc-400 text-xs">
                  Generate customized algorithmic Expert Advisor rules for your preferred trading profile.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-[11px] block mb-1">Trading Style:</label>
                  <select
                    value={traderStyle}
                    onChange={(e) => setTraderStyle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-xs"
                  >
                    <option value="Scalper">High-Speed Scalper (1M-5M)</option>
                    <option value="Day Trader">Day Trader (15M-1H)</option>
                    <option value="Swing Trader">Swing Momentum (4H-1D)</option>
                    <option value="Grid Trader">Grid Volatility DCA</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 text-[11px] block mb-1">Risk Appetite:</label>
                  <select
                    value={riskPreference}
                    onChange={(e) => setRiskPreference(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-xs"
                  >
                    <option value="Conservative">Conservative (Low Drawdown, 1:2 RR)</option>
                    <option value="Moderate">Moderate (Balanced Trend Following)</option>
                    <option value="Aggressive">Aggressive (Fast Profits, Tighter Stops)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateCustomStrategy}
                disabled={isGeneratingStrategy}
                className="py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition"
              >
                {isGeneratingStrategy ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Designing Algorithmic Rules...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Custom Robot Strategy</span>
                  </>
                )}
              </button>

              {customStrategyResult && (
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-bold text-white text-sm">
                      {customStrategyResult.strategyName}
                    </span>
                    <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">
                      Timeframe: {customStrategyResult.timeframe}
                    </span>
                  </div>

                  <p className="text-zinc-300 text-xs">
                    {customStrategyResult.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">Lot Size:</span>
                      <span className="text-white font-bold">{customStrategyResult.lotSize}</span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">Stop Loss:</span>
                      <span className="text-rose-400 font-bold">{customStrategyResult.stopLossPips} pips</span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">Take Profit:</span>
                      <span className="text-emerald-400 font-bold">{customStrategyResult.takeProfitPips} pips</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-400 font-bold text-[11px] block mb-1">
                      Generated Execution Rules:
                    </span>
                    <ul className="space-y-1">
                      {customStrategyResult.rules?.map((rule: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5 text-zinc-300 text-[11px]">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
