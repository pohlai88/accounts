/**
 * Session Security Enhancements
 * Device tracking, suspicious activity detection, and security policies
 */

import { supabase } from "./supabase";

export interface DeviceInfo {
  user_agent: string;
  ip_address: string;
  device_type: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  location?: string;
}

export interface SecurityEvent {
  type: "login" | "logout" | "suspicious_activity" | "password_change" | "email_change";
  device_info: DeviceInfo;
  timestamp: string;
  risk_level: "low" | "medium" | "high";
  details?: any;
}

export class SessionSecurity {
  /**
   * Get device information from browser
   */
  static getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;

    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    );
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent);

    let deviceType: DeviceInfo["device_type"] = "desktop";
    if (isTablet) deviceType = "tablet";
    else if (isMobile) deviceType = "mobile";

    // Detect browser
    let browser = "Unknown";
    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";

    // Detect OS
    let os = "Unknown";
    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iOS")) os = "iOS";

    return {
      user_agent: userAgent,
      ip_address: "", // Will be filled by server
      device_type: deviceType,
      browser,
      os,
    };
  }

  /**
   * Log security event
   */
  static async logSecurityEvent(event: Omit<SecurityEvent, "timestamp">) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("security_events").insert({
        user_id: user.id,
        event_type: event.type,
        device_info: event.device_info,
        risk_level: event.risk_level,
        details: event.details,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }

  /**
   * Check for suspicious login activity
   */
  static async checkSuspiciousActivity(deviceInfo: DeviceInfo): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      // Get recent login events
      const { data: recentEvents } = await supabase
        .from("security_events")
        .select("*")
        .eq("user_id", user.id)
        .eq("event_type", "login")
        .gte("timestamp", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("timestamp", { ascending: false })
        .limit(10);

      if (!recentEvents || recentEvents.length === 0) return false;

      // Check for different devices/locations
      const uniqueDevices = new Set(
        recentEvents.map(
          e => `${e.device_info.browser}-${e.device_info.os}-${e.device_info.device_type}`,
        ),
      );

      // Flag as suspicious if more than 3 different devices in 24h
      if (uniqueDevices.size > 3) {
        await this.logSecurityEvent({
          type: "suspicious_activity",
          device_info: deviceInfo,
          risk_level: "high",
          details: { reason: "Multiple devices in 24h", device_count: uniqueDevices.size },
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to check suspicious activity:", error);
      return false;
    }
  }

  /**
   * Create secure session
   */
  static async createSecureSession() {
    const deviceInfo = this.getDeviceInfo();

    // Check for suspicious activity
    const isSuspicious = await this.checkSuspiciousActivity(deviceInfo);

    // Log login event
    await this.logSecurityEvent({
      type: "login",
      device_info: deviceInfo,
      risk_level: isSuspicious ? "high" : "low",
      details: { suspicious: isSuspicious },
    });

    // Store session info
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_sessions").insert({
        user_id: user.id,
        session_token: crypto.randomUUID(),
        device_info: deviceInfo,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        last_activity: new Date().toISOString(),
      });
    }

    return { isSuspicious, deviceInfo };
  }

  /**
   * Update session activity
   */
  static async updateSessionActivity() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_sessions")
        .update({ last_activity: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_active", true);
    } catch (error) {
      console.error("Failed to update session activity:", error);
    }
  }

  /**
   * Cleanup expired sessions
   */
  static async cleanupExpiredSessions() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_sessions")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .lt("expires_at", new Date().toISOString());
    } catch (error) {
      console.error("Failed to cleanup expired sessions:", error);
    }
  }

  /**
   * Get active sessions for user
   */
  static async getActiveSessions() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: sessions } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .order("last_activity", { ascending: false });

      return sessions || [];
    } catch (error) {
      console.error("Failed to get active sessions:", error);
      return [];
    }
  }

  /**
   * Revoke session
   */
  static async revokeSession(sessionId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_sessions")
        .update({ is_active: false })
        .eq("id", sessionId)
        .eq("user_id", user.id);

      await this.logSecurityEvent({
        type: "logout",
        device_info: this.getDeviceInfo(),
        risk_level: "low",
        details: { session_revoked: sessionId },
      });
    } catch (error) {
      console.error("Failed to revoke session:", error);
    }
  }
}

// Hook for session security
export function useSessionSecurity() {
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveSessions();

    // Update activity every 5 minutes
    const activityInterval = setInterval(
      () => {
        SessionSecurity.updateSessionActivity();
      },
      5 * 60 * 1000,
    );

    // Cleanup expired sessions every hour
    const cleanupInterval = setInterval(
      () => {
        SessionSecurity.cleanupExpiredSessions();
      },
      60 * 60 * 1000,
    );

    return () => {
      clearInterval(activityInterval);
      clearInterval(cleanupInterval);
    };
  }, []);

  const loadActiveSessions = async () => {
    setLoading(true);
    try {
      const sessions = await SessionSecurity.getActiveSessions();
      setActiveSessions(sessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    await SessionSecurity.revokeSession(sessionId);
    await loadActiveSessions();
  };

  return {
    activeSessions,
    loading,
    revokeSession,
    refreshSessions: loadActiveSessions,
  };
}

// Add missing import
import { useState, useEffect } from "react";
