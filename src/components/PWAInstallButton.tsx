import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Monitor, Smartphone, Apple, Check, X, Sparkles, ExternalLink } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'compact' | 'modal';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'DESKTOP' | 'ANDROID' | 'IOS'>('DESKTOP');
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed and running standalone, display a subtle badge or return null
  if (isInstalled) {
    if (variant === 'navbar') {
      return (
        <span
          id="pwa-installed-badge"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/60 border border-emerald-800/60 text-emerald-400"
          title="Mthika Robot is installed and running natively"
        >
          <Check className="w-3.5 h-3.5" />
          <span>App Installed</span>
        </span>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 5000);
      }
    } else {
      // In iframes or when browser hasn't fired event, open the multi-platform guide modal
      if (isIOS) {
        setActiveTab('IOS');
      } else if (/android/.test(navigator.userAgent.toLowerCase())) {
        setActiveTab('ANDROID');
      } else {
        setActiveTab('DESKTOP');
      }
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        id="pwa-install-app-btn"
        onClick={handleInstallClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
          isInstallable
            ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 ring-1 ring-emerald-400/50'
            : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
        } ${className}`}
        title="Download and install Mthika Robot on your device"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Download App</span>
        {isInstallable && (
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-ping" />
        )}
      </button>

      {/* Guide Modal for Manual or IFrame Installation */}
      {showGuideModal && (
        <div
          id="pwa-install-guide-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center p-2 shadow-inner">
                  <img src="/icon.svg" alt="Mthika Robot Icon" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    Install Mthika Robot
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      PWA Native
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">Download and run directly on your home screen or desktop</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Platform Selection Tabs */}
            <div className="flex rounded-lg bg-zinc-950 p-1 border border-zinc-850 gap-1 text-xs">
              <button
                onClick={() => setActiveTab('DESKTOP')}
                className={`flex-1 py-1.5 px-2 rounded-md font-semibold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'DESKTOP' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop (PC/Mac)</span>
              </button>
              <button
                onClick={() => setActiveTab('ANDROID')}
                className={`flex-1 py-1.5 px-2 rounded-md font-semibold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'ANDROID' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>
              <button
                onClick={() => setActiveTab('IOS')}
                className={`flex-1 py-1.5 px-2 rounded-md font-semibold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'IOS' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>
            </div>

            {/* Instructions Body */}
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs space-y-3">
              {activeTab === 'DESKTOP' && (
                <div className="space-y-2.5 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/60 flex items-center justify-center text-[11px]">
                      1
                    </span>
                    <p className="text-zinc-300">
                      Open this app directly in <strong>Chrome</strong>, <strong>Brave</strong>, or <strong>Edge</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/60 flex items-center justify-center text-[11px]">
                      2
                    </span>
                    <p className="text-zinc-300">
                      Click the <strong>Install icon</strong> (<Download className="w-3 h-3 inline text-emerald-400" />) located on the right side of the browser's address bar.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/60 flex items-center justify-center text-[11px]">
                      3
                    </span>
                    <p className="text-zinc-300">
                      Click <strong>Install</strong>. Mthika Robot will launch in its own dedicated, high-performance window without browser address bars.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'ANDROID' && (
                <div className="space-y-2.5 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/60 flex items-center justify-center text-[11px]">
                      1
                    </span>
                    <p className="text-zinc-300">
                      Open Mthika Robot in <strong>Chrome for Android</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/60 flex items-center justify-center text-[11px]">
                      2
                    </span>
                    <p className="text-zinc-300">
                      Tap the <strong>three dots menu</strong> (⋮) in the top-right corner.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/60 flex items-center justify-center text-[11px]">
                      3
                    </span>
                    <p className="text-zinc-300">
                      Select <strong>Install App</strong> or <strong>Add to Home screen</strong>.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'IOS' && (
                <div className="space-y-2.5 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/60 flex items-center justify-center text-[11px]">
                      1
                    </span>
                    <p className="text-zinc-300">
                      Open Mthika Robot in <strong>Safari</strong> on your iPhone or iPad.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/60 flex items-center justify-center text-[11px]">
                      2
                    </span>
                    <p className="text-zinc-300">
                      Tap the <strong>Share</strong> button (box with an upward arrow) in the bottom toolbar.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/60 flex items-center justify-center text-[11px]">
                      3
                    </span>
                    <p className="text-zinc-300">
                      Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Note / Open in New Tab if in iframe */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
              <span>Runs completely offline once installed.</span>
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
              >
                <span>Open in Full Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
