// @ts-nocheck
import { createClient } from "@supabase/supabase-js";

// Legacy PDF storage function
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
export async function putPdf(opts: { tenantId: string; path: string; bytes: Buffer }) {
  const { error } = await supabase.storage
    .from("documents")
    .upload(`${opts.tenantId}/${opts.path}`, opts.bytes, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (error) {throw error;}
  const { data } = supabase.storage.from("documents").getPublicUrl(`${opts.tenantId}/${opts.path}`);
  return { url: data.publicUrl };
}

// V1 Compliance: Export attachment system
export * from "./storage/index.js";
export { attachmentService } from "./storage/index.js";
