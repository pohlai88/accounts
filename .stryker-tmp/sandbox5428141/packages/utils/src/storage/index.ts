// @ts-nocheck
// Storage utilities and services

export { AttachmentService } from "./attachment-service.js";
export type {
  UploadOptions as AttachmentUploadOptions,
  UploadResult as AttachmentUploadResult,
  AttachmentInfo,
} from "./attachment-service.js";

// Create default attachment service instance
import { AttachmentService } from "./attachment-service.js";
export const attachmentService = new AttachmentService();
