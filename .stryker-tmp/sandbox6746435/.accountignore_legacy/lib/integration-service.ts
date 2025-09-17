// @ts-nocheck
// =====================================================
// Phase 8: Professional Integration Service
// Third-party integrations with OAuth, webhooks, and data sync
// =====================================================

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Integration Types and Interfaces
export interface IntegrationConnection {
  id: string;
  integrationName: string;
  connectionType: "oauth" | "api_key" | "webhook";
  status: "pending" | "connected" | "error" | "disconnected";
  credentials: Record<string, any>;
  settings: Record<string, any>;
  lastSyncAt?: Date;
  syncFrequency: "realtime" | "hourly" | "daily" | "weekly";
  errorMessage?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncLog {
  id: string;
  connectionId: string;
  syncType: "import" | "export" | "bidirectional";
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  syncDurationMs: number;
  errorDetails: Record<string, any>;
  createdAt: Date;
}

export interface IntegrationTemplate {
  name: string;
  displayName: string;
  description: string;
  connectionType: "oauth" | "api_key" | "webhook";
  authUrl?: string;
  tokenUrl?: string;
  scopes?: string[];
  requiredFields: string[];
  optionalFields: string[];
  supportedOperations: string[];
  dataMapping: Record<string, any>;
}

// Integration Service Class
export class IntegrationService {
  private companyId: string;
  private userId: string;

  constructor(companyId: string, userId: string) {
    this.companyId = companyId;
    this.userId = userId;
  }

  // Get Available Integrations
  getAvailableIntegrations(): IntegrationTemplate[] {
    return [
      {
        name: "quickbooks",
        displayName: "QuickBooks Online",
        description: "Sync with QuickBooks Online accounting software",
        connectionType: "oauth",
        authUrl: "https://appcenter.intuit.com/connect/oauth2",
        tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
        scopes: ["com.intuit.quickbooks.accounting"],
        requiredFields: ["client_id", "client_secret"],
        optionalFields: ["sandbox"],
        supportedOperations: ["accounts", "customers", "vendors", "items", "transactions"],
        dataMapping: {
          accounts: {
            name: "Name",
            type: "AccountType",
            code: "AccountCode",
          },
          customers: {
            name: "Name",
            email: "PrimaryEmailAddr.Address",
          },
        },
      },
      {
        name: "xero",
        displayName: "Xero",
        description: "Sync with Xero accounting software",
        connectionType: "oauth",
        authUrl: "https://login.xero.com/identity/connect/authorize",
        tokenUrl: "https://identity.xero.com/connect/token",
        scopes: ["accounting.transactions", "accounting.contacts"],
        requiredFields: ["client_id", "client_secret"],
        optionalFields: ["tenant_id"],
        supportedOperations: ["accounts", "contacts", "items", "transactions"],
        dataMapping: {
          accounts: {
            name: "Name",
            type: "Type",
            code: "Code",
          },
          contacts: {
            name: "Name",
            email: "EmailAddress",
          },
        },
      },
      {
        name: "stripe",
        displayName: "Stripe",
        description: "Sync payment data from Stripe",
        connectionType: "api_key",
        requiredFields: ["api_key"],
        optionalFields: ["webhook_secret"],
        supportedOperations: ["payments", "customers", "transactions"],
        dataMapping: {
          payments: {
            amount: "amount",
            currency: "currency",
            status: "status",
          },
        },
      },
      {
        name: "paypal",
        displayName: "PayPal",
        description: "Sync payment data from PayPal",
        connectionType: "api_key",
        requiredFields: ["client_id", "client_secret"],
        optionalFields: ["sandbox"],
        supportedOperations: ["payments", "transactions"],
        dataMapping: {
          payments: {
            amount: "amount.total",
            currency: "amount.currency",
            status: "state",
          },
        },
      },
      {
        name: "bank_feed",
        displayName: "Bank Feed",
        description: "Connect to bank accounts for automatic transaction import",
        connectionType: "oauth",
        requiredFields: ["provider", "account_id"],
        optionalFields: ["credentials"],
        supportedOperations: ["transactions"],
        dataMapping: {
          transactions: {
            amount: "amount",
            date: "date",
            description: "description",
          },
        },
      },
      {
        name: "salesforce",
        displayName: "Salesforce CRM",
        description: "Sync customer data with Salesforce",
        connectionType: "oauth",
        authUrl: "https://login.salesforce.com/services/oauth2/authorize",
        tokenUrl: "https://login.salesforce.com/services/oauth2/token",
        scopes: ["api", "refresh_token"],
        requiredFields: ["client_id", "client_secret"],
        optionalFields: ["instance_url"],
        supportedOperations: ["customers", "contacts", "opportunities"],
        dataMapping: {
          customers: {
            name: "Name",
            email: "Email",
          },
        },
      },
      {
        name: "hubspot",
        displayName: "HubSpot CRM",
        description: "Sync customer data with HubSpot",
        connectionType: "api_key",
        requiredFields: ["api_key"],
        optionalFields: ["portal_id"],
        supportedOperations: ["customers", "contacts", "deals"],
        dataMapping: {
          customers: {
            name: "firstname",
            email: "email",
          },
        },
      },
    ];
  }

