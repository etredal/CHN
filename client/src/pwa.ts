// Installable-app support: registers the service worker (production builds
// only), tracks the browser's install prompt, and reports waiting updates.
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

let installEvent: BeforeInstallPromptEvent | null = null;
let waitingWorker: ServiceWorker | null = null;

export function registerServiceWorker() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    notify();
  });

  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      const track = (worker: ServiceWorker | null) => {
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            waitingWorker = worker;
            notify();
          }
        });
      };
      if (reg.waiting && navigator.serviceWorker.controller) {
        waitingWorker = reg.waiting;
        notify();
      }
      track(reg.installing);
      reg.addEventListener('updatefound', () => track(reg.installing));
      // Check for a new version whenever the app comes back to the foreground.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    } catch (err) {
      console.warn('Service worker registration failed', err);
    }
  });

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading || !waitingWorker) return;
    reloading = true;
    window.location.reload();
  });
}

export function usePwa() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  return {
    canInstall: installEvent !== null,
    install: async () => {
      if (!installEvent) return;
      await installEvent.prompt();
      await installEvent.userChoice;
      installEvent = null;
      notify();
    },
    updateReady: waitingWorker !== null,
    applyUpdate: () => waitingWorker?.postMessage('SKIP_WAITING'),
  };
}
