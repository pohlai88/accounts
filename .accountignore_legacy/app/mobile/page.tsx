// =====================================================
// Phase 9: Mobile Main Page
// Mobile-optimized main page with PWA features
// =====================================================

"use client";

import React, { useState, useEffect } from "react";
import { MobileDashboard } from "@/components/mobile/mobile-dashboard";
import { PWAInstall } from "@/components/mobile/pwa-install";
import { usePWAInstall } from "@/components/mobile/pwa-install";

export default function MobilePage() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

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

  // Show install prompt after delay
  useEffect(() => {
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  return (
    <div className="min-h-screen bg-background">
      {/* PWA Install Component */}
      <PWAInstall
        onInstall={() => {
          console.log("App installed successfully");
          setShowInstallPrompt(false);
        }}
        onDismiss={() => {
          console.log("Install prompt dismissed");
          setShowInstallPrompt(false);
        }}
      />

      {/* Mobile Dashboard */}
      <MobileDashboard companyId="demo-company-id" userId="demo-user-id" />

      {/* PWA Status Indicator */}
      {!isInstalled && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Install App</span>
            </div>
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-yellow-900 rounded-full animate-pulse"></div>
            <span>You're offline. Some features may be limited.</span>
          </div>
        </div>
      )}
    </div>
  );
}
