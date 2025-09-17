// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Get the request body
    const { type, record } = await req.json();

    // Only process access token requests
    if (type !== "access_token") {
      return new Response(JSON.stringify({ record }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userId = record.user_id;

    // Get user's active tenant from user_settings
    const { data: userSettings, error: settingsError } = await supabaseClient
      .from("user_settings")
      .select("active_tenant_id")
      .eq("user_id", userId)
      .single();

    if (settingsError && settingsError.code !== "PGRST116") {
      console.error("Error fetching user settings:", settingsError);
      // Continue without tenant_id if settings don't exist
    }

    // Get user's memberships to validate tenant access
    const { data: memberships, error: membershipsError } = await supabaseClient
      .from("memberships")
      .select("tenant_id, role, permissions, company_id")
      .eq("user_id", userId)
      .eq("status", "active");

    if (membershipsError) {
      console.error("Error fetching memberships:", membershipsError);
      // Continue without tenant context if memberships can't be fetched
    }

    // Get tenant and company information
    let tenantId = userSettings?.active_tenant_id;
    let companyId = null;
    let tenantName = null;
    let companyName = null;

    if (tenantId && memberships) {
      const activeMembership = memberships.find(m => m.tenant_id === tenantId);

      if (activeMembership) {
        companyId = activeMembership.company_id;

        // Get tenant details
        const { data: tenant, error: tenantError } = await supabaseClient
          .from("tenants")
          .select("name")
          .eq("id", tenantId)
          .single();

        if (!tenantError && tenant) {
          tenantName = tenant.name;
        }

        // Get company details if company_id exists
        if (companyId) {
          const { data: company, error: companyError } = await supabaseClient
            .from("companies")
            .select("name")
            .eq("id", companyId)
            .single();

          if (!companyError && company) {
            companyName = company.name;
          }
        }
      }
    }

    // If no active tenant, use the first available membership
    if (!tenantId && memberships && memberships.length > 0) {
      const firstMembership = memberships[0];
      tenantId = firstMembership.tenant_id;
      companyId = firstMembership.company_id;

      // Update user settings with the first available tenant
      await supabaseClient.from("user_settings").upsert({
        user_id: userId,
        active_tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      });

      // Get tenant and company names
      if (tenantId) {
        const { data: tenant } = await supabaseClient
          .from("tenants")
          .select("name")
          .eq("id", tenantId)
          .single();

        if (tenant) {
          tenantName = tenant.name;
        }
      }

      if (companyId) {
        const { data: company } = await supabaseClient
          .from("companies")
          .select("name")
          .eq("id", companyId)
          .single();

        if (company) {
          companyName = company.name;
        }
      }
    }

    // Build app_metadata with tenant context
    const appMetadata = {
      ...record.app_metadata,
      tenant_id: tenantId,
      company_id: companyId,
      tenant_name: tenantName,
      company_name: companyName,
      available_tenants:
        memberships?.map(m => ({
          tenant_id: m.tenant_id,
          role: m.role,
          permissions: m.permissions,
        })) || [],
    };

    // Return the updated record
    return new Response(
      JSON.stringify({
        record: {
          ...record,
          app_metadata,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Auth hook error:", error);

    // Return the original record if there's an error
    return new Response(
      JSON.stringify({
        record,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  }
});
