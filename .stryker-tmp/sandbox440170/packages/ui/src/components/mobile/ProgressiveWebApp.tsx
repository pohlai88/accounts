// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@aibos/ui/Card";
import { Button } from "@aibos/ui/Button";
import { Badge } from "@aibos/ui/Badge";
import { Alert } from "@aibos/ui/Alert";
import { cn } from "@aibos/ui/utils";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Globe,
  Monitor,
  Smartphone,
  Wifi,
  WifiOff,
  Zap,
  Cloud,
  CloudOff,
  Settings,
  Shield,
  Battery,
  Cpu,
} from "lucide-react";

interface PWAStatus {
  isInstalled: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  lastUpdate: Date | null;
  version: string;
  installPromptShown: boolean;
  canInstall: boolean;
}

interface PWACapabilities {
  offlineSupport: boolean;
  pushNotifications: boolean;
  backgroundSync: boolean;
  cameraAccess: boolean;
  locationAccess: boolean;
  storageAccess: boolean;
  fullscreen: boolean;
  shareTarget: boolean;
}

interface PWAPerformance {
  loadTime: number;
  bundleSize: number;
  cacheSize: number;
  memoryUsage: number;
  batteryImpact: "low" | "medium" | "high";
  networkUsage: number;
}

interface ProgressiveWebAppProps {
  pwaStatus: PWAStatus;
  capabilities: PWACapabilities;
  performance: PWAPerformance;
  onInstall: () => void;
  onUpdate: () => void;
  onUninstall: () => void;
  onEnableCapability: (capability: string) => void;
  onDisableCapability: (capability: string) => void;
  onClearCache: () => void;
  onOptimizePerformance: () => void;
}

