import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AccountSummary,
  BotConfig,
  BotLog,
  Candle,
  CurrencyPair,
  CustomVisualStrategy,
  DispatchedEmail,
  EmailNotificationConfig,
  EquityPoint,
  OrderType,
  Position,
  StrategyType,
  Timeframe,
} from './types';
import {
  INITIAL_PAIRS,
  calculatePositionPnL,
  calculateRequiredMargin,
  calculateSmartLotSize,
  enrichCandlesWithIndicators,
  formatPrice,
  generateInitialCandles,
  getPipValue,
} from './utils/forexMath';
import { evaluateStrategySignal, BOT_STRATEGIES } from './utils/strategies';
import { PRESET_STRATEGY_TEMPLATES } from './utils/visualStrategyEngine';
import {
  createLargeLossEmail,
  createMarginCallEmail,
  createPanicStopEmail,
  createStrategySwitchEmail,
  DEFAULT_EMAIL_NOTIFICATION_CONFIG,
} from './utils/notificationEngine';
import { Navbar } from './components/Navbar';
import { AccountMetrics } from './components/AccountMetrics';
import { PairSelector } from './components/PairSelector';
import { TradingChart } from './components/TradingChart';
import { BotControlPanel } from './components/BotControlPanel';
import { ActivePositionsTable } from './components/ActivePositionsTable';
import { ClosedTradesHistory } from './components/ClosedTradesHistory';
import { BotTelemetryLogs } from './components/BotTelemetryLogs';
import { AISignalModal } from './components/AISignalModal';
import { BacktesterModal } from './components/BacktesterModal';
import { VisualStrategyBuilderModal } from './components/VisualStrategyBuilderModal';
import { SettingsModal } from './components/SettingsModal';
import { MarketCorrelationHeatmap } from './components/MarketCorrelationHeatmap';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Mail, Bell, X, Eye, Activity, ShieldCheck } from 'lucide-react';

// Audio Synthesizer for Forex execution alerts
function playSound(type: 'ORDER_OPEN' | 'WIN' | 'LOSS' | 'ALERT') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'ALERT') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.08); // D6
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'ORDER_OPEN') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'WIN') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(349.23, now); // F4
      osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.18); // C4
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {
    // AudioContext blocked or not supported
  }
}

let ticketSequence = 849201;

