import { inngest } from "../inngestClient.js";
import { createServiceClient, logger } from "@aibos/utils";

// V1 Dead Letter Queue Handler for failed jobs
export const dlqHandler = inngest.createFunction(
  {
    id: "dlq-handler",
    name: "Dead Letter Queue Handler",
    retries: 1, // DLQ handler itself should not retry extensively
  },
  { event: "inngest/function.failed" },
  async ({ event, step }: WorkflowArgs) => {
    const { function_id, run_id, error, original_event, attempt_count } = event.data;

    // Step 1: Log the failure
    await step.run("log-failure", async () => {
      logger.error("Job failed and sent to DLQ", {
        functionId: function_id,
        runId: run_id,
        error: error?.message || "Unknown error",
        originalEvent: original_event,
        attemptCount: attempt_count,
        timestamp: new Date().toISOString(),
      });
    });

    // Step 2: Store in DLQ table for admin review
    const dlqRecord = await step.run("store-in-dlq", async () => {
      const supabase = createServiceClient();

      try {
        const { data, error: dbError } = await supabase
          .from("dead_letter_queue")
          .insert({
            function_id,
            run_id,
            original_event: original_event,
            error_message: error?.message || "Unknown error",
            error_stack: error?.stack,
            attempt_count,
            failed_at: new Date().toISOString(),
            status: "failed",
            tenant_id: original_event?.data?.tenantId || null,
            company_id: original_event?.data?.companyId || null,
          })
          .select()
          .single();

        if (dbError) {
          logger.error("Failed to store DLQ record", {
            error: dbError.message,
            functionId: function_id,
            runId: run_id,
          });
          throw dbError;
        }

        logger.info("DLQ record created", {
          dlqId: data.id,
          functionId: function_id,
          runId: run_id,
        });

        return data;
      } catch (error) {
        logger.error("DLQ storage failed", {
          error: error instanceof Error ? error.message : String(error),
          functionId: function_id,
          runId: run_id,
        });
        throw error;
      }
    });

    // Step 3: Determine if we should attempt auto-recovery
    const recoveryAction = await step.run("determine-recovery", async () => {
      // Auto-recovery rules based on function type and error
      const autoRecoveryRules = {
        "fx-rate-ingestion": {
          maxAttempts: 5,
          retryDelay: 300000, // 5 minutes
          recoverableErrors: ["network", "timeout", "rate_limit"],
        },
        "pdf-generation": {
          maxAttempts: 3,
          retryDelay: 60000, // 1 minute
          recoverableErrors: ["timeout", "memory"],
        },
        "email-workflow": {
          maxAttempts: 3,
          retryDelay: 120000, // 2 minutes
          recoverableErrors: ["rate_limit", "temporary"],
        },
      };

      const rule = autoRecoveryRules[function_id as keyof typeof autoRecoveryRules];

      if (!rule || attempt_count >= rule.maxAttempts) {
        return { action: "manual_review" as const, reason: "Max attempts exceeded" };
      }

      const errorType = classifyError(error?.message || "");

      if (rule.recoverableErrors.includes(errorType)) {
        return {
          action: "auto_retry" as const,
          delay: rule.retryDelay,
          errorType,
        };
      }

      return { action: "manual_review" as const, reason: "Non-recoverable error" };
    });

    // Step 4: Execute recovery action
    await step.run("execute-recovery", async () => {
      if (recoveryAction.action === "auto_retry") {
        // Schedule retry after delay
        await inngest.send({
          name: "dlq/retry",
          data: {
            dlqId: dlqRecord.id,
            originalEvent: original_event,
            retryDelay: (recoveryAction as any).delay,
            errorType: (recoveryAction as any).errorType,
          },
        });

        logger.info("Auto-retry scheduled", {
          dlqId: dlqRecord.id,
          functionId: function_id,
          delay: (recoveryAction as any).delay,
          errorType: (recoveryAction as any).errorType,
        });
      } else {
        // Mark for manual review
        const supabase = createServiceClient();

        await supabase
          .from("dead_letter_queue")
          .update({
            status: "manual_review",
            recovery_action: recoveryAction.reason,
          })
          .eq("id", dlqRecord.id);

        logger.info("Marked for manual review", {
          dlqId: dlqRecord.id,
          functionId: function_id,
          reason: recoveryAction.reason,
        });
      }
    });

    // Step 5: Send notification for critical failures
    await step.run("notify-if-critical", async () => {
      const criticalFunctions = ["fx-rate-ingestion", "payment-processing"];

      if (criticalFunctions.includes(function_id) || attempt_count >= 3) {
        await inngest.send({
          name: "email/send",
          data: {
            to: process.env.ADMIN_EMAIL || "admin@aibos.com",
            subject: `Critical Job Failure: ${function_id}`,
            template: "system_notification",
            data: {
              title: "Critical Job Failure",
              message: `
                Function: ${function_id}
                Run ID: ${run_id}
                Error: ${error?.message || "Unknown error"}
                Attempt: ${attempt_count}
                Action: ${recoveryAction.action}

                Please review the DLQ admin panel for details.
              `,
            },
            priority: "high",
          },
        });

        logger.info("Critical failure notification sent", {
          functionId: function_id,
          runId: run_id,
          attemptCount: attempt_count,
        });
      }
    });

    return {
      success: true,
      dlqId: dlqRecord.id,
      recoveryAction: recoveryAction.action,
      functionId: function_id,
      runId: run_id,
    };
  },
);

// DLQ Retry Handler
export const dlqRetryHandler = inngest.createFunction(
  {
    id: "dlq-retry-handler",
    name: "DLQ Retry Handler",
  },
  { event: "dlq/retry" },
  async ({ event, step }: WorkflowArgs) => {
    const { dlqId, originalEvent, retryDelay, errorType } = event.data;

    // Step 1: Wait for retry delay
    await step.sleep("retry-delay", retryDelay);

    // Step 2: Update DLQ status
    await step.run("update-dlq-status", async () => {
      const supabase = createServiceClient();

      await supabase
        .from("dead_letter_queue")
        .update({
          status: "retrying",
          retry_count: supabase.rpc("increment_retry_count", { dlq_id: dlqId }),
          last_retry_at: new Date().toISOString(),
        })
        .eq("id", dlqId);

      logger.info("DLQ retry initiated", {
        dlqId,
        errorType,
        retryDelay,
      });
    });

    // Step 3: Resend original event
    await step.run("resend-original-event", async () => {
      await inngest.send(originalEvent);

      logger.info("Original event resent", {
        dlqId,
        eventName: originalEvent.name,
      });
    });

    return {
      success: true,
      dlqId,
      retriedAt: new Date().toISOString(),
    };
  },
);

// Error classification helper
function classifyError(errorMessage: string): string {
  const errorPatterns = {
    network: /network|connection|timeout|ENOTFOUND|ECONNREFUSED/i,
    rate_limit: /rate.?limit|too.?many.?requests|429/i,
    timeout: /timeout|timed.?out/i,
    memory: /memory|out.?of.?memory|heap/i,
    temporary: /temporary|try.?again|503|502|504/i,
    auth: /auth|unauthorized|forbidden|401|403/i,
    validation: /validation|invalid|bad.?request|400/i,
  };

  for (const [type, pattern] of Object.entries(errorPatterns)) {
    if (pattern.test(errorMessage)) {
      return type;
    }
  }

  return "unknown";
}
