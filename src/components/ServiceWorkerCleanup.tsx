'use client';

import { useEffect } from 'react';

export function ServiceWorkerCleanup() {
  useEffect(() => {
    // Aggressive service worker cleanup
    if ('serviceWorker' in navigator) {
      // Unregister all service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then(() => {
            console.log('Service worker unregistered successfully');
          });
        });
      });

      // Clear all caches
      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            caches.delete(cacheName);
          });
        });
      }

      // Override service worker registration to prevent future registrations
      const originalRegister = navigator.serviceWorker.register;
      navigator.serviceWorker.register = function() {
        console.log('Service worker registration blocked');
        return Promise.reject(new Error('Service worker registration is disabled'));
      };
    }
  }, []);

  return null; // This component doesn't render anything
}