import React, { useState, useMemo, useEffect } from 'react';
import {
  Candle,
  ComparisonOperator,
  CurrencyPair,
  CustomVisualStrategy,
  IndicatorSource,
  RightOperandType,
  Timeframe,
  VisualCondition,
  StrategyValidationResult,
} from '../types';
import {
  TOOLBOX_TEMPLATES,
  PRESET_STRATEGY_TEMPLATES,
  formatConditionString,
  formatIndicatorLabel,
  formatOperatorLabel,
  getIndicatorValue,
  evaluateCondition,
  evaluateRuleGroup,
  ToolboxConditionTemplate,
} from '../utils/visualStrategyEngine';
import { run100CandleStrategyAutoValidation } from '../utils/strategyAutoValidator';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  Sparkles,
  Play,
  RotateCcw,
  Zap,
  Layers,
  ArrowRight,
  GripVertical,
  Activity,
  Code2,
  TrendingUp,
  TrendingDown,
  Info,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface VisualStrategyBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStrategy?: CustomVisualStrategy;
  activeStrategy?: CustomVisualStrategy;
  onSaveStrategy: (
    strategy: CustomVisualStrategy,
    deployImmediately: boolean,
    validation?: StrategyValidationResult
  ) => void;
  onDeployToBot?: (
    strategy: CustomVisualStrategy,
    validation?: StrategyValidationResult
  ) => void;
  activePair: CurrencyPair;
  candles: Candle[];
}

