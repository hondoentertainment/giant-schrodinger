let deferredPrompt = null;

const DISMISS_KEY = 'vwf_pwa_dismissed';

export function initPWAInstall() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new Event('pwa-installable'));
  });
}

export function canInstallPWA() { return !!deferredPrompt; }

export async function installPWA() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === 'accepted';
}

export function isStandaloneDisplay(win = typeof window !== 'undefined' ? window : undefined) {
  if (!win) return false;
  if (win.Capacitor?.isNativePlatform?.()) return true;
  if (win.navigator?.standalone === true) return true;
  return Boolean(win.matchMedia?.('(display-mode: standalone)')?.matches);
}

export function isLikelyIosSafari(win = typeof window !== 'undefined' ? window : undefined) {
  if (!win?.navigator) return false;
  const ua = win.navigator.userAgent || '';
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  const iPadOs = win.navigator.platform === 'MacIntel' && (win.navigator.maxTouchPoints || 0) > 1;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/.test(ua);
  return (iOSDevice || iPadOs) && isSafari;
}

export function isPwaTipDismissed(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  try {
    return storage?.getItem(DISMISS_KEY) === 'true';
  } catch {
    return false;
  }
}

export function dismissPwaTip(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  try {
    storage?.setItem(DISMISS_KEY, 'true');
    return true;
  } catch {
    return false;
  }
}

/**
 * After the first completed session: Chrome install prompt, or a quiet
 * iOS “Add to Home Screen” tip. Never shown in standalone / native.
 */
export function shouldOfferHomeScreenTip({
  roundsPlayed = 0,
  minRounds = 1,
  win = typeof window !== 'undefined' ? window : undefined,
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
} = {}) {
  if (roundsPlayed < minRounds) return false;
  if (isPwaTipDismissed(storage)) return false;
  if (isStandaloneDisplay(win)) return false;
  return canInstallPWA() || isLikelyIosSafari(win);
}

export function homeScreenTipCopy(win = typeof window !== 'undefined' ? window : undefined) {
  if (isLikelyIosSafari(win) && !canInstallPWA()) {
    return {
      title: 'Add Venn to your Home Screen',
      body: 'Tap Share, then Add to Home Screen. Opens full-screen next time — no App Store wait.',
      action: null,
    };
  }
  return {
    title: 'Add Venn to your home screen',
    body: 'Launch like a native game — faster loads and full-screen play.',
    action: 'Install',
  };
}
