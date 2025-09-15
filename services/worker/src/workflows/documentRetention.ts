import { inngest } from "../inngestClient.js";
import { createServiceClient, logger, getV1AuditService, createV1AuditContext } from "@aibos/utils";
import type { V1AuditAuditContext, V1AuditAuditEvent } from "@aibos/utils/types";
// Note: These types will be used when implementing full document retention
// import { RetentionPolicyReq, ApplyRetentionPolicyReq, RetentionStatusRes } from "@aibos/contracts";

// V1 Document Retention System with Compliance-based Policies
// Supports automated retention, legal holds, and compliance reporting

export const documentRetentionPolicy = inngest.createFunction(
  {
    id: "document-retention-policy",
    name: "Document Retention Policy Management",
    retries: 3,
  },
  { event: "retention/policy.create" },
  async ({ event, step }: WorkflowArgs) => {
    const {
      tenantId,
      companyId,
      policyName,
      description,
      retentionPeriod,
      category,
      entityType,
      actionAfterRetention = "archive",
      notifyBeforeExpiry = 30,
      legalHoldOverride = false,
      complianceNotes,
      effectiveFrom,
      effectiveUntil,
    } = event.data as any;

    const supabase = createServiceClient();
    const auditService = getV1AuditService();

    const auditContext: V1AuditAuditContext = {
      userId: event.user?.id || undefined,
      tenantId: tenantId || undefined,
      companyId: companyId || undefined,
      sessionId: undefined,
      ipAddress: "worker",
      userAgent: undefined,
      timestamp: new Date(),
    };

    // Step 1: Validate and create retention policy
    const policyData = await step.run("create-retention-policy", async () => {
      if (!tenantId || !companyId || !policyName || !retentionPeriod || !effectiveFrom) {
        throw new Error("Missing required parameters for retention policy");
      }

      logger.info("Creating retention policy", {
        tenantId,
        companyId,
        policyName,
        retentionPeriod,
        category,
        entityType,
        actionAfterRetention,
        requestId: event.id,
      });

      const policyId = crypto.randomUUID();
      const policy = {
        id: policyId,
        tenantId,
        companyId,
        policyName,
        description,
        retentionPeriod,
        category,
        entityType,
        actionAfterRetention,
        notifyBeforeExpiry,
        legalHoldOverride,
        complianceNotes,
        effectiveFrom,
        effectiveUntil,
        status: "active",
        createdAt: new Date().toISOString(),
        createdBy: event.user?.id || "system",
      };

      // Store policy in database (using a dedicated retention_policies table)
      const { error: policyError } = await supabase.from("retention_policies").insert(policy);

      if (policyError) {
        // If table doesn't exist, store in metadata for now
        logger.warn("Retention policies table not found, storing in company metadata", {
          error: policyError.message,
        });

        // Fallback: store in company metadata
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("metadata")
          .eq("id", companyId)
          .eq("tenant_id", tenantId)
          .single();

        if (companyError) {
          throw new Error(`Failed to fetch company: ${companyError.message}`);
        }

        const existingPolicies = company.metadata?.retentionPolicies || [];
        const updatedPolicies = [...existingPolicies, policy];

        const { error: updateError } = await supabase
          .from("companies")
          .update({
            metadata: {
              ...company.metadata,
              retentionPolicies: updatedPolicies,
            },
          })
          .eq("id", companyId);

        if (updateError) {
          throw new Error(`Failed to store retention policy: ${updateError.message}`);
        }
      }

      await auditService.logOperation(auditContext, {
        operation: "retention_policy_created",
        data: {
          policyId,
          policyName,
          retentionPeriod,
          category,
          entityType,
          actionAfterRetention,
        },
      });

      return policy;
    });

    // Step 2: Apply policy to existing documents if specified
    await step.run("apply-to-existing-documents", async () => {
      let query = supabase
        .from("attachments")
        .select("id, created_at, category, metadata")
        .eq("tenant_id", tenantId)
        .eq("company_id", companyId);

      // Apply category filter if specified
      if (category) {
        query = query.eq("category", category);
      }

      const { data: attachments, error: queryError } = await query;

      if (queryError) {
        logger.error("Failed to query existing attachments", {
          error: queryError.message,
        });
        return { applied: 0 };
      }

      if (!attachments || attachments.length === 0) {
        return { applied: 0 };
      }

      let appliedCount = 0;
      const batchSize = 100;

      for (let i = 0; i < attachments.length; i += batchSize) {
        const batch = attachments.slice(i, i + batchSize);

        const updates = batch.map((attachment: unknown) => {
          const a = attachment as { id: string; created_at: string; metadata: any };
          const retentionUntil = new Date(a.created_at);
          retentionUntil.setDate(retentionUntil.getDate() + (policyData as any).retentionPeriod);
          return {
            id: a.id,
            metadata: {
              ...a.metadata,
              retentionPolicy: {
                policyId: policyData.id,
                policyName: policyData.policyName,
                retentionUntil: retentionUntil.toISOString(),
                actionAfterRetention: policyData.actionAfterRetention,
                appliedAt: new Date().toISOString(),
              },
            },
          };
        });

        // Update batch
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from("attachments")
            .update({ metadata: update.metadata })
            .eq("id", update.id);

          if (!updateError) {
            appliedCount++;
          }
        }
      }

      logger.info("Retention policy applied to existing documents", {
        policyId: policyData.id,
        totalDocuments: attachments.length,
        appliedCount,
      });

      return { applied: appliedCount };
    });

    // Step 3: Schedule retention monitoring job
    await step.run("schedule-retention-monitoring", async () => {
      await inngest.send(
        {
          name: "retention/monitor",
          data: {
            tenantId,
            companyId,
            policyId: policyData.id,
          },
        },
        {
          // delay: "1d" // Check daily - removed due to Inngest API constraints
        },
      );

      return { monitoringScheduled: true };
    });

    return {
      success: true,
      policyId: policyData.id,
      policyName: policyData.policyName,
      retentionPeriod: policyData.retentionPeriod,
      actionAfterRetention: policyData.actionAfterRetention,
    };
  },
);