export const VisualStrategyBuilderModal: React.FC<VisualStrategyBuilderModalProps> = ({
  isOpen,
  onClose,
  currentStrategy,
  activeStrategy,
  onSaveStrategy,
  onDeployToBot,
  activePair,
  candles,
}) => {
  const initialStrat = currentStrategy || activeStrategy || PRESET_STRATEGY_TEMPLATES[0];
  const [strategy, setStrategy] = useState<CustomVisualStrategy>(initialStrat);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isOverBuy, setIsOverBuy] = useState(false);
  const [isOverSell, setIsOverSell] = useState(false);
  const [showCustomConditionModal, setShowCustomConditionModal] = useState(false);
  const [customTargetGroup, setCustomTargetGroup] = useState<'BUY' | 'SELL'>('BUY');

  // Custom condition form state
  const [newLeft, setNewLeft] = useState<IndicatorSource>('RSI');
  const [newOp, setNewOp] = useState<ComparisonOperator>('<');
  const [newRightType, setNewRightType] = useState<RightOperandType>('VALUE');
  const [newRightVal, setNewRightVal] = useState<number>(30);
  const [newRightInd, setNewRightInd] = useState<IndicatorSource>('EMA_200');

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const active = currentStrategy || activeStrategy;
      if (active) {
        setStrategy(active);
      }
    }
  }, [isOpen, currentStrategy, activeStrategy]);

  // Live 100-candle auto-validation preview
  const liveValidation = useMemo(() => {
    return run100CandleStrategyAutoValidation(strategy, candles, {
      pair: activePair,
      stopLossPips: strategy.defaultStopLossPips,
      takeProfitPips: strategy.defaultTakeProfitPips,
      trailingStopPips: strategy.defaultTrailingStopPips,
    });
  }, [strategy, candles, activePair]);

  const handleDeployToRobot = () => {
    const valResult = run100CandleStrategyAutoValidation(strategy, candles, {
      pair: activePair,
      stopLossPips: strategy.defaultStopLossPips,
      takeProfitPips: strategy.defaultTakeProfitPips,
      trailingStopPips: strategy.defaultTrailingStopPips,
    });
    onSaveStrategy(strategy, true, valResult);
    if (onDeployToBot) {
      onDeployToBot(strategy, valResult);
    }
    onClose();
  };

  const handleSaveStrategy = () => {
    const valResult = run100CandleStrategyAutoValidation(strategy, candles, {
      pair: activePair,
      stopLossPips: strategy.defaultStopLossPips,
      takeProfitPips: strategy.defaultTakeProfitPips,
      trailingStopPips: strategy.defaultTrailingStopPips,
    });
    onSaveStrategy(strategy, false, valResult);
    showToast('Strategy & 100-candle audit saved');
  };

  if (!isOpen) return null;

  const currentCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2400);
  };

  // Drag start from toolbox
  const handleDragStartToolbox = (e: React.DragEvent, item: ToolboxConditionTemplate) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        source: 'TOOLBOX',
        template: item,
      })
    );
  };

  // Drag start from existing condition in rules
  const handleDragStartExisting = (
    e: React.DragEvent,
    fromGroup: 'BUY' | 'SELL',
    conditionId: string
  ) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        source: 'EXISTING',
        fromGroup,
        conditionId,
      })
    );
  };

  // Drop handler for BUY / SELL zones
  const handleDrop = (e: React.DragEvent, targetGroup: 'BUY' | 'SELL') => {
    e.preventDefault();
    setIsOverBuy(false);
    setIsOverSell(false);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      if (data.source === 'TOOLBOX') {
        const t = data.template as ToolboxConditionTemplate;
        const newCondition: VisualCondition = {
          id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          leftIndicator: t.leftIndicator,
          operator: t.operator,
          rightType: t.rightType,
          rightValue: t.rightValue,
          rightIndicator: t.rightIndicator,
          label: t.badge,
        };

        setStrategy((prev) => ({
          ...prev,
          buyRules:
            targetGroup === 'BUY'
              ? { ...prev.buyRules, conditions: [...prev.buyRules.conditions, newCondition] }
              : prev.buyRules,
          sellRules:
            targetGroup === 'SELL'
              ? { ...prev.sellRules, conditions: [...prev.sellRules.conditions, newCondition] }
              : prev.sellRules,
        }));
        showToast(`Added ${t.badge} to ${targetGroup} rules`);
      } else if (data.source === 'EXISTING') {
        const { fromGroup, conditionId } = data;
        if (fromGroup === targetGroup) return; // already in this group

        // Move from one group to the other
        const conditionToMove =
          fromGroup === 'BUY'
            ? strategy.buyRules.conditions.find((c) => c.id === conditionId)
            : strategy.sellRules.conditions.find((c) => c.id === conditionId);

        if (!conditionToMove) return;

        setStrategy((prev) => ({
          ...prev,
          buyRules: {
            ...prev.buyRules,
            conditions:
              fromGroup === 'BUY'
                ? prev.buyRules.conditions.filter((c) => c.id !== conditionId)
                : [...prev.buyRules.conditions, conditionToMove],
          },
          sellRules: {
            ...prev.sellRules,
            conditions:
              fromGroup === 'SELL'
                ? prev.sellRules.conditions.filter((c) => c.id !== conditionId)
                : [...prev.sellRules.conditions, conditionToMove],
          },
        }));
        showToast(`Moved condition to ${targetGroup} rules`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick click add from toolbox
  const handleQuickAdd = (template: ToolboxConditionTemplate, targetGroup: 'BUY' | 'SELL') => {
    const newCondition: VisualCondition = {
      id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      leftIndicator: template.leftIndicator,
      operator: template.operator,
      rightType: template.rightType,
      rightValue: template.rightValue,
      rightIndicator: template.rightIndicator,
      label: template.badge,
    };

    setStrategy((prev) => ({
      ...prev,
      buyRules:
        targetGroup === 'BUY'
          ? { ...prev.buyRules, conditions: [...prev.buyRules.conditions, newCondition] }
          : prev.buyRules,
      sellRules:
        targetGroup === 'SELL'
          ? { ...prev.sellRules, conditions: [...prev.sellRules.conditions, newCondition] }
          : prev.sellRules,
    }));
    showToast(`Added to ${targetGroup} rules`);
  };

  const removeCondition = (targetGroup: 'BUY' | 'SELL', conditionId: string) => {
    setStrategy((prev) => ({
      ...prev,
      buyRules:
        targetGroup === 'BUY'
          ? {
              ...prev.buyRules,
              conditions: prev.buyRules.conditions.filter((c) => c.id !== conditionId),
            }
          : prev.buyRules,
      sellRules:
        targetGroup === 'SELL'
          ? {
              ...prev.sellRules,
              conditions: prev.sellRules.conditions.filter((c) => c.id !== conditionId),
            }
          : prev.sellRules,
    }));
  };

  const loadPreset = (preset: CustomVisualStrategy) => {
    setStrategy({
      ...preset,
      id: `custom-${Date.now()}`,
      createdAt: Date.now(),
    });
    showToast(`Loaded "${preset.name}" template`);
  };

  const handleAddCustomConditionSubmit = () => {
    const customCond: VisualCondition = {
      id: `custom-${Date.now()}`,
      leftIndicator: newLeft,
      operator: newOp,
      rightType: newRightType,
      rightValue: newRightType === 'VALUE' ? Number(newRightVal) : undefined,
      rightIndicator: newRightType === 'INDICATOR' ? newRightInd : undefined,
    };

    setStrategy((prev) => ({
      ...prev,
      buyRules:
        customTargetGroup === 'BUY'
          ? { ...prev.buyRules, conditions: [...prev.buyRules.conditions, customCond] }
          : prev.buyRules,
      sellRules:
        customTargetGroup === 'SELL'
          ? { ...prev.sellRules, conditions: [...prev.sellRules.conditions, customCond] }
          : prev.sellRules,
    }));

    setShowCustomConditionModal(false);
    showToast(`Custom condition added to ${customTargetGroup}`);
  };

  // Evaluate current strategy live against candles
  const buyMet = currentCandle
    ? evaluateRuleGroup(strategy.buyRules, currentCandle, prevCandle)
    : false;
  const sellMet = currentCandle
    ? evaluateRuleGroup(strategy.sellRules, currentCandle, prevCandle)
    : false;

  const filteredToolbox = TOOLBOX_TEMPLATES.filter((t) => {
    if (selectedCategory === 'ALL') return true;
    return t.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Visual Strategy Builder
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
                  DRAG & DROP LOGIC
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Design custom algorithmic execution rules without hardcoded parameters (e.g. RSI &lt; 30 AND EMA 50 &gt; EMA 200)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notification && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 animate-fade">
                {notification}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Preset Bar & Strategy Details */}
        <div className="px-5 py-3 border-b border-zinc-800/80 bg-zinc-900/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Strategy Name & Timeframe */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 flex-1">
              <span className="text-zinc-500 font-bold uppercase text-[10px]">Name:</span>
              <input
                type="text"
                value={strategy.name}
                onChange={(e) => setStrategy((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-transparent text-white font-semibold outline-none w-full text-xs"
                placeholder="Custom Strategy Name..."
              />
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
              <span className="text-zinc-500 font-bold uppercase text-[10px]">TF:</span>
              {(['1M', '5M', '15M', '1H'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setStrategy((prev) => ({ ...prev, timeframe: tf }))}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    strategy.timeframe === tf
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase text-zinc-500 mr-1">Presets:</span>
            {PRESET_STRATEGY_TEMPLATES.map((p) => (
              <button
                key={p.id}
                onClick={() => loadPreset(p)}
                className="px-2 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-[11px] text-zinc-300 hover:text-white transition flex items-center gap-1"
                title={p.description}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{p.name.split('+')[0].trim()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Core Workspace: Two Columns (Left: Palette, Right: Canvas) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[440px]">
          {/* Left Column: Toolbox / Conditions Palette (5 cols) */}
          <div className="lg:col-span-5 border-r border-zinc-800/80 bg-zinc-950 p-4 flex flex-col gap-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Indicator Toolbox
                </span>
              </div>
              <button
                onClick={() => setShowCustomConditionModal(true)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] font-semibold transition"
              >
                <Plus className="w-3 h-3 text-cyan-400" />
                <span>Custom Math</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-500 leading-tight">
              Drag condition chips directly into the <strong className="text-emerald-400">BUY</strong> or <strong className="text-rose-400">SELL</strong> drop zones on the right, or click the quick action tags.
            </p>

            {/* Category Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
              {(['ALL', 'MOMENTUM', 'MOVING_AVERAGES', 'VOLATILITY', 'PRICE_ACTION'] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded-md font-bold transition whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                )
              )}
            </div>

            {/* Draggable Chips Grid */}
            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
              {filteredToolbox.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStartToolbox(e, item)}
                  className="group bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 rounded-xl p-2.5 flex flex-col gap-1.5 transition cursor-grab active:cursor-grabbing shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-zinc-600 group-hover:text-cyan-400 transition" />
                      <span className="font-mono text-xs font-bold text-white group-hover:text-cyan-300 transition">
                        {item.name}
                      </span>
                    </div>
                    {/* Quick Add Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuickAdd(item, 'BUY')}
                        className="px-1.5 py-0.5 rounded bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold transition"
                        title="Add directly to BUY rules"
                      >
                        + BUY
                      </button>
                      <button
                        onClick={() => handleQuickAdd(item, 'SELL')}
                        className="px-1.5 py-0.5 rounded bg-rose-900/50 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[10px] font-bold transition"
                        title="Add directly to SELL rules"
                      >
                        + SELL
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-400 line-clamp-1">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Execution Rules Canvas & Drop Zones (7 cols) */}
          <div className="lg:col-span-7 bg-zinc-950/60 p-4 flex flex-col gap-4 overflow-y-auto">
            {/* BUY Rules Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsOverBuy(true);
              }}
              onDragLeave={() => setIsOverBuy(false)}
              onDrop={(e) => handleDrop(e, 'BUY')}
              className={`border rounded-xl p-3 flex flex-col gap-2.5 transition ${
                isOverBuy
                  ? 'bg-emerald-950/30 border-emerald-400 ring-2 ring-emerald-500/30'
                  : 'bg-zinc-900/40 border-emerald-900/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> BUY Conditions
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                    {strategy.buyRules.conditions.length} Active
                  </span>
                  {buyMet && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold animate-pulse">
                      CONDITIONS MET
                    </span>
                  )}
                </div>

                {/* Conjunction Selector (AND / OR) */}
                <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 text-[10px] font-bold">
                  <span className="text-zinc-500 px-1 text-[9px] uppercase">Logic:</span>
                  <button
                    onClick={() =>
                      setStrategy((prev) => ({
                        ...prev,
                        buyRules: { ...prev.buyRules, conjunction: 'AND' },
                      }))
                    }
                    className={`px-2 py-0.5 rounded ${
                      strategy.buyRules.conjunction === 'AND'
                        ? 'bg-emerald-500 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    AND
                  </button>
                  <button
                    onClick={() =>
                      setStrategy((prev) => ({
                        ...prev,
                        buyRules: { ...prev.buyRules, conjunction: 'OR' },
                      }))
                    }
                    className={`px-2 py-0.5 rounded ${
                      strategy.buyRules.conjunction === 'OR'
                        ? 'bg-emerald-500 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    OR
                  </button>
                </div>
              </div>

              {/* Conditions List */}
              {strategy.buyRules.conditions.length === 0 ? (
                <div className="border border-dashed border-zinc-800 rounded-lg p-6 text-center text-zinc-500 text-xs flex flex-col items-center justify-center">
                  <span>Drop indicator condition chips here to trigger BUY orders</span>
                  <span className="text-[10px] text-zinc-600 mt-0.5">
                    (e.g., Drag &quot;RSI &lt; 30&quot; and &quot;EMA 50 &gt; EMA 200&quot;)
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {strategy.buyRules.conditions.map((cond, idx) => {
                    const isMatched = currentCandle
                      ? evaluateCondition(cond, currentCandle, prevCandle)
                      : false;
                    const liveLeftVal = currentCandle
                      ? getIndicatorValue(cond.leftIndicator, currentCandle)
                      : 0;

                    return (
                      <div
                        key={cond.id}
                        draggable
                        onDragStart={(e) => handleDragStartExisting(e, 'BUY', cond.id)}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs hover:border-zinc-700 transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                          <span className="text-[10px] font-bold text-zinc-500 shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-mono font-bold text-white truncate">
                            {formatConditionString(cond)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Live value readout */}
                          <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
                            Live: {liveLeftVal.toFixed(2)}
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                              isMatched
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            {isMatched ? 'TRUE' : 'FALSE'}
                          </span>

                          <button
                            onClick={() => removeCondition('BUY', cond.id)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition"
                            title="Remove condition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SELL Rules Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsOverSell(true);
              }}
              onDragLeave={() => setIsOverSell(false)}
              onDrop={(e) => handleDrop(e, 'SELL')}
              className={`border rounded-xl p-3 flex flex-col gap-2.5 transition ${
                isOverSell
                  ? 'bg-rose-950/30 border-rose-400 ring-2 ring-rose-500/30'
                  : 'bg-zinc-900/40 border-rose-900/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5" /> SELL Conditions
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                    {strategy.sellRules.conditions.length} Active
                  </span>
                  {sellMet && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold animate-pulse">
                      CONDITIONS MET
                    </span>
                  )}
                </div>

                {/* Conjunction Selector (AND / OR) */}
                <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 text-[10px] font-bold">
                  <span className="text-zinc-500 px-1 text-[9px] uppercase">Logic:</span>
                  <button
                    onClick={() =>
                      setStrategy((prev) => ({
                        ...prev,
                        sellRules: { ...prev.sellRules, conjunction: 'AND' },
                      }))
                    }
                    className={`px-2 py-0.5 rounded ${
                      strategy.sellRules.conjunction === 'AND'
                        ? 'bg-rose-500 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    AND
                  </button>
                  <button
                    onClick={() =>
                      setStrategy((prev) => ({
                        ...prev,
                        sellRules: { ...prev.sellRules, conjunction: 'OR' },
                      }))
                    }
                    className={`px-2 py-0.5 rounded ${
                      strategy.sellRules.conjunction === 'OR'
                        ? 'bg-rose-500 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    OR
                  </button>
                </div>
              </div>

              {/* Conditions List */}
              {strategy.sellRules.conditions.length === 0 ? (
                <div className="border border-dashed border-zinc-800 rounded-lg p-6 text-center text-zinc-500 text-xs flex flex-col items-center justify-center">
                  <span>Drop indicator condition chips here to trigger SELL orders</span>
                  <span className="text-[10px] text-zinc-600 mt-0.5">
                    (e.g., Drag &quot;RSI &gt; 70&quot; and &quot;EMA 50 &lt; EMA 200&quot;)
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {strategy.sellRules.conditions.map((cond, idx) => {
                    const isMatched = currentCandle
                      ? evaluateCondition(cond, currentCandle, prevCandle)
                      : false;
                    const liveLeftVal = currentCandle
                      ? getIndicatorValue(cond.leftIndicator, currentCandle)
                      : 0;

                    return (
                      <div
                        key={cond.id}
                        draggable
                        onDragStart={(e) => handleDragStartExisting(e, 'SELL', cond.id)}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs hover:border-zinc-700 transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                          <span className="text-[10px] font-bold text-zinc-500 shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-mono font-bold text-white truncate">
                            {formatConditionString(cond)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
                            Live: {liveLeftVal.toFixed(2)}
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                              isMatched
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            {isMatched ? 'TRUE' : 'FALSE'}
                          </span>

                          <button
                            onClick={() => removeCondition('SELL', cond.id)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition"
                            title="Remove condition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Generated Execution Formula & Diagnostics */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span>Generated Algorithmic Rule Formula</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Pair: {activePair.symbol}</span>
                </div>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 font-mono text-[11px] flex flex-col gap-1 text-zinc-300 overflow-x-auto">
                <div className="flex items-center gap-1">
                  <span className="text-emerald-400 font-bold">BUY RULE:</span>
                  <span>
                    IF{' '}
                    {strategy.buyRules.conditions.length > 0
                      ? strategy.buyRules.conditions
                          .map((c) => `(${formatConditionString(c)})`)
                          .join(` ${strategy.buyRules.conjunction} `)
                      : 'NO CONDITIONS DEFINED'}{' '}
                    =&gt; <strong className="text-emerald-400">EXECUTE BUY ORDER</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-rose-400 font-bold">SELL RULE:</span>
                  <span>
                    IF{' '}
                    {strategy.sellRules.conditions.length > 0
                      ? strategy.sellRules.conditions
                          .map((c) => `(${formatConditionString(c)})`)
                          .join(` ${strategy.sellRules.conjunction} `)
                      : 'NO CONDITIONS DEFINED'}{' '}
                    =&gt; <strong className="text-rose-400">EXECUTE SELL ORDER</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Execution Risk Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">
                  Take Profit (Pips)
                </span>
                <input
                  type="number"
                  value={strategy.defaultTakeProfitPips}
                  onChange={(e) =>
                    setStrategy((prev) => ({
                      ...prev,
                      defaultTakeProfitPips: Number(e.target.value),
                    }))
                  }
                  className="bg-transparent font-mono text-white font-bold text-xs outline-none w-full mt-0.5"
                />
              </div>

              <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">
                  Stop Loss (Pips)
                </span>
                <input
                  type="number"
                  value={strategy.defaultStopLossPips}
                  onChange={(e) =>
                    setStrategy((prev) => ({
                      ...prev,
                      defaultStopLossPips: Number(e.target.value),
                    }))
                  }
                  className="bg-transparent font-mono text-white font-bold text-xs outline-none w-full mt-0.5"
                />
              </div>

              <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">
                  Trailing Stop (Pips)
                </span>
                <input
                  type="number"
                  value={strategy.defaultTrailingStopPips}
                  onChange={(e) =>
                    setStrategy((prev) => ({
                      ...prev,
                      defaultTrailingStopPips: Number(e.target.value),
                    }))
                  }
                  className="bg-transparent font-mono text-white font-bold text-xs outline-none w-full mt-0.5"
                />
              </div>

              <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">
                  Min Confidence (%)
                </span>
                <input
                  type="number"
                  value={strategy.minConfidence}
                  onChange={(e) =>
                    setStrategy((prev) => ({
                      ...prev,
                      minConfidence: Number(e.target.value),
                    }))
                  }
                  className="bg-transparent font-mono text-white font-bold text-xs outline-none w-full mt-0.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">
              Engine evaluates rules on every incoming tick bar. No hardcoding or server rebuild needed.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live 100-Candle Auto-Validator Preview Indicator */}
            <div
              className="flex items-center gap-2 bg-zinc-950/90 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-mono"
              title="Quick 100-candle auto-validation test on current pair"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-zinc-400 text-[11px] hidden md:inline">100-Bar Validator:</span>
              <span
                className={`font-bold ${
                  liveValidation.successProbability >= 60
                    ? 'text-emerald-400'
                    : liveValidation.successProbability >= 45
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {liveValidation.successProbability.toFixed(1)}% Prob
              </span>
              <span className="text-zinc-600">&bull;</span>
              <span
                className={`font-bold ${
                  liveValidation.currencyNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {liveValidation.currencyNetProfit >= 0 ? '+' : ''}$
                {liveValidation.currencyNetProfit.toFixed(2)} USD
              </span>
              <span className="text-zinc-500 text-[10px]">({activePair.symbol})</span>
            </div>

            <button
              type="button"
              onClick={handleSaveStrategy}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold transition"
            >
              Save Strategy
            </button>

            <button
              type="button"
              id="deploy-strategy-to-robot-btn"
              onClick={handleDeployToRobot}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs transition shadow-sm shadow-cyan-500/20 flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Deploy to Robot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Math Condition Modal */}
      {showCustomConditionModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <span className="font-bold text-sm text-white">Create Custom Indicator Condition</span>
              <button
                onClick={() => setShowCustomConditionModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-zinc-500 text-[10px] font-bold uppercase block mb-1">
                  Add to Rule Group
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCustomTargetGroup('BUY')}
                    className={`py-1.5 rounded-lg font-bold border ${
                      customTargetGroup === 'BUY'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    BUY Rules
                  </button>
                  <button
                    onClick={() => setCustomTargetGroup('SELL')}
                    className={`py-1.5 rounded-lg font-bold border ${
                      customTargetGroup === 'SELL'
                        ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    SELL Rules
                  </button>
                </div>
              </div>

              <div>
                <label className="text-zinc-500 text-[10px] font-bold uppercase block mb-1">
                  Left Operand Indicator
                </label>
                <select
                  value={newLeft}
                  onChange={(e) => setNewLeft(e.target.value as IndicatorSource)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none"
                >
                  <option value="RSI">RSI (14)</option>
                  <option value="EMA_9">EMA (9)</option>
                  <option value="EMA_21">EMA (21)</option>
                  <option value="EMA_50">EMA (50)</option>
                  <option value="EMA_200">EMA (200)</option>
                  <option value="PRICE_CLOSE">Price (Close)</option>
                  <option value="PRICE_OPEN">Price (Open)</option>
                  <option value="MACD_HIST">MACD Histogram</option>
                  <option value="MACD_LINE">MACD Line</option>
                  <option value="BB_UPPER">Upper Bollinger Band</option>
                  <option value="BB_LOWER">Lower Bollinger Band</option>
                  <option value="ATR">Average True Range (ATR)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-500 text-[10px] font-bold uppercase block mb-1">
                  Comparison Operator
                </label>
                <select
                  value={newOp}
                  onChange={(e) => setNewOp(e.target.value as ComparisonOperator)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none"
                >
                  <option value="<">&lt; (Less Than)</option>
                  <option value="<=">&le; (Less Than or Equal)</option>
                  <option value=">">&gt; (Greater Than)</option>
                  <option value=">=">&ge; (Greater Than or Equal)</option>
                  <option value="CROSSES_ABOVE">Crosses Above</option>
                  <option value="CROSSES_BELOW">Crosses Below</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-500 text-[10px] font-bold uppercase block mb-1">
                  Compare Against
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() => setNewRightType('VALUE')}
                    className={`py-1.5 rounded-lg font-bold border ${
                      newRightType === 'VALUE'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Constant Value
                  </button>
                  <button
                    onClick={() => setNewRightType('INDICATOR')}
                    className={`py-1.5 rounded-lg font-bold border ${
                      newRightType === 'INDICATOR'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Another Indicator
                  </button>
                </div>

                {newRightType === 'VALUE' ? (
                  <input
                    type="number"
                    step="any"
                    value={newRightVal}
                    onChange={(e) => setNewRightVal(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none"
                    placeholder="e.g. 30, 70, 0"
                  />
                ) : (
                  <select
                    value={newRightInd}
                    onChange={(e) => setNewRightInd(e.target.value as IndicatorSource)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none"
                  >
                    <option value="EMA_200">EMA (200)</option>
                    <option value="EMA_50">EMA (50)</option>
                    <option value="EMA_21">EMA (21)</option>
                    <option value="EMA_9">EMA (9)</option>
                    <option value="PRICE_CLOSE">Price (Close)</option>
                    <option value="PRICE_OPEN">Price (Open)</option>
                    <option value="BB_UPPER">Upper Bollinger Band</option>
                    <option value="BB_LOWER">Lower Bollinger Band</option>
                  </select>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowCustomConditionModal(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomConditionSubmit}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold"
              >
                Add Condition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
