import { inngest } from "../inngestClient.js";
import { createServiceClient, logger, getV1AuditService, createV1AuditContext } from "@aibos/utils";
import type { V1AuditAuditContext, V1AuditAuditEvent } from "@aibos/utils/types";
// Note: These types will be used when implementing full document approval
// import { DocumentApprovalReq, ApprovalDecisionReq, ApprovalStatusRes } from "@aibos/contracts";

// V1 Document Approval Workflow with Multi-stage Support
// Supports single approver, multi-stage, and parallel approval workflows

export const documentApprovalWorkflow = inngest.createFunction(
  {
    id: "document-approval-workflow",
    name: "Document Approval Workflow",
    retries: 3,
  },
  { event: "document/approval.start" },
  async ({ event, step }: WorkflowArgs) => {
    const {
      tenantId,
      attachmentId,
      workflowType = "single_approver",
      approvers,
      requireAllApprovers = false,
      allowSelfApproval = false,
      autoApproveThreshold,
      notifyOnSubmission = true,
      notifyOnApproval = true, // eslint-disable-line @typescript-eslint/no-unused-vars
      reminderInterval = 24,
      comments,
      priority = "normal",
      dueDate,
    } = event.data as {
      tenantId: string;
      attachmentId: string;
      workflowType?: string;
      approvers: string[];
      requireAllApprovers?: boolean;
      allowSelfApproval?: boolean;
      autoApproveThreshold?: number;
      notifyOnSubmission?: boolean;
      notifyOnApproval?: boolean;
      reminderInterval?: number;
      comments?: string;
      priority?: string;
      dueDate?: string;
    };

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

    // Step 1: Validate input and fetch attachment
    const workflowData = await step.run("initialize-approval-workflow", async () => {
      if (!tenantId || !attachmentId || !approvers || approvers.length === 0) {
        throw new Error("Missing required parameters for approval workflow");
      }

      logger.info("Document approval workflow started", {
        tenantId,
        attachmentId,
        workflowType,
        approverCount: approvers.length,
        requireAllApprovers,
        priority,
        requestId: event.id,
      });

      // Fetch attachment details
      const { data: attachment, error: attachmentError } = await supabase
        .from("attachments")
        .select("*")
        .eq("id", attachmentId)
        .eq("tenant_id", tenantId)
        .single();

      if (attachmentError || !attachment) {
        throw new Error(`Attachment not found: ${attachmentId}`);
      }

      // Check if attachment already has an active approval workflow
      const existingWorkflow = attachment.metadata?.approvalWorkflow;
      if (existingWorkflow && existingWorkflow.status === "in_progress") {
        throw new Error(`Attachment already has an active approval workflow`);
      }

      // Auto-approve based on OCR confidence if threshold is set
      const ocrConfidence = attachment.metadata?.ocrConfidence || 0;
      const shouldAutoApprove =
        autoApproveThreshold &&
        ocrConfidence >= autoApproveThreshold &&
        attachment.metadata?.ocrStatus === "completed";

      if (shouldAutoApprove) {
        // Auto-approve the document
        await supabase
          .from("attachments")
          .update({
            metadata: {
              ...attachment.metadata,
              approvalStatus: "approved",
              approvedBy: "system",
              approvedAt: new Date().toISOString(),
              approvalReason: `Auto-approved based on OCR confidence: ${ocrConfidence}`,
            },
          })
          .eq("id", attachmentId);

        await auditService.logOperation(auditContext, {
          operation: "document_auto_approved",
          data: {
            attachmentId,
            ocrConfidence,
            threshold: autoApproveThreshold,
          },
        });

        return { autoApproved: true, ocrConfidence };
      }

      // Create approval workflow record
      const workflowId = crypto.randomUUID();
      const workflow = {
        id: workflowId,
        attachmentId,
        tenantId,
        workflowType,
        status: "in_progress",
        approvers: approvers.map((approver: any, index: number) => ({
          ...approver,
          id: crypto.randomUUID(),
          status: "pending",
          stage: approver.stage || 1,
          order: index,
        })),
        requireAllApprovers,
        allowSelfApproval,
        priority,
        dueDate,
        comments,
        submittedAt: new Date().toISOString(),
        submittedBy: event.user?.id || "system",
        currentStage: 1,
        totalStages: Math.max(...approvers.map((a: any) => a.stage || 1)),
      };

      // Update attachment with approval workflow
      await supabase
        .from("attachments")
        .update({
          metadata: {
            ...attachment.metadata,
            approvalStatus: "pending",
            approvalWorkflow: workflow,
          },
        })
        .eq("id", attachmentId);

      await auditService.logOperation(auditContext, {
        operation: "document_approval_workflow_started",
        data: {
          attachmentId,
          workflowId,
          workflowType,
          approverCount: approvers.length,
          priority,
        },
      });

      return {
        autoApproved: false,
        workflow,
        attachment: {
          id: attachment.id,
          filename: attachment.filename,
          category: attachment.category,
        },
      };
    });

    if (workflowData.autoApproved) {
      return {
        success: true,
        status: "auto_approved",
        ocrConfidence: (workflowData as any).ocrConfidence,
      };
    }

    const { workflow, attachment } = workflowData as any;

    // Step 2: Send initial notifications to approvers
    if (notifyOnSubmission) {
      await step.run("send-initial-notifications", async () => {
        const currentStageApprovers = workflow.approvers.filter(
          (approver: { stage: number }) => approver.stage === workflow.currentStage,
        );

        for (const approver of currentStageApprovers) {
          await inngest.send({
            name: "email/send",
            data: {
              to: approver.email || `user-${approver.userId}@placeholder.com`,
              subject: `Document Approval Required: ${attachment.filename}`,
              template: "document-approval-request",
              data: {
                attachmentId,
                filename: attachment.filename,
                category: attachment.category,
                approverName: approver.name || approver.userId,
                priority: workflow.priority,
                dueDate: workflow.dueDate,
                comments: workflow.comments,
                approvalUrl: `${process.env.APP_URL}/documents/${attachmentId}/approve`,
              },
              tenantId,
              priority: workflow.priority === "urgent" ? "high" : "normal",
            },
          });
        }

        logger.info("Initial approval notifications sent", {
          attachmentId,
          approverCount: currentStageApprovers.length,
          stage: workflow.currentStage,
        });

        return { notificationsSent: currentStageApprovers.length };
      });
    }

    // Step 3: Set up reminder notifications
    if (reminderInterval > 0) {
      await step.run("schedule-reminder-notifications", async () => {
        await inngest.send({
          name: "document/approval.reminder",
          data: {
            attachmentId,
            tenantId,
            workflowId: workflow.id,
            reminderInterval,
          },
        });

        logger.info("Reminder notifications scheduled", {
          attachmentId,
          reminderInterval,
        });

        return { reminderScheduled: true };
      });
    }

    return {
      success: true,
      workflowId: workflow.id,
      status: "in_progress",
      currentStage: workflow.currentStage,
      totalStages: workflow.totalStages,
      approverCount: workflow.approvers.length,
    };
  },
);