export const ProgressiveWebApp: React.FC<ProgressiveWebAppProps> = ({
  pwaStatus,
  capabilities,
  performance,
  onInstall,
  onUpdate,
  onUninstall,
  onEnableCapability,
  onDisableCapability,
  onClearCache,
  onOptimizePerformance,
}) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    await onInstall();
    setIsInstalling(false);
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    await onUpdate();
    setIsUpdating(false);
  };

  const getBatteryImpactColor = (impact: string) => {
    switch (impact) {
      case "low":
        return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
      case "medium":
        return "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10";
      case "high":
        return "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10";
      default:
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--sys-text-primary)]">Progressive Web App</h2>
          <p className="text-[var(--sys-text-secondary)] mt-1">
            Mobile app experience with web technology
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {!pwaStatus.isInstalled && pwaStatus.canInstall && (
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{isInstalling ? "Installing..." : "Install App"}</span>
            </Button>
          )}
          {pwaStatus.hasUpdate && (
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{isUpdating ? "Updating..." : "Update Available"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Installation Status */}
      {!pwaStatus.isInstalled && (
        <Alert variant="default">
          <Download className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Install App for Better Experience</h4>
            <p className="text-sm">
              Install this app on your device for faster access, offline capabilities, and native
              app features.
            </p>
          </div>
        </Alert>
      )}

      {pwaStatus.hasUpdate && (
        <Alert variant="default">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Update Available</h4>
            <p className="text-sm">
              A new version of the app is available with improved features and bug fixes.
            </p>
          </div>
        </Alert>
      )}

      {/* PWA Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Status</div>
              {pwaStatus.isInstalled ? (
                <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
              ) : (
                <Download className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
              )}
            </div>
            <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
              {pwaStatus.isInstalled ? "Installed" : "Not Installed"}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">
              Version {pwaStatus.version}
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Connection</div>
              {pwaStatus.isOnline ? (
                <Wifi className="h-4 w-4 text-[var(--sys-status-success)]" />
              ) : (
                <WifiOff className="h-4 w-4 text-[var(--sys-status-error)]" />
              )}
            </div>
            <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
              {pwaStatus.isOnline ? "Online" : "Offline"}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">
              {pwaStatus.isOnline ? "Connected" : "Disconnected"}
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Load Time</div>
              <Clock className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
              {formatTime(performance.loadTime)}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">Initial load</div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Battery Impact</div>
              <Battery className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
              {performance.batteryImpact.toUpperCase()}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">Power consumption</div>
          </CardContent>
        </Card>
      </div>

      {/* PWA Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>App Capabilities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(capabilities).map(([key, enabled]) => {
              const capabilityNames = {
                offlineSupport: "Offline Support",
                pushNotifications: "Push Notifications",
                backgroundSync: "Background Sync",
                cameraAccess: "Camera Access",
                locationAccess: "Location Access",
                storageAccess: "Storage Access",
                fullscreen: "Fullscreen Mode",
                shareTarget: "Share Target",
              };

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 border border-[var(--sys-border-hairline)] rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        enabled
                          ? "bg-[var(--sys-status-success)]"
                          : "bg-[var(--sys-text-tertiary)]",
                      )}
                    />
                    <span className="text-sm font-medium text-[var(--sys-text-primary)]">
                      {capabilityNames[key as keyof typeof capabilityNames]}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => (enabled ? onDisableCapability(key) : onEnableCapability(key))}
                  >
                    {enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Performance Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-[var(--sys-border-hairline)] rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Monitor className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                <span className="text-sm font-medium text-[var(--sys-text-primary)]">
                  Bundle Size
                </span>
              </div>
              <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {formatBytes(performance.bundleSize)}
              </div>
              <div className="text-xs text-[var(--sys-text-tertiary)]">Initial download</div>
            </div>

            <div className="p-4 border border-[var(--sys-border-hairline)] rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Cloud className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                <span className="text-sm font-medium text-[var(--sys-text-primary)]">
                  Cache Size
                </span>
              </div>
              <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {formatBytes(performance.cacheSize)}
              </div>
              <div className="text-xs text-[var(--sys-text-tertiary)]">Local storage</div>
            </div>

            <div className="p-4 border border-[var(--sys-border-hairline)] rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Cpu className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                <span className="text-sm font-medium text-[var(--sys-text-primary)]">
                  Memory Usage
                </span>
              </div>
              <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {formatBytes(performance.memoryUsage)}
              </div>
              <div className="text-xs text-[var(--sys-text-tertiary)]">RAM consumption</div>
            </div>

            <div className="p-4 border border-[var(--sys-border-hairline)] rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                <span className="text-sm font-medium text-[var(--sys-text-primary)]">
                  Network Usage
                </span>
              </div>
              <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {formatBytes(performance.networkUsage)}
              </div>
              <div className="text-xs text-[var(--sys-text-tertiary)]">Data transferred</div>
            </div>

            <div className="p-4 border border-[var(--sys-border-hairline)] rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Battery className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                <span className="text-sm font-medium text-[var(--sys-text-primary)]">
                  Battery Impact
                </span>
              </div>
              <div
                className={cn(
                  "text-2xl font-bold",
                  getBatteryImpactColor(performance.batteryImpact),
                )}
              >
                {performance.batteryImpact.toUpperCase()}
              </div>
              <div className="text-xs text-[var(--sys-text-tertiary)]">Power efficiency</div>
            </div>

            <div className="p-4 border border-[var(--sys-border-hairline)] rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                <span className="text-sm font-medium text-[var(--sys-text-primary)]">
                  Load Time
                </span>
              </div>
              <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                {formatTime(performance.loadTime)}
              </div>
              <div className="text-xs text-[var(--sys-text-tertiary)]">Time to interactive</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>App Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-[var(--sys-text-primary)]">App Actions</h4>
                <div className="space-y-2">
                  <Button onClick={onClearCache} variant="outline" className="w-full justify-start">
                    <CloudOff className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                  <Button
                    onClick={onOptimizePerformance}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Optimize Performance
                  </Button>
                  {pwaStatus.isInstalled && (
                    <Button
                      onClick={onUninstall}
                      variant="outline"
                      className="w-full justify-start text-[var(--sys-status-error)] hover:text-[var(--sys-status-error)]/80"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Uninstall App
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-[var(--sys-text-primary)]">App Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--sys-text-secondary)]">Version:</span>
                    <span className="text-[var(--sys-text-primary)]">{pwaStatus.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--sys-text-secondary)]">Last Update:</span>
                    <span className="text-[var(--sys-text-primary)]">
                      {pwaStatus.lastUpdate ? pwaStatus.lastUpdate.toLocaleDateString() : "Never"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--sys-text-secondary)]">Install Prompt:</span>
                    <span className="text-[var(--sys-text-primary)]">
                      {pwaStatus.installPromptShown ? "Shown" : "Not Shown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--sys-text-secondary)]">Can Install:</span>
                    <span className="text-[var(--sys-text-primary)]">
                      {pwaStatus.canInstall ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PWA Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>PWA Benefits</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">User Experience</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Fast Loading
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Instant loading with service workers
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Offline Access
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Works without internet connection
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Native Feel
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Feels like a native mobile app
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Push Notifications
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Real-time updates and alerts
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Technical Advantages</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Cross-Platform
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Works on iOS, Android, and desktop
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Auto-Updates
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Updates automatically in background
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">Secure</p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      HTTPS required for PWA features
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">Responsive</p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Adapts to any screen size
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
