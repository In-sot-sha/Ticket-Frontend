/**
 * InstallPrompt
 *
 * Shows an "Add to home screen" banner:
 *  - Android Chrome: uses the native beforeinstallprompt event
 *  - iOS Safari:     shows manual instructions (iOS doesn't support the event)
 *
 * Dismissed state is persisted in localStorage so it doesn't nag on every visit.
 */
import React, { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

type Platform = 'android' | 'ios' | null;

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return null;
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

const DISMISSED_KEY = 'pwa_install_dismissed';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform]             = useState<Platform>(null);
  const [visible, setVisible]               = useState(false);

  useEffect(() => {
    // Don't show if already installed or user already dismissed
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const p = detectPlatform();
    setPlatform(p);

    if (p === 'android') {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setVisible(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }

    if (p === 'ios') {
      // iOS: show the manual instructions banner after a short delay
      const t = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      dismiss();
    }
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[60] md:left-auto md:right-6 md:max-w-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-start gap-3 animate-in slide-in-from-bottom-3 duration-300">
        {/* App icon */}
        <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 40 40" className="w-6 h-6 fill-white" aria-hidden="true">
            {/* Simplified ticket shape */}
            <rect x="6" y="14" width="28" height="12" rx="2.5"/>
            <circle cx="6"  cy="20" r="2.5" fill="#f43f5e"/>
            <circle cx="34" cy="20" r="2.5" fill="#f43f5e"/>
            <rect x="20.5" y="14" width="1.5" height="4"   fill="#f43f5e" opacity=".4"/>
            <rect x="20.5" y="22" width="1.5" height="4"   fill="#f43f5e" opacity=".4"/>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-neutral-900 dark:text-white">Install Eventify</p>
          {platform === 'android' && (
            <>
              <p className="text-xs text-neutral-500 mt-0.5">Add to your home screen for quick access and offline use.</p>
              <button
                onClick={install}
                className="mt-2.5 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all active:scale-[0.98]"
              >
                <Download className="h-3.5 w-3.5" /> Add to home screen
              </button>
            </>
          )}
          {platform === 'ios' && (
            <>
              <p className="text-xs text-neutral-500 mt-0.5">
                Tap <Share className="inline h-3.5 w-3.5 text-blue-500 mx-0.5" /> then{' '}
                <strong className="text-neutral-700 dark:text-neutral-300">"Add to Home Screen"</strong> for the best experience.
              </p>
            </>
          )}
        </div>

        <button
          onClick={dismiss}
          className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 shrink-0 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
