// @ts-nocheck
// =====================================================
// Phase 9: PWA Provider Component
// Service worker registration and PWA management
// =====================================================

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface PWAContextType {
  isOnline: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  updateAvailable: boolean;
  install: () => Promise<boolean>;
  update: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check if app is already installed
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }
  }, []);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(registration => {
          console.log("Service Worker registered successfully:", registration);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch(error => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Install function
  const install = async (): Promise<boolean> => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return outcome === "accepted";
    }
    return false;
  };

  // Update function
  const update = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
          window.location.reload();
        }
      });
    }
  };

  const value: PWAContextType = {
    isOnline,
    isInstalled,
    isInstallable,
    updateAvailable,
    install,
    update,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

// PWA Update Notification Component
export function PWAUpdateNotification() {
  const { updateAvailable, update } = usePWA();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-blue-500 text-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold">🔄</span>
          </div>
          <div>
            <p className="font-semibold">Update Available</p>
            <p className="text-sm opacity-90">A new version is ready to install</p>
          </div>
        </div>
        <button
          onClick={update}
          className="bg-white text-blue-500 px-4 py-2 rounded-md font-semibold hover:bg-white/90 transition-colors"
        >
          Update
        </button>
      </div>
    </div>
  );
}

// PWA Status Component
export function PWAStatus() {
  const { isOnline, isInstalled, isInstallable } = usePWA();

  return (
    <div className="fixed top-4 right-4 z-40 space-y-2">
      {/* Online/Offline Status */}
      <div
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {isOnline ? "Online" : "Offline"}
      </div>

      {/* PWA Status */}
      {isInstalled && (
        <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          PWA Installed
        </div>
      )}

      {isInstallable && !isInstalled && (
        <div className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Installable
        </div>
      )}
    </div>
  );
}
