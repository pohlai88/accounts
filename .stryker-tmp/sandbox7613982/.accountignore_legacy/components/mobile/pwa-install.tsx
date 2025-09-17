// @ts-nocheck
// =====================================================
// Phase 9: PWA Installation Component
// Progressive Web App installation prompts and management
// =====================================================

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  X,
  Smartphone,
  Monitor,
  Wifi,
  Battery,
  CheckCircle,
  AlertCircle,
  Info,
  ExternalLink,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export function PWAInstall({ onInstall, onDismiss }: PWAInstallProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installSource, setInstallSource] = useState<"browser" | "manual" | null>(null);

  useEffect(() => {
    // Check if app is already installed
    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      setInstallSource("browser");
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      onInstall?.();
    };

    // Listen for install prompt dismissal
    const handleInstallPromptDismissed = () => {
      setShowInstallPrompt(false);
      onDismiss?.();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Show install prompt after a delay (if not already shown)
    const timer = setTimeout(() => {
      if (isInstallable && !isInstalled) {
        setShowInstallPrompt(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(timer);
    };
  }, [isInstallable, isInstalled, onInstall, onDismiss]);

  const checkIfInstalled = () => {
    // Check if running as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if running in standalone mode on iOS
    if ((window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Check if app is bookmarked (heuristic)
    if (window.matchMedia("(display-mode: minimal-ui)").matches) {
      setIsInstalled(true);
      return;
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      // Fallback for manual installation
      setInstallSource("manual");
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    onDismiss?.();
  };

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes("chrome")) {
      return {
        browser: "Chrome",
        steps: [
          "Click the three dots menu (⋮) in your browser",
          'Select "Install Modern Accounting" or "Add to Home Screen"',
          'Click "Install" when prompted',
        ],
      };
    } else if (userAgent.includes("firefox")) {
      return {
        browser: "Firefox",
        steps: [
          "Click the three lines menu (☰) in your browser",
          'Select "Install" or "Add to Home Screen"',
          'Click "Add" when prompted',
        ],
      };
    } else if (userAgent.includes("safari")) {
      return {
        browser: "Safari",
        steps: [
          "Tap the Share button (□↗) in Safari",
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to confirm',
        ],
      };
    } else if (userAgent.includes("edge")) {
      return {
        browser: "Edge",
        steps: [
          "Click the three dots menu (⋯) in your browser",
          'Select "Apps" then "Install this site as an app"',
          'Click "Install" when prompted',
        ],
      };
    } else {
      return {
        browser: "Your Browser",
        steps: [
          "Look for an install option in your browser menu",
          "Or add this page to your bookmarks",
          'Enable "Add to Home Screen" if available',
        ],
      };
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Don't show if not installable and not manual
  if (!isInstallable && !installSource) {
    return null;
  }

  return (
    <>
      {/* Install Prompt Banner */}
      {showInstallPrompt && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Download className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">Install Modern Accounting</p>
                <p className="text-sm opacity-90">Get the full app experience</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="bg-white text-blue-600 hover:bg-white/90"
              >
                Install
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Install Instructions */}
      {installSource === "manual" && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Install App
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setInstallSource(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Install Modern Accounting for a better experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Installation Instructions</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Follow these steps to install the app on your device
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center">
                  <Smartphone className="h-4 w-4 mr-2" />
                  {getInstallInstructions().browser}
                </h4>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  {getInstallInstructions().steps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Benefits of Installing</p>
                    <ul className="text-sm text-green-700 mt-1 space-y-1">
                      <li>• Faster loading and better performance</li>
                      <li>• Works offline for basic features</li>
                      <li>• Native app-like experience</li>
                      <li>• Push notifications for important updates</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={() => setInstallSource(null)} variant="outline" className="flex-1">
                  Maybe Later
                </Button>
                <Button onClick={() => setInstallSource(null)} className="flex-1">
                  Got It
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PWA Status Indicator */}
      {!isInstalled && (
        <div className="fixed bottom-20 right-4 z-40">
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
          >
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
        </div>
      )}

      {/* PWA Features Info */}
      <div className="hidden md:block">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              PWA Features
            </CardTitle>
            <CardDescription>Modern Accounting works as a Progressive Web App</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm">Offline Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <Battery className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Battery Efficient</span>
              </div>
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Mobile Optimized</span>
              </div>
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Cross Platform</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Hook for PWA installation
export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return outcome === "accepted";
    }
    return false;
  };

  return {
    isInstallable,
    isInstalled,
    install,
  };
}