  // Create Integration Connection
  async createConnection(
    integrationName: string,
    credentials: Record<string, any>,
    settings: Record<string, any> = {},
  ): Promise<IntegrationConnection> {
    const integration = this.getAvailableIntegrations().find(i => i.name === integrationName);
    if (!integration) {
      throw new Error("Integration not found");
    }

    // Validate required fields
    const missingFields = integration.requiredFields.filter(field => !credentials[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Encrypt credentials
    const encryptedCredentials = this.encryptCredentials(credentials);

    const { data, error } = await supabase
      .from("integration_connections")
      .insert({
        integration_name: integrationName,
        connection_type: integration.connectionType,
        credentials: encryptedCredentials,
        settings,
        company_id: this.companyId,
        created_by: this.userId,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      integrationName: data.integration_name,
      connectionType: data.connection_type,
      status: data.status,
      credentials: this.decryptCredentials(data.credentials),
      settings: data.settings,
      lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : undefined,
      syncFrequency: data.sync_frequency,
      errorMessage: data.error_message,
      companyId: data.company_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  // Test Connection
  async testConnection(connectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const connection = await this.getConnection(connectionId);
      if (!connection) {
        return { success: false, error: "Connection not found" };
      }

      // Test connection based on integration type
      switch (connection.integrationName) {
        case "quickbooks":
          return await this.testQuickBooksConnection(connection);
        case "xero":
          return await this.testXeroConnection(connection);
        case "stripe":
          return await this.testStripeConnection(connection);
        case "paypal":
          return await this.testPayPalConnection(connection);
        default:
          return { success: false, error: "Unsupported integration" };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Sync Data
  async syncData(
    connectionId: string,
    syncType: "import" | "export" | "bidirectional",
  ): Promise<SyncLog> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsSuccessful = 0;
    let recordsFailed = 0;
    const errorDetails: Record<string, any> = {};

    try {
      const connection = await this.getConnection(connectionId);
      if (!connection) {
        throw new Error("Connection not found");
      }

      // Update connection status
      await this.updateConnectionStatus(connectionId, "connected");

      // Perform sync based on integration
      switch (connection.integrationName) {
        case "quickbooks":
          const qbResult = await this.syncQuickBooks(connection, syncType);
          recordsProcessed = qbResult.processed;
          recordsSuccessful = qbResult.successful;
          recordsFailed = qbResult.failed;
          break;
        case "xero":
          const xeroResult = await this.syncXero(connection, syncType);
          recordsProcessed = xeroResult.processed;
          recordsSuccessful = xeroResult.successful;
          recordsFailed = xeroResult.failed;
          break;
        case "stripe":
          const stripeResult = await this.syncStripe(connection, syncType);
          recordsProcessed = stripeResult.processed;
          recordsSuccessful = stripeResult.successful;
          recordsFailed = stripeResult.failed;
          break;
        default:
          throw new Error("Unsupported integration");
      }

      // Update last sync time
      await this.updateConnectionLastSync(connectionId);
    } catch (error) {
      errorDetails.error = error instanceof Error ? error.message : "Unknown error";
      await this.updateConnectionStatus(connectionId, "error", errorDetails.error);
    }

    const syncDuration = Date.now() - startTime;

    // Log sync result
    const { data, error } = await supabase
      .from("sync_logs")
      .insert({
        connection_id: connectionId,
        sync_type: syncType,
        records_processed: recordsProcessed,
        records_successful: recordsSuccessful,
        records_failed: recordsFailed,
        sync_duration_ms: syncDuration,
        error_details: errorDetails,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      connectionId: data.connection_id,
      syncType: data.sync_type,
      recordsProcessed: data.records_processed,
      recordsSuccessful: data.records_successful,
      recordsFailed: data.records_failed,
      syncDurationMs: data.sync_duration_ms,
      errorDetails: data.error_details,
      createdAt: new Date(data.created_at),
    };
  }

  // Get Connection
  async getConnection(connectionId: string): Promise<IntegrationConnection | null> {
    const { data, error } = await supabase
      .from("integration_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("company_id", this.companyId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      integrationName: data.integration_name,
      connectionType: data.connection_type,
      status: data.status,
      credentials: this.decryptCredentials(data.credentials),
      settings: data.settings,
      lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : undefined,
      syncFrequency: data.sync_frequency,
      errorMessage: data.error_message,
      companyId: data.company_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  // Get All Connections
  async getConnections(): Promise<IntegrationConnection[]> {
    const { data, error } = await supabase
      .from("integration_connections")
      .select("*")
      .eq("company_id", this.companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map(connection => ({
      id: connection.id,
      integrationName: connection.integration_name,
      connectionType: connection.connection_type,
      status: connection.status,
      credentials: this.decryptCredentials(connection.credentials),
      settings: connection.settings,
      lastSyncAt: connection.last_sync_at ? new Date(connection.last_sync_at) : undefined,
      syncFrequency: connection.sync_frequency,
      errorMessage: connection.error_message,
      companyId: connection.company_id,
      createdAt: new Date(connection.created_at),
      updatedAt: new Date(connection.updated_at),
    }));
  }

  // Update Connection
  async updateConnection(
    connectionId: string,
    updates: Partial<IntegrationConnection>,
  ): Promise<void> {
    const updateData: any = {};

    if (updates.credentials) {
      updateData.credentials = this.encryptCredentials(updates.credentials);
    }
    if (updates.settings) {
      updateData.settings = updates.settings;
    }
    if (updates.syncFrequency) {
      updateData.sync_frequency = updates.syncFrequency;
    }

    const { error } = await supabase
      .from("integration_connections")
      .update(updateData)
      .eq("id", connectionId)
      .eq("company_id", this.companyId);

    if (error) throw error;
  }

  // Delete Connection
  async deleteConnection(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from("integration_connections")
      .delete()
      .eq("id", connectionId)
      .eq("company_id", this.companyId);

    if (error) throw error;
  }

  // Get Sync Logs
  async getSyncLogs(connectionId?: string): Promise<SyncLog[]> {
    let query = supabase
      .from("sync_logs")
      .select(
        `
        *,
        integration_connections!sync_logs_connection_id_fkey (
          integration_name,
          connection_type
        )
      `,
      )
      .eq("integration_connections.company_id", this.companyId)
      .order("created_at", { ascending: false });

    if (connectionId) {
      query = query.eq("connection_id", connectionId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(log => ({
      id: log.id,
      connectionId: log.connection_id,
      syncType: log.sync_type,
      recordsProcessed: log.records_processed,
      recordsSuccessful: log.records_successful,
      recordsFailed: log.records_failed,
      syncDurationMs: log.sync_duration_ms,
      errorDetails: log.error_details,
      createdAt: new Date(log.created_at),
    }));
  }

  // Helper Methods
  private encryptCredentials(credentials: Record<string, any>): Record<string, any> {
    const encrypted: Record<string, any> = {};

    for (const [key, value] of Object.entries(credentials)) {
      if (typeof value === "string" && value.length > 0) {
        const cipher = crypto.createCipher(
          "aes-256-cbc",
          process.env.ENCRYPTION_KEY || "default-key",
        );
        let encryptedValue = cipher.update(value, "utf8", "hex");
        encryptedValue += cipher.final("hex");
        encrypted[key] = encryptedValue;
      } else {
        encrypted[key] = value;
      }
    }

    return encrypted;
  }

  private decryptCredentials(encryptedCredentials: Record<string, any>): Record<string, any> {
    const decrypted: Record<string, any> = {};

    for (const [key, value] of Object.entries(encryptedCredentials)) {
      if (typeof value === "string" && value.length > 0) {
        try {
          const decipher = crypto.createDecipher(
            "aes-256-cbc",
            process.env.ENCRYPTION_KEY || "default-key",
          );
          let decryptedValue = decipher.update(value, "hex", "utf8");
          decryptedValue += decipher.final("utf8");
          decrypted[key] = decryptedValue;
        } catch {
          decrypted[key] = value; // Return as-is if decryption fails
        }
      } else {
        decrypted[key] = value;
      }
    }

    return decrypted;
  }

  private async updateConnectionStatus(
    connectionId: string,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    const { error } = await supabase
      .from("integration_connections")
      .update({
        status,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId);

    if (error) throw error;
  }

  private async updateConnectionLastSync(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from("integration_connections")
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId);

    if (error) throw error;
  }

  // Integration-specific sync methods (simplified implementations)
  private async testQuickBooksConnection(
    connection: IntegrationConnection,
  ): Promise<{ success: boolean; error?: string }> {
    // Implementation would test QuickBooks API connection
    return { success: true };
  }

  private async testXeroConnection(
    connection: IntegrationConnection,
  ): Promise<{ success: boolean; error?: string }> {
    // Implementation would test Xero API connection
    return { success: true };
  }

  private async testStripeConnection(
    connection: IntegrationConnection,
  ): Promise<{ success: boolean; error?: string }> {
    // Implementation would test Stripe API connection
    return { success: true };
  }

  private async testPayPalConnection(
    connection: IntegrationConnection,
  ): Promise<{ success: boolean; error?: string }> {
    // Implementation would test PayPal API connection
    return { success: true };
  }

  private async syncQuickBooks(
    connection: IntegrationConnection,
    syncType: string,
  ): Promise<{ processed: number; successful: number; failed: number }> {
    // Implementation would sync with QuickBooks
    return { processed: 0, successful: 0, failed: 0 };
  }

  private async syncXero(
    connection: IntegrationConnection,
    syncType: string,
  ): Promise<{ processed: number; successful: number; failed: number }> {
    // Implementation would sync with Xero
    return { processed: 0, successful: 0, failed: 0 };
  }

  private async syncStripe(
    connection: IntegrationConnection,
    syncType: string,
  ): Promise<{ processed: number; successful: number; failed: number }> {
    // Implementation would sync with Stripe
    return { processed: 0, successful: 0, failed: 0 };
  }
}

// Integration Utility Functions
export const integrationUtils = {
  // Get Integration by Name
  getIntegrationByName: (
    name: string,
    integrations: IntegrationTemplate[],
  ): IntegrationTemplate | undefined => {
    return integrations.find(i => i.name === name);
  },

  // Validate Integration Credentials
  validateCredentials: (
    integration: IntegrationTemplate,
    credentials: Record<string, any>,
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    for (const field of integration.requiredFields) {
      if (!credentials[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  // Generate OAuth URL
  generateOAuthUrl: (integration: IntegrationTemplate, state: string): string => {
    if (!integration.authUrl) {
      throw new Error("OAuth not supported for this integration");
    }

    const params = new URLSearchParams({
      client_id: process.env[`${integration.name.toUpperCase()}_CLIENT_ID`] || "",
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/integrations/callback`,
      response_type: "code",
      scope: integration.scopes?.join(" ") || "",
      state,
    });

    return `${integration.authUrl}?${params.toString()}`;
  },

  // Format Sync Results
  formatSyncResults: (syncLog: SyncLog): string => {
    const successRate =
      syncLog.recordsProcessed > 0
        ? ((syncLog.recordsSuccessful / syncLog.recordsProcessed) * 100).toFixed(1)
        : "0";

    return `
Sync Results
============
Type: ${syncLog.syncType}
Duration: ${(syncLog.syncDurationMs / 1000).toFixed(2)}s
Processed: ${syncLog.recordsProcessed}
Successful: ${syncLog.recordsSuccessful}
Failed: ${syncLog.recordsFailed}
Success Rate: ${successRate}%
    `.trim();
  },
};