export default function App() {
  // Pairs state
  const [pairs, setPairs] = useState<CurrencyPair[]>(INITIAL_PAIRS);
  const [selectedPair, setSelectedPair] = useState<CurrencyPair>(INITIAL_PAIRS[0]);

  // Historical Candles map for each pair
  const [allCandles, setAllCandles] = useState<Record<string, Candle[]>>(() => {
    const map: Record<string, Candle[]> = {};
    INITIAL_PAIRS.forEach((p) => {
      map[p.symbol] = generateInitialCandles(p, 65);
    });
    return map;
  });

  // Timeframe
  const [timeframe, setTimeframe] = useState<Timeframe>('5M');

  // Active Positions & Closed History
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  const [closedPositions, setClosedPositions] = useState<Position[]>([
    {
      id: 'closed-10821',
      ticket: 10821,
      pairSymbol: 'EUR/USD',
      type: 'BUY',
      lots: 0.1,
      openPrice: 1.08420,
      currentPrice: 1.08560,
      closePrice: 1.08560,
      stopLoss: 1.08220,
      takeProfit: 1.08560,
      trailingStopPips: 5,
      pnlDollar: 14.00,
      pnlPips: 14.0,
      openTime: Date.now() - 3600000 * 2,
      closeTime: Date.now() - 3600000 * 1.5,
      closeReason: 'TAKE_PROFIT',
      strategyName: 'Copy Scalper Robot (HFT Prop)',
    },
    {
      id: 'closed-10822',
      ticket: 10822,
      pairSymbol: 'GBP/USD',
      type: 'SELL',
      lots: 0.1,
      openPrice: 1.29650,
      currentPrice: 1.29460,
      closePrice: 1.29460,
      stopLoss: 1.29850,
      takeProfit: 1.29350,
      trailingStopPips: 6,
      pnlDollar: 19.00,
      pnlPips: 19.0,
      openTime: Date.now() - 3600000,
      closeTime: Date.now() - 1800000,
      closeReason: 'TRAILING_STOP',
      strategyName: 'Forex Scalper Pro (Micro-Pip)',
    },
  ]);

  // Account State
  const initialBalance = 10000;
  const [account, setAccount] = useState<AccountSummary>({
    balance: 10033,
    equity: 10033,
    margin: 0,
    freeMargin: 10033,
    marginLevelPercent: 9999,
    initialBalance,
    dailyStartBalance: initialBalance,
    realizedPnL: 33,
    unrealizedPnL: 0,
    winRatePercent: 100,
    totalTrades: 2,
    winningTrades: 2,
    losingTrades: 0,
    profitFactor: 33,
    maxDrawdownPercent: 0,
  });

  // Equity Curve History for Performance Tracking
  const [equityHistory, setEquityHistory] = useState<EquityPoint[]>(() => {
    const now = Date.now();
    const list: EquityPoint[] = [];
    const count = 25;
    for (let i = count; i >= 0; i--) {
      const t = now - i * 3000;
      const d = new Date(t);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      list.push({
        time: t,
        timeStr,
        equity: 10000,
        balance: 10000,
      });
    }
    return list;
  });

  // Bot Configuration (Enabled by default so user sees live trading actions)
  const [config, setConfig] = useState<BotConfig>({
    isRunning: true,
    activeStrategyId: 'EMA_CROSS',
    activePairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD'],
    executionIntervalMs: 1200,
    simulationSpeed: 1,
    lotSizeType: 'FIXED',
    fixedLotSize: 0.1,
    riskPercent: 1.5,
    leverage: 100,
    stopLossPips: 20,
    takeProfitPips: 38,
    trailingStopEnabled: true,
    trailingStopPips: 10,
    smartRiskEnabled: true,
    maxOpenTrades: 4,
    maxDailyDrawdownPercent: 5,
    soundAlerts: true,
    globalCurrency: 'USD',
  });

  // Quick Lots for manual orders
  const [quickLots, setQuickLots] = useState<number>(0.1);

  // Bot Telemetry Logs
  const [logs, setLogs] = useState<BotLog[]>([
    {
      id: 'init-1',
      timestamp: Date.now() - 5000,
      level: 'INFO',
      pairSymbol: 'SYSTEM',
      message: 'Mthika Robot initialized. Neural quant engine online.',
    },
    {
      id: 'init-2',
      timestamp: Date.now() - 2000,
      level: 'SIGNAL',
      pairSymbol: 'EUR/USD',
      message: 'EMA 9/21 Trend momentum engine scanning active chart candles.',
    },
  ]);

  const addLog = useCallback((level: BotLog['level'], pairSymbol: string, message: string, details?: string) => {
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        level,
        pairSymbol,
        message,
        details,
      },
      ...prev.slice(0, 150),
    ]);
  }, []);

  // Account Mode & Modals
  const [accountMode, setAccountMode] = useState<'DEMO' | 'MT5_BRIDGE'>('DEMO');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isBacktestModalOpen, setIsBacktestModalOpen] = useState(false);
  const [isStrategyBuilderOpen, setIsStrategyBuilderOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<'POSITIONS' | 'HISTORY' | 'LOGS' | 'CORRELATIONS'>('POSITIONS');

  // Email Notification & Alert State (persisted to localStorage)
  const [notificationConfig, setNotificationConfig] = useState<EmailNotificationConfig>(() => {
    try {
      const saved = localStorage.getItem('forex_email_notification_config');
      if (saved) {
        return { ...DEFAULT_EMAIL_NOTIFICATION_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_EMAIL_NOTIFICATION_CONFIG;
  });

  const [dispatchedEmails, setDispatchedEmails] = useState<DispatchedEmail[]>(() => {
    try {
      const saved = localStorage.getItem('forex_dispatched_emails');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [toastEmail, setToastEmail] = useState<DispatchedEmail | null>(null);
  const lastMarginAlertTimeRef = useRef<number>(0);
  const prevStrategyIdRef = useRef<StrategyType>(config.activeStrategyId);

  const handleUpdateNotificationConfig = useCallback((newConfig: EmailNotificationConfig) => {
    setNotificationConfig(newConfig);
    try {
      localStorage.setItem('forex_email_notification_config', JSON.stringify(newConfig));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const dispatchEmail = useCallback(
    (email: DispatchedEmail) => {
      setDispatchedEmails((prev) => {
        const updated = [email, ...prev.slice(0, 99)];
        try {
          localStorage.setItem('forex_dispatched_emails', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      });

      setToastEmail(email);
      if (config.soundAlerts) {
        playSound('ALERT');
      }

      addLog(
        email.severity === 'CRITICAL' ? 'RISK_HALT' : 'INFO',
        email.meta?.pairSymbol || 'EMAIL',
        `📧 [DISPATCH TO ${email.recipient}]: ${email.subject}`,
        email.summary
      );
    },
    [config.soundAlerts, addLog]
  );

  // Auto-dismiss toast email alert
  useEffect(() => {
    if (!toastEmail) return;
    const t = setTimeout(() => {
      setToastEmail(null);
    }, 7000);
    return () => clearTimeout(t);
  }, [toastEmail]);

  // Custom Visual Strategy state (defaulting to preset: RSI < 30 AND EMA 50 > EMA 200)
  const [customStrategy, setCustomStrategy] = useState<CustomVisualStrategy>(() => {
    try {
      const saved = localStorage.getItem('forex_custom_visual_strategy');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return PRESET_STRATEGY_TEMPLATES[0];
  });

  // Track Strategy Switches for automated email alerts
  useEffect(() => {
    if (prevStrategyIdRef.current !== config.activeStrategyId) {
      const prevStrat =
        BOT_STRATEGIES.find((s) => s.id === prevStrategyIdRef.current)?.name ||
        prevStrategyIdRef.current;
      const newStrat =
        config.activeStrategyId === 'CUSTOM_BUILDER'
          ? customStrategy?.name || 'Custom Visual Strategy'
          : BOT_STRATEGIES.find((s) => s.id === config.activeStrategyId)?.name ||
            config.activeStrategyId;

      if (notificationConfig.enabled && notificationConfig.notifyOnStrategySwitch) {
        const switchEmail = createStrategySwitchEmail(
          notificationConfig.recipientEmail,
          prevStrat,
          newStrat,
          `Active strategy updated from "${prevStrat}" to "${newStrat}". Live confluence logic now following new rules.`
        );
        dispatchEmail(switchEmail);
      }
      prevStrategyIdRef.current = config.activeStrategyId;
    }
  }, [config.activeStrategyId, customStrategy, notificationConfig, dispatchEmail]);

  // Ref to track peak equity for drawdown
  const peakEquityRef = useRef<number>(initialBalance);
  const tickCounterRef = useRef<number>(0);

  // Helper to open a new position
  const openOrder = useCallback(
    (
      pairSymbol: string,
      type: OrderType,
      lots: number,
      slPips?: number,
      tpPips?: number,
      strategyName: string = 'Manual Execution'
    ) => {
      const pair = pairs.find((p) => p.symbol === pairSymbol);
      if (!pair) return;

      const pipSize = getPipValue(pair.symbol);
      const executionPrice = type === 'BUY' ? pair.currentAsk : pair.currentBid;
      const effectiveSLPips = slPips ?? config.stopLossPips;
      const effectiveTPPips = tpPips ?? config.takeProfitPips;

      const stopLoss =
        effectiveSLPips > 0
          ? type === 'BUY'
            ? executionPrice - effectiveSLPips * pipSize
            : executionPrice + effectiveSLPips * pipSize
          : null;

      const takeProfit =
        effectiveTPPips > 0
          ? type === 'BUY'
            ? executionPrice + effectiveTPPips * pipSize
            : executionPrice - effectiveTPPips * pipSize
          : null;

      const reqMargin = calculateRequiredMargin(lots, executionPrice, config.leverage, pair.symbol);

      if (account.freeMargin < reqMargin) {
        addLog('RISK_HALT', pair.symbol, `Order rejected: Insufficient Free Margin ($${account.freeMargin.toFixed(2)} vs required $${reqMargin.toFixed(2)})`);
        return;
      }

      ticketSequence += 1;
      const newPos: Position = {
        id: `pos-${ticketSequence}`,
        ticket: ticketSequence,
        pairSymbol: pair.symbol,
        type,
        lots,
        openPrice: executionPrice,
        currentPrice: executionPrice,
        stopLoss: stopLoss ? Number(stopLoss.toFixed(pair.digits)) : null,
        takeProfit: takeProfit ? Number(takeProfit.toFixed(pair.digits)) : null,
        trailingStopPips: config.trailingStopEnabled ? config.trailingStopPips : null,
        peakPrice: executionPrice,
        pnlDollar: 0,
        pnlPips: 0,
        openTime: Date.now(),
        strategyName,
      };

      setOpenPositions((prev) => [newPos, ...prev]);

      // Stamp execution marker on the latest candle
      setAllCandles((prevMap) => {
        const list = prevMap[pair.symbol] || [];
        if (!list.length) return prevMap;
        const last = { ...list[list.length - 1] };
        last.signalMarker = {
          type,
          price: executionPrice,
          label: `${type} #${ticketSequence}`,
        };
        const updated = [...list.slice(0, -1), last];
        return { ...prevMap, [pair.symbol]: updated };
      });

      if (config.soundAlerts) playSound('ORDER_OPEN');
      addLog(
        'ORDER_FILLED',
        pair.symbol,
        `Executed ${type} ${lots} lots @ ${formatPrice(executionPrice, pair.symbol)}`,
        `SL: ${effectiveSLPips}p | TP: ${effectiveTPPips}p | Strategy: ${strategyName}`
      );
    },
    [pairs, config, account.freeMargin, addLog]
  );

  // Close an active position
  const closePosition = useCallback(
    (id: string, reason: Position['closeReason'] = 'MANUAL') => {
      setOpenPositions((prev) => {
        const pos = prev.find((p) => p.id === id);
        if (!pos) return prev;

        const pair = pairs.find((p) => p.symbol === pos.pairSymbol);
        const exitPrice = pos.type === 'BUY' ? (pair?.currentBid ?? pos.currentPrice) : (pair?.currentAsk ?? pos.currentPrice);

        const closedPos: Position = {
          ...pos,
          closePrice: exitPrice,
          closeTime: Date.now(),
          closeReason: reason,
        };

        setClosedPositions((cPrev) => [closedPos, ...cPrev]);

        // Update Account metrics
        setAccount((acc) => {
          const newBalance = Number((acc.balance + pos.pnlDollar).toFixed(2));
          const newRealized = Number((acc.realizedPnL + pos.pnlDollar).toFixed(2));
          const isWin = pos.pnlDollar >= 0;
          const newWins = acc.winningTrades + (isWin ? 1 : 0);
          const newLosses = acc.losingTrades + (isWin ? 0 : 1);
          const newTotal = acc.totalTrades + 1;
          const newWinRate = Number(((newWins / newTotal) * 100).toFixed(1));

          return {
            ...acc,
            balance: newBalance,
            realizedPnL: newRealized,
            totalTrades: newTotal,
            winningTrades: newWins,
            losingTrades: newLosses,
            winRatePercent: newWinRate,
          };
        });

        if (config.soundAlerts) {
          if (pos.pnlDollar >= 0) playSound('WIN');
          else playSound('LOSS');
        }

        addLog(
          'POSITION_CLOSED',
          pos.pairSymbol,
          `Closed #${pos.ticket} ${pos.type} @ ${formatPrice(exitPrice, pos.pairSymbol)} [PnL: ${pos.pnlDollar >= 0 ? '+' : ''}$${pos.pnlDollar.toFixed(2)}]`,
          `Reason: ${reason}`
        );

        // Check for Large Loss notification trigger
        if (
          notificationConfig.enabled &&
          notificationConfig.notifyOnLargeLoss &&
          pos.pnlDollar <= -Math.abs(notificationConfig.largeLossThresholdDollar)
        ) {
          const estimatedBalance = Number((account.balance + pos.pnlDollar).toFixed(2));
          const lossEmail = createLargeLossEmail(
            notificationConfig.recipientEmail,
            closedPos,
            estimatedBalance
          );
          dispatchEmail(lossEmail);
        }

        return prev.filter((p) => p.id !== id);
      });
    },
    [pairs, config.soundAlerts, addLog, notificationConfig, dispatchEmail, account.balance]
  );

  // Set Breakeven for an open position
  const setBreakeven = useCallback((id: string) => {
    setOpenPositions((prev) =>
      prev.map((pos) => {
        if (pos.id !== id) return pos;
        addLog('INFO', pos.pairSymbol, `Stop loss adjusted to breakeven for #${pos.ticket} @ ${pos.openPrice}`);
        return {
          ...pos,
          stopLoss: pos.openPrice,
        };
      })
    );
  }, [addLog]);

  // Bulk close actions
  const handleCloseAll = () => {
    openPositions.forEach((pos) => closePosition(pos.id, 'MANUAL'));
  };

  const handleCloseProfitable = () => {
    openPositions.filter((p) => p.pnlDollar > 0).forEach((pos) => closePosition(pos.id, 'MANUAL'));
  };

  const handleEmergencyStop = () => {
    const activeCount = openPositions.length;
    setConfig((prev) => ({ ...prev, isRunning: false }));
    handleCloseAll();
    addLog('RISK_HALT', 'ALL', 'EMERGENCY PANIC STOP: All trades liquidated and robot halted.');

    if (notificationConfig.enabled && notificationConfig.notifyOnPanicStop) {
      const panicEmail = createPanicStopEmail(
        notificationConfig.recipientEmail,
        'Manual Emergency Panic Button Triggered',
        activeCount,
        account.balance
      );
      dispatchEmail(panicEmail);
    }
  };

  const handleResetAccount = () => {
    setOpenPositions([]);
    setClosedPositions([]);
    setAccount({
      balance: initialBalance,
      equity: initialBalance,
      margin: 0,
      freeMargin: initialBalance,
      marginLevelPercent: 9999,
      initialBalance,
      dailyStartBalance: initialBalance,
      realizedPnL: 0,
      unrealizedPnL: 0,
      winRatePercent: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      profitFactor: 0,
      maxDrawdownPercent: 0,
    });
    peakEquityRef.current = initialBalance;
    const resetTime = Date.now();
    setEquityHistory([
      {
        time: resetTime,
        timeStr: new Date(resetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        equity: initialBalance,
        balance: initialBalance,
      },
    ]);
    addLog('INFO', 'SYSTEM', 'Account reset to default $10,000 balance.');
  };

  // Live Tick Simulation & Bot Logic Loop
  useEffect(() => {
    const intervalMs = Math.max(200, 1000 / config.simulationSpeed);

    const timer = setInterval(() => {
      tickCounterRef.current += 1;
      const isNewBar = tickCounterRef.current % 10 === 0;

      // 1. Advance Prices for all currency pairs
      setPairs((prevPairs) => {
        const nextPairs = prevPairs.map((p) => {
          const pip = getPipValue(p.symbol);
          const volatility = p.baseVolatility * (Math.random() * 1.6 + 0.4);
          // Random Brownian fluctuation with slight momentum
          const delta = (Math.random() - 0.495) * volatility;
          const newBid = Math.max(pip * 10, p.currentBid + delta);
          const newAsk = newBid + p.spreadPips * pip;

          const change = newBid - (p.high24h + p.low24h) / 2;
          const changePercent = (change / newBid) * 100;

          return {
            ...p,
            currentBid: Number(newBid.toFixed(p.digits)),
            currentAsk: Number(newAsk.toFixed(p.digits)),
            high24h: Math.max(p.high24h, newBid),
            low24h: Math.min(p.low24h, newBid),
            change24h: Number(change.toFixed(p.digits)),
            changePercent24h: Number(changePercent.toFixed(2)),
          };
        });

        // Also keep selectedPair up to date
        const currentSelected = nextPairs.find((p) => p.symbol === selectedPair.symbol);
        if (currentSelected) {
          setSelectedPair(currentSelected);
        }

        return nextPairs;
      });

      // 2. Update Candle streams
      setAllCandles((prevCandlesMap) => {
        const updatedMap: Record<string, Candle[]> = {};

        pairs.forEach((pair) => {
          const list = prevCandlesMap[pair.symbol] || [];
          if (!list.length) return;

          const currentPrice = pair.currentBid;
          const lastCandle = { ...list[list.length - 1] };

          if (isNewBar) {
            // Finalize previous candle and create a new one
            const newCandle: Candle = {
              time: Date.now(),
              open: currentPrice,
              high: currentPrice,
              low: currentPrice,
              close: currentPrice,
              volume: Math.floor(Math.random() * 200 + 50),
            };
            const updated = [...list.slice(-70), newCandle];
            updatedMap[pair.symbol] = enrichCandlesWithIndicators(updated);
          } else {
            // Update current active candle in place
            lastCandle.high = Math.max(lastCandle.high, currentPrice);
            lastCandle.low = Math.min(lastCandle.low, currentPrice);
            lastCandle.close = currentPrice;
            lastCandle.volume += Math.floor(Math.random() * 15 + 2);

            const updated = [...list.slice(0, -1), lastCandle];
            updatedMap[pair.symbol] = enrichCandlesWithIndicators(updated);
          }
        });

        return updatedMap;
      });

      // 3. Update Open Positions & Check Stop Loss / Take Profit / Trailing Stops
      setOpenPositions((prevPositions) => {
        if (!prevPositions.length) return prevPositions;

        const remaining: Position[] = [];

        prevPositions.forEach((pos) => {
          const pair = pairs.find((p) => p.symbol === pos.pairSymbol);
          if (!pair) {
            remaining.push(pos);
            return;
          }

          const pipSize = getPipValue(pair.symbol);
          const currentPrice = pos.type === 'BUY' ? pair.currentBid : pair.currentAsk;
          const { pnlDollar, pnlPips } = calculatePositionPnL(pos, pair.currentBid, pair.currentAsk, pair.symbol);

          let updatedSL = pos.stopLoss;
          let newPeakPrice = pos.peakPrice ?? pos.openPrice;

          // Trailing stop logic
          if (config.trailingStopEnabled && pos.trailingStopPips) {
            const trailDist = pos.trailingStopPips * pipSize;
            if (pos.type === 'BUY') {
              if (currentPrice > newPeakPrice) {
                newPeakPrice = currentPrice;
                const potentialSL = currentPrice - trailDist;
                if (!updatedSL || potentialSL > updatedSL) {
                  updatedSL = Number(potentialSL.toFixed(pair.digits));
                }
              }
            } else {
              if (currentPrice < newPeakPrice) {
                newPeakPrice = currentPrice;
                const potentialSL = currentPrice + trailDist;
                if (!updatedSL || potentialSL < updatedSL) {
                  updatedSL = Number(potentialSL.toFixed(pair.digits));
                }
              }
            }
          }

          // Check Exit triggers
          let shouldClose = false;
          let closeReason: Position['closeReason'] = 'MANUAL';

          if (pos.type === 'BUY') {
            if (updatedSL && currentPrice <= updatedSL) {
              shouldClose = true;
              closeReason = pnlDollar >= 0 ? 'TRAILING_STOP' : 'STOP_LOSS';
            } else if (pos.takeProfit && currentPrice >= pos.takeProfit) {
              shouldClose = true;
              closeReason = 'TAKE_PROFIT';
            }
          } else {
            if (updatedSL && currentPrice >= updatedSL) {
              shouldClose = true;
              closeReason = pnlDollar >= 0 ? 'TRAILING_STOP' : 'STOP_LOSS';
            } else if (pos.takeProfit && currentPrice <= pos.takeProfit) {
              shouldClose = true;
              closeReason = 'TAKE_PROFIT';
            }
          }

          if (shouldClose) {
            // Close position
            const closedPos: Position = {
              ...pos,
              currentPrice,
              closePrice: currentPrice,
              closeTime: Date.now(),
              closeReason,
              pnlDollar,
              pnlPips,
            };

            setClosedPositions((cPrev) => [closedPos, ...cPrev]);

            setAccount((acc) => {
              const newBal = Number((acc.balance + pnlDollar).toFixed(2));
              const newRealized = Number((acc.realizedPnL + pnlDollar).toFixed(2));
              const isWin = pnlDollar >= 0;
              const newWins = acc.winningTrades + (isWin ? 1 : 0);
              const newLosses = acc.losingTrades + (isWin ? 0 : 1);
              const newTotal = acc.totalTrades + 1;
              const newWinRate = Number(((newWins / newTotal) * 100).toFixed(1));

              return {
                ...acc,
                balance: newBal,
                realizedPnL: newRealized,
                totalTrades: newTotal,
                winningTrades: newWins,
                losingTrades: newLosses,
                winRatePercent: newWinRate,
              };
            });

            if (config.soundAlerts) {
              if (pnlDollar >= 0) playSound('WIN');
              else playSound('LOSS');
            }

            addLog(
              'POSITION_CLOSED',
              pos.pairSymbol,
              `Hit ${closeReason} for #${pos.ticket} @ ${formatPrice(currentPrice, pos.pairSymbol)} [PnL: ${pnlDollar >= 0 ? '+' : ''}$${pnlDollar.toFixed(2)}]`,
              `Trigger: ${closeReason}`
            );

            // Large Loss Check
            if (
              notificationConfig.enabled &&
              notificationConfig.notifyOnLargeLoss &&
              pnlDollar <= -Math.abs(notificationConfig.largeLossThresholdDollar)
            ) {
              const estimatedBal = Number((account.balance + pnlDollar).toFixed(2));
              const lossEmail = createLargeLossEmail(
                notificationConfig.recipientEmail,
                closedPos,
                estimatedBal
              );
              dispatchEmail(lossEmail);
            }
          } else {
            remaining.push({
              ...pos,
              currentPrice,
              pnlDollar,
              pnlPips,
              stopLoss: updatedSL,
              peakPrice: newPeakPrice,
            });
          }
        });

        return remaining;
      });

      // 4. Update Margin & Equity
      setAccount((acc) => {
        const unrealized = openPositions.reduce((sum, p) => sum + p.pnlDollar, 0);
        const equity = Number((acc.balance + unrealized).toFixed(2));

        let totalMargin = 0;
        openPositions.forEach((pos) => {
          const pair = pairs.find((p) => p.symbol === pos.pairSymbol);
          if (pair) {
            totalMargin += calculateRequiredMargin(pos.lots, pos.currentPrice, config.leverage, pair.symbol);
          }
        });

        const freeMargin = Math.max(0, equity - totalMargin);
        const marginLevel = totalMargin > 0 ? (equity / totalMargin) * 100 : 9999;

        // Margin Call Email Trigger
        if (
          notificationConfig.enabled &&
          notificationConfig.notifyOnMarginCall &&
          totalMargin > 0 &&
          marginLevel <= notificationConfig.marginCallThresholdPercent
        ) {
          const now = Date.now();
          if (now - lastMarginAlertTimeRef.current > 300000) {
            lastMarginAlertTimeRef.current = now;
            const marginEmail = createMarginCallEmail(
              notificationConfig.recipientEmail,
              Math.round(marginLevel),
              equity,
              totalMargin,
              freeMargin
            );
            dispatchEmail(marginEmail);
          }
        }

        if (equity > peakEquityRef.current) {
          peakEquityRef.current = equity;
        }
        const currentDrawdown = ((peakEquityRef.current - equity) / peakEquityRef.current) * 100;
        const maxDd = Math.max(acc.maxDrawdownPercent, currentDrawdown);

        // Daily Drawdown Protection Halt Check
        const dailyDd = ((acc.dailyStartBalance - equity) / acc.dailyStartBalance) * 100;
        if (config.isRunning && dailyDd >= config.maxDailyDrawdownPercent) {
          setConfig((prev) => ({ ...prev, isRunning: false }));
          addLog(
            'RISK_HALT',
            'RISK_GUARD',
            `Daily Max Drawdown reached (${dailyDd.toFixed(1)}% >= ${config.maxDailyDrawdownPercent}%). Auto-trading halted for safety.`
          );

          if (notificationConfig.enabled && notificationConfig.notifyOnPanicStop) {
            const haltEmail = createPanicStopEmail(
              notificationConfig.recipientEmail,
              `Daily Max Drawdown Limit Reached (${dailyDd.toFixed(1)}% >= ${config.maxDailyDrawdownPercent}%)`,
              openPositions.length,
              acc.balance
            );
            dispatchEmail(haltEmail);
          }
        }

        // Record equity point for performance trend curve
        setEquityHistory((prev) => {
          const now = Date.now();
          const timeStr = new Date(now).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          return [...prev.slice(-99), {
            time: now,
            timeStr,
            equity,
            balance: acc.balance,
          }];
        });

        return {
          ...acc,
          equity,
          unrealizedPnL: Number(unrealized.toFixed(2)),
          margin: Number(totalMargin.toFixed(2)),
          freeMargin: Number(freeMargin.toFixed(2)),
          marginLevelPercent: Number(marginLevel.toFixed(0)),
          maxDrawdownPercent: Number(maxDd.toFixed(1)),
        };
      });

      // 5. Automated Strategy Signal Evaluation & Execution
      if (config.isRunning && openPositions.length < config.maxOpenTrades) {
        // Evaluate enabled pairs
        config.activePairs.forEach((pairSymbol) => {
          const pair = pairs.find((p) => p.symbol === pairSymbol);
          const candles = allCandles[pairSymbol];
          if (!pair || !candles || candles.length < 5) return;

          // Check if we already have an open position for this pair
          const hasOpenPosForPair = openPositions.some((p) => p.pairSymbol === pairSymbol);
          if (hasOpenPosForPair) return;

          const evaluation = evaluateStrategySignal(
            config.activeStrategyId,
            candles,
            pairSymbol,
            customStrategy
          );

          if (evaluation.signal && evaluation.confidence >= 75) {
            addLog(
              'SIGNAL',
              pairSymbol,
              `Strategy ${config.activeStrategyId === 'CUSTOM_BUILDER' ? customStrategy.name : config.activeStrategyId} triggered ${evaluation.signal} (Confidence ${evaluation.confidence}%)`,
              evaluation.reason
            );

            // Smart Risk dynamic sizing based on current drawdown to preserve margin
            const liveDrawdown = peakEquityRef.current > 0
              ? Math.max(0, ((peakEquityRef.current - account.equity) / peakEquityRef.current) * 100)
              : 0;

            const smartRisk = calculateSmartLotSize(
              config.fixedLotSize,
              liveDrawdown,
              config.smartRiskEnabled
            );

            if (config.smartRiskEnabled && smartRisk.reductionPercent > 0) {
              addLog(
                'INFO',
                pairSymbol,
                `[SMART RISK] Dynamically scaled position to ${smartRisk.effectiveLot} lots (-${smartRisk.reductionPercent}%)`,
                `Drawdown: ${liveDrawdown.toFixed(1)}% | ${smartRisk.riskTier} | Margin conserved`
              );
            }

            // Strategy display tag
            const strategyDisplayLabel =
              config.activeStrategyId === 'CUSTOM_BUILDER'
                ? `Custom: ${customStrategy.name}`
                : config.activeStrategyId;

            // Execute automated order with smart dynamic lot size
            openOrder(
              pairSymbol,
              evaluation.signal,
              smartRisk.effectiveLot,
              config.stopLossPips,
              config.takeProfitPips,
              config.smartRiskEnabled && smartRisk.reductionPercent > 0
                ? `${strategyDisplayLabel} [Smart Risk -${smartRisk.reductionPercent}%]`
                : strategyDisplayLabel
            );
          }
        });
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [
    config,
    pairs,
    allCandles,
    openPositions,
    account.equity,
    selectedPair.symbol,
    openOrder,
    closePosition,
    addLog,
  ]);

  // Current peak-to-trough account drawdown
  const currentDrawdown = peakEquityRef.current > 0
    ? Math.max(0, ((peakEquityRef.current - account.equity) / peakEquityRef.current) * 100)
    : 0;

  // Open position counts by pair
  const openPositionsByPair = openPositions.reduce((acc, pos) => {
    acc[pos.pairSymbol] = (acc[pos.pairSymbol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* PWA Offline Network Toast Indicator */}
      <OfflineIndicator />

      {/* Top Navbar */}
      <Navbar
        config={config}
        onUpdateConfig={setConfig}
        onOpenAIModal={() => setIsAIModalOpen(true)}
        onOpenBacktestModal={() => setIsBacktestModalOpen(true)}
        onOpenStrategyBuilder={() => setIsStrategyBuilderOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenCorrelationHeatmap={() => {
          setBottomTab('CORRELATIONS');
          setTimeout(() => {
            document.getElementById('market-correlation-heatmap')?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
        onEmergencyStop={handleEmergencyStop}
        onResetAccount={handleResetAccount}
        accountMode={accountMode}
        onToggleAccountMode={() =>
          setAccountMode((prev) => (prev === 'DEMO' ? 'MT5_BRIDGE' : 'DEMO'))
        }
      />

      {/* Account Balance & Margin Ribbon with Recharts Equity Curve */}
      <AccountMetrics
        metrics={account}
        openPositionsCount={openPositions.length}
        equityHistory={equityHistory}
      />

      {/* Currency Pair Selector */}
      <PairSelector
        pairs={pairs}
        selectedPair={selectedPair}
        onSelectPair={setSelectedPair}
        activePairsInBot={config.activePairs}
        onTogglePairInBot={(symbol) => {
          setConfig((prev) => {
            const exists = prev.activePairs.includes(symbol);
            return {
              ...prev,
              activePairs: exists
                ? prev.activePairs.filter((s) => s !== symbol)
                : [...prev.activePairs, symbol],
            };
          });
        }}
        openPositionsByPair={openPositionsByPair}
      />

      {/* Main Terminal Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 flex flex-col gap-4">
        {/* Top Split: Live Chart + Bot Strategy Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Interactive Chart (7 cols) */}
          <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col">
            <TradingChart
              pair={selectedPair}
              candles={allCandles[selectedPair.symbol] || []}
              timeframe={timeframe}
              onChangeTimeframe={setTimeframe}
              openPositions={openPositions}
              onManualOrder={(type, lots) =>
                openOrder(selectedPair.symbol, type, lots, config.stopLossPips, config.takeProfitPips, 'Manual Order')
              }
              quickLots={quickLots}
              onChangeQuickLots={setQuickLots}
            />
          </div>

          {/* Bot Strategy & Risk Center (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <BotControlPanel
              config={config}
              onUpdateConfig={setConfig}
              currentDrawdownPercent={currentDrawdown}
              onOpenStrategyBuilder={() => setIsStrategyBuilderOpen(true)}
              notificationConfig={notificationConfig}
              onUpdateNotificationConfig={handleUpdateNotificationConfig}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              botStatusText={
                config.isRunning
                  ? openPositions.length > 0
                    ? `IN TRADE (${openPositions.length})`
                    : 'ARMED & SCANNING'
                  : 'ROBOT PAUSED'
              }
            />
          </div>
        </div>

        {/* Bottom Workspace: Tabbed View (Open Positions, History, Live Telemetry) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-1 text-xs">
            <button
              onClick={() => setBottomTab('POSITIONS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                bottomTab === 'POSITIONS'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Active Positions</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400">
                {openPositions.length}
              </span>
            </button>

            <button
              onClick={() => setBottomTab('HISTORY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                bottomTab === 'HISTORY'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Trade History</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-400">
                {closedPositions.length}
              </span>
            </button>

            <button
              id="tab-correlations"
              onClick={() => setBottomTab('CORRELATIONS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                bottomTab === 'CORRELATIONS'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Correlation Heatmap</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Hedging Matrix
              </span>
            </button>

            <button
              onClick={() => setBottomTab('LOGS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                bottomTab === 'LOGS'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Execution Telemetry</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          </div>

          {bottomTab === 'POSITIONS' && (
            <ActivePositionsTable
              positions={openPositions}
              onClosePosition={(id) => closePosition(id, 'MANUAL')}
              onSetBreakeven={setBreakeven}
              onCloseAll={handleCloseAll}
              onCloseProfitable={handleCloseProfitable}
            />
          )}

          {bottomTab === 'HISTORY' && (
            <ClosedTradesHistory closedPositions={closedPositions} />
          )}

          {bottomTab === 'CORRELATIONS' && (
            <MarketCorrelationHeatmap
              pairs={pairs}
              allCandles={allCandles}
              activePairsInBot={config.activePairs}
              openPositions={openPositions}
              defaultLotSize={config.fixedLotSize}
              onExecuteHedgeOrder={(pairSymbol, type, lots, reason) => {
                openOrder(
                  pairSymbol,
                  type,
                  lots,
                  config.stopLossPips,
                  config.takeProfitPips,
                  reason
                );
              }}
            />
          )}

          {bottomTab === 'LOGS' && (
            <BotTelemetryLogs logs={logs} onClearLogs={() => setLogs([])} />
          )}
        </div>
      </main>

      {/* AI Signal Modal */}
      <AISignalModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        pair={selectedPair}
        candles={allCandles[selectedPair.symbol] || []}
        onExecuteAITrade={(type, lots, sl, tp, strat) =>
          openOrder(selectedPair.symbol, type, lots, sl, tp, strat)
        }
        quickLots={quickLots}
      />

      {/* Backtester Modal */}
      <BacktesterModal
        isOpen={isBacktestModalOpen}
        onClose={() => setIsBacktestModalOpen(false)}
        pairs={pairs}
        allCandles={allCandles}
        currentStrategyId={config.activeStrategyId}
        customStrategy={customStrategy}
      />

      {/* Visual Strategy Builder Modal */}
      <VisualStrategyBuilderModal
        isOpen={isStrategyBuilderOpen}
        onClose={() => setIsStrategyBuilderOpen(false)}
        activeStrategy={customStrategy}
        onSaveStrategy={(savedStrat) => {
          setCustomStrategy(savedStrat);
          try {
            localStorage.setItem('forex_custom_visual_strategy', JSON.stringify(savedStrat));
          } catch (e) {
            console.error(e);
          }
          addLog(
            'INFO',
            'SYSTEM',
            `Visual Strategy "${savedStrat.name}" compiled and saved (${savedStrat.buyRules.conditions.length} BUY rules, ${savedStrat.sellRules.conditions.length} SELL rules).`
          );
        }}
        onDeployToBot={(stratToDeploy) => {
          setCustomStrategy(stratToDeploy);
          try {
            localStorage.setItem('forex_custom_visual_strategy', JSON.stringify(stratToDeploy));
          } catch (e) {
            console.error(e);
          }
          setConfig((prev) => ({
            ...prev,
            activeStrategyId: 'CUSTOM_BUILDER',
            stopLossPips: stratToDeploy.defaultStopLossPips || prev.stopLossPips,
            takeProfitPips: stratToDeploy.defaultTakeProfitPips || prev.takeProfitPips,
          }));
          addLog(
            'SIGNAL',
            'SYSTEM',
            `[STRATEGY DEPLOYED] Visual Strategy "${stratToDeploy.name}" is now the active bot execution engine!`,
            `Rules: ${stratToDeploy.buyRules.conditions.length} Buy / ${stratToDeploy.sellRules.conditions.length} Sell`
          );
        }}
        activePair={selectedPair}
        candles={allCandles[selectedPair.symbol] || []}
      />

      {/* Terminal Settings & Email Notifications Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        onUpdateConfig={setConfig}
        notificationConfig={notificationConfig}
        onUpdateNotificationConfig={handleUpdateNotificationConfig}
        dispatchedEmails={dispatchedEmails}
        onDispatchEmail={dispatchEmail}
        onClearDispatchedEmails={() => {
          setDispatchedEmails([]);
          try {
            localStorage.removeItem('forex_dispatched_emails');
          } catch (e) {
            console.error(e);
          }
        }}
      />

      {/* Real-time Email Dispatch Toast Banner */}
      {toastEmail && (
        <div
          id="email-dispatch-toast"
          className="fixed bottom-4 right-4 z-50 max-w-md w-full bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl p-4 animate-slideIn flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`p-1.5 rounded-lg ${
                  toastEmail.event === 'MARGIN_CALL'
                    ? 'bg-rose-500/20 text-rose-400'
                    : toastEmail.event === 'LARGE_LOSS'
                    ? 'bg-amber-500/20 text-amber-400'
                    : toastEmail.event === 'STRATEGY_SWITCH'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                <Mail className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-white block">Email Dispatch Sent</span>
                <span className="text-[10px] text-zinc-400 font-mono">To: {toastEmail.recipient}</span>
              </div>
            </div>
            <button
              onClick={() => setToastEmail(null)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-xs text-zinc-200 font-semibold truncate">{toastEmail.subject}</div>
          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{toastEmail.summary}</p>

          <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[10px]">
            <span className="text-zinc-500">Instantaneous Delivery</span>
            <button
              onClick={() => {
                setToastEmail(null);
                setIsSettingsModalOpen(true);
              }}
              className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <Eye className="w-3 h-3" />
              <span>Inspect in Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
