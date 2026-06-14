import React, { useState, useEffect } from 'react';
import { installPWA } from '../lib/pwaInstall';

export function PWAInstallBanner() {
  const [installable, setInstallable] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('venn_pwa_dismissed') === 'true');

  useEffect(() => {
    const handler = () => setInstallable(true);
    window.addEventListener('pwa-installable', handler);
    return () => window.removeEventListener('pwa-installable', handler);
  }, []);

  if (!installable || dismissed) return null;

  return (
    <div className="w-full max-w-md mb-4 p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 flex items-center justify-between">
      <div>
        <div className="text-green-300 text-sm font-bold">Install Venn as App</div>
        <div className="text-white/60 text-xs">Faster loading, offline play</div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setDismissed(true); localStorage.setItem('venn_pwa_dismissed', 'true'); }} className="px-3 py-1.5 text-white/40 text-xs">Later</button>
        <button onClick={async () => { await installPWA(); setInstallable(false); }} className="px-4 py-1.5 rounded-lg bg-green-500 text-white text-sm font-semibold">Install</button>
      </div>
    </div>
  );
}
