// Admin Settings API - Demonstrates enhanced permission system integration
// Uses existing patterns with new admin configuration capabilities

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertPermission, getEnhancedUserContext } from "@aibos/utils";
import { createServiceClient } from "@aibos/utils";
import { getV1AuditService, createV1AuditContext } from "@aibos/utils";

// Validation schemas
const UpdateFeatureFlagsSchema = z.object({
  attachments: z.boolean().optional(),
  reports: z.boolean().optional(),
  ar: z.boolean().optional(),
  ap: z.boolean().optional(),
  je: z.boolean().optional(),
  regulated_mode: z.boolean().optional(),
});

const UpdatePolicySettingsSchema = z.object({
  approval_threshold_rm: z.number().min(0).optional(),
  export_requires_reason: z.boolean().optional(),
  mfa_required_for_admin: z.boolean().optional(),
  session_timeout_minutes: z.number().min(30).max(1440).optional(),
});

/**
 * GET /api/admin/settings - Get current admin settings
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Check admin access permission
    await assertPermission(request, "admin:access");

    // 2. Get enhanced user context with current settings
    const userContext = await getEnhancedUserContext(request);

    // 3. Audit log the access
    const auditService = getV1AuditService();
    const auditContext = createV1AuditContext(request);

    await auditService.logOperation(auditContext, {
      operation: "admin_settings_view",
      data: {
        tenantId: userContext.tenantId,
        companyId: userContext.companyId,
        userId: userContext.id,
      },
    });

    // 4. Return current settings
    return NextResponse.json({
      success: true,
      data: {
        featureFlags: userContext.featureFlags,
        policySettings: userContext.policySettings,
        userRoles: userContext.roles,
      },
    });
  } catch (error) {
    // Log admin settings error to monitoring service
    if ((process.env.NODE_ENV as string) === 'development') {
      // eslint-disable-next-line no-console
      console.error("Failed to get admin settings:", error);
    }

    if ((error as Error & { status?: number }).status === 403) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: "authorization_error",
            title: "Forbidden",
            status: 403,
            code: "INSUFFICIENT_PERMISSIONS",
            detail: (error as Error).message,
          },
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: false,
      error: {
        type: "internal_error",
        title: "Internal server error",
        status: 500,
        code: "INTERNAL_ERROR",
        detail: "An unexpected error occurred",
      },
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }, { status: 500 });
  }
}

/**
 * PUT /api/admin/settings/features - Update feature flags
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Check admin configuration permission
    await assertPermission(request, "admin:configure");

    // 2. Parse and validate request body
    const body = await request.json();
    const updates = UpdateFeatureFlagsSchema.parse(body);

    // 3. Get user context
    const userContext = await getEnhancedUserContext(request);
    const supabase = createServiceClient();

    // 4. Update feature flags in database
    const { error: updateError } = await supabase
      .from("tenants")
      .update({
        feature_flags: {
          ...userContext.featureFlags,
          ...updates,
        },
      })
      .eq("id", userContext.tenantId);

    if (updateError) {
      throw new Error(`Failed to update feature flags: ${updateError.message}`);
    }

    // 5. Audit log the change
    const auditService = getV1AuditService();
    const auditContext = createV1AuditContext(request);

    await auditService.logOperation(auditContext, {
      operation: "admin_feature_flags_updated",
      data: {
        tenantId: userContext.tenantId,
        userId: userContext.id,
        changes: updates,
        previousFlags: userContext.featureFlags,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Feature flags updated successfully",
      data: {
        featureFlags: {
          ...userContext.featureFlags,
          ...updates,
        },
      },
    });
  } catch (error) {
    // Log feature flags update error to monitoring service
    if ((process.env.NODE_ENV as string) === 'development') {
      // eslint-disable-next-line no-console
      console.error("Failed to update feature flags:", error);
    }

    if ((error as Error & { status?: number }).status === 403) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: "authorization_error",
            title: "Forbidden",
            status: 403,
            code: "INSUFFICIENT_PERMISSIONS",
            detail: (error as Error).message,
          },
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
        { status: 403 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: "validation_error",
            title: "Invalid request data",
            status: 400,
            code: "VALIDATION_ERROR",
            detail: "Please check your request format",
            errors: error.issues.reduce(
              (acc, err) => {
                acc[err.path.join(".")] = [err.message];
                return acc;
              },
              {} as Record<string, string[]>,
            ),
          },
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: false,
      error: {
        type: "internal_error",
        title: "Internal server error",
        status: 500,
        code: "INTERNAL_ERROR",
        detail: "An unexpected error occurred",
      },
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/settings/policies - Update policy settings
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Check admin configuration permission
    await assertPermission(request, "admin:configure");

    // 2. Parse and validate request body
    const body = await request.json();
    const updates = UpdatePolicySettingsSchema.parse(body);

    // 3. Get user context
    const userContext = await getEnhancedUserContext(request);
    const supabase = createServiceClient();

    // 4. Update policy settings in database
    const { error: updateError } = await supabase
      .from("companies")
      .update({
        policy_settings: {
          ...userContext.policySettings,
          ...updates,
        },
      })
      .eq("id", userContext.companyId);

    if (updateError) {
      throw new Error(`Failed to update policy settings: ${updateError.message}`);
    }

    // 5. Audit log the change
    const auditService = getV1AuditService();
    const auditContext = createV1AuditContext(request);

    await auditService.logOperation(auditContext, {
      operation: "admin_policy_settings_updated",
      data: {
        companyId: userContext.companyId,
        userId: userContext.id,
        changes: updates,
        previousSettings: userContext.policySettings,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Policy settings updated successfully",
      data: {
        policySettings: {
          ...userContext.policySettings,
          ...updates,
        },
      },
    });
  } catch (error) {
    // Log policy settings update error to monitoring service
    if ((process.env.NODE_ENV as string) === 'development') {
      // eslint-disable-next-line no-console
      console.error("Failed to update policy settings:", error);
    }

    if ((error as Error & { status?: number }).status === 403) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: "authorization_error",
            title: "Forbidden",
            status: 403,
            code: "INSUFFICIENT_PERMISSIONS",
            detail: (error as Error).message,
          },
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
        { status: 403 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: "validation_error",
            title: "Invalid request data",
            status: 400,
            code: "VALIDATION_ERROR",
            detail: "Please check your request format",
            errors: error.issues.reduce(
              (acc, err) => {
                acc[err.path.join(".")] = [err.message];
                return acc;
              },
              {} as Record<string, string[]>,
            ),
          },
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: false,
      error: {
        type: "internal_error",
        title: "Internal server error",
        status: 500,
        code: "INTERNAL_ERROR",
        detail: "An unexpected error occurred",
      },
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }, { status: 500 });
  }
}
