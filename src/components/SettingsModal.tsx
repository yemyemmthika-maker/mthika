import React, { useState } from 'react';
import {
  Settings,
  Mail,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Bell,
  Sliders,
  Send,
  Eye,
  Trash2,
  X,
  Zap,
  Layers,
  ChevronRight,
  Server,
  Shield,
  Clock,
  ExternalLink,
  Download,
  FileDown,
  Monitor,
  Smartphone,
  Apple,
  Globe,
} from 'lucide-react';
import { BotConfig, DispatchedEmail, EmailNotificationConfig } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  createTestEmail,
  DEFAULT_EMAIL_NOTIFICATION_CONFIG,
} from '../utils/notificationEngine';
import {
  SUPPORTED_GLOBAL_CURRENCIES,
  GlobalCurrencyCode,
  formatGlobalCurrency,
  getCurrencyInfo,
} from '../utils/currencyFlags';
import { CurrencyFlag } from './CurrencyFlag';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BotConfig;
  onUpdateConfig: (updater: (prev: BotConfig) => BotConfig) => void;
  notificationConfig: EmailNotificationConfig;
  onUpdateNotificationConfig: (newConfig: EmailNotificationConfig) => void;
  dispatchedEmails: DispatchedEmail[];
  onDispatchEmail: (email: DispatchedEmail) => void;
  onClearDispatchedEmails: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  notificationConfig,
  onUpdateNotificationConfig,
  dispatchedEmails,
  onDispatchEmail,
  onClearDispatchedEmails,
}) => {
  const [activeTab, setActiveTab] = useState<'NOTIFICATIONS' | 'RISK_GUARD' | 'MT5_BRIDGE' | 'AUDIT_LOG' | 'INSTALL_APP' | 'CURRENCY'>('NOTIFICATIONS');
  const [localNotif, setLocalNotif] = useState<EmailNotificationConfig>(notificationConfig);
  const [testType, setTestType] = useState<'MARGIN_CALL' | 'LARGE_LOSS' | 'STRATEGY_SWITCH' | 'TEST_EMAIL'>('TEST_EMAIL');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);
  const [previewEmail, setPreviewEmail] = useState<DispatchedEmail | null>(null);
  const [selectedLogEmail, setSelectedLogEmail] = useState<DispatchedEmail | null>(null);
  const [savedSuccessBanner, setSavedSuccessBanner] = useState(false);

  // Sync state if props change when opening
  React.useEffect(() => {
    setLocalNotif(notificationConfig);
  }, [notificationConfig, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateNotificationConfig(localNotif);
    setSavedSuccessBanner(true);
    setTimeout(() => setSavedSuccessBanner(false), 3000);
  };

  const handleSendTest = () => {
    setIsSendingTest(true);
    setTestSuccessMessage(null);

    setTimeout(() => {
      const email = createTestEmail(localNotif.recipientEmail || 'yemyemmthika@gmail.com', testType);
      onDispatchEmail(email);
      setIsSendingTest(false);
      setTestSuccessMessage(`Dispatched test "${email.subject.slice(0, 45)}..." to ${localNotif.recipientEmail}`);
      setPreviewEmail(email);
      setTimeout(() => setTestSuccessMessage(null), 5000);
    }, 450);
  };

  const isValidEmail = localNotif.recipientEmail.includes('@') && localNotif.recipientEmail.includes('.');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Terminal Settings & Notifications
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                  {localNotif.enabled ? 'Alerts Active' : 'Alerts Disabled'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configure email dispatches for margin calls, large losses, strategy switches & broker bridge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Saved feedback banner */}
        {savedSuccessBanner && (
          <div className="bg-emerald-950/70 border-b border-emerald-800/80 px-6 py-2 flex items-center gap-2 text-xs text-emerald-300 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Settings saved successfully! Email alerts are updated and persisted to local storage.</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="px-6 pt-3 border-b border-zinc-800 bg-zinc-900/30 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-semibold border-b-2 transition ${
              activeTab === 'NOTIFICATIONS'
                ? 'border-emerald-500 text-emerald-400 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Notifications</span>
            <span
              className={`w-2 h-2 rounded-full ${
                localNotif.enabled ? 'bg-emerald-400' : 'bg-zinc-600'
              }`}
            />
          </button>

          <button
            onClick={() => setActiveTab('AUDIT_LOG')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-semibold border-b-2 transition ${
              activeTab === 'AUDIT_LOG'
                ? 'border-emerald-500 text-emerald-400 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Dispatched Alert Logs</span>
            {dispatchedEmails.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold">
                {dispatchedEmails.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('RISK_GUARD')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-semibold border-b-2 transition ${
              activeTab === 'RISK_GUARD'
                ? 'border-emerald-500 text-emerald-400 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Risk Guard Limits</span>
          </button>

          <button
            onClick={() => setActiveTab('MT5_BRIDGE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-semibold border-b-2 transition ${
              activeTab === 'MT5_BRIDGE'
                ? 'border-emerald-500 text-emerald-400 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Broker & MT5 Bridge</span>
          </button>

          <button
            id="tab-global-currency"
            onClick={() => setActiveTab('CURRENCY')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-semibold border-b-2 transition ${
              activeTab === 'CURRENCY'
                ? 'border-emerald-500 text-emerald-400 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Base Currency</span>
            <CurrencyFlag code={config.globalCurrency} size="xs" />
          </button>

          <button
            id="tab-install-app"
            onClick={() => setActiveTab('INSTALL_APP')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-semibold border-b-2 transition ${
              activeTab === 'INSTALL_APP'
                ? 'border-emerald-500 text-emerald-400 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download & App Install</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              PWA
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-zinc-300">
          {/* TAB 1: EMAIL NOTIFICATIONS */}
          {activeTab === 'NOTIFICATIONS' && (
            <div className="space-y-6">
              {/* Master Email Toggle & Recipient Address Box */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">Automated Email Alert System</div>
                      <p className="text-xs text-zinc-400">
                        Receive instant email notifications for margin distress, large losses, and strategy changes.
                      </p>
                    </div>
                  </div>

                  {/* Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localNotif.enabled}
                      onChange={(e) =>
                        setLocalNotif((prev) => ({ ...prev, enabled: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Recipient Address */}
                <div className="pt-3 border-t border-zinc-800">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Primary Recipient Email Address:
                  </label>
                  <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={localNotif.recipientEmail}
                        onChange={(e) =>
                          setLocalNotif((prev) => ({ ...prev, recipientEmail: e.target.value }))
                        }
                        placeholder="trader@forex.com"
                        className={`w-full bg-zinc-950 border rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none transition ${
                          isValidEmail ? 'border-zinc-700 focus:border-emerald-500' : 'border-rose-500 text-rose-300'
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setLocalNotif((prev) => ({
                          ...prev,
                          recipientEmail: 'yemyemmthika@gmail.com',
                        }))
                      }
                      className="px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-xs shrink-0 transition"
                      title="Reset to account email"
                    >
                      Use Default Email
                    </button>
                  </div>
                  {!isValidEmail && (
                    <span className="text-[11px] text-rose-400 mt-1 block">
                      Please enter a valid email address format (e.g. user@domain.com).
                    </span>
                  )}
                </div>
              </div>

              {/* CRITICAL TRADING EVENTS LIST */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Configured Critical Alert Events</span>
                </div>

                <div className="space-y-3">
                  {/* Event 1: Margin Call */}
                  <div className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 transition">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 mt-0.5">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">Margin Call Warning Alert</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800/60 uppercase">
                              Critical Severity
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-xl">
                            Triggers an urgent email dispatch when account <strong>Margin Level</strong> falls below the configured safety threshold, warning of impending broker forced liquidation.
                          </p>
                        </div>
                      </div>

                      {/* Checkbox Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={localNotif.notifyOnMarginCall}
                          onChange={(e) =>
                            setLocalNotif((prev) => ({
                              ...prev,
                              notifyOnMarginCall: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                      </label>
                    </div>

                    {/* Margin Level Threshold Settings */}
                    {localNotif.notifyOnMarginCall && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 bg-zinc-950/40 p-2.5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-300">Trigger Alert When Margin Level Falls Below:</span>
                          <div className="flex items-center gap-1 font-mono">
                            <input
                              type="number"
                              min="30"
                              max="200"
                              step="5"
                              value={localNotif.marginCallThresholdPercent}
                              onChange={(e) =>
                                setLocalNotif((prev) => ({
                                  ...prev,
                                  marginCallThresholdPercent: Math.max(20, parseInt(e.target.value) || 100),
                                }))
                              }
                              className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-rose-400 font-bold text-center"
                            />
                            <span className="text-xs text-rose-400 font-bold">%</span>
                          </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-500">Presets:</span>
                          {[
                            { label: '120% Caution', val: 120 },
                            { label: '100% Margin Call', val: 100 },
                            { label: '80% Critical', val: 80 },
                            { label: '50% Stop-Out', val: 50 },
                          ].map((p) => (
                            <button
                              key={p.val}
                              type="button"
                              onClick={() =>
                                setLocalNotif((prev) => ({
                                  ...prev,
                                  marginCallThresholdPercent: p.val,
                                }))
                              }
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition ${
                                localNotif.marginCallThresholdPercent === p.val
                                  ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Event 2: Large Loss Protection */}
                  <div className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 transition">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-0.5">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">Large Loss Protection Alert</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/60 uppercase">
                              Warning Severity
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-xl">
                            Dispatches an immediate audit email when any trade closes with a loss surpassing your maximum loss threshold, including ticket breakdown and exit reason.
                          </p>
                        </div>
                      </div>

                      {/* Checkbox Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={localNotif.notifyOnLargeLoss}
                          onChange={(e) =>
                            setLocalNotif((prev) => ({
                              ...prev,
                              notifyOnLargeLoss: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {/* Loss Threshold Config */}
                    {localNotif.notifyOnLargeLoss && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950/40 p-2.5 rounded-lg text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-300">Dollar Loss Per Trade Exceeds:</span>
                          <div className="flex items-center gap-1 font-mono">
                            <span className="text-zinc-500 font-bold">$</span>
                            <input
                              type="number"
                              min="5"
                              max="500"
                              step="5"
                              value={localNotif.largeLossThresholdDollar}
                              onChange={(e) =>
                                setLocalNotif((prev) => ({
                                  ...prev,
                                  largeLossThresholdDollar: Math.max(5, parseFloat(e.target.value) || 20),
                                }))
                              }
                              className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-amber-400 font-bold text-center"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-300">Pip Loss Per Trade Exceeds:</span>
                          <div className="flex items-center gap-1 font-mono">
                            <input
                              type="number"
                              min="5"
                              max="100"
                              step="5"
                              value={localNotif.largeLossThresholdPips}
                              onChange={(e) =>
                                setLocalNotif((prev) => ({
                                  ...prev,
                                  largeLossThresholdPips: Math.max(5, parseFloat(e.target.value) || 15),
                                }))
                              }
                              className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-amber-400 font-bold text-center"
                            />
                            <span className="text-zinc-500 font-bold">pips</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Event 3: Strategy Switches */}
                  <div className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 transition">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-0.5">
                          <Sliders className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">Strategy Switch & Deployment Alert</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 uppercase">
                              Audit Event
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-xl">
                            Sends an email confirmation whenever the active algorithmic trading strategy is switched (e.g. from London Trend to Copy Scalper, or custom Visual Builder rules deployed).
                          </p>
                        </div>
                      </div>

                      {/* Checkbox Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={localNotif.notifyOnStrategySwitch}
                          onChange={(e) =>
                            setLocalNotif((prev) => ({
                              ...prev,
                              notifyOnStrategySwitch: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* Event 4: Emergency Panic Stop & Daily Drawdown Circuit Breaker */}
                  <div className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 transition">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 mt-0.5">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">Emergency Stop & Drawdown Circuit Breaker</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800/60 uppercase">
                              Safety Halt
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-xl">
                            Dispatches emergency notification if manual panic stop is triggered, or if daily max drawdown limit trips and shuts down the trading robot.
                          </p>
                        </div>
                      </div>

                      {/* Checkbox Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={localNotif.notifyOnPanicStop}
                          onChange={(e) =>
                            setLocalNotif((prev) => ({
                              ...prev,
                              notifyOnPanicStop: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* TEST ALERT DISPATCHER & LIVE EMAIL PREVIEW */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Test Alert Delivery & Live Preview
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Verify email formatting and delivery pipeline
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zinc-300">Select Test Type:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'MARGIN_CALL', label: 'Margin Call Alert', color: 'text-rose-400' },
                      { id: 'LARGE_LOSS', label: 'Large Loss Alert', color: 'text-amber-400' },
                      { id: 'STRATEGY_SWITCH', label: 'Strategy Switch', color: 'text-cyan-400' },
                      { id: 'TEST_EMAIL', label: 'Delivery Handshake', color: 'text-emerald-400' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTestType(t.id as any);
                          const sample = createTestEmail(localNotif.recipientEmail || 'yemyemmthika@gmail.com', t.id as any);
                          setPreviewEmail(sample);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                          testType === t.id
                            ? 'bg-zinc-800 border-zinc-600 text-white font-bold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className={t.color}>&bull;</span> {t.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={isSendingTest}
                    className="ml-auto px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {isSendingTest ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        <span>Sending Dispatch...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Test Alert</span>
                      </>
                    )}
                  </button>
                </div>

                {testSuccessMessage && (
                  <div className="bg-emerald-950/50 border border-emerald-800/80 p-2.5 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{testSuccessMessage}</span>
                  </div>
                )}

                {/* Email Preview Card */}
                {previewEmail && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-semibold text-zinc-300">Live Email Client Preview:</span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500">To: {previewEmail.recipient}</span>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 max-h-72 overflow-y-auto">
                      <div className="text-xs font-bold text-white border-b border-zinc-850 pb-2 mb-2 flex items-center justify-between">
                        <span>{previewEmail.subject}</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60">
                          {previewEmail.status}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-300 leading-relaxed font-sans">
                        <div dangerouslySetInnerHTML={{ __html: previewEmail.body }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT LOG (DISPATCHED EMAILS) */}
          {activeTab === 'AUDIT_LOG' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Recent Email Dispatches & Audit Records
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Log of all alert events sent to {localNotif.recipientEmail}
                  </p>
                </div>
                {dispatchedEmails.length > 0 && (
                  <button
                    onClick={onClearDispatchedEmails}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Log</span>
                  </button>
                )}
              </div>

              {dispatchedEmails.length === 0 ? (
                <div className="p-8 text-center bg-zinc-900/30 border border-zinc-800 rounded-xl space-y-2">
                  <Mail className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div className="text-xs font-semibold text-zinc-400">No Email Alerts Dispatched Yet</div>
                  <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                    When margin calls occur, large losses are closed, or strategies are switched, records will appear here with delivery timestamps.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('NOTIFICATIONS');
                      handleSendTest();
                    }}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200"
                  >
                    Send a Test Email
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {dispatchedEmails.map((email) => (
                    <div
                      key={email.id}
                      className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-750 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1 min-w-[240px]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border ${
                              email.event === 'MARGIN_CALL'
                                ? 'bg-rose-950/60 border-rose-800/60 text-rose-400'
                                : email.event === 'LARGE_LOSS'
                                ? 'bg-amber-950/60 border-amber-800/60 text-amber-400'
                                : email.event === 'STRATEGY_SWITCH'
                                ? 'bg-cyan-950/60 border-cyan-800/60 text-cyan-400'
                                : 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
                            }`}
                          >
                            {email.event.replace('_', ' ')}
                          </span>
                          <span className="font-semibold text-white truncate">{email.subject}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-1">{email.summary}</p>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
                          <span>Recipient: {email.recipient}</span>
                          <span>&bull;</span>
                          <span>{new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedLogEmail(email)}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Body</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RISK GUARD */}
          {activeTab === 'RISK_GUARD' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs uppercase tracking-wider">
                    Core Risk Limits & Margin Safeguards
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Account Leverage</span>
                      <span className="text-[11px] text-zinc-400">Determines margin requirement per lot</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-sm">1:{config.leverage}</span>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Daily Drawdown Kill-Switch</span>
                      <span className="text-[11px] text-zinc-400">Automated bot circuit breaker</span>
                    </div>
                    <span className="font-mono font-bold text-rose-400 text-sm">
                      {config.maxDailyDrawdownPercent}% Max Drop
                    </span>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Max Open Trades</span>
                      <span className="text-[11px] text-zinc-400">Concurrent position cap</span>
                    </div>
                    <span className="font-mono font-bold text-white text-sm">{config.maxOpenTrades} Orders</span>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">Smart Risk Dynamic Scaling</span>
                      <span className="text-[11px] text-zinc-400">Drawdown-based lot throttling</span>
                    </div>
                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                        config.smartRiskEnabled
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {config.smartRiskEnabled ? 'ENABLED' : 'OFF'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MT5 BRIDGE */}
          {activeTab === 'MT5_BRIDGE' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      MetaTrader 5 Bridge Connection
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    BRIDGE ONLINE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
                    <span className="text-zinc-500 block text-[10px]">EXECUTION LATENCY</span>
                    <span className="text-white font-mono font-bold text-sm">14.2 ms</span>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
                    <span className="text-zinc-500 block text-[10px]">SERVER GATEWAY</span>
                    <span className="text-emerald-400 font-mono font-bold text-xs">LD4-Equinix-London</span>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
                    <span className="text-zinc-500 block text-[10px]">PROTOCOL</span>
                    <span className="text-white font-mono font-bold text-xs">FIX 4.4 / MT5 WebAPI</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DOWNLOAD & APP INSTALL (PWA) */}
          {activeTab === 'INSTALL_APP' && (
            <div className="space-y-6">
              {/* App Showcase & Direct Install Card */}
              <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/40 border border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-emerald-500/40 p-2.5 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                      <img src="/icon.svg" alt="Mthika Robot App" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white tracking-tight">Mthika Robot Desktop & Mobile</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          PWA Standalone
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Install natively to run as a dedicated, standalone trading application with offline caching and zero browser latency.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <PWAInstallButton variant="modal" />
                  </div>
                </div>

                {/* Features List */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-800/80">
                  <div className="bg-zinc-950/70 border border-zinc-800/80 p-3 rounded-lg">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Instant Native Launch</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Launches in an independent frameless window without browser tabs or address bar friction.
                    </p>
                  </div>
                  <div className="bg-zinc-950/70 border border-zinc-800/80 p-3 rounded-lg">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Offline Resilient</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Service worker precaches strategy engines, indicators, and historical charts for immediate offline access.
                    </p>
                  </div>
                  <div className="bg-zinc-950/70 border border-zinc-800/80 p-3 rounded-lg">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Cross-Platform Sync</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Compatible across Windows 11, macOS Sonoma, Linux, Android tablets, and iOS home screens.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step-by-step Installation Instructions */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Installation Guides By Device
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Desktop */}
                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-zinc-200 text-xs font-bold">
                      <Monitor className="w-4 h-4 text-emerald-400" />
                      <span>Windows & Mac</span>
                    </div>
                    <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                      <li>Open in Chrome, Edge, or Brave.</li>
                      <li>Click the <strong>Install</strong> icon in the address bar or the "Download App" button above.</li>
                      <li>Confirm <strong>Install</strong> to add a desktop icon.</li>
                    </ol>
                  </div>

                  {/* Android */}
                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-zinc-200 text-xs font-bold">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>Android</span>
                    </div>
                    <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                      <li>Open in Google Chrome on your phone.</li>
                      <li>Tap the <strong>⋮</strong> menu in the upper right.</li>
                      <li>Tap <strong>Install App</strong> or <strong>Add to Home Screen</strong>.</li>
                    </ol>
                  </div>

                  {/* iOS */}
                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-zinc-200 text-xs font-bold">
                      <Apple className="w-4 h-4 text-emerald-400" />
                      <span>iPhone & iPad</span>
                    </div>
                    <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                      <li>Open in <strong>Safari</strong> browser.</li>
                      <li>Tap the <strong>Share</strong> icon (square with arrow).</li>
                      <li>Select <strong>Add to Home Screen</strong> and tap <strong>Add</strong>.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Data & Bot Configuration File Download */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white">Download Bot Configuration File (.json)</h4>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Export your trading bot parameters, risk thresholds, and active pairs as a standalone JSON backup file.
                  </p>
                </div>
                <button
                  type="button"
                  id="download-bot-config-btn"
                  onClick={() => {
                    const exportData = {
                      botConfig: config,
                      notificationConfig: localNotif,
                      exportedAt: new Date().toISOString(),
                      app: 'Mthika Robot Quant Terminal',
                      version: '2.4.0',
                    };
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `mthika-robot-config-${new Date().toISOString().slice(0, 10)}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-white flex items-center gap-2 transition"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Config (.json)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: GLOBAL BASE CURRENCY */}
          {activeTab === 'CURRENCY' && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Global Base Currency & Country Flags
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active: {config.globalCurrency}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                  Select your primary account presentation currency. All terminal metrics (Balance, Equity, Floating PnL, Realized Gains, Free Margin, and Historical Export Ledgers) are localized with accurate country flag badges and converted via real-time global exchange rates.
                </p>
              </div>

              {/* Currency Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {SUPPORTED_GLOBAL_CURRENCIES.map((cur) => {
                  const isSelected = config.globalCurrency === cur.code;
                  const sampleVal = formatGlobalCurrency(10000, cur.code);

                  return (
                    <button
                      key={cur.code}
                      id={`currency-card-${cur.code}`}
                      type="button"
                      onClick={() => {
                        onUpdateConfig((prev) => ({ ...prev, globalCurrency: cur.code }));
                      }}
                      className={`p-4 rounded-xl border text-left transition relative flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <CurrencyFlag code={cur.code} size="md" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-white tracking-tight">
                                {cur.code}
                              </span>
                              <span className="text-xs font-mono text-zinc-400">
                                ({cur.symbol})
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-400 block truncate max-w-[150px]">
                              {cur.country}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </div>

                      <div className="border-t border-zinc-850 pt-2.5 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-500">
                          1 USD = {cur.defaultRateToUSD < 10 ? cur.defaultRateToUSD.toFixed(4) : cur.defaultRateToUSD.toFixed(2)} {cur.code}
                        </span>
                        <span className={`font-bold ${isSelected ? 'text-emerald-400' : 'text-zinc-300'}`}>
                          {sampleVal}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected Log Email Preview Modal */}
        {selectedLogEmail && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs truncate max-w-md">
                    {selectedLogEmail.subject}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedLogEmail(null)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 bg-zinc-950">
                <div dangerouslySetInnerHTML={{ __html: selectedLogEmail.body }} />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setLocalNotif(DEFAULT_EMAIL_NOTIFICATION_CONFIG)}
            className="text-xs text-zinc-400 hover:text-zinc-200 underline"
          >
            Reset Notifications to Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save & Apply Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