// Document Retention Monitoring Job
export const documentRetentionMonitor = inngest.createFunction(
  {
    id: "document-retention-monitor",
    name: "Document Retention Monitoring",
    retries: 3,
  },
  { event: "retention/monitor" },
  async ({ event, step }: WorkflowArgs) => {
    const { tenantId, companyId, policyId } = event.data;

    const supabase = createServiceClient();
    const auditService = getV1AuditService();

    const auditContext: V1AuditAuditContext = {
      userId: event.user?.id || undefined,
      tenantId: tenantId || undefined,
      companyId: companyId || undefined,
      sessionId: undefined,
      ipAddress: "worker",
      userAgent: undefined,
      timestamp: new Date(),
    };

    // Step 1: Find documents approaching retention expiry
    const expiringDocuments = await step.run("find-expiring-documents", async () => {
      const now = new Date();
      const warningDate = new Date();
      warningDate.setDate(now.getDate() + 30); // 30 days warning

      // Query documents with retention policies
      const { data: attachments, error: queryError } = await supabase
        .from("attachments")
        .select("id, filename, category, metadata, created_at")
        .eq("tenant_id", tenantId)
        .eq("company_id", companyId)
        .not("metadata->retentionPolicy", "is", null);

      if (queryError) {
        throw new Error(`Failed to query attachments: ${queryError.message}`);
      }

      const expiring: any[] = [];
      const expired: any[] = [];

      for (const attachment of attachments || []) {
        const retentionPolicy = attachment.metadata?.retentionPolicy;
        if (!retentionPolicy?.retentionUntil) { continue; }

        const retentionDate = new Date(retentionPolicy.retentionUntil);

        if (retentionDate <= now) {
          expired.push({ ...attachment, retentionDate });
        } else if (retentionDate <= warningDate) {
          expiring.push({ ...attachment, retentionDate });
        }
      }

      logger.info("Retention monitoring results", {
        tenantId,
        companyId,
        policyId,
        expiringCount: expiring.length,
        expiredCount: expired.length,
      });

      return { expiring, expired };
    });

    // Step 2: Process expired documents
    if (expiringDocuments.expired.length > 0) {
      await step.run("process-expired-documents", async () => {
        for (const document of expiringDocuments.expired) {
          if (!document) { continue; }

          const retentionPolicy = document.metadata?.retentionPolicy;
          const action = retentionPolicy?.actionAfterRetention || "archive";

          // Check for legal hold
          const onLegalHold = document.metadata?.legalHold?.active || false;
          if (onLegalHold) {
            logger.info("Skipping expired document due to legal hold", {
              attachmentId: document.id,
              filename: document.filename,
            });
            continue;
          }

          try {
            if (action === "delete") {
              // Soft delete the document
              await supabase
                .from("attachments")
                .update({
                  status: "deleted",
                  deleted_at: new Date().toISOString(),
                  metadata: {
                    ...document.metadata,
                    retentionAction: {
                      action: "deleted",
                      processedAt: new Date().toISOString(),
                      reason: "retention_policy_expiry",
                    },
                  },
                })
                .eq("id", document.id);

              await auditService.logOperation(auditContext, {
                operation: "document_retention_deleted",
                data: {
                  attachmentId: document.id,
                  filename: document.filename,
                  policyId: retentionPolicy.policyId,
                  retentionDate: document.retentionDate,
                },
              });
            } else if (action === "archive") {
              // Archive the document
              await supabase
                .from("attachments")
                .update({
                  status: "archived",
                  metadata: {
                    ...document.metadata,
                    retentionAction: {
                      action: "archived",
                      processedAt: new Date().toISOString(),
                      reason: "retention_policy_expiry",
                    },
                  },
                })
                .eq("id", document.id);

              await auditService.logOperation(auditContext, {
                operation: "document_retention_archived",
                data: {
                  attachmentId: document.id,
                  filename: document.filename,
                  policyId: retentionPolicy.policyId,
                  retentionDate: document.retentionDate,
                },
              });
            } else if (action === "review") {
              // Flag for manual review
              await supabase
                .from("attachments")
                .update({
                  metadata: {
                    ...document.metadata,
                    retentionReview: {
                      flaggedAt: new Date().toISOString(),
                      reason: "retention_policy_expiry",
                      status: "pending_review",
                    },
                  },
                })
                .eq("id", document.id);

              // Send notification for manual review
              await inngest.send({
                name: "email/send",
                data: {
                  to: "compliance@company.com", // Configure based on tenant
                  subject: `Document Retention Review Required: ${document.filename}`,
                  template: "document-retention-review",
                  data: {
                    attachmentId: document.id,
                    filename: document.filename,
                    category: document.category,
                    retentionDate: document.retentionDate,
                    policyName: retentionPolicy.policyName,
                    reviewUrl: `${process.env.APP_URL}/documents/${document.id}/retention-review`,
                  },
                  tenantId,
                },
              });
            }
          } catch (error) {
            logger.error("Failed to process expired document", {
              attachmentId: document.id,
              action,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        return { processedCount: expiringDocuments.expired.length };
      });
    }

    // Step 3: Send expiry warnings
    if (expiringDocuments.expiring.length > 0) {
      await step.run("send-expiry-warnings", async () => {
        // Group by days until expiry for batched notifications
        const groupedByDays: Record<number, typeof expiringDocuments.expiring> = {};

        for (const document of expiringDocuments.expiring) {
          if (!document) { continue; }

          const daysUntilExpiry = Math.ceil(
            (document.retentionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );

          if (!groupedByDays[daysUntilExpiry]) {
            groupedByDays[daysUntilExpiry] = [];
          }
          groupedByDays[daysUntilExpiry].push(document);
        }

        // Send notifications for documents expiring in 30, 14, 7, and 1 days
        const notificationDays = [30, 14, 7, 1];

        for (const days of notificationDays) {
          const documentsExpiring = groupedByDays[days];
          if (!documentsExpiring || documentsExpiring.length === 0) { continue; }

          await inngest.send({
            name: "email/send",
            data: {
              to: "compliance@company.com", // Configure based on tenant
              subject: `Document Retention Warning: ${documentsExpiring.length} documents expiring in ${days} days`,
              template: "document-retention-warning",
              data: {
                daysUntilExpiry: days,
                documentCount: documentsExpiring.length,
                documents: documentsExpiring.map((doc: unknown) => {
                  const d = doc as { id: string; filename: string; category: string; retentionDate: string };
                  return {
                    id: d.id,
                    filename: d.filename,
                    category: d.category,
                    retentionDate: d.retentionDate,
                  };
                }),
                reviewUrl: `${process.env.APP_URL}/compliance/retention-review`,
              },
              tenantId,
            },
          });
        }

        return { warningsSent: Object.keys(groupedByDays).length };
      });
    }

    // Step 4: Schedule next monitoring cycle
    await step.run("schedule-next-monitoring", async () => {
      await inngest.send(
        {
          name: "retention/monitor",
          data: {
            tenantId,
            companyId,
            policyId,
          },
        },
        {
          // delay: "1d" // Check daily - removed due to Inngest API constraints
        },
      );

      return { nextMonitoringScheduled: true };
    });

    return {
      success: true,
      expiringCount: expiringDocuments.expiring.length,
      expiredCount: expiringDocuments.expired.length,
      processedCount: expiringDocuments.expired.length,
    };
  },
);

// Legal Hold Management
export const documentLegalHold = inngest.createFunction(
  {
    id: "document-legal-hold",
    name: "Document Legal Hold Management",
    retries: 3,
  },
  { event: "retention/legal-hold" },
  async ({ event, step }: WorkflowArgs) => {
    const {
      tenantId,
      attachmentIds,
      action, // 'apply' or 'release'
      reason,
      holdUntil,
      legalCase,
      requestedBy,
    } = event.data;

    const supabase = createServiceClient();
    const auditService = getV1AuditService();

    const auditContext: V1AuditAuditContext = {
      userId: event.user?.id || undefined,
      tenantId: tenantId || undefined,
      companyId: undefined,
      sessionId: undefined,
      ipAddress: "worker",
      userAgent: undefined,
      timestamp: new Date(),
    };

    // Step 1: Validate and process legal hold
    const holdResult = await step.run("process-legal-hold", async () => {
      if (!tenantId || !attachmentIds || !action || !reason) {
        throw new Error("Missing required parameters for legal hold");
      }

      logger.info("Processing legal hold", {
        tenantId,
        attachmentCount: attachmentIds.length,
        action,
        reason,
        legalCase,
        requestId: event.id,
      });

      const results: any[] = [];

      for (const attachmentId of attachmentIds) {
        try {
          const { data: attachment, error: fetchError } = await supabase
            .from("attachments")
            .select("*")
            .eq("id", attachmentId)
            .eq("tenant_id", tenantId)
            .single();

          if (fetchError || !attachment) {
            results.push({
              attachmentId,
              success: false,
              error: "Attachment not found",
            });
            continue;
          }

          const legalHoldData = {
            active: action === "apply",
            reason,
            holdUntil,
            legalCase,
            requestedBy,
            appliedAt: action === "apply" ? new Date().toISOString() : undefined,
            releasedAt: action === "release" ? new Date().toISOString() : undefined,
            previousHold: attachment.metadata?.legalHold,
          };

          const { error: updateError } = await supabase
            .from("attachments")
            .update({
              metadata: {
                ...attachment.metadata,
                legalHold: legalHoldData,
              },
            })
            .eq("id", attachmentId);

          if (updateError) {
            results.push({
              attachmentId,
              success: false,
              error: updateError.message,
            });
            continue;
          }

          await auditService.logOperation(auditContext, {
            operation: `document_legal_hold_${action}`,
            data: {
              attachmentId,
              filename: attachment.filename,
              reason,
              legalCase,
              requestedBy,
            },
          });

          results.push({
            attachmentId,
            success: true,
            action,
          });
        } catch (error) {
          results.push({
            attachmentId,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      logger.info("Legal hold processing completed", {
        tenantId,
        action,
        totalCount: results.length,
        successCount,
        failureCount,
      });

      return { results, successCount, failureCount };
    });

    // Step 2: Send notifications
    await step.run("send-legal-hold-notifications", async () => {
  const successfulHolds = holdResult.results.filter((r: { success: boolean }) => r.success);

      if (successfulHolds.length > 0) {
        await inngest.send({
          name: "email/send",
          data: {
            to: "legal@company.com", // Configure based on tenant
            subject: `Legal Hold ${action === "apply" ? "Applied" : "Released"}: ${successfulHolds.length} documents`,
            template: "document-legal-hold-notification",
            data: {
              action,
              documentCount: successfulHolds.length,
              reason,
              legalCase,
              requestedBy,
              attachmentIds: successfulHolds.map((r: any) => r.attachmentId),
              processedAt: new Date().toISOString(),
            },
            tenantId,
          },
        });
      }

      return { notificationSent: successfulHolds.length > 0 };
    });

    return {
      success: true,
      action,
      totalCount: holdResult.results.length,
      successCount: holdResult.successCount,
      failureCount: holdResult.failureCount,
      results: holdResult.results,
    };
  },
);
