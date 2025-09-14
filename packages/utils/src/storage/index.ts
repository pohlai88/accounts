// Storage utilities and services

export { AttachmentService } from "./attachment-service";
export type {
  UploadOptions as AttachmentUploadOptions,
  UploadResult as AttachmentUploadResult,
  AttachmentInfo,
} from "./attachment-service";

// Create default attachment service instance
import { AttachmentService } from "./attachment-service";
export const attachmentService = new AttachmentService();