// Document Approval Decision Handler
export const documentApprovalDecision = inngest.createFunction(
  {
    id: "document-approval-decision",
    name: "Document Approval Decision",
    retries: 3,
  },
  { event: "document/approval.decision" },
  async ({ event, step }: WorkflowArgs) => {
    const { tenantId, attachmentId, decision, comments, conditions, delegateTo, delegationReason } =
      event.data as any;

    const userId = event.user?.id || event.data.userId;
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

    // Step 1: Validate decision and fetch current workflow
    const decisionData = await step.run("validate-and-fetch-workflow", async () => {
      if (!tenantId || !attachmentId || !decision || !userId) {
        throw new Error("Missing required parameters for approval decision");
      }

      logger.info("Processing approval decision", {
        tenantId,
        attachmentId,
        decision,
        userId,
        requestId: event.id,
      });

      // Fetch attachment with current workflow
      const { data: attachment, error: attachmentError } = await supabase
        .from("attachments")
        .select("*")
        .eq("id", attachmentId)
        .eq("tenant_id", tenantId)
        .single();

      if (attachmentError || !attachment) {
        throw new Error(`Attachment not found: ${attachmentId}`);
      }

      const workflow = attachment.metadata?.approvalWorkflow;
      if (!workflow || workflow.status !== "in_progress") {
        throw new Error(`No active approval workflow found for attachment: ${attachmentId}`);
      }

      // Find the approver making this decision
      const approver = workflow.approvers.find(
        (a: { userId: string; status: string }) => a.userId === userId && a.status === "pending",
      );

      if (!approver) {
        throw new Error(
          `User ${userId} is not authorized to make approval decisions for this document`,
        );
      }

      return { attachment, workflow, approver };
    });

    const { attachment, workflow, approver } = decisionData;

    // Step 2: Process the approval decision
    const updatedWorkflow = await step.run("process-approval-decision", async () => {
      const now = new Date().toISOString();

      // Handle delegation
      if (decision === "approve" && delegateTo) {
        // Update approver to delegated status
        approver.status = "delegated";
        approver.delegatedTo = delegateTo;
        approver.delegationReason = delegationReason;
        approver.decidedAt = now;

        // Add new approver for delegation
        const newApprover = {
          ...approver,
          id: crypto.randomUUID(),
          userId: delegateTo,
          status: "pending",
          delegatedFrom: userId,
        };
        workflow.approvers.push(newApprover);

        await auditService.logOperation(auditContext, {
          operation: "document_approval_delegated",
          data: {
            attachmentId,
            fromUserId: userId,
            toUserId: delegateTo,
            reason: delegationReason,
          },
        });

        return workflow;
      }

      // Update approver decision
      approver.status = decision === "approve" ? "approved" : "rejected";
      approver.decision = decision;
      approver.comments = comments;
      approver.conditions = conditions;
      approver.decidedAt = now;

      // Log the decision
      await auditService.logOperation(auditContext, {
        operation: `document_approval_${decision}`,
        data: {
          attachmentId,
          userId,
          decision,
          comments,
          stage: approver.stage,
        },
      });

      // Check if workflow is complete
      const currentStageApprovers = workflow.approvers.filter(
        (a: { stage: number }) => a.stage === workflow.currentStage,
      );

      const approvedCount = currentStageApprovers.filter(
        (a: { status: string }) => a.status === "approved",
      ).length;

      const rejectedCount = currentStageApprovers.filter(
        (a: { status: string }) => a.status === "rejected",
      ).length;

      // Determine if current stage is complete
      let stageComplete = false;
      let stageApproved = false;

      if (workflow.requireAllApprovers) {
        // All approvers must approve
        stageComplete = approvedCount + rejectedCount === currentStageApprovers.length;
        stageApproved = approvedCount === currentStageApprovers.length;
      } else {
        // Any rejection fails the stage, any approval passes it
        if (rejectedCount > 0) {
          stageComplete = true;
          stageApproved = false;
        } else if (approvedCount > 0) {
          stageComplete = true;
          stageApproved = true;
        }
      }

      if (stageComplete) {
        if (!stageApproved) {
          // Workflow rejected
          workflow.status = "rejected";
          workflow.completedAt = now;
          workflow.finalDecision = "rejected";
        } else if (workflow.currentStage >= workflow.totalStages) {
          // Workflow approved (final stage)
          workflow.status = "completed";
          workflow.completedAt = now;
          workflow.finalDecision = "approved";
        } else {
          // Move to next stage
          workflow.currentStage += 1;
        }
      }

      return workflow;
    });

    // Step 3: Update attachment with new workflow state
    await step.run("update-attachment-workflow", async () => {
      const updateData: Record<string, unknown> = {
        metadata: {
          ...attachment.metadata,
          approvalWorkflow: updatedWorkflow,
        },
      };

      // Update approval status if workflow is complete
      if (updatedWorkflow.status === "completed") {
        updateData.metadata = {
          ...(updateData.metadata as Record<string, unknown>),
          approvalStatus: "approved",
          approvedBy: userId,
          approvedAt: updatedWorkflow.completedAt,
        };
      } else if (updatedWorkflow.status === "rejected") {
        updateData.metadata = {
          ...(updateData.metadata as Record<string, unknown>),
          approvalStatus: "rejected",
          rejectedBy: userId,
          rejectedAt: updatedWorkflow.completedAt,
          rejectionReason: comments,
        };
      }

      const { error: updateError } = await supabase
        .from("attachments")
        .update(updateData)
        .eq("id", attachmentId);

      if (updateError) {
        throw new Error(`Failed to update attachment: ${updateError.message}`);
      }

      logger.info("Attachment workflow updated", {
        attachmentId,
        workflowStatus: updatedWorkflow.status,
        currentStage: updatedWorkflow.currentStage,
      });

      return { updated: true };
    });

    // Step 4: Send notifications based on workflow state
    await step.run("send-decision-notifications", async () => {
      if (updatedWorkflow.status === "completed") {
        // Notify submitter of approval
        await inngest.send({
          name: "email/send",
          data: {
            to: `user-${updatedWorkflow.submittedBy}@placeholder.com`,
            subject: `Document Approved: ${attachment.filename}`,
            template: "document-approval-completed",
            data: {
              attachmentId,
              filename: attachment.filename,
              approvedBy: userId,
              finalComments: comments,
              documentUrl: `${process.env.APP_URL}/documents/${attachmentId}`,
            },
            tenantId,
          },
        });

        // Trigger any downstream workflows
        await inngest.send({
          name: "document/approved",
          data: {
            attachmentId,
            tenantId,
            approvedBy: userId,
            approvedAt: updatedWorkflow.completedAt,
          },
        });
      } else if (updatedWorkflow.status === "rejected") {
        // Notify submitter of rejection
        await inngest.send({
          name: "email/send",
          data: {
            to: `user-${updatedWorkflow.submittedBy}@placeholder.com`,
            subject: `Document Rejected: ${attachment.filename}`,
            template: "document-approval-rejected",
            data: {
              attachmentId,
              filename: attachment.filename,
              rejectedBy: userId,
              rejectionReason: comments,
              documentUrl: `${process.env.APP_URL}/documents/${attachmentId}`,
            },
            tenantId,
          },
        });
      } else if (updatedWorkflow.currentStage > (workflow.currentStage || 1)) {
        // Notify next stage approvers
        const nextStageApprovers = updatedWorkflow.approvers.filter(
          (a: { stage: number; status: string }) =>
            a.stage === updatedWorkflow.currentStage && a.status === "pending",
        );

        for (const nextApprover of nextStageApprovers) {
          await inngest.send({
            name: "email/send",
            data: {
              to: nextApprover.email || `user-${nextApprover.userId}@placeholder.com`,
              subject: `Document Approval Required (Stage ${updatedWorkflow.currentStage}): ${attachment.filename}`,
              template: "document-approval-request",
              data: {
                attachmentId,
                filename: attachment.filename,
                category: attachment.category,
                approverName: nextApprover.name || nextApprover.userId,
                stage: updatedWorkflow.currentStage,
                totalStages: updatedWorkflow.totalStages,
                priority: updatedWorkflow.priority,
                dueDate: updatedWorkflow.dueDate,
                approvalUrl: `${process.env.APP_URL}/documents/${attachmentId}/approve`,
              },
              tenantId,
            },
          });
        }
      }

      return { notificationsSent: true };
    });

    return {
      success: true,
      decision,
      workflowStatus: updatedWorkflow.status,
      currentStage: updatedWorkflow.currentStage,
      totalStages: updatedWorkflow.totalStages,
      isComplete: updatedWorkflow.status === "completed" || updatedWorkflow.status === "rejected",
    };
  },
);

