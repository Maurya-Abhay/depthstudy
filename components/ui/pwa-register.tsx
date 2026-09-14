'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        registration = reg;

        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;

          worker.addEventListener('statechange', () => {
            if (
              worker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              window.dispatchEvent(
                new CustomEvent('depth-study:update-ready')
              );
            }
          });
        });
      })
      .catch(() => undefined);

    return () => {
      registration?.update().catch(() => undefined);
    };
  }, []);

  return null;
}