import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-lg bg-amber-500/95 text-zinc-950 px-3.5 py-2 text-xs font-semibold shadow-xl backdrop-blur border border-amber-400/50 animate-bounce"
    >
      <WifiOff className="w-4 h-4 text-zinc-950" />
      <span>Offline Mode Active &bull; Running on cached PWA data</span>
    </div>
  );
};