// Approval Reminder Handler
export const documentApprovalReminder = inngest.createFunction(
  {
    id: "document-approval-reminder",
    name: "Document Approval Reminder",
    retries: 2,
  },
  { event: "document/approval.reminder" },
  async ({ event, step }: WorkflowArgs) => {
    const { attachmentId, tenantId, workflowId, reminderInterval } = event.data;

    const supabase = createServiceClient();

    // Check if workflow is still active
    const workflowCheck = await step.run("check-workflow-status", async () => {
      const { data: attachment, error } = await supabase
        .from("attachments")
        .select("metadata")
        .eq("id", attachmentId)
        .eq("tenant_id", tenantId)
        .single();

      if (error || !attachment) {
        return { active: false, reason: "Attachment not found" };
      }

      const workflow = attachment.metadata?.approvalWorkflow;
      if (!workflow || workflow.id !== workflowId || workflow.status !== "in_progress") {
        return { active: false, reason: "Workflow no longer active" };
      }

      return { active: true, workflow };
    });

    if (!workflowCheck.active) {
      logger.info("Skipping reminder - workflow no longer active", {
        attachmentId,
        workflowId,
        reason: (workflowCheck as any).reason,
      });
      return { skipped: true, reason: (workflowCheck as any).reason };
    }

    // Send reminder notifications
    await step.run("send-reminder-notifications", async () => {
      const workflow = (workflowCheck as any).workflow;
      const pendingApprovers = workflow.approvers.filter(
        (a: { stage: number; status: string }) =>
          a.stage === workflow.currentStage && a.status === "pending",
      );

      for (const approver of pendingApprovers) {
        await inngest.send({
          name: "email/send",
          data: {
            to: approver.email || `user-${approver.userId}@placeholder.com`,
            subject: `Reminder: Document Approval Required - ${workflow.attachmentFilename}`,
            template: "document-approval-reminder",
            data: {
              attachmentId,
              filename: workflow.attachmentFilename,
              approverName: approver.name || approver.userId,
              daysPending: Math.floor(
                (Date.now() - new Date(workflow.submittedAt).getTime()) / (1000 * 60 * 60 * 24),
              ),
              priority: workflow.priority,
              dueDate: workflow.dueDate,
              approvalUrl: `${process.env.APP_URL}/documents/${attachmentId}/approve`,
            },
            tenantId,
            priority: "normal",
          },
        });
      }

      logger.info("Reminder notifications sent", {
        attachmentId,
        reminderCount: pendingApprovers.length,
      });

      return { remindersSent: pendingApprovers.length };
    });

    // Schedule next reminder
    await step.run("schedule-next-reminder", async () => {
      await inngest.send({
        name: "document/approval.reminder",
        data: {
          attachmentId,
          tenantId,
          workflowId,
          reminderInterval,
        },
      });

      return { nextReminderScheduled: true };
    });

    return {
      success: true,
      remindersSent:
        (workflowCheck as any).workflow?.approvers?.filter(
          (a: { stage: number; status: string }) =>
            a.stage === (workflowCheck as any).workflow.currentStage && a.status === "pending",
        ).length || 0,
    };
  },
);
