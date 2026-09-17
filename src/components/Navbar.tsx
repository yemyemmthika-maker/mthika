import React from 'react';
import {
  Play,
  Pause,
  AlertTriangle,
  Bot,
  Sparkles,
  Zap,
  RotateCcw,
  BarChart2,
  Sliders,
  Volume2,
  VolumeX,
  Settings,
  Activity,
} from 'lucide-react';
import { BotConfig } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { GlobalCurrencySelector } from './CurrencyFlag';

interface NavbarProps {
  config: BotConfig;
  onUpdateConfig: (updater: (prev: BotConfig) => BotConfig) => void;
  onOpenAIModal: () => void;
  onOpenBacktestModal: () => void;
  onOpenStrategyBuilder: () => void;
  onOpenSettingsModal: () => void;
  onOpenCorrelationHeatmap?: () => void;
  onEmergencyStop: () => void;
  onResetAccount: () => void;
  accountMode: 'DEMO' | 'MT5_BRIDGE';
  onToggleAccountMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  onUpdateConfig,
  onOpenAIModal,
  onOpenBacktestModal,
  onOpenStrategyBuilder,
  onOpenSettingsModal,
  onOpenCorrelationHeatmap,
  onEmergencyStop,
  onResetAccount,
  accountMode,
  onToggleAccountMode,
}) => {
  const toggleBotRunning = () => {
    onUpdateConfig((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const toggleSound = () => {
    onUpdateConfig((prev) => ({ ...prev, soundAlerts: !prev.soundAlerts }));
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Bot State */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">
                  Mthika Robot <span className="text-emerald-400 text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">AUTOTRADER</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border bg-zinc-900 border-zinc-700 text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  MT5 Latency: 14ms
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Algorithmic Execution & Multi-Pair Quant Engine
              </p>
            </div>
          </div>
        </div>

        {/* Center: Master Bot Toggle & Simulation Speed */}
        <div className="flex items-center gap-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg p-1">
          <button
            id="master-bot-toggle"
            onClick={toggleBotRunning}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm ${
              config.isRunning
                ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/20 hover:bg-emerald-400'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {config.isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>BOT RUNNING</span>
                <span className="w-2 h-2 rounded-full bg-zinc-950 animate-ping"></span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                <span>START ROBOT</span>
              </>
            )}
          </button>

          <div className="h-4 w-px bg-zinc-800"></div>

          {/* Speed selector */}
          <div className="flex items-center gap-1 px-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Tick Speed:</span>
            {([1, 2, 5, 10] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => onUpdateConfig((prev) => ({ ...prev, simulationSpeed: spd }))}
                className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition ${
                  config.simulationSpeed === spd
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          {/* Visual Strategy Builder */}
          <button
            id="open-strategy-builder-btn"
            onClick={onOpenStrategyBuilder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition"
            title="Design custom drag-and-drop trading logic"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Strategy Builder</span>
          </button>

          {/* AI Quant Signal Assistant */}
          <button
            id="open-ai-signal-btn"
            onClick={onOpenAIModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Signal Intel</span>
          </button>

          {/* Backtester */}
          <button
            id="open-backtest-btn"
            onClick={onOpenBacktestModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-medium transition"
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strategy Backtester</span>
          </button>

          {/* Correlation Heatmap Navigation Button */}
          {onOpenCorrelationHeatmap && (
            <button
              id="open-correlation-heatmap-btn"
              onClick={onOpenCorrelationHeatmap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition"
              title="Real-time currency pair correlation matrix & hedging opportunities"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Correlation Matrix</span>
            </button>
          )}

          {/* Terminal & Notification Settings */}
          <button
            id="open-settings-modal-btn"
            onClick={onOpenSettingsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-medium transition"
            title="Configure email notifications for margin calls, losses & strategy switches"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            <span>Settings</span>
          </button>

          {/* Download & Install App (PWA) */}
          <PWAInstallButton variant="navbar" />

          {/* Global Base Currency Selector */}
          <GlobalCurrencySelector
            selectedCurrency={config.globalCurrency || 'USD'}
            onSelectCurrency={(currency) =>
              onUpdateConfig((prev) => ({ ...prev, globalCurrency: currency }))
            }
          />

          {/* Account Mode Toggle */}
          <button
            onClick={onToggleAccountMode}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-300 hover:text-white"
            title="Switch Demo / Live bridge simulation"
          >
            <span className="text-zinc-500">Mode:</span>
            <span className={accountMode === 'DEMO' ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
              {accountMode === 'DEMO' ? 'Demo $10K' : 'Live MT5 Bridge'}
            </span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
            title={config.soundAlerts ? 'Mute audio cues' : 'Unmute audio cues'}
          >
            {config.soundAlerts ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-600" />}
          </button>

          {/* Emergency Panic Liquidate All */}
          <button
            id="emergency-liquidate-btn"
            onClick={onEmergencyStop}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition"
            title="Instantly close all active trades & pause robot"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Panic Stop</span>
          </button>

          {/* Reset Account */}
          <button
            onClick={onResetAccount}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
            title="Reset balance to $10,000"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
